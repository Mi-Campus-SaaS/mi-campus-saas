import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFee, listFees, listPayments, recordPayment, type FeeInvoice, type Payment } from '../api/finance';
import { listStudents } from '../api/students';
import type { Paginated, Student } from '../types/api';
import { queryClient } from '../queryClient';
import { Skeleton } from '../components/Skeleton';
import { createFeeSchema, recordPaymentSchema } from '../validation/schemas';
import { useZodForm } from '../hooks/useZodForm';
import Form from '../components/forms/Form';
import Field from '../components/forms/Field';
import { NumberField, TextField, DateField } from '../components/forms/inputs';
import styles from './FinancePage.module.css';
import { DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import { openFinancePdf } from '../utils/financePdf';

const FinancePage: React.FC = () => {
  const { t, i18n } = useTranslation();
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

  const feeForm = useZodForm(createFeeSchema, { studentId: '', amount: 0, dueDate: '', status: 'pending' });
  const createMut = useMutation({
    mutationFn: () =>
      createFee({
        studentId,
        amount: feeForm.values.amount,
        dueDate: feeForm.values.dueDate,
        status: 'pending',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', studentId] });
      feeForm.setValues({ studentId: '', amount: 0, dueDate: '', status: 'pending' });
    },
  });

  const payForm = useZodForm(recordPaymentSchema, { invoiceId: '', amount: 0, reference: '' });
  const payMut = useMutation({
    mutationFn: () =>
      recordPayment({
        invoiceId: payForm.values.invoiceId,
        amount: payForm.values.amount,
        reference: payForm.values.reference || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', studentId] });
      queryClient.invalidateQueries({ queryKey: ['payments', studentId] });
      payForm.setValues({ invoiceId: '', amount: 0, reference: '' });
    },
  });
  // Validation errors are provided by useZodForm (feeForm.errors, payForm.errors)

  const locale = useMemo(() => {
    const lang = i18n.language || 'es';
    if (lang.startsWith('es')) return 'es-ES';
    if (lang.startsWith('en')) return 'en-US';
    return lang;
  }, [i18n.language]);

  const currency = 'USD';

  const selectedStudent = useMemo(() => {
    if (!studentId) return null;
    const list = studentsQ.data?.data || [];
    return list.find((s) => s.id === studentId) || null;
  }, [studentId, studentsQ.data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className={`w-6 h-6 ${styles.icon}`} />
        <h1 className={`text-xl font-semibold ${styles.title}`}>{t('finance')}</h1>
        <div className="ml-auto">
          <button
            type="button"
            className="border px-3 py-2 rounded hover-surface disabled:opacity-50"
            disabled={!studentId}
            onClick={() => {
              openFinancePdf({
                student: {
                  id: selectedStudent?.id || studentId,
                  name: selectedStudent
                    ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
                    : studentSearch || studentId,
                },
                invoices: feesQ.data?.data || [],
                payments: paymentsQ.data?.data || [],
                currency,
                locale,
                schoolName: 'MI Campus',
              });
            }}
          >
            {t('export_pdf')}
          </button>
        </div>
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
          <Form
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-4"
            onSubmit={feeForm.handleSubmit(() => {
              if (!studentId) return;
              createMut.mutate();
            })}
          >
            <Field id="feeAmount" label={t('amount')} error={feeForm.errors.amount && t(feeForm.errors.amount)}>
              <NumberField
                id="feeAmount"
                className={styles.input}
                value={feeForm.values.amount}
                onChange={(v) => feeForm.setField('amount', Number(v))}
                placeholder={t('amount')}
                min={0}
                step={0.01}
              />
            </Field>
            <div>
              <label htmlFor="feeDue" className={`block text-sm mb-1 ${styles.label}`}>
                {t('due_date')}
              </label>
              <DateField
                id="feeDue"
                className={styles.input}
                value={feeForm.values.dueDate}
                onChange={(v) => feeForm.setField('dueDate', v)}
                placeholder={t('due_date')}
              />
              {feeForm.errors.dueDate && (
                <div className="text-xs text-red-600 dark:text-red-400">{t(feeForm.errors.dueDate)}</div>
              )}
            </div>
            <div>
              <button
                disabled={createMut.isPending || !studentId || feeForm.values.amount <= 0 || !feeForm.values.dueDate}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                {t('create_fee')}
              </button>
            </div>
          </Form>

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
                      {formatCurrency(f.amount, locale, currency)} ({f.status})
                    </div>
                    <div className={`text-sm ${styles.feeDueDate}`}>
                      {`${t('due')}:`} {formatDate(f.dueDate, locale)}
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
          <Form
            className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mb-4"
            onSubmit={payForm.handleSubmit(() => {
              payMut.mutate();
            })}
          >
            <div className="md:col-span-2">
              <label htmlFor="invoiceId" className={`block text-sm mb-1 ${styles.label}`}>
                {t('invoice_id')}
              </label>
              <input
                id="invoiceId"
                className={`border rounded p-2 w-full ${styles.input}`}
                value={payForm.values.invoiceId}
                onChange={(e) => payForm.setField('invoiceId', e.target.value)}
                placeholder={t('invoice_id')}
                aria-label={t('invoice_id')}
              />
              {payForm.errors.invoiceId && (
                <div className="text-xs text-red-600 dark:text-red-400">{t(payForm.errors.invoiceId)}</div>
              )}
            </div>
            <div>
              <label htmlFor="payAmount" className={`block text-sm mb-1 ${styles.label}`}>
                {t('amount')}
              </label>
              <NumberField
                id="payAmount"
                className={styles.input}
                value={payForm.values.amount}
                onChange={(v) => payForm.setField('amount', Number(v))}
                placeholder={t('amount')}
                min={0}
                step={0.01}
              />
              {payForm.errors.amount && (
                <div className="text-xs text-red-600 dark:text-red-400">{t(payForm.errors.amount)}</div>
              )}
            </div>
            <div>
              <label htmlFor="payRef" className={`block text-sm mb-1 ${styles.label}`}>
                {t('reference')}
              </label>
              <TextField
                id="payRef"
                className={styles.input}
                value={payForm.values.reference}
                onChange={(v) => payForm.setField('reference', v)}
                placeholder={t('reference')}
              />
            </div>
            <div>
              <button
                disabled={payMut.isPending || !payForm.values.invoiceId || payForm.values.amount <= 0}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                {t('record_payment')}
              </button>
            </div>
          </Form>

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
                    <div className={`font-medium ${styles.paymentAmount}`}>
                      {formatCurrency(p.amount, locale, currency)}
                    </div>
                    <div className={`text-sm ${styles.paymentDate}`}>{formatDate(p.paidAt, locale)}</div>
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
