import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFee, listFees, listPayments, recordPayment, type FeeInvoice, type Payment } from '../api/finance';
import { listStudents } from '../api/students';
import type { Paginated, Student } from '../types/api';
import { queryClient } from '../queryClient';
import { Skeleton } from '../components/Skeleton';
import { createFeeSchema, recordPaymentSchema } from '../validation/schemas';
import styles from './FinancePage.module.css';
import { DollarSign } from 'lucide-react';

const FinancePage: React.FC = () => {
  const { t } = useTranslation();
  const [studentId, setStudentId] = useState('');
  const studentsQ = useQuery<Paginated<Student>>({
    queryKey: ['students'],
    queryFn: () => listStudents({ page: 1 }),
    staleTime: 60_000,
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);
  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase();
    return (studentsQ.data?.data || [])
      .filter(
        (s: Student) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }, [studentsQ.data, studentSearch]);
  const feesQ = useQuery({
    queryKey: ['fees', studentId],
    queryFn: () => listFees(studentId),
    enabled: !!studentId,
  });
  const paymentsQ = useQuery({
    queryKey: ['payments', studentId],
    queryFn: () => listPayments(studentId),
    enabled: !!studentId,
  });

  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const canCreate = useMemo(() => Number(amount) > 0 && !!studentId && !!dueDate, [amount, studentId, dueDate]);
  const createMut = useMutation({
    mutationFn: () =>
      createFee({
        studentId,
        amount: Number(amount),
        dueDate,
        status: 'pending',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', studentId] });
      setAmount('');
      setDueDate('');
    },
  });

  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [reference, setReference] = useState('');
  const canPay = useMemo(() => Number(payAmount) > 0 && !!payInvoiceId, [payAmount, payInvoiceId]);
  const payMut = useMutation({
    mutationFn: () =>
      recordPayment({
        invoiceId: payInvoiceId,
        amount: Number(payAmount),
        reference: reference || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', studentId] });
      queryClient.invalidateQueries({ queryKey: ['payments', studentId] });
      setPayInvoiceId('');
      setPayAmount('');
      setReference('');
    },
  });
  const [feeErrors, setFeeErrors] = useState<{
    amount?: string;
    dueDate?: string;
    studentId?: string;
  }>({});
  const [payErrors, setPayErrors] = useState<{
    invoiceId?: string;
    amount?: string;
  }>({});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className={`w-6 h-6 ${styles.icon}`} />
        <h1 className={`text-xl font-semibold ${styles.title}`}>{t('finance')}</h1>
      </div>

      <div className="card rounded-lg shadow-sm p-4">
        <div className="flex items-end gap-3 relative max-w-lg">
          <div className="w-full">
            <label htmlFor="studentSearch" className={`block text-sm mb-1 ${styles.label}`}>
              {t('student')}
            </label>
            <input
              id="studentSearch"
              className={`border rounded p-2 w-full ${styles.input}`}
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value);
                setShowStudentList(true);
              }}
              onFocus={() => setShowStudentList(true)}
              placeholder={t('search_student')}
              aria-label={t('search_student')}
            />
            {showStudentList && (studentsQ.isLoading || filteredStudents.length > 0) && (
              <ul className="absolute z-10 mt-1 w-full dropdown shadow-lg max-h-64 overflow-auto">
                {studentsQ.isLoading ? (
                  <li className="px-3 py-2">
                    <Skeleton className="w-44 h-3" />
                  </li>
                ) : (
                  filteredStudents.map((s: Student) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover-surface"
                        onClick={() => {
                          setStudentId(s.id);
                          setStudentSearch(`${s.firstName} ${s.lastName}`);
                          setShowStudentList(false);
                        }}
                      >
                        <span className={`mr-2 ${styles.studentName}`}>
                          {s.firstName} {s.lastName}
                        </span>
                        <span className={`text-xs ${styles.studentId}`}>{s.id}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card rounded-lg shadow-sm p-4">
          <h2 className={`font-semibold mb-4 ${styles.sectionTitle}`}>{t('fees')}</h2>
          <form
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              const parse = createFeeSchema
                .pick({
                  studentId: true,
                  amount: true,
                  dueDate: true,
                  status: true,
                })
                .safeParse({
                  studentId,
                  amount: Number(amount),
                  dueDate,
                  status: 'pending',
                });
              if (!parse.success) {
                const errs: {
                  amount?: string;
                  dueDate?: string;
                  studentId?: string;
                } = {};
                for (const issue of parse.error.issues) {
                  if (issue.path[0] === 'studentId') errs.studentId = t(issue.message);
                  if (issue.path[0] === 'amount') errs.amount = t(issue.message);
                  if (issue.path[0] === 'dueDate') errs.dueDate = t(issue.message);
                }
                setFeeErrors(errs);
                return;
              }
              setFeeErrors({});
              createMut.mutate();
            }}
          >
            <div>
              <label htmlFor="feeAmount" className={`block text-sm mb-1 ${styles.label}`}>
                {t('amount')}
              </label>
              <input
                id="feeAmount"
                className={`border rounded p-2 w-full ${styles.input}`}
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('amount')}
                aria-label={t('amount')}
              />
              {feeErrors.amount && <div className="text-xs text-red-600 dark:text-red-400">{feeErrors.amount}</div>}
            </div>
            <div>
              <label htmlFor="feeDue" className={`block text-sm mb-1 ${styles.label}`}>
                {t('due_date')}
              </label>
              <input
                id="feeDue"
                className={`border rounded p-2 w-full ${styles.input}`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label={t('due_date')}
              />
              {feeErrors.dueDate && <div className="text-xs text-red-600 dark:text-red-400">{feeErrors.dueDate}</div>}
            </div>
            <div>
              <button
                disabled={!canCreate || createMut.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                {t('create_fee')}
              </button>
            </div>
          </form>

          {feesQ.isError && (
            <div className="mb-3 p-3 border border-red-200 dark:border-red-800 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center justify-between">
              <span className="text-sm">{t('error_loading')}</span>
              <button
                className="px-2 py-1 border border-red-300 dark:border-red-600 rounded text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                onClick={() => feesQ.refetch()}
              >
                {t('retry')}
              </button>
            </div>
          )}
          {feesQ.isLoading ? (
            <div className="space-y-3">
              {['a', 'b', 'c'].map((k) => (
                <div key={`fees-sk-${k}`} className={`border rounded p-3 ${styles.input}`}>
                  <Skeleton className="w-40 h-3" />
                  <Skeleton className="w-32 h-3 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {feesQ.data?.data?.map((f: FeeInvoice) => (
                <li
                  key={f.id}
                  className={`border rounded p-3 flex items-center justify-between ${styles.input} ${styles.hoverBg}`}
                >
                  <div>
                    <div className={`font-medium ${styles.feeAmount}`}>
                      ${f.amount.toFixed(2)} ({f.status})
                    </div>
                    <div className={`text-sm ${styles.feeDueDate}`}>
                      {`${t('due')}:`} {new Date(f.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`text-xs ${styles.feeStatus}`}>{f.id}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card rounded-lg shadow-sm p-4">
          <h2 className={`font-semibold mb-4 ${styles.sectionTitle}`}>{t('payments')}</h2>
          <form
            className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = recordPaymentSchema.safeParse({
                invoiceId: payInvoiceId,
                amount: Number(payAmount),
                reference,
              });
              if (!parsed.success) {
                const errs: { invoiceId?: string; amount?: string } = {};
                for (const issue of parsed.error.issues) {
                  if (issue.path[0] === 'invoiceId') errs.invoiceId = t(issue.message);
                  if (issue.path[0] === 'amount') errs.amount = t(issue.message);
                }
                setPayErrors(errs);
                return;
              }
              setPayErrors({});
              payMut.mutate();
            }}
          >
            <div className="md:col-span-2">
              <label htmlFor="invoiceId" className={`block text-sm mb-1 ${styles.label}`}>
                {t('invoice_id')}
              </label>
              <input
                id="invoiceId"
                className={`border rounded p-2 w-full ${styles.input}`}
                value={payInvoiceId}
                onChange={(e) => setPayInvoiceId(e.target.value)}
                placeholder={t('invoice_id')}
                aria-label={t('invoice_id')}
              />
              {payErrors.invoiceId && (
                <div className="text-xs text-red-600 dark:text-red-400">{payErrors.invoiceId}</div>
              )}
            </div>
            <div>
              <label htmlFor="payAmount" className={`block text-sm mb-1 ${styles.label}`}>
                {t('amount')}
              </label>
              <input
                id="payAmount"
                className={`border rounded p-2 w-full ${styles.input}`}
                type="number"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={t('amount')}
                aria-label={t('amount')}
              />
              {payErrors.amount && <div className="text-xs text-red-600 dark:text-red-400">{payErrors.amount}</div>}
            </div>
            <div>
              <label htmlFor="payRef" className={`block text-sm mb-1 ${styles.label}`}>
                {t('reference')}
              </label>
              <input
                id="payRef"
                className={`border rounded p-2 w-full ${styles.input}`}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={t('reference')}
                aria-label={t('reference')}
              />
            </div>
            <div>
              <button
                disabled={!canPay || payMut.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                {t('record_payment')}
              </button>
            </div>
          </form>

          {paymentsQ.isError && (
            <div className="mb-3 p-3 border border-red-200 dark:border-red-800 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center justify-between">
              <span className="text-sm">{t('error_loading')}</span>
              <button
                className="px-2 py-1 border border-red-300 dark:border-red-600 rounded text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                onClick={() => paymentsQ.refetch()}
              >
                {t('retry')}
              </button>
            </div>
          )}
          {paymentsQ.isLoading ? (
            <div className="space-y-3">
              {['a', 'b', 'c'].map((k) => (
                <div key={`pay-sk-${k}`} className={`border rounded p-3 ${styles.input}`}>
                  <Skeleton className="w-30 h-3" />
                  <Skeleton className="w-40 h-3 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {paymentsQ.data?.data?.map((p: Payment) => (
                <li
                  key={p.id}
                  className={`border rounded p-3 flex items-center justify-between ${styles.input} ${styles.hoverBg}`}
                >
                  <div>
                    <div className={`font-medium ${styles.paymentAmount}`}>${p.amount.toFixed(2)}</div>
                    <div className={`text-sm ${styles.paymentDate}`}>{new Date(p.paidAt).toLocaleString()}</div>
                  </div>
                  <div className={`text-xs ${styles.paymentMethod}`}>{p.reference}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancePage;
