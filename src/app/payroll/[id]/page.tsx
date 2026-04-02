'use client';

import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import { formatPKR } from '@/lib/currency';

type PayrollStatus = 'draft' | 'processed' | 'paid';

type Account = {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'savings' | 'investment';
  balance: number;
  currency: string;
  is_active: boolean;
};

type PayrollRow = {
  id: string;
  user_id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  base_salary: number;
  overtime_amount: number | null;
  bonus_amount: number | null;
  allowances: number | null;
  gross_salary: number;
  tax_deduction: number | null;
  provident_fund: number | null;
  other_deductions: number | null;
  total_deductions: number;
  net_salary: number;
  currency: string;
  status: PayrollStatus;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employees?: {
    first_name?: string;
    last_name?: string;
    department?: string | null;
    email?: string | null;
  } | null;
};

type PayrollItem = {
  id: string;
  payroll_id: string;
  item_type: 'earning' | 'deduction';
  item_name: string;
  amount: number;
  is_taxable: boolean;
  created_at: string;
};

const Container = styled.div`
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const Subtitle = styled.div`
  color: rgba(255, 255, 255, 0.75);
  margin-top: 6px;
  font-size: 14px;
`;

const Card = styled.div`
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.3);
  box-shadow: 0 8px 32px rgba(220, 38, 38, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
`;

const Stat = styled.div`
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
`;

const StatValue = styled.div`
  margin-top: 6px;
  font-size: 18px;
  font-weight: 700;
  color: white;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  &:last-child {
    border-bottom: none;
  }
`;

const RowLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
`;

const RowValue = styled.div`
  color: white;
  font-size: 14px;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ $status: PayrollStatus }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;

  ${props => {
    switch (props.$status) {
      case 'paid':
        return `
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.35);
        `;
      case 'processed':
        return `
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.35);
        `;
      default:
        return `
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.35);
        `;
    }
  }}
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 700;
  color: white;
`;

const Input = styled.input`
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 14px;
  color: white;

  &:focus {
    outline: none;
    border-color: rgba(220, 38, 38, 0.6);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
  }
`;

const Select = styled.select`
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 14px;
  color: white;

  &:focus {
    outline: none;
    border-color: rgba(220, 38, 38, 0.6);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Td = styled.td`
  padding: 12px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

