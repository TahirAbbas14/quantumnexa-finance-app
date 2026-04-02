'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPKR } from '@/lib/currency';
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Edit,
  Globe,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  X
} from 'lucide-react';
import { addDays, addMonths, addWeeks, addYears, format, isBefore, isValid, parseISO } from 'date-fns';
import styled from 'styled-components';

type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

type Subscription = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  amount: number;
  currency: string | null;
  billing_frequency: BillingFrequency;
  billing_interval: number | null;
  start_date: string;
  end_date: string | null;
  next_billing_date: string;
  last_billed_date: string | null;
  is_active: boolean;
  auto_pay: boolean;
  payment_method: string | null;
  vendor: string | null;
  website_url: string | null;
  cancellation_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type SubscriptionPayment = {
  id: string;
  subscription_id: string;
  expense_id: string | null;
  payment_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_method: string | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
};

type PaymentFormState = {
  payment_date: string;
  amount: string;
  payment_method: string;
  transaction_id: string;
  notes: string;
  create_expense: boolean;
};

type TemplateFormState = {
  name: string;
  category: string;
  amount: string;
  currency: string;
  billing_frequency: BillingFrequency;
  billing_interval: string;
  start_date: string;
  end_date: string;
  next_billing_date: string;
  is_active: boolean;
  auto_pay: boolean;
  payment_method: string;
  vendor: string;
  website_url: string;
  cancellation_url: string;
  description: string;
  notes: string;
};

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TitleBlock = styled.div`
  h1 {
    font-size: 26px;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.01em;
  }

  p {
    margin: 8px 0 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.4;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-bottom: 18px;
`;

const StatCard = styled(Card)`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 18px;
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.65);
`;

const StatValue = styled.div`
  margin-top: 6px;
  font-size: 24px;
  font-weight: 900;
  color: #ffffff;
`;

const StatHint = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
`;

interface StatIconProps {
  $color?: string;
  $textColor?: string;
}

const StatIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$color' && prop !== '$textColor'
})<StatIconProps>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => p.$color || 'rgba(255,255,255,0.10)'};
  color: ${(p) => p.$textColor || '#fff'};
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  margin-bottom: 18px;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ControlsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const ControlsRight = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const TextInput = styled.input`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  outline: none;
  min-width: 240px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.45);
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  outline: none;
  min-width: 180px;

  option {
    background: #101010;
    color: #ffffff;
  }
`;

const InlineHint = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.60);
`;

const ListCard = styled(Card)`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
`;

const ListTitle = styled.div`
  font-size: 14px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
`;

const Table = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 14px;
  overflow: hidden;
`;

const Row = styled.div<{ $header?: boolean }>`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 180px;
  gap: 12px;
  padding: ${(p) => (p.$header ? '10px 12px' : '12px')};
  background: ${(p) => (p.$header ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)')};
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: ${(p) => (p.$header ? '8px' : '10px')};
  }
`;

const Th = styled.div`
  font-size: 11px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const Td = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  min-width: 0;
`;

const Muted = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.60);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Pill = styled.span<{ $tone: 'green' | 'gray' | 'yellow' | 'blue' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  background: ${(p) => {
    switch (p.$tone) {
      case 'green':
        return 'rgba(16, 185, 129, 0.18)';
      case 'yellow':
        return 'rgba(245, 158, 11, 0.18)';
      case 'blue':
        return 'rgba(59, 130, 246, 0.18)';
      default:
        return 'rgba(255, 255, 255, 0.10)';
    }
  }};
  color: ${(p) => {
    switch (p.$tone) {
      case 'green':
        return '#34d399';
      case 'yellow':
        return '#fbbf24';
      case 'blue':
        return '#60a5fa';
      default:
        return 'rgba(255,255,255,0.80)';
    }
  }};
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    justify-content: flex-start;
  }
`;

const ActionIconButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.10);
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  padding: 28px;
  text-align: center;
  color: rgba(255, 255, 255, 0.70);
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 50;
`;

const ModalContent = styled.div`
  width: 100%;
  max-width: 760px;
  background: rgba(20, 20, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
  backdrop-filter: blur(20px);
  max-height: 90vh;
  overflow: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
`;

const ModalTitle = styled.div`
  font-size: 18px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.95);
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 13px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.85);
  }
