'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPKR } from '@/lib/currency';
import { addDays, addMonths, addWeeks, addYears, format, isBefore, isValid, parseISO } from 'date-fns';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  X
} from 'lucide-react';
import styled from 'styled-components';

type ReminderType = 'invoice_payment' | 'subscription_renewal' | 'bill_payment' | 'tax_payment' | 'loan_payment' | 'other';
type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';
type ReminderStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';
type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

type PaymentReminder = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string | null;
  due_date: string;
  reminder_type: ReminderType;
  priority: ReminderPriority;
  status: ReminderStatus;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  next_reminder_date: string | null;
  related_invoice_id: string | null;
  related_subscription_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type InvoiceOption = { id: string; invoice_number: string | null; total_amount: number | null; status: string | null };
type SubscriptionOption = { id: string; name: string; amount: number | null; is_active: boolean | null };

type ReminderFormState = {
  title: string;
  description: string;
  amount: string;
  currency: string;
  due_date: string;
  reminder_type: ReminderType;
  priority: ReminderPriority;
  status: ReminderStatus;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency;
  next_reminder_date: string;
  related_invoice_id: string;
  related_subscription_id: string;
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
  grid-template-columns: 1.8fr 1fr 1fr 1fr 1fr 210px;
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

const Pill = styled.span<{ $tone: 'green' | 'gray' | 'yellow' | 'red' | 'blue' }>`
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
      case 'red':
        return 'rgba(239, 68, 68, 0.18)';
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
      case 'red':
        return '#f87171';
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
  max-width: 780px;
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

const InlineRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const formatISODate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const safeDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
};

const addByFrequency = (date: Date, frequency: RecurringFrequency) => {
  switch (frequency) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    case 'quarterly':
      return addMonths(date, 3);
    case 'yearly':
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
};

const toFormState = (r?: PaymentReminder): ReminderFormState => {
  const today = formatISODate(new Date());
  return {
    title: r?.title || '',
    description: r?.description || '',
    amount: r?.amount != null ? String(r.amount) : '',
    currency: r?.currency || 'PKR',
    due_date: (r?.due_date || today).slice(0, 10),
    reminder_type: r?.reminder_type || 'bill_payment',
    priority: r?.priority || 'medium',
    status: r?.status || 'pending',
    is_recurring: Boolean(r?.is_recurring),
    recurring_frequency: (r?.recurring_frequency || 'monthly') as RecurringFrequency,
    next_reminder_date: (r?.next_reminder_date || '').slice(0, 10),
    related_invoice_id: r?.related_invoice_id || '',
    related_subscription_id: r?.related_subscription_id || '',
    notes: r?.notes || ''
  };
};

export default function PaymentRemindersPage() {
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReminderStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ReminderType>('all');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<PaymentReminder | null>(null);
  const [form, setForm] = useState<ReminderFormState>(() => toFormState());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const getErrorText = (e: unknown) => {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message || 'Unknown error';
    const anyErr = e as { message?: string; error?: string; details?: string; hint?: string; code?: string };
    return anyErr.message || anyErr.error || anyErr.details || anyErr.hint || anyErr.code || 'Unknown error';
  };

  const fetchInvoices = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return;
    setInvoices((data || []) as InvoiceOption[]);
  }, [supabase, user?.id]);

  const fetchSubscriptions = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase.from('subscriptions').select('id, name, amount, is_active').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(50);
    if (error) return;
    setSubscriptions((data || []) as SubscriptionOption[]);
  }, [supabase, user?.id]);

  const fetchReminders = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase
      .from('payment_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });
    if (error) {
      const msg = getErrorText(error).toLowerCase();
      if (msg.includes('schema cache') || msg.includes('payment_reminders')) {
        setReminders([]);
        return;
      }
      throw error;
    }
    setReminders((data || []) as PaymentReminder[]);
  }, [supabase, user?.id]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setPageError(null);
      await Promise.all([fetchReminders(), fetchInvoices(), fetchSubscriptions()]);
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setLoading(false);
    }
  }, [fetchInvoices, fetchReminders, fetchSubscriptions]);

  useEffect(() => {
    if (!user?.id) return;
    refresh();
  }, [refresh, user?.id]);

  const stats = useMemo(() => {
    const now = new Date();
    const total = reminders.length;
    const pending = reminders.filter((r) => r.status === 'pending').length;
    const completed = reminders.filter((r) => r.status === 'completed').length;
    const overdue = reminders.filter((r) => r.status === 'pending' && r.due_date && isBefore(parseISO(r.due_date), now)).length;
    const dueSoon = reminders.filter((r) => {
      if (r.status !== 'pending') return false;
      const d = safeDate(r.due_date);
      if (!d) return false;
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;
    return { total, pending, completed, overdue, dueSoon };
  }, [reminders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reminders.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.reminder_type !== typeFilter) return false;
      if (!q) return true;
      return (r.title || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q) || (r.notes || '').toLowerCase().includes(q);
    });
  }, [reminders, search, statusFilter, typeFilter]);

  const openCreate = () => {
    setFormError(null);
    setEditing(null);
    setForm(toFormState());
    setShowCreate(true);
  };

  const openEdit = (r: PaymentReminder) => {
    setFormError(null);
    setEditing(r);
    setForm(toFormState(r));
    setShowEdit(true);
  };

  const closeModal = () => {
    setShowCreate(false);
    setShowEdit(false);
    setEditing(null);
    setFormError(null);
  };

  const saveReminder = async () => {
    if (!supabase || !user?.id) return;
    try {
      setSaving(true);
      setFormError(null);

      if (!form.title.trim()) {
        setFormError('Title is required.');
        return;
      }
      if (!form.due_date) {
        setFormError('Due date is required.');
        return;
      }
      const amount = form.amount.trim() ? Number(form.amount) : null;
      if (form.amount.trim() && (!Number.isFinite(amount) || (amount ?? 0) < 0)) {
        setFormError('Amount must be a valid number.');
        return;
      }
      if (form.is_recurring && !form.next_reminder_date) {
        setFormError('Next reminder date is required for recurring reminders.');
        return;
      }

      const payload = {
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        amount,
        currency: form.currency || 'PKR',
        due_date: form.due_date,
        reminder_type: form.reminder_type,
        priority: form.priority,
        status: form.status,
        is_recurring: form.is_recurring,
        recurring_frequency: form.is_recurring ? form.recurring_frequency : null,
        next_reminder_date: form.is_recurring ? (form.next_reminder_date || null) : null,
        related_invoice_id: form.related_invoice_id || null,
        related_subscription_id: form.related_subscription_id || null,
        notes: form.notes.trim() || null
      };

      if (editing) {
        const { error } = await supabase.from('payment_reminders').update(payload).eq('id', editing.id).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('payment_reminders').insert(payload);
        if (error) throw error;
      }

      await fetchReminders();
      closeModal();
    } catch (e) {
      setFormError(getErrorText(e));
    } finally {
      setSaving(false);
    }
  };

  const removeReminder = async (r: PaymentReminder) => {
    if (!supabase || !user?.id) return;
    const ok = window.confirm('Delete this reminder?');
    if (!ok) return;
    try {
      setBusyId(r.id);
      const { error } = await supabase.from('payment_reminders').delete().eq('id', r.id).eq('user_id', user.id);
      if (error) throw error;
      await fetchReminders();
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setBusyId(null);
    }
  };

  const togglePause = async (r: PaymentReminder) => {
    if (!supabase || !user?.id) return;
    try {
      setBusyId(r.id);
      const nextStatus: ReminderStatus = r.status === 'cancelled' ? 'pending' : 'cancelled';
      const { error } = await supabase.from('payment_reminders').update({ status: nextStatus }).eq('id', r.id).eq('user_id', user.id);
      if (error) throw error;
      await fetchReminders();
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setBusyId(null);
    }
  };

  const completeReminder = async (r: PaymentReminder) => {
    if (!supabase || !user?.id) return;
    try {
      setBusyId(r.id);

      if (r.is_recurring) {
        const due = safeDate(r.due_date) || new Date();
        const nextDue = r.next_reminder_date ? safeDate(r.next_reminder_date) : null;
        const effectiveDue = nextDue || addByFrequency(due, (r.recurring_frequency || 'monthly') as RecurringFrequency);
        const nextNext = addByFrequency(effectiveDue, (r.recurring_frequency || 'monthly') as RecurringFrequency);
        const { error } = await supabase
          .from('payment_reminders')
          .update({
            status: 'pending',
            due_date: formatISODate(effectiveDue),
            next_reminder_date: formatISODate(nextNext)
          })
          .eq('id', r.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('payment_reminders').update({ status: 'completed' }).eq('id', r.id).eq('user_id', user.id);
        if (error) throw error;
      }

      await fetchReminders();
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setBusyId(null);
    }
  };

  const displayStatus = (r: PaymentReminder): ReminderStatus => {
    if (r.status !== 'pending') return r.status;
    const d = safeDate(r.due_date);
    if (!d) return r.status;
    return isBefore(d, new Date()) ? 'overdue' : 'pending';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.85)' }}>
            <Loader2 className="animate-spin" size={28} style={{ marginBottom: '12px' }} />
            Loading payment reminders...
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
            <h1>Payment Reminders</h1>
            <p>Track due dates and keep recurring payments on schedule.</p>
          </TitleBlock>
          <HeaderActions>
            <Button variant="outline" onClick={refresh}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} />
              New Reminder
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
                <Clock size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>All reminders</StatHint>
          </StatCard>
          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Pending</StatLabel>
                <StatValue>{stats.pending}</StatValue>
              </div>
              <StatIcon $color="rgba(245, 158, 11, 0.18)" $textColor="#fbbf24">
                <Calendar size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>Upcoming and due</StatHint>
          </StatCard>
          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Due Soon</StatLabel>
                <StatValue>{stats.dueSoon}</StatValue>
              </div>
              <StatIcon $color="rgba(255, 255, 255, 0.10)" $textColor="rgba(255,255,255,0.92)">
                <Clock size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>Next 7 days</StatHint>
          </StatCard>
          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Overdue</StatLabel>
                <StatValue style={{ color: stats.overdue > 0 ? '#f87171' : '#ffffff' }}>{stats.overdue}</StatValue>
              </div>
              <StatIcon $color="rgba(239, 68, 68, 0.18)" $textColor="#f87171">
                <AlertTriangle size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>Past due date</StatHint>
          </StatCard>
        </StatsGrid>

        <ControlsBar>
          <ControlsLeft>
            <TextInput placeholder="Search reminders..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
              <option value="all">All types</option>
              <option value="invoice_payment">Invoice payment</option>
              <option value="subscription_renewal">Subscription renewal</option>
              <option value="bill_payment">Bill payment</option>
              <option value="tax_payment">Tax payment</option>
              <option value="loan_payment">Loan payment</option>
              <option value="other">Other</option>
            </Select>
          </ControlsLeft>
          <ControlsRight>
            <InlineHint>{filtered.length} shown</InlineHint>
          </ControlsRight>
        </ControlsBar>

        <ListCard>
          <ListHeader>
            <ListTitle>Reminders</ListTitle>
          </ListHeader>

          <Table>
            <Row $header>
              <Th>Reminder</Th>
              <Th>Type</Th>
              <Th>Due</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th style={{ textAlign: 'right' }}>Actions</Th>
            </Row>

            {filtered.length === 0 ? (
              <EmptyState>
                <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>
                  {reminders.length === 0 ? 'No reminders yet' : 'No reminders match your filters'}
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                  {reminders.length === 0 ? 'Create a reminder to track upcoming payments.' : 'Try adjusting search or filters.'}
                </div>
                {reminders.length === 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <Button onClick={openCreate}>
                      <Plus size={16} />
                      Create Reminder
                    </Button>
                  </div>
                )}
              </EmptyState>
            ) : (
              filtered.map((r) => {
                const busy = busyId === r.id;
                const status = displayStatus(r);
                const statusTone = status === 'completed' ? 'green' : status === 'overdue' ? 'red' : status === 'cancelled' ? 'gray' : 'yellow';
                const typeTone = r.reminder_type === 'subscription_renewal' ? 'blue' : 'gray';

                const amountLabel = r.amount != null ? formatPKR(Number(r.amount || 0)) : '—';
                const dueLabel = r.due_date ? format(new Date(r.due_date), 'MMM d, yyyy') : '—';
                const invoice = r.related_invoice_id ? invoices.find((i) => i.id === r.related_invoice_id) : null;
                const subscription = r.related_subscription_id ? subscriptions.find((s) => s.id === r.related_subscription_id) : null;

                return (
                  <Row key={r.id}>
                    <Td>
                      <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{r.title}</div>
                      {r.description ? <Muted>{r.description}</Muted> : null}
                      {invoice?.invoice_number ? <Muted>Invoice: {invoice.invoice_number}</Muted> : null}
                      {subscription?.name ? <Muted>Subscription: {subscription.name}</Muted> : null}
                    </Td>
                    <Td>
                      <Pill $tone={typeTone}>
                        <Clock size={14} />
                        {r.reminder_type.replace('_', ' ')}
                      </Pill>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} style={{ color: 'rgba(255,255,255,0.65)' }} />
                        <span style={{ color: status === 'overdue' ? '#f87171' : 'rgba(255,255,255,0.85)', fontWeight: status === 'overdue' ? 900 : 700 }}>
                          {dueLabel}
                        </span>
                      </div>
                      {r.is_recurring && r.next_reminder_date ? <Muted>Next: {format(new Date(r.next_reminder_date), 'MMM d')}</Muted> : null}
                    </Td>
                    <Td style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{amountLabel}</Td>
                    <Td>
                      <Pill $tone={statusTone}>
                        {status === 'completed' ? <CheckCircle size={14} /> : status === 'cancelled' ? <Pause size={14} /> : <AlertTriangle size={14} />}
                        {status}
                      </Pill>
                    </Td>
                    <Td>
                      <Actions>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || status === 'completed' || status === 'cancelled'}
                          onClick={() => completeReminder(r)}
                          style={{ height: '34px', padding: '0 12px' }}
                        >
                          <CheckCircle size={16} />
                          {r.is_recurring ? 'Next' : 'Complete'}
                        </Button>
                        <ActionIconButton onClick={() => togglePause(r)} disabled={busy} title={r.status === 'cancelled' ? 'Resume' : 'Pause'}>
                          {r.status === 'cancelled' ? <Play size={16} /> : <Pause size={16} />}
                        </ActionIconButton>
                        <ActionIconButton onClick={() => openEdit(r)} disabled={busy} title="Edit">
                          <Edit size={16} />
                        </ActionIconButton>
                        <ActionIconButton onClick={() => removeReminder(r)} disabled={busy} title="Delete">
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

        {(showCreate || showEdit) && (
          <ModalOverlay onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>{showEdit ? 'Edit reminder' : 'New reminder'}</ModalTitle>
                <ActionIconButton onClick={closeModal} title="Close">
                  <X size={16} />
                </ActionIconButton>
              </ModalHeader>

              <FieldGrid>
                <Field>
                  <label>Title</label>
                  <TextInput value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                </Field>
                <Field>
                  <label>Type</label>
                  <Select value={form.reminder_type} onChange={(e) => setForm((p) => ({ ...p, reminder_type: e.target.value as ReminderType }))}>
                    <option value="invoice_payment">Invoice payment</option>
                    <option value="subscription_renewal">Subscription renewal</option>
                    <option value="bill_payment">Bill payment</option>
                    <option value="tax_payment">Tax payment</option>
                    <option value="loan_payment">Loan payment</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field>
                  <label>Due date</label>
                  <TextInput type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} />
                </Field>
                <Field>
                  <label>Priority</label>
                  <Select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as ReminderPriority }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                </Field>
                <Field>
                  <label>Amount (optional)</label>
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
                  <label>Status</label>
                  <Select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ReminderStatus }))}>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </Field>
                <Field>
                  <label>Recurring</label>
                  <Select value={form.is_recurring ? 'yes' : 'no'} onChange={(e) => setForm((p) => ({ ...p, is_recurring: e.target.value === 'yes' }))}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </Select>
                </Field>
              </FieldGrid>

              {form.is_recurring && (
                <div style={{ marginTop: '12px' }}>
                  <FieldGrid>
                    <Field>
                      <label>Recurring frequency</label>
                      <Select
                        value={form.recurring_frequency}
                        onChange={(e) => setForm((p) => ({ ...p, recurring_frequency: e.target.value as RecurringFrequency }))}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </Select>
                    </Field>
                    <Field>
                      <label>Next reminder date</label>
                      <TextInput
                        type="date"
                        value={form.next_reminder_date}
                        onChange={(e) => setForm((p) => ({ ...p, next_reminder_date: e.target.value }))}
                      />
                    </Field>
                  </FieldGrid>
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <FieldGrid>
                  <Field>
                    <label>Linked invoice (optional)</label>
                    <Select value={form.related_invoice_id} onChange={(e) => setForm((p) => ({ ...p, related_invoice_id: e.target.value }))}>
                      <option value="">None</option>
                      {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoice_number || inv.id.slice(0, 8)} ({formatPKR(Number(inv.total_amount || 0))})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field>
                    <label>Linked subscription (optional)</label>
                    <Select value={form.related_subscription_id} onChange={(e) => setForm((p) => ({ ...p, related_subscription_id: e.target.value }))}>
                      <option value="">None</option>
                      {subscriptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({formatPKR(Number(s.amount || 0))})
                        </option>
                      ))}
                    </Select>
                  </Field>
                </FieldGrid>
              </div>

              <Field style={{ marginTop: '12px' }}>
                <label>Description (optional)</label>
                <TextArea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </Field>

              <Field style={{ marginTop: '12px' }}>
                <label>Notes (optional)</label>
                <TextArea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </Field>

              <InlineRow style={{ marginTop: '10px', color: 'rgba(255,255,255,0.60)', fontSize: '12px' }}>
                {form.is_recurring && form.next_reminder_date ? (
                  <>
                    <Clock size={14} />
                    Next schedule: {format(addByFrequency(parseISO(form.next_reminder_date), form.recurring_frequency), 'MMM d, yyyy')}
                  </>
                ) : null}
              </InlineRow>

              {formError ? <ErrorText>{formError}</ErrorText> : null}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button variant="outline" onClick={closeModal} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={saveReminder} disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {showEdit ? 'Save' : 'Create'}
                </Button>
              </div>
            </ModalContent>
          </ModalOverlay>
        )}
      </Container>
    </DashboardLayout>
  );
}

