import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFee, listFees, listPayments, recordPayment, type FeeInvoice, type Payment } from '../api/finance';
import { listStudents } from '../api/students';
import type { Paginated, Student } from '../types/api';
import { queryClient } from '../queryClient';
import { Skeleton } from '../components/Skeleton';

const FinancePage: React.FC = () => {
  const { t } = useTranslation();
  const [studentId, setStudentId] = useState('');
  const studentsQ = useQuery<Paginated<Student>>({ queryKey: ['students'], queryFn: () => listStudents({ page: 1 }), staleTime: 60_000 });
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);
  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase();
    return (studentsQ.data?.data || []).filter((s: Student) =>
      s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q),
    ).slice(0, 10);
  }, [studentsQ.data, studentSearch]);
  const feesQ = useQuery({ queryKey: ['fees', studentId], queryFn: () => listFees(studentId), enabled: !!studentId });
  const paymentsQ = useQuery({ queryKey: ['payments', studentId], queryFn: () => listPayments(studentId), enabled: !!studentId });

  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const canCreate = useMemo(() => Number(amount) > 0 && !!studentId && !!dueDate, [amount, studentId, dueDate]);
  const createMut = useMutation({
    mutationFn: () => createFee({ studentId, amount: Number(amount), dueDate, status: 'pending' }),
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
    mutationFn: () => recordPayment({ invoiceId: payInvoiceId, amount: Number(payAmount), reference: reference || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees', studentId] });
      queryClient.invalidateQueries({ queryKey: ['payments', studentId] });
      setPayInvoiceId('');
      setPayAmount('');
      setReference('');
    },
  });
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">{t('finance')}</h1>

      <div className="flex items-end gap-3 relative max-w-lg">
        <div className="w-full">
          <label htmlFor="studentSearch" className="block text-sm mb-1">{t('student')}</label>
          <input
            id="studentSearch"
            className="border rounded p-2 w-full"
            value={studentSearch}
            onChange={(e) => { setStudentSearch(e.target.value); setShowStudentList(true); }}
            onFocus={() => setShowStudentList(true)}
            placeholder={t('search_student')}
            aria-label={t('search_student')}
          />
          {showStudentList && (studentsQ.isLoading || filteredStudents.length > 0) && (
            <ul className="absolute z-10 mt-1 w-full dropdown shadow max-h-64 overflow-auto">
              {studentsQ.isLoading ? (
                <li className="px-3 py-2"><Skeleton className="w-44 h-3" /></li>
              ) : (
                 filteredStudents.map((s: Student) => (
                  <li key={s.id}>
                    <button
                      type="button"
                       className="w-full text-left px-3 py-2 hover-surface"
                      onClick={() => { setStudentId(s.id); setStudentSearch(`${s.firstName} ${s.lastName}`); setShowStudentList(false); }}
                    >
                      <span className="mr-2">{s.firstName} {s.lastName}</span><span className="text-xs text-gray-500">{s.id}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">{t('fees')}</h2>
          <form
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-3"
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
          >
            <div>
              <label htmlFor="feeAmount" className="block text-sm mb-1">{t('amount')}</label>
              <input id="feeAmount" className="border rounded p-2 w-full" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('amount')} aria-label={t('amount')} />
            </div>
            <div>
              <label htmlFor="feeDue" className="block text-sm mb-1">{t('due_date')}</label>
              <input id="feeDue" className="border rounded p-2 w-full" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label={t('due_date')} />
            </div>
            <div>
              <button disabled={!canCreate || createMut.isPending} className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{t('create_fee')}</button>
            </div>
          </form>

          {feesQ.isError && (
            <div className="mb-3 p-3 border rounded bg-red-50 text-red-900 flex items-center justify-between">
              <span className="text-sm">{t('error_loading')}</span>
              <button className="px-2 py-1 border rounded" onClick={() => feesQ.refetch()}>{t('retry')}</button>
            </div>
          )}
          {feesQ.isLoading ? (
            <div className="space-y-3">
              {['a','b','c'].map((k) => (
                <div key={`fees-sk-${k}`} className="border rounded p-3">
                  <Skeleton className="w-40 h-3" />
                  <Skeleton className="w-32 h-3 mt-2" />
                </div>
              ))}
            </div>
          ) : (
          <ul className="space-y-2">
            {feesQ.data?.data?.map((f: FeeInvoice) => (
              <li key={f.id} className="card p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">${f.amount.toFixed(2)} ({f.status})</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{`${t('due')}:`} {new Date(f.dueDate).toLocaleDateString()}</div>
                </div>
                <div className="text-xs text-gray-500">{f.id}</div>
              </li>
            ))}
          </ul>
          )}
        </div>
        <div>
          <h2 className="font-semibold mb-2">{t('payments')}</h2>
          <form
            className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mb-3"
            onSubmit={(e) => {
              e.preventDefault();
              payMut.mutate();
            }}
          >
            <div className="md:col-span-2">
              <label htmlFor="invoiceId" className="block text-sm mb-1">{t('invoice_id')}</label>
              <input id="invoiceId" className="border rounded p-2 w-full" value={payInvoiceId} onChange={(e) => setPayInvoiceId(e.target.value)} placeholder={t('invoice_id')} aria-label={t('invoice_id')} />
            </div>
            <div>
              <label htmlFor="payAmount" className="block text-sm mb-1">{t('amount')}</label>
              <input id="payAmount" className="border rounded p-2 w-full" type="number" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={t('amount')} aria-label={t('amount')} />
            </div>
            <div>
              <label htmlFor="payRef" className="block text-sm mb-1">{t('reference')}</label>
              <input id="payRef" className="border rounded p-2 w-full" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={t('reference')} aria-label={t('reference')} />
            </div>
            <div>
              <button disabled={!canPay || payMut.isPending} className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{t('record_payment')}</button>
            </div>
          </form>

          {paymentsQ.isError && (
            <div className="mb-3 p-3 border rounded bg-red-50 text-red-900 flex items-center justify-between">
              <span className="text-sm">{t('error_loading')}</span>
              <button className="px-2 py-1 border rounded" onClick={() => paymentsQ.refetch()}>{t('retry')}</button>
            </div>
          )}
          {paymentsQ.isLoading ? (
            <div className="space-y-3">
              {['a','b','c'].map((k) => (
                <div key={`pay-sk-${k}`} className="border rounded p-3">
                  <Skeleton className="w-30 h-3" />
                  <Skeleton className="w-40 h-3 mt-2" />
                </div>
              ))}
            </div>
          ) : (
          <ul className="space-y-2">
            {paymentsQ.data?.map((p: Payment) => (
              <li key={p.id} className="card p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">${p.amount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{new Date(p.paidAt).toLocaleString()}</div>
                </div>
                <div className="text-xs text-gray-500">{p.reference}</div>
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