`;

const TextArea = styled.textarea`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  outline: none;
  resize: vertical;
`;

const ErrorText = styled.div`
  margin-top: 12px;
  font-size: 13px;
  color: #ef4444;
`;

const formatISODate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const expensePaymentMethods = ['cash', 'bank_transfer', 'credit_card', 'cheque'] as const;
type ExpensePaymentMethod = (typeof expensePaymentMethods)[number];

const toExpensePaymentMethod = (raw?: string | null): ExpensePaymentMethod => {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return 'cash';
  if ((expensePaymentMethods as readonly string[]).includes(v)) return v as ExpensePaymentMethod;
  if (v.includes('bank') || v.includes('transfer')) return 'bank_transfer';
  if (v.includes('credit') || v.includes('card')) return 'credit_card';
  if (v.includes('cheq')) return 'cheque';
  return 'cash';
};

const safeDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
};

const addByFrequency = (date: Date, frequency: BillingFrequency, interval: number) => {
  switch (frequency) {
    case 'daily':
      return addDays(date, interval);
    case 'weekly':
      return addWeeks(date, interval);
    case 'monthly':
      return addMonths(date, interval);
    case 'quarterly':
      return addMonths(date, interval * 3);
    case 'yearly':
      return addYears(date, interval);
    default:
      return addMonths(date, interval);
  }
};

const monthlyEquivalent = (amount: number, frequency: BillingFrequency, interval: number) => {
  const i = Math.max(1, interval);
  switch (frequency) {
    case 'daily':
      return (amount * 30) / i;
    case 'weekly':
      return (amount * 4.345) / i;
    case 'monthly':
      return amount / i;
    case 'quarterly':
      return amount / (3 * i);
    case 'yearly':
      return amount / (12 * i);
    default:
      return amount / i;
  }
};

const toTemplateForm = (s?: Subscription, todayISO?: string): TemplateFormState => {
  if (!s) {
    const today = todayISO || formatISODate(new Date());
    return {
      name: '',
      category: 'Subscription',
      amount: '',
      currency: 'PKR',
      billing_frequency: 'monthly',
      billing_interval: '1',
      start_date: today,
      end_date: '',
      next_billing_date: today,
      is_active: true,
      auto_pay: false,
      payment_method: '',
      vendor: '',
      website_url: '',
      cancellation_url: '',
      description: '',
      notes: ''
    };
  }

  return {
    name: s.name || '',
    category: s.category || 'Subscription',
    amount: String(s.amount ?? ''),
    currency: s.currency || 'PKR',
    billing_frequency: s.billing_frequency,
    billing_interval: String(s.billing_interval ?? 1),
    start_date: (s.start_date || '').slice(0, 10),
    end_date: (s.end_date || '').slice(0, 10),
    next_billing_date: (s.next_billing_date || '').slice(0, 10),
    is_active: Boolean(s.is_active),
    auto_pay: Boolean(s.auto_pay),
    payment_method: s.payment_method || '',
    vendor: s.vendor || '',
    website_url: s.website_url || '',
    cancellation_url: s.cancellation_url || '',
    description: s.description || '',
    notes: s.notes || ''
  };
};

const toPaymentForm = (s: Subscription): PaymentFormState => {
  const nextISO = (s.next_billing_date || formatISODate(new Date())).slice(0, 10);
  return {
    payment_date: nextISO,
    amount: String(s.amount ?? ''),
    payment_method: s.payment_method || 'cash',
    transaction_id: '',
    notes: '',
    create_expense: true
  };
};

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [form, setForm] = useState<TemplateFormState>(() => toTemplateForm(undefined));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [showPay, setShowPay] = useState(false);
  const [paying, setPaying] = useState<Subscription | null>(null);
  const [payForm, setPayForm] = useState<PaymentFormState | null>(null);
  const [payingBusy, setPayingBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const getErrorText = (e: unknown) => {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message || 'Unknown error';
    const anyErr = e as { message?: string; error?: string; details?: string; hint?: string; code?: string };
    return anyErr.message || anyErr.error || anyErr.details || anyErr.hint || anyErr.code || 'Unknown error';
  };

  const fetchSubscriptions = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    setSubscriptions((data || []) as Subscription[]);
  }, [supabase, user?.id]);

  const fetchPayments = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase.from('subscription_payments').select('*').order('payment_date', { ascending: false }).limit(10);
    if (error) {
      const msg = getErrorText(error).toLowerCase();
      if (msg.includes('schema cache') || msg.includes('subscription_payments')) {
        setPayments([]);
        return;
      }
      throw error;
    }
    setPayments((data || []) as SubscriptionPayment[]);
  }, [supabase, user?.id]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setPageError(null);
      await Promise.all([fetchSubscriptions(), fetchPayments()]);
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setLoading(false);
    }
  }, [fetchPayments, fetchSubscriptions]);

  useEffect(() => {
    if (!user?.id) return;
    refresh();
  }, [refresh, user?.id]);

  const filteredSubscriptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscriptions
      .filter((s) => {
        if (statusFilter === 'active' && !s.is_active) return false;
        if (statusFilter === 'inactive' && s.is_active) return false;
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          (s.vendor || '').toLowerCase().includes(q) ||
          (s.category || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.next_billing_date || '').localeCompare(b.next_billing_date || ''));
  }, [search, statusFilter, subscriptions]);

  const stats = useMemo(() => {
    const active = subscriptions.filter((s) => s.is_active);
    const monthly = active.reduce((sum, s) => sum + monthlyEquivalent(Number(s.amount || 0), s.billing_frequency, Number(s.billing_interval || 1)), 0);
    const now = new Date();
    const upcoming7 = active.filter((s) => {
      const d = safeDate(s.next_billing_date);
      if (!d) return false;
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;
    const overdue = active.filter((s) => {
      const d = safeDate(s.next_billing_date);
      if (!d) return false;
      return isBefore(d, now);
    }).length;
    return {
      total: subscriptions.length,
      active: active.length,
      monthly,
      upcoming7,
      overdue
    };
  }, [subscriptions]);

  const openCreate = () => {
    setFormError(null);
    setEditing(null);
    setForm(toTemplateForm(undefined, formatISODate(new Date())));
    setShowCreate(true);
  };

  const openEdit = (s: Subscription) => {
    setFormError(null);
    setEditing(s);
    setForm(toTemplateForm(s));
    setShowEdit(true);
  };

  const closeTemplateModal = () => {
    setShowCreate(false);
    setShowEdit(false);
    setEditing(null);
    setFormError(null);
  };

  const closePayModal = () => {
    setShowPay(false);
    setPaying(null);
    setPayForm(null);
    setPayError(null);
  };

  const saveSubscription = async () => {
    if (!supabase || !user?.id) return;
    try {
      setSaving(true);
      setFormError(null);

      const amount = Number(form.amount);
      if (!form.name.trim()) {
        setFormError('Name is required.');
        return;
      }
      if (!form.category.trim()) {
        setFormError('Category is required.');
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        setFormError('Amount must be greater than 0.');
        return;
      }
      if (!form.start_date) {
        setFormError('Start date is required.');
        return;
      }
      if (!form.next_billing_date) {
        setFormError('Next billing date is required.');
        return;
      }

      const interval = Math.max(1, Number(form.billing_interval || 1));
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category.trim(),
        amount,
        currency: form.currency || 'PKR',
        billing_frequency: form.billing_frequency,
        billing_interval: interval,
        start_date: form.start_date,
        end_date: form.end_date || null,
        next_billing_date: form.next_billing_date,
        is_active: form.is_active,
        auto_pay: form.auto_pay,
        payment_method: form.payment_method.trim() || null,
        vendor: form.vendor.trim() || null,
        website_url: form.website_url.trim() || null,
        cancellation_url: form.cancellation_url.trim() || null,
        notes: form.notes.trim() || null
      };

      if (editing) {
        const { error } = await supabase.from('subscriptions').update(payload).eq('id', editing.id).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('subscriptions').insert(payload);
        if (error) throw error;
      }

      await fetchSubscriptions();
      closeTemplateModal();
    } catch (e) {
      setFormError(getErrorText(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: Subscription) => {
    if (!supabase || !user?.id) return;
    try {
      setBusyId(s.id);
      const { error } = await supabase.from('subscriptions').update({ is_active: !s.is_active }).eq('id', s.id).eq('user_id', user.id);
      if (error) throw error;
      await fetchSubscriptions();
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setBusyId(null);
    }
  };

  const removeSubscription = async (s: Subscription) => {
    if (!supabase || !user?.id) return;
    const ok = window.confirm('Delete this subscription?');
    if (!ok) return;
    try {
      setBusyId(s.id);
      const { error } = await supabase.from('subscriptions').delete().eq('id', s.id).eq('user_id', user.id);
      if (error) throw error;
      await fetchSubscriptions();
      await fetchPayments();
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setBusyId(null);
    }
  };

  const openPay = (s: Subscription) => {
    setPayError(null);
    setPaying(s);
    setPayForm(toPaymentForm(s));
    setShowPay(true);
  };

  const recordPayment = async () => {
    if (!supabase || !user?.id || !paying || !payForm) return;
    try {
      setPayingBusy(true);
      setPayError(null);

      const amount = Number(payForm.amount);
      if (!payForm.payment_date) {
        setPayError('Payment date is required.');
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        setPayError('Amount must be greater than 0.');
        return;
      }

      let expenseId: string | null = null;
      if (payForm.create_expense) {
        const normalizedExpenseMethod = toExpensePaymentMethod(payForm.payment_method || paying.payment_method);
        const { data: expense, error: expError } = await supabase
          .from('expenses')
          .insert({
            user_id: user.id,
            description: paying.name,
            amount,
            currency: paying.currency || 'PKR',
            category: paying.category || 'Subscription',
            date: payForm.payment_date,
            vendor: paying.vendor || null,
            payment_method: normalizedExpenseMethod,
            notes: payForm.notes.trim() || null
          })
          .select('id')
          .single();
        if (expError) throw expError;
        expenseId = (expense as { id?: string } | null)?.id || null;
      }

      const { error: payErrorInsert } = await supabase.from('subscription_payments').insert({
        subscription_id: paying.id,
        expense_id: expenseId,
        payment_date: payForm.payment_date,
        amount,
        status: 'paid',
        payment_method: payForm.payment_method.trim() || paying.payment_method || null,
        transaction_id: payForm.transaction_id.trim() || null,
        notes: payForm.notes.trim() || null
      });
      if (payErrorInsert) {
        const msg = getErrorText(payErrorInsert).toLowerCase();
        if (!msg.includes('schema cache') && !msg.includes('subscription_payments')) throw payErrorInsert;
      }

      const paidDate = parseISO(payForm.payment_date);
      const interval = Math.max(1, Number(paying.billing_interval || 1));
      const nextDate = addByFrequency(paidDate, paying.billing_frequency, interval);
      const nextISO = formatISODate(nextDate);
      const endISO = paying.end_date ? paying.end_date.slice(0, 10) : null;
      const nextActive = endISO ? nextISO <= endISO : true;

      const { error: subUpdateError } = await supabase
        .from('subscriptions')
        .update({
          last_billed_date: payForm.payment_date,
          next_billing_date: nextISO,
          is_active: nextActive && paying.is_active
        })
        .eq('id', paying.id)
        .eq('user_id', user.id);
      if (subUpdateError) throw subUpdateError;

      await Promise.all([fetchSubscriptions(), fetchPayments()]);
      closePayModal();
    } catch (e) {
      setPayError(getErrorText(e));
    } finally {
      setPayingBusy(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.85)' }}>
            <Loader2 className="animate-spin" size={28} style={{ marginBottom: '12px' }} />
            Loading subscriptions...
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <TitleBlock>
            <h1>Subscriptions</h1>
            <p>Track recurring services and record payments.</p>
          </TitleBlock>
          <HeaderActions>
            <Button variant="outline" onClick={refresh}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setShowHistory(true)}>
              <Clock size={16} />
              History
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} />
              New Subscription
            </Button>
          </HeaderActions>
        </Header>

        {pageError && (
          <div style={{ marginBottom: '18px' }}>
            <Card variant="glass" padding="lg">
              <div style={{ color: 'rgba(255,255,255,0.90)', fontWeight: 900 }}>Something went wrong</div>
              <div style={{ marginTop: '8px', color: 'rgba(255,255,255,0.70)', fontSize: '13px' }}>{pageError}</div>
            </Card>
          </div>
        )}

        <StatsGrid>
          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Total</StatLabel>
                <StatValue>{stats.total}</StatValue>
              </div>
              <StatIcon $color="rgba(59, 130, 246, 0.18)" $textColor="#60a5fa">
                <CreditCard size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>All subscriptions</StatHint>
          </StatCard>
          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Active</StatLabel>
                <StatValue>{stats.active}</StatValue>
              </div>
              <StatIcon $color="rgba(16, 185, 129, 0.18)" $textColor="#34d399">
                <Play size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>Running subscriptions</StatHint>
          </StatCard>
          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Monthly Forecast</StatLabel>
                <StatValue>{formatPKR(stats.monthly)}</StatValue>
              </div>
              <StatIcon $color="rgba(255, 255, 255, 0.10)" $textColor="rgba(255,255,255,0.92)">
                <Calendar size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>Normalized across frequencies</StatHint>
          </StatCard>
          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Due Soon</StatLabel>
                <StatValue style={{ color: stats.overdue > 0 ? '#f87171' : '#ffffff' }}>
                  {stats.overdue > 0 ? stats.overdue : stats.upcoming7}
                </StatValue>
              </div>
              <StatIcon $color={stats.overdue > 0 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)'} $textColor={stats.overdue > 0 ? '#f87171' : '#fbbf24'}>
                <Clock size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>{stats.overdue > 0 ? 'Overdue' : 'Next 7 days'}</StatHint>
          </StatCard>
        </StatsGrid>

        <ControlsBar>
          <ControlsLeft>
            <TextInput placeholder="Search subscriptions..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </ControlsLeft>
          <ControlsRight>
            <InlineHint>{filteredSubscriptions.length} shown</InlineHint>
          </ControlsRight>
        </ControlsBar>

        <ListCard>
          <ListHeader>
            <ListTitle>Subscriptions</ListTitle>
          </ListHeader>

          <Table>
            <Row $header>
              <Th>Subscription</Th>
              <Th>Billing</Th>
              <Th>Next</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th style={{ textAlign: 'right' }}>Actions</Th>
            </Row>

            {filteredSubscriptions.length === 0 ? (
              <EmptyState>
                <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>
                  {subscriptions.length === 0 ? 'No subscriptions yet' : 'No subscriptions match your filters'}
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                  {subscriptions.length === 0 ? 'Create a subscription to start tracking renewals.' : 'Try adjusting your search or filter.'}
                </div>
                {subscriptions.length === 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <Button onClick={openCreate}>
                      <Plus size={16} />
                      Create Subscription
                    </Button>
                  </div>
                )}
              </EmptyState>
            ) : (
              filteredSubscriptions.map((s) => {
                const busy = busyId === s.id;
                const nextDate = safeDate(s.next_billing_date);
                const overdue = s.is_active && nextDate ? isBefore(nextDate, new Date()) : false;
                return (
                  <Row key={s.id}>
                    <Td>
                      <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{s.name}</div>
                      <Muted>
                        {s.vendor ? `${s.vendor} • ` : ''}
                        {s.category}
                      </Muted>
                    </Td>
                    <Td>
                      <Pill $tone="blue">
                        <Calendar size={14} />
                        {s.billing_frequency} / {Math.max(1, Number(s.billing_interval || 1))}
                      </Pill>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} style={{ color: 'rgba(255,255,255,0.65)' }} />
                        <span style={{ color: overdue ? '#f87171' : 'rgba(255,255,255,0.85)', fontWeight: overdue ? 900 : 700 }}>
                          {s.next_billing_date ? format(new Date(s.next_billing_date), 'MMM d, yyyy') : '—'}
                        </span>
                      </div>
                    </Td>
                    <Td style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{formatPKR(Number(s.amount || 0))}</Td>
                    <Td>
                      <Pill $tone={s.is_active ? (overdue ? 'yellow' : 'green') : 'gray'}>
                        {s.is_active ? <Play size={14} /> : <Pause size={14} />}
                        {s.is_active ? (overdue ? 'Due' : 'Active') : 'Inactive'}
                      </Pill>
                    </Td>
                    <Td>
                      <Actions>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || !s.is_active}
                          onClick={() => openPay(s)}
                          style={{ height: '34px', padding: '0 12px' }}
                        >
                          <CheckCircle size={16} />
                          Pay
                        </Button>
                        {s.website_url ? (
                          <ActionIconButton onClick={() => window.open(s.website_url || '', '_blank')} title="Open website">
                            <Globe size={16} />
                          </ActionIconButton>
                        ) : null}
                        <ActionIconButton onClick={() => toggleActive(s)} disabled={busy} title={s.is_active ? 'Pause' : 'Activate'}>
                          {s.is_active ? <Pause size={16} /> : <Play size={16} />}
                        </ActionIconButton>
                        <ActionIconButton onClick={() => openEdit(s)} disabled={busy} title="Edit">
                          <Edit size={16} />
                        </ActionIconButton>
                        <ActionIconButton onClick={() => removeSubscription(s)} disabled={busy} title="Delete">
                          <Trash2 size={16} />
                        </ActionIconButton>
                      </Actions>
                    </Td>
                  </Row>
                );
              })
            )}
          </Table>
        </ListCard>

        {showHistory && (
          <ModalOverlay onClick={() => setShowHistory(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
              <ModalHeader>
                <ModalTitle>Payment History</ModalTitle>
                <ActionIconButton onClick={() => setShowHistory(false)} title="Close">
                  <X size={16} />
                </ActionIconButton>
              </ModalHeader>

              {payments.length === 0 ? (
                <EmptyState>
                  <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>No history</div>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>History appears after recording payments.</div>
                </EmptyState>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '12px',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.10)',
                        background: 'rgba(255,255,255,0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{formatPKR(Number(p.amount || 0))}</div>
                          <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                            {p.payment_date ? format(new Date(p.payment_date), 'MMM d, yyyy') : '—'}
                            {p.payment_method ? ` • ${p.payment_method}` : ''}
                          </div>
                        </div>
                        <Pill $tone={p.status === 'paid' ? 'green' : p.status === 'pending' ? 'yellow' : 'gray'}>
                          {p.status === 'paid' ? <CheckCircle size={14} /> : <Clock size={14} />}
                          {p.status}
                        </Pill>
                      </div>
                      {p.transaction_id ? (
                        <div style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                          Transaction: {p.transaction_id}
                        </div>
                      ) : null}
                      {p.notes ? <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{p.notes}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </ModalContent>
          </ModalOverlay>
        )}

        {(showCreate || showEdit) && (
          <ModalOverlay onClick={closeTemplateModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>{showEdit ? 'Edit subscription' : 'New subscription'}</ModalTitle>
                <ActionIconButton onClick={closeTemplateModal} title="Close">
                  <X size={16} />
                </ActionIconButton>
              </ModalHeader>

              <FieldGrid>
                <Field>
                  <label>Name</label>
                  <TextInput value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </Field>
                <Field>
                  <label>Category</label>
                  <TextInput value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
                </Field>
                <Field>
                  <label>Amount</label>
                  <TextInput inputMode="decimal" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
                </Field>
                <Field>
                  <label>Currency</label>
                  <Select value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}>
                    <option value="PKR">PKR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </Select>
                </Field>
                <Field>
                  <label>Billing frequency</label>
                  <Select
                    value={form.billing_frequency}
                    onChange={(e) => setForm((p) => ({ ...p, billing_frequency: e.target.value as BillingFrequency }))}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </Select>
                </Field>
                <Field>
                  <label>Interval</label>
                  <TextInput inputMode="numeric" value={form.billing_interval} onChange={(e) => setForm((p) => ({ ...p, billing_interval: e.target.value }))} />
                </Field>
                <Field>
                  <label>Start date</label>
                  <TextInput type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
                </Field>
                <Field>
                  <label>End date (optional)</label>
                  <TextInput type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
                </Field>
                <Field>
                  <label>Next billing date</label>
                  <TextInput
                    type="date"
                    value={form.next_billing_date}
                    onChange={(e) => setForm((p) => ({ ...p, next_billing_date: e.target.value }))}
                  />
                </Field>
                <Field>
                  <label>Vendor (optional)</label>
                  <TextInput value={form.vendor} onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))} />
                </Field>
                <Field>
                  <label>Payment method (optional)</label>
                  <Select value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))}>
                    <option value="">Select</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cheque">Cheque</option>
                  </Select>
                </Field>
                <Field>
                  <label>Status</label>
                  <Select value={form.is_active ? 'active' : 'inactive'} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'active' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </Field>
                <Field>
                  <label>Auto pay</label>
                  <Select value={form.auto_pay ? 'yes' : 'no'} onChange={(e) => setForm((p) => ({ ...p, auto_pay: e.target.value === 'yes' }))}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </Select>
                </Field>
                <Field>
                  <label>Website URL (optional)</label>
                  <TextInput value={form.website_url} onChange={(e) => setForm((p) => ({ ...p, website_url: e.target.value }))} />
                </Field>
                <Field>
                  <label>Cancellation URL (optional)</label>
                  <TextInput value={form.cancellation_url} onChange={(e) => setForm((p) => ({ ...p, cancellation_url: e.target.value }))} />
                </Field>
              </FieldGrid>

              <Field style={{ marginTop: '12px' }}>
                <label>Description (optional)</label>
                <TextArea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </Field>

              <Field style={{ marginTop: '12px' }}>
                <label>Notes (optional)</label>
                <TextArea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </Field>

              {formError ? <ErrorText>{formError}</ErrorText> : null}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button variant="outline" onClick={closeTemplateModal} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={saveSubscription} disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {showEdit ? 'Save' : 'Create'}
                </Button>
              </div>
            </ModalContent>
          </ModalOverlay>
        )}

        {showPay && paying && payForm && (
          <ModalOverlay onClick={closePayModal}>
            <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
              <ModalHeader>
                <ModalTitle>Record payment</ModalTitle>
                <ActionIconButton onClick={closePayModal} title="Close">
                  <X size={16} />
                </ActionIconButton>
              </ModalHeader>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{paying.name}</div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                  Next due: {paying.next_billing_date ? format(new Date(paying.next_billing_date), 'MMM d, yyyy') : '—'}
                </div>
              </div>

              <FieldGrid>
                <Field>
                  <label>Payment date</label>
                  <TextInput
                    type="date"
                    value={payForm.payment_date}
                    onChange={(e) => setPayForm((p) => (p ? { ...p, payment_date: e.target.value } : p))}
                  />
                </Field>
                <Field>
                  <label>Amount</label>
                  <TextInput inputMode="decimal" value={payForm.amount} onChange={(e) => setPayForm((p) => (p ? { ...p, amount: e.target.value } : p))} />
                </Field>
                <Field>
                  <label>Payment method (optional)</label>
                  <Select value={payForm.payment_method} onChange={(e) => setPayForm((p) => (p ? { ...p, payment_method: e.target.value } : p))}>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cheque">Cheque</option>
                  </Select>
                </Field>
                <Field>
                  <label>Transaction ID (optional)</label>
                  <TextInput value={payForm.transaction_id} onChange={(e) => setPayForm((p) => (p ? { ...p, transaction_id: e.target.value } : p))} />
                </Field>
              </FieldGrid>

              <Field style={{ marginTop: '12px' }}>
                <label>Notes (optional)</label>
                <TextArea rows={3} value={payForm.notes} onChange={(e) => setPayForm((p) => (p ? { ...p, notes: e.target.value } : p))} />
              </Field>

              <Field style={{ marginTop: '12px' }}>
                <label>Create expense entry?</label>
                <Select
                  value={payForm.create_expense ? 'yes' : 'no'}
                  onChange={(e) => setPayForm((p) => (p ? { ...p, create_expense: e.target.value === 'yes' } : p))}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </Field>

              {payError ? <ErrorText>{payError}</ErrorText> : null}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button variant="outline" onClick={closePayModal} disabled={payingBusy}>
                  Cancel
                </Button>
                <Button onClick={recordPayment} disabled={payingBusy}>
                  {payingBusy ? <Loader2 size={16} className="animate-spin" /> : null}
                  Record
                </Button>
              </div>
            </ModalContent>
          </ModalOverlay>
        )}
      </Container>
    </DashboardLayout>
  );
}
