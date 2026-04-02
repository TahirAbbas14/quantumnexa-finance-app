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
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
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

type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

type RecurringIncome = {
  id: string;
  user_id: string;
  source_name: string;
  description: string | null;
  category: string;
  amount: number;
  currency: string | null;
  frequency: Frequency;
  frequency_interval: number | null;
  start_date: string;
  end_date: string | null;
  next_income_date: string;
  last_received_date: string | null;
  is_active: boolean;
  auto_record: boolean;
  payment_method: string | null;
  source_contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type IncomeHistory = {
  id: string;
  recurring_income_id: string;
  received_date: string;
  amount: number;
  status: 'received' | 'pending' | 'missed' | 'cancelled';
  notes: string | null;
  created_at: string;
};

type IncomeFormState = {
  source_name: string;
  category: string;
  amount: string;
  currency: string;
  frequency: Frequency;
  frequency_interval: string;
  start_date: string;
  end_date: string;
  next_income_date: string;
  is_active: boolean;
  auto_record: boolean;
  payment_method: string;
  source_contact: string;
  description: string;
  notes: string;
};

type ReceiveFormState = {
  received_date: string;
  amount: string;
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
  grid-template-columns: 1.6fr 1fr 1fr 1fr 1fr 200px;
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

const safeDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
};

const addByFrequency = (date: Date, frequency: Frequency, interval: number) => {
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

const monthlyEquivalent = (amount: number, frequency: Frequency, interval: number) => {
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

const toIncomeForm = (s?: RecurringIncome, todayISO?: string): IncomeFormState => {
  if (!s) {
    const today = todayISO || formatISODate(new Date());
    return {
      source_name: '',
      category: 'Income',
      amount: '',
      currency: 'PKR',
      frequency: 'monthly',
      frequency_interval: '1',
      start_date: today,
      end_date: '',
      next_income_date: today,
      is_active: true,
      auto_record: false,
      payment_method: '',
      source_contact: '',
      description: '',
      notes: ''
    };
  }

  return {
    source_name: s.source_name || '',
    category: s.category || 'Income',
    amount: String(s.amount ?? ''),
    currency: s.currency || 'PKR',
    frequency: s.frequency,
    frequency_interval: String(s.frequency_interval ?? 1),
    start_date: (s.start_date || '').slice(0, 10),
    end_date: (s.end_date || '').slice(0, 10),
    next_income_date: (s.next_income_date || '').slice(0, 10),
    is_active: Boolean(s.is_active),
    auto_record: Boolean(s.auto_record),
    payment_method: s.payment_method || '',
    source_contact: s.source_contact || '',
    description: s.description || '',
    notes: s.notes || ''
  };
};

const toReceiveForm = (s: RecurringIncome): ReceiveFormState => {
  const nextISO = (s.next_income_date || formatISODate(new Date())).slice(0, 10);
  return { received_date: nextISO, amount: String(s.amount ?? ''), notes: '' };
};

export default function RecurringIncomePage() {
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const [sources, setSources] = useState<RecurringIncome[]>([]);
  const [history, setHistory] = useState<IncomeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<RecurringIncome | null>(null);
  const [form, setForm] = useState<IncomeFormState>(() => toIncomeForm(undefined));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [showReceive, setShowReceive] = useState(false);
  const [receiving, setReceiving] = useState<RecurringIncome | null>(null);
  const [receiveForm, setReceiveForm] = useState<ReceiveFormState | null>(null);
  const [receiveBusy, setReceiveBusy] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);

  const getErrorText = (e: unknown) => {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message || 'Unknown error';
    const anyErr = e as { message?: string; error?: string; details?: string; hint?: string; code?: string };
    return anyErr.message || anyErr.error || anyErr.details || anyErr.hint || anyErr.code || 'Unknown error';
  };

  const fetchSources = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase.from('recurring_income').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (error) throw error;
    setSources((data || []) as RecurringIncome[]);
  }, [supabase, user?.id]);

  const fetchHistory = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase.from('recurring_income_history').select('*').order('received_date', { ascending: false }).limit(10);
    if (error) {
      const msg = getErrorText(error).toLowerCase();
      if (msg.includes('schema cache') || msg.includes('recurring_income_history')) {
        setHistory([]);
        return;
      }
      throw error;
    }
    setHistory((data || []) as IncomeHistory[]);
  }, [supabase, user?.id]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setPageError(null);
      await Promise.all([fetchSources(), fetchHistory()]);
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setLoading(false);
    }
  }, [fetchHistory, fetchSources]);

  useEffect(() => {
    if (!user?.id) return;
    refresh();
  }, [refresh, user?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sources
      .filter((s) => {
        if (statusFilter === 'active' && !s.is_active) return false;
        if (statusFilter === 'inactive' && s.is_active) return false;
        if (!q) return true;
        return (
          s.source_name.toLowerCase().includes(q) ||
          (s.category || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          (s.source_contact || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.next_income_date || '').localeCompare(b.next_income_date || ''));
  }, [search, sources, statusFilter]);

  const stats = useMemo(() => {
    const active = sources.filter((s) => s.is_active);
    const monthly = active.reduce((sum, s) => sum + monthlyEquivalent(Number(s.amount || 0), s.frequency, Number(s.frequency_interval || 1)), 0);
    const now = new Date();
    const overdue = active.filter((s) => {
      const d = safeDate(s.next_income_date);
      if (!d) return false;
      return isBefore(d, now);
    }).length;
    const upcoming7 = active.filter((s) => {
      const d = safeDate(s.next_income_date);
      if (!d) return false;
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;
    return { total: sources.length, active: active.length, monthly, overdue, upcoming7 };
  }, [sources]);

  const openCreate = () => {
    setFormError(null);
    setEditing(null);
    setForm(toIncomeForm(undefined, formatISODate(new Date())));
    setShowCreate(true);
  };

  const openEdit = (s: RecurringIncome) => {
    setFormError(null);
    setEditing(s);
    setForm(toIncomeForm(s));
    setShowEdit(true);
  };

  const closeIncomeModal = () => {
    setShowCreate(false);
    setShowEdit(false);
    setEditing(null);
    setFormError(null);
  };

  const saveIncome = async () => {
    if (!supabase || !user?.id) return;
    try {
      setSaving(true);
      setFormError(null);

      const amount = Number(form.amount);
      if (!form.source_name.trim()) {
        setFormError('Source name is required.');
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
      if (!form.next_income_date) {
        setFormError('Next income date is required.');
        return;
      }

      const interval = Math.max(1, Number(form.frequency_interval || 1));
      const payload = {
        user_id: user.id,
        source_name: form.source_name.trim(),
        description: form.description.trim() || null,
        category: form.category.trim(),
        amount,
        currency: form.currency || 'PKR',
        frequency: form.frequency,
        frequency_interval: interval,
        start_date: form.start_date,
        end_date: form.end_date || null,
        next_income_date: form.next_income_date,
        is_active: form.is_active,
        auto_record: form.auto_record,
        payment_method: form.payment_method.trim() || null,
        source_contact: form.source_contact.trim() || null,
        notes: form.notes.trim() || null
      };

      if (editing) {
        const { error } = await supabase.from('recurring_income').update(payload).eq('id', editing.id).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recurring_income').insert(payload);
        if (error) throw error;
      }

      await fetchSources();
      closeIncomeModal();
    } catch (e) {
      setFormError(getErrorText(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: RecurringIncome) => {
    if (!supabase || !user?.id) return;
    try {
      setBusyId(s.id);
      const { error } = await supabase.from('recurring_income').update({ is_active: !s.is_active }).eq('id', s.id).eq('user_id', user.id);
      if (error) throw error;
      await fetchSources();
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setBusyId(null);
    }
  };

  const removeIncome = async (s: RecurringIncome) => {
    if (!supabase || !user?.id) return;
    const ok = window.confirm('Delete this recurring income source?');
    if (!ok) return;
    try {
      setBusyId(s.id);
      const { error } = await supabase.from('recurring_income').delete().eq('id', s.id).eq('user_id', user.id);
      if (error) throw error;
      await Promise.all([fetchSources(), fetchHistory()]);
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setBusyId(null);
    }
  };

  const openReceive = (s: RecurringIncome) => {
    setReceiveError(null);
    setReceiving(s);
    setReceiveForm(toReceiveForm(s));
    setShowReceive(true);
  };

  const closeReceiveModal = () => {
    setShowReceive(false);
    setReceiving(null);
    setReceiveForm(null);
    setReceiveError(null);
  };

  const recordReceived = async () => {
    if (!supabase || !user?.id || !receiving || !receiveForm) return;
    try {
      setReceiveBusy(true);
      setReceiveError(null);

      const amount = Number(receiveForm.amount);
      if (!receiveForm.received_date) {
        setReceiveError('Received date is required.');
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        setReceiveError('Amount must be greater than 0.');
        return;
      }

      const { error: histError } = await supabase.from('recurring_income_history').insert({
        recurring_income_id: receiving.id,
        received_date: receiveForm.received_date,
        amount,
        status: 'received',
        notes: receiveForm.notes.trim() || null
      });
      if (histError) {
        const msg = getErrorText(histError).toLowerCase();
        if (!msg.includes('schema cache') && !msg.includes('recurring_income_history')) throw histError;
      }

      const receivedDate = parseISO(receiveForm.received_date);
      const interval = Math.max(1, Number(receiving.frequency_interval || 1));
      const nextDate = addByFrequency(receivedDate, receiving.frequency, interval);
      const nextISO = formatISODate(nextDate);
      const endISO = receiving.end_date ? receiving.end_date.slice(0, 10) : null;
      const nextActive = endISO ? nextISO <= endISO : true;

      const { error: srcError } = await supabase
        .from('recurring_income')
        .update({
          last_received_date: receiveForm.received_date,
          next_income_date: nextISO,
          is_active: nextActive && receiving.is_active
        })
        .eq('id', receiving.id)
        .eq('user_id', user.id);
      if (srcError) throw srcError;

      await Promise.all([fetchSources(), fetchHistory()]);
      closeReceiveModal();
    } catch (e) {
      setReceiveError(getErrorText(e));
    } finally {
      setReceiveBusy(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.85)' }}>
            <Loader2 className="animate-spin" size={28} style={{ marginBottom: '12px' }} />
            Loading recurring income...
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
            <h1>Recurring Income</h1>
            <p>Track repeating income sources and record incoming payments.</p>
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
              New Source
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
                <StatLabel>Total Sources</StatLabel>
                <StatValue>{stats.total}</StatValue>
              </div>
              <StatIcon $color="rgba(59, 130, 246, 0.18)" $textColor="#60a5fa">
                <DollarSign size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>All recurring income sources</StatHint>
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
            <StatHint>Running sources</StatHint>
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
                <StatValue style={{ color: stats.overdue > 0 ? '#f87171' : '#ffffff' }}>{stats.overdue > 0 ? stats.overdue : stats.upcoming7}</StatValue>
              </div>
              <StatIcon
                $color={stats.overdue > 0 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)'}
                $textColor={stats.overdue > 0 ? '#f87171' : '#fbbf24'}
              >
                <Clock size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>{stats.overdue > 0 ? 'Overdue' : 'Next 7 days'}</StatHint>
          </StatCard>
        </StatsGrid>

        <ControlsBar>
          <ControlsLeft>
            <TextInput placeholder="Search income sources..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </ControlsLeft>
          <ControlsRight>
            <InlineHint>{filtered.length} shown</InlineHint>
          </ControlsRight>
        </ControlsBar>

        <ListCard>
          <ListHeader>
            <ListTitle>Income Sources</ListTitle>
          </ListHeader>

          <Table>
            <Row $header>
              <Th>Source</Th>
              <Th>Frequency</Th>
              <Th>Next</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th style={{ textAlign: 'right' }}>Actions</Th>
            </Row>

            {filtered.length === 0 ? (
              <EmptyState>
                <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>
                  {sources.length === 0 ? 'No recurring income sources yet' : 'No sources match your filters'}
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                  {sources.length === 0 ? 'Create a source to record repeating income.' : 'Try adjusting your search or filter.'}
                </div>
                {sources.length === 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <Button onClick={openCreate}>
                      <Plus size={16} />
                      Create Source
                    </Button>
                  </div>
                )}
              </EmptyState>
            ) : (
              filtered.map((s) => {
                const busy = busyId === s.id;
                const nextDate = safeDate(s.next_income_date);
                const overdue = s.is_active && nextDate ? isBefore(nextDate, new Date()) : false;
                const interval = Math.max(1, Number(s.frequency_interval || 1));
                return (
                  <Row key={s.id}>
                    <Td>
                      <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{s.source_name}</div>
                      <Muted>
                        {s.category}
                        {s.source_contact ? ` • ${s.source_contact}` : ''}
                      </Muted>
                    </Td>
                    <Td>
                      <Pill $tone="blue">
                        <Calendar size={14} />
                        {s.frequency} / {interval}
                      </Pill>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} style={{ color: 'rgba(255,255,255,0.65)' }} />
                        <span style={{ color: overdue ? '#f87171' : 'rgba(255,255,255,0.85)', fontWeight: overdue ? 900 : 700 }}>
                          {s.next_income_date ? format(new Date(s.next_income_date), 'MMM d, yyyy') : '—'}
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
                          onClick={() => openReceive(s)}
                          style={{ height: '34px', padding: '0 12px' }}
                        >
                          <CheckCircle size={16} />
                          Receive
                        </Button>
                        <ActionIconButton onClick={() => toggleActive(s)} disabled={busy} title={s.is_active ? 'Pause' : 'Activate'}>
                          {s.is_active ? <Pause size={16} /> : <Play size={16} />}
                        </ActionIconButton>
                        <ActionIconButton onClick={() => openEdit(s)} disabled={busy} title="Edit">
                          <Edit size={16} />
                        </ActionIconButton>
                        <ActionIconButton onClick={() => removeIncome(s)} disabled={busy} title="Delete">
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
                <ModalTitle>History</ModalTitle>
                <ActionIconButton onClick={() => setShowHistory(false)} title="Close">
                  <X size={16} />
                </ActionIconButton>
              </ModalHeader>

              {history.length === 0 ? (
                <EmptyState>
                  <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>No history</div>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>History appears after recording income.</div>
                </EmptyState>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {history.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        padding: '12px',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.10)',
                        background: 'rgba(255,255,255,0.06)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{formatPKR(Number(h.amount || 0))}</div>
                          <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                            {h.received_date ? format(new Date(h.received_date), 'MMM d, yyyy') : '—'}
                          </div>
                        </div>
                        <Pill $tone={h.status === 'received' ? 'green' : h.status === 'pending' ? 'yellow' : 'gray'}>
                          {h.status === 'received' ? <CheckCircle size={14} /> : <Clock size={14} />}
                          {h.status}
                        </Pill>
                      </div>
                      {h.notes ? <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{h.notes}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </ModalContent>
          </ModalOverlay>
        )}

        {(showCreate || showEdit) && (
          <ModalOverlay onClick={closeIncomeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>{showEdit ? 'Edit income source' : 'New income source'}</ModalTitle>
                <ActionIconButton onClick={closeIncomeModal} title="Close">
                  <X size={16} />
                </ActionIconButton>
              </ModalHeader>

              <FieldGrid>
                <Field>
                  <label>Source name</label>
                  <TextInput value={form.source_name} onChange={(e) => setForm((p) => ({ ...p, source_name: e.target.value }))} />
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
                  <label>Frequency</label>
                  <Select value={form.frequency} onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value as Frequency }))}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </Select>
                </Field>
                <Field>
                  <label>Interval</label>
                  <TextInput inputMode="numeric" value={form.frequency_interval} onChange={(e) => setForm((p) => ({ ...p, frequency_interval: e.target.value }))} />
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
                  <label>Next income date</label>
                  <TextInput type="date" value={form.next_income_date} onChange={(e) => setForm((p) => ({ ...p, next_income_date: e.target.value }))} />
                </Field>
                <Field>
                  <label>Source contact (optional)</label>
                  <TextInput value={form.source_contact} onChange={(e) => setForm((p) => ({ ...p, source_contact: e.target.value }))} />
                </Field>
                <Field>
                  <label>Payment method (optional)</label>
                  <TextInput value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))} />
                </Field>
                <Field>
                  <label>Status</label>
                  <Select value={form.is_active ? 'active' : 'inactive'} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'active' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </Field>
                <Field>
                  <label>Auto record</label>
                  <Select value={form.auto_record ? 'yes' : 'no'} onChange={(e) => setForm((p) => ({ ...p, auto_record: e.target.value === 'yes' }))}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </Select>
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
                <Button variant="outline" onClick={closeIncomeModal} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={saveIncome} disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {showEdit ? 'Save' : 'Create'}
                </Button>
              </div>
            </ModalContent>
          </ModalOverlay>
        )}

        {showReceive && receiving && receiveForm && (
          <ModalOverlay onClick={closeReceiveModal}>
            <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
              <ModalHeader>
                <ModalTitle>Record income</ModalTitle>
                <ActionIconButton onClick={closeReceiveModal} title="Close">
                  <X size={16} />
                </ActionIconButton>
              </ModalHeader>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{receiving.source_name}</div>
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                  Next due: {receiving.next_income_date ? format(new Date(receiving.next_income_date), 'MMM d, yyyy') : '—'}
                </div>
              </div>

              <FieldGrid>
                <Field>
                  <label>Received date</label>
                  <TextInput
                    type="date"
                    value={receiveForm.received_date}
                    onChange={(e) => setReceiveForm((p) => (p ? { ...p, received_date: e.target.value } : p))}
                  />
                </Field>
                <Field>
                  <label>Amount</label>
                  <TextInput
                    inputMode="decimal"
                    value={receiveForm.amount}
                    onChange={(e) => setReceiveForm((p) => (p ? { ...p, amount: e.target.value } : p))}
                  />
                </Field>
              </FieldGrid>

              <Field style={{ marginTop: '12px' }}>
                <label>Notes (optional)</label>
                <TextArea rows={3} value={receiveForm.notes} onChange={(e) => setReceiveForm((p) => (p ? { ...p, notes: e.target.value } : p))} />
              </Field>

              {receiveError ? <ErrorText>{receiveError}</ErrorText> : null}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Button variant="outline" onClick={closeReceiveModal} disabled={receiveBusy}>
                  Cancel
                </Button>
                <Button onClick={recordReceived} disabled={receiveBusy}>
                  {receiveBusy ? <Loader2 size={16} className="animate-spin" /> : null}
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