export default function PayrollDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const payrollId = params?.id as string;

  const [payroll, setPayroll] = useState<PayrollRow | null>(null);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payFromAccountId, setPayFromAccountId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  const employeeName = useMemo(() => {
    const first = payroll?.employees?.first_name || '';
    const last = payroll?.employees?.last_name || '';
    const name = `${first} ${last}`.trim();
    return name || 'Employee';
  }, [payroll]);

  const [form, setForm] = useState({
    pay_period_start: '',
    pay_period_end: '',
    pay_date: '',
    payment_method: 'bank_transfer',
    base_salary: 0,
    allowances: 0,
    bonus_amount: 0,
    overtime_amount: 0,
    tax_deduction: 0,
    provident_fund: 0,
    other_deductions: 0
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [router, user]);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return;
      try {
        const supabase = createSupabaseClient();
        if (!supabase) return;

        const { data, error: accountsError } = await supabase
          .from('accounts')
          .select('id, name, type, balance, currency, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (accountsError) throw accountsError;
        const next = (data as Account[]) || [];
        setAccounts(next);
        if (!payFromAccountId && next.length > 0) {
          const preferred = next.find((a) => a.type === 'bank') || next.find((a) => a.type === 'cash') || next[0];
          setPayFromAccountId(preferred?.id || '');
        }
      } catch {
        setAccounts([]);
      }
    };

    fetchAccounts();
  }, [payFromAccountId, user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const supabase = createSupabaseClient();
        if (!supabase) throw new Error('Supabase client is not initialized');

        const { data: payrollData, error: payrollError } = await supabase
          .from('payroll')
          .select(
            `
            *,
            employees (
              first_name,
              last_name,
              department,
              email
            )
          `
          )
          .eq('id', payrollId)
          .eq('user_id', user.id)
          .single();

        if (payrollError) throw payrollError;

        const record = payrollData as PayrollRow;
        setPayroll(record);

        setForm({
          pay_period_start: record.pay_period_start,
          pay_period_end: record.pay_period_end,
          pay_date: record.pay_date,
          payment_method: record.payment_method || 'bank_transfer',
          base_salary: record.base_salary || 0,
          allowances: record.allowances || 0,
          bonus_amount: record.bonus_amount || 0,
          overtime_amount: record.overtime_amount || 0,
          tax_deduction: record.tax_deduction || 0,
          provident_fund: record.provident_fund || 0,
          other_deductions: record.other_deductions || 0
        });

        const { data: itemsData, error: itemsError } = await supabase
          .from('payroll_items')
          .select('id, payroll_id, item_type, item_name, amount, is_taxable, created_at')
          .eq('payroll_id', payrollId)
          .order('created_at', { ascending: true });

        if (itemsError) throw itemsError;
        setItems((itemsData as PayrollItem[]) || []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load payroll';
        setError(message);
        setPayroll(null);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [payrollId, user]);

  const applyAccountDelta = async (accountId: string, delta: number) => {
    if (!user) return;
    const supabase = createSupabaseClient();
    if (!supabase) throw new Error('Supabase client is not initialized');

    const { data: accountRow, error: accountError } = await supabase
      .from('accounts')
      .select('id, balance')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError) throw accountError;

    const currentBalance = Number((accountRow as { balance: number }).balance || 0);
    const nextBalance = currentBalance + delta;

    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: nextBalance })
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, balance: nextBalance } : a)));
  };

  const ensurePayrollExpense = async () => {
    if (!user) return;
    if (!payroll) return;
    const supabase = createSupabaseClient();
    if (!supabase) throw new Error('Supabase client is not initialized');

    const expenseNote = `payroll_id:${payrollId}`;
    const expenseDescription = `Salary payment - ${employeeName} [${payrollId}]`;

    const { data: existingExpense, error: existingExpenseError } = await supabase
      .from('expenses')
      .select('id, category')
      .eq('user_id', user.id)
      .eq('notes', expenseNote)
      .maybeSingle();

    if (existingExpenseError) throw existingExpenseError;

    if (existingExpense?.id) {
      if ((existingExpense as { category?: string }).category !== 'Salary') {
        const { error: updateExpenseError } = await supabase
          .from('expenses')
          .update({ category: 'Salary', description: expenseDescription })
          .eq('id', (existingExpense as { id: string }).id)
          .eq('user_id', user.id);
        if (updateExpenseError) throw updateExpenseError;
      }
      return;
    }

    if (!existingExpense?.id) {
      const { error: insertExpenseError } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          description: expenseDescription,
          amount: payroll.net_salary,
          category: 'Salary',
          date: payroll.pay_date,
          notes: expenseNote,
          payment_method: payroll.payment_method || 'bank_transfer',
          currency: payroll.currency || 'PKR'
        });

      if (insertExpenseError) throw insertExpenseError;
    }
  };

  const deletePayrollExpense = async () => {
    if (!user) return;
    const supabase = createSupabaseClient();
    if (!supabase) throw new Error('Supabase client is not initialized');

    const expenseNote = `payroll_id:${payrollId}`;
    const { error: deleteExpenseError } = await supabase
      .from('expenses')
      .delete()
      .eq('user_id', user.id)
      .eq('notes', expenseNote);

    if (deleteExpenseError) throw deleteExpenseError;
  };

  const ensurePayrollAccountDebit = async (accountId: string) => {
    if (!user) return;
    if (!payroll) return;

    const supabase = createSupabaseClient();
    if (!supabase) throw new Error('Supabase client is not initialized');

    const reference = `PAYROLL-${payrollId}`;
    const hasAccountTxn = await accountTransactionsAvailable();

    if (hasAccountTxn) {
      const { data: existingTxn, error: existingTxnError } = await supabase
        .from('account_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('reference', reference)
        .maybeSingle();

      if (existingTxnError) throw existingTxnError;

      if (!existingTxn?.id) {
        const { error: txnError } = await supabase
          .from('account_transactions')
          .insert({
            account_id: accountId,
            type: 'debit',
            amount: payroll.net_salary,
            description: `Payroll payment - ${employeeName}`,
            reference,
            date: payroll.pay_date,
            user_id: user.id
          });

        if (txnError) throw txnError;
        await applyAccountDelta(accountId, -Number(payroll.net_salary || 0));
      }
      return;
    }

    const referenceMarker = payroll.payment_reference || '';
    const nextMarker = `acct:${accountId}`;
    if (!referenceMarker.includes(nextMarker)) {
      await applyAccountDelta(accountId, -Number(payroll.net_salary || 0));
    }
  };

  const reversePayrollPayment = async () => {
    if (!user) return;
    if (!payroll) return;
    if (payroll.status !== 'paid') return;

    try {
      setProcessing(true);
      setError(null);
      const supabase = createSupabaseClient();
      if (!supabase) throw new Error('Supabase client is not initialized');

      const debitRef = `PAYROLL-${payrollId}`;
      const reverseRef = `PAYROLL-REV-${payrollId}`;
      const hasAccountTxn = await accountTransactionsAvailable();

      if (hasAccountTxn) {
        const { data: debitTxn, error: debitError } = await supabase
          .from('account_transactions')
          .select('id, account_id')
          .eq('user_id', user.id)
          .eq('reference', debitRef)
          .maybeSingle();

        if (debitError) throw debitError;

        const { data: reverseTxn, error: reverseError } = await supabase
          .from('account_transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('reference', reverseRef)
          .maybeSingle();

        if (reverseError) throw reverseError;

        if (debitTxn?.account_id && !reverseTxn?.id) {
          const { error: txnError } = await supabase
            .from('account_transactions')
            .insert({
              account_id: (debitTxn as { account_id: string }).account_id,
              type: 'credit',
              amount: payroll.net_salary,
              description: `Payroll reversal - ${employeeName}`,
              reference: reverseRef,
              date: new Date().toISOString().slice(0, 10),
              user_id: user.id
            });

          if (txnError) throw txnError;
          await applyAccountDelta((debitTxn as { account_id: string }).account_id, Number(payroll.net_salary || 0));
        }
      } else {
        const marker = payroll.payment_reference || '';
        const match = marker.match(/acct:([0-9a-fA-F-]{36})/);
        const accountId = match?.[1] || payFromAccountId;
        if (accountId) {
          await applyAccountDelta(accountId, Number(payroll.net_salary || 0));
        }
      }

      await deletePayrollExpense();

      const { error: updateError } = await supabase
        .from('payroll')
        .update({ status: 'processed', updated_at: new Date().toISOString() })
        .eq('id', payrollId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setPayroll((prev) => (prev ? { ...prev, status: 'processed' } : prev));
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  const reverseProcessedPayroll = async () => {
    if (!user) return;
    if (!payroll) return;
    if (payroll.status !== 'processed') return;

    try {
      setProcessing(true);
      setError(null);
      const supabase = createSupabaseClient();
      if (!supabase) throw new Error('Supabase client is not initialized');

      const debitRef = `PAYROLL-${payrollId}`;
      const reverseRef = `PAYROLL-REV-${payrollId}`;
      const hasAccountTxn = await accountTransactionsAvailable();

      if (hasAccountTxn) {
        const { data: debitTxn, error: debitError } = await supabase
          .from('account_transactions')
          .select('id, account_id')
          .eq('user_id', user.id)
          .eq('reference', debitRef)
          .maybeSingle();

        if (debitError) throw debitError;

        if (debitTxn?.account_id) {
          await applyAccountDelta((debitTxn as { account_id: string }).account_id, Number(payroll.net_salary || 0));
        }

        const { error: deleteTxnError } = await supabase
          .from('account_transactions')
          .delete()
          .eq('user_id', user.id)
          .in('reference', [debitRef, reverseRef]);

        if (deleteTxnError) throw deleteTxnError;
      } else {
        const marker = payroll.payment_reference || '';
        const match = marker.match(/acct:([0-9a-fA-F-]{36})/);
        const accountId = match?.[1];
        if (accountId) {
          await applyAccountDelta(accountId, Number(payroll.net_salary || 0));
        }
      }

      await deletePayrollExpense();

      const { error: updateError } = await supabase
        .from('payroll')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .eq('id', payrollId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setPayroll((prev) => (prev ? { ...prev, status: 'draft' } : prev));
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  const deletePayroll = async () => {
    if (!user) return;
    if (!payroll) return;

    const confirmed = window.confirm('Delete this payroll? If already paid, balance will be restored.');
    if (!confirmed) return;

    try {
      setProcessing(true);
      setError(null);
      const supabase = createSupabaseClient();
      if (!supabase) throw new Error('Supabase client is not initialized');

      const debitRef = `PAYROLL-${payrollId}`;
      const reverseRef = `PAYROLL-REV-${payrollId}`;
      const hasAccountTxn = await accountTransactionsAvailable();

      if (payroll.status === 'paid') {
        if (hasAccountTxn) {
          const { data: reverseTxn, error: reverseError } = await supabase
            .from('account_transactions')
            .select('id')
            .eq('user_id', user.id)
            .eq('reference', reverseRef)
            .maybeSingle();

          if (reverseError) throw reverseError;

          if (!reverseTxn?.id) {
            const { data: debitTxn, error: debitError } = await supabase
              .from('account_transactions')
              .select('id, account_id')
              .eq('user_id', user.id)
              .eq('reference', debitRef)
              .maybeSingle();

            if (debitError) throw debitError;

            if (debitTxn?.account_id) {
              await applyAccountDelta((debitTxn as { account_id: string }).account_id, Number(payroll.net_salary || 0));
            }
          }
        } else {
          const marker = payroll.payment_reference || '';
          const match = marker.match(/acct:([0-9a-fA-F-]{36})/);
          const accountId = match?.[1] || payFromAccountId;
          if (accountId) {
            await applyAccountDelta(accountId, Number(payroll.net_salary || 0));
          }
        }
      }

      await deletePayrollExpense();

      if (hasAccountTxn) {
        const { error: deleteTxnError } = await supabase
          .from('account_transactions')
          .delete()
          .eq('user_id', user.id)
          .in('reference', [debitRef, reverseRef]);

        if (deleteTxnError) throw deleteTxnError;
      }

      const { error: deletePayrollError } = await supabase
        .from('payroll')
        .delete()
        .eq('id', payrollId)
        .eq('user_id', user.id);

      if (deletePayrollError) throw deletePayrollError;

      router.push('/payroll');
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  const computed = useMemo(() => {
    const gross = Number(form.base_salary || 0) + Number(form.allowances || 0) + Number(form.bonus_amount || 0) + Number(form.overtime_amount || 0);
    const totalDeductions = Number(form.tax_deduction || 0) + Number(form.provident_fund || 0) + Number(form.other_deductions || 0);
    const net = gross - totalDeductions;
    return { gross, totalDeductions, net };
  }, [form]);

  const getErrorMessage = (e: unknown) => {
    if (typeof e === 'string') return e;
    if (e && typeof e === 'object') {
      const anyE = e as Record<string, unknown>;
      const message = typeof anyE.message === 'string' ? anyE.message : null;
      const details = typeof anyE.details === 'string' ? anyE.details : null;
      const hint = typeof anyE.hint === 'string' ? anyE.hint : null;
      const code = typeof anyE.code === 'string' ? anyE.code : null;

      const parts = [message, details, hint, code ? `code: ${code}` : null].filter(Boolean) as string[];
      if (parts.length > 0) return parts.join(' | ');
    }
    return 'Unknown error';
  };

  const isMissingTableError = (e: unknown) => {
    if (!e || typeof e !== 'object') return false;
    const anyE = e as Record<string, unknown>;
    if (anyE.code === '42P01') return true;
    if (anyE.code === 'PGRST205') return true;
    const message = typeof anyE.message === 'string' ? anyE.message : '';
    const lower = message.toLowerCase();
    return lower.includes('does not exist') || lower.includes('could not find the table');
  };

  const accountTransactionsAvailable = async () => {
    if (!user) return false;
    const supabase = createSupabaseClient();
    if (!supabase) return false;
    const { error } = await supabase.from('account_transactions').select('id').limit(1);
    if (!error) return true;
    if (isMissingTableError(error)) return false;
    return true;
  };

  const saveEdits = async () => {
    if (!user) return;
    if (!payroll) return;

    try {
      setSaving(true);
      setError(null);
      const supabase = createSupabaseClient();
      if (!supabase) throw new Error('Supabase client is not initialized');

      const { error: updateError } = await supabase
        .from('payroll')
        .update({
          pay_period_start: form.pay_period_start,
          pay_period_end: form.pay_period_end,
          pay_date: form.pay_date,
          payment_method: form.payment_method,
          base_salary: Number(form.base_salary || 0),
          allowances: Number(form.allowances || 0),
          bonus_amount: Number(form.bonus_amount || 0),
          overtime_amount: Number(form.overtime_amount || 0),
          gross_salary: computed.gross,
          tax_deduction: Number(form.tax_deduction || 0),
          provident_fund: Number(form.provident_fund || 0),
          other_deductions: Number(form.other_deductions || 0),
          total_deductions: computed.totalDeductions,
          net_salary: computed.net,
          updated_at: new Date().toISOString()
        })
        .eq('id', payrollId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setPayroll((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pay_period_start: form.pay_period_start,
          pay_period_end: form.pay_period_end,
          pay_date: form.pay_date,
          payment_method: form.payment_method,
          base_salary: Number(form.base_salary || 0),
          allowances: Number(form.allowances || 0),
          bonus_amount: Number(form.bonus_amount || 0),
          overtime_amount: Number(form.overtime_amount || 0),
          gross_salary: computed.gross,
          tax_deduction: Number(form.tax_deduction || 0),
          provident_fund: Number(form.provident_fund || 0),
          other_deductions: Number(form.other_deductions || 0),
          total_deductions: computed.totalDeductions,
          net_salary: computed.net
        };
      });
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const processPayroll = async () => {
    if (!user) return;
    if (!payroll) return;
    try {
      setProcessing(true);
      setError(null);
      const supabase = createSupabaseClient();
      if (!supabase) throw new Error('Supabase client is not initialized');

      const { error: updateError } = await supabase
        .from('payroll')
        .update({ status: 'processed', updated_at: new Date().toISOString() })
        .eq('id', payrollId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      setPayroll((prev) => (prev ? { ...prev, status: 'processed' } : prev));
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  const markPaid = async () => {
    if (!user) return;
    if (!payroll) return;
    try {
      setProcessing(true);
      setError(null);
      const supabase = createSupabaseClient();
      if (!supabase) throw new Error('Supabase client is not initialized');

      if (payFromAccountId) {
        await ensurePayrollAccountDebit(payFromAccountId);
      }
      await ensurePayrollExpense();

      const { error: updateError } = await supabase
        .from('payroll')
        .update({
          status: 'paid',
          payment_reference: payFromAccountId ? `acct:${payFromAccountId}` : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', payrollId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setPayroll((prev) => (prev ? { ...prev, status: 'paid' } : prev));
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <Card>Loading payroll...</Card>
        </Container>
      </DashboardLayout>
    );
  }

  if (!payroll) {
    return (
      <DashboardLayout>
        <Container>
          <Card>
            {error ? error : 'Payroll record not found'}
            <div style={{ marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => router.push('/payroll')}>
                Back to Payroll
              </Button>
            </div>
          </Card>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <div>
            <Title>Payroll Details</Title>
            <Subtitle>
              {employeeName} • {payroll.employees?.department || 'Unknown'} •{' '}
              {format(parseISO(payroll.pay_period_start), 'do MMM')} - {format(parseISO(payroll.pay_period_end), 'do MMM, yyyy')}
            </Subtitle>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <StatusBadge $status={payroll.status}>{payroll.status}</StatusBadge>
            <Button variant="secondary" onClick={() => router.push('/payroll')}>
              Back
            </Button>
            {payroll.status === 'draft' && (
              <Button onClick={processPayroll} disabled={processing}>
                {processing ? 'Processing...' : 'Process'}
              </Button>
            )}
            {payroll.status === 'processed' && (
              <>
                <Button onClick={markPaid} disabled={processing}>
                  {processing ? 'Saving...' : 'Mark Paid'}
                </Button>
                <Button variant="secondary" onClick={reverseProcessedPayroll} disabled={processing}>
                  {processing ? 'Saving...' : 'Reverse'}
                </Button>
              </>
            )}
            {payroll.status === 'paid' && (
              <>
                <Button onClick={reversePayrollPayment} disabled={processing}>
                  {processing ? 'Saving...' : 'Reverse'}
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={deletePayroll} disabled={processing}>
              Delete
            </Button>
          </div>
        </Header>

        {error && (
          <div style={{ marginBottom: '12px', color: '#ef4444' }}>
            {error}
          </div>
        )}

        <Card>
          <Grid>
            <Stat>
              <StatLabel>Gross Salary</StatLabel>
              <StatValue>{formatPKR(payroll.gross_salary)}</StatValue>
            </Stat>
            <Stat>
              <StatLabel>Total Deductions</StatLabel>
              <StatValue>{formatPKR(payroll.total_deductions)}</StatValue>
            </Stat>
            <Stat>
              <StatLabel>Net Salary</StatLabel>
              <StatValue>{formatPKR(payroll.net_salary)}</StatValue>
            </Stat>
            <Stat>
              <StatLabel>Pay Date</StatLabel>
              <StatValue>{format(parseISO(payroll.pay_date), 'do MMM, yyyy')}</StatValue>
            </Stat>
            <Stat>
              <StatLabel>Pay Period</StatLabel>
              <StatValue>
                {format(parseISO(payroll.pay_period_start), 'do MMM')} - {format(parseISO(payroll.pay_period_end), 'do MMM, yyyy')}
              </StatValue>
            </Stat>
          </Grid>
        </Card>

        <Card>
          <Row>
            <RowLabel>Base Salary</RowLabel>
            <RowValue>{formatPKR(payroll.base_salary)}</RowValue>
          </Row>
          <Row>
            <RowLabel>Allowances</RowLabel>
            <RowValue>{formatPKR(payroll.allowances || 0)}</RowValue>
          </Row>
          <Row>
            <RowLabel>Bonus</RowLabel>
            <RowValue>{formatPKR(payroll.bonus_amount || 0)}</RowValue>
          </Row>
          <Row>
            <RowLabel>Overtime</RowLabel>
            <RowValue>{formatPKR(payroll.overtime_amount || 0)}</RowValue>
          </Row>
          <Row>
            <RowLabel>Tax Deduction</RowLabel>
            <RowValue>-{formatPKR(payroll.tax_deduction || 0)}</RowValue>
          </Row>
          <Row>
            <RowLabel>Provident Fund</RowLabel>
            <RowValue>-{formatPKR(payroll.provident_fund || 0)}</RowValue>
          </Row>
          <Row>
            <RowLabel>Other Deductions</RowLabel>
            <RowValue>-{formatPKR(payroll.other_deductions || 0)}</RowValue>
          </Row>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <div style={{ fontWeight: 800, color: 'white' }}>Edit Payroll</div>
            <Button onClick={saveEdits} disabled={saving || payroll.status !== 'draft'}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
          <FieldGrid>
            <Field>
              <Label>Period Start</Label>
              <Input
                type="date"
                value={(form.pay_period_start || '').slice(0, 10)}
                onChange={(e) => setForm((prev) => ({ ...prev, pay_period_start: e.target.value }))}
                disabled={payroll.status !== 'draft'}
              />
            </Field>
            <Field>
              <Label>Period End</Label>
              <Input
                type="date"
                value={(form.pay_period_end || '').slice(0, 10)}
                onChange={(e) => setForm((prev) => ({ ...prev, pay_period_end: e.target.value }))}
                disabled={payroll.status !== 'draft'}
              />
            </Field>
            <Field>
              <Label>Pay Date</Label>
              <Input
                type="date"
                value={(form.pay_date || '').slice(0, 10)}
                onChange={(e) => setForm((prev) => ({ ...prev, pay_date: e.target.value }))}
                disabled={payroll.status !== 'draft'}
              />
            </Field>
            <Field>
              <Label>Payment Method</Label>
              <Select
                value={form.payment_method}
                onChange={(e) => setForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                disabled={payroll.status !== 'draft'}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </Select>
            </Field>
            <Field>
              <Label>Base Salary</Label>
              <Input
                type="number"
                value={form.base_salary}
                onChange={(e) => setForm((prev) => ({ ...prev, base_salary: Number(e.target.value || 0) }))}
                disabled={payroll.status !== 'draft'}
              />
            </Field>
            <Field>
              <Label>Allowances</Label>
              <Input
                type="number"
                value={form.allowances}
                onChange={(e) => setForm((prev) => ({ ...prev, allowances: Number(e.target.value || 0) }))}
                disabled={payroll.status !== 'draft'}
              />
            </Field>
            <Field>
              <Label>Bonus</Label>
              <Input
                type="number"
                value={form.bonus_amount}
                onChange={(e) => setForm((prev) => ({ ...prev, bonus_amount: Number(e.target.value || 0) }))}
                disabled={payroll.status !== 'draft'}
              />
            </Field>
            <Field>
              <Label>Overtime Amount</Label>
              <Input
                type="number"
                value={form.overtime_amount}
                onChange={(e) => setForm((prev) => ({ ...prev, overtime_amount: Number(e.target.value || 0) }))}
                disabled={payroll.status !== 'draft'}
              />
            </Field>
            <Field>
              <Label>Tax Deduction</Label>
              <Input
                type="number"
                value={form.tax_deduction}
                onChange={(e) => setForm((prev) => ({ ...prev, tax_deduction: Number(e.target.value || 0) }))}
                disabled={payroll.status !== 'draft'}
              />
            </Field>
            <Field>
              <Label>Provident Fund</Label>
              <Input
                type="number"
                value={form.provident_fund}
                onChange={(e) => setForm((prev) => ({ ...prev, provident_fund: Number(e.target.value || 0) }))}
                disabled={payroll.status !== 'draft'}
              />
            </Field>
            <Field>
              <Label>Other Deductions</Label>
              <Input
                type="number"
                value={form.other_deductions}
                onChange={(e) => setForm((prev) => ({ ...prev, other_deductions: Number(e.target.value || 0) }))}
                disabled={payroll.status !== 'draft'}
              />
            </Field>
          </FieldGrid>

          <div style={{ marginTop: '14px', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
            Recalculated: Gross {formatPKR(computed.gross)} • Deductions {formatPKR(computed.totalDeductions)} • Net {formatPKR(computed.net)}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 800, color: 'white', marginBottom: '10px' }}>Payroll Items</div>
          {items.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.75)' }}>No item breakdown available for this payroll.</div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Type</Th>
                  <Th>Item</Th>
                  <Th>Amount</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <Td style={{ textTransform: 'capitalize' }}>{item.item_type}</Td>
                    <Td>{item.item_name}</Td>
                    <Td>{item.item_type === 'deduction' ? `-${formatPKR(item.amount)}` : formatPKR(item.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </Container>
    </DashboardLayout>
  );
}
