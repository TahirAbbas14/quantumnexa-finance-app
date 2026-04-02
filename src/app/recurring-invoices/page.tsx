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
  Edit,
  FileText,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Zap
} from 'lucide-react';
import { addDays, addMonths, addWeeks, addYears, format } from 'date-fns';
import styled from 'styled-components';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

type RecurringTemplate = {
  id: string;
  user_id: string;
  client_id: string | null;
  template_name: string;
  description: string | null;
  amount: number;
  currency: string | null;
  frequency: Frequency;
  frequency_interval: number | null;
  start_date: string;
  end_date: string | null;
  next_invoice_date: string;
  is_active: boolean;
  auto_send: boolean;
  payment_terms: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ClientOption = { id: string; name: string; email: string | null };

type HistoryRow = {
  id: string;
  template_id: string;
  invoice_id: string | null;
  generated_date: string;
  amount: number;
  status: 'generated' | 'sent' | 'paid' | 'failed' | 'cancelled';
  error_message: string | null;
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

const StatHint = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 18px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
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
  grid-template-columns: 1.6fr 1.1fr 1fr 1fr 1fr 150px;
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
`;

const Pill = styled.span<{ $tone: 'green' | 'gray' | 'blue' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  background: ${(p) =>
    p.$tone === 'green'
      ? 'rgba(16, 185, 129, 0.18)'
      : p.$tone === 'blue'
        ? 'rgba(59, 130, 246, 0.18)'
        : 'rgba(255, 255, 255, 0.10)'};
  color: ${(p) => (p.$tone === 'green' ? '#34d399' : p.$tone === 'blue' ? '#60a5fa' : 'rgba(255,255,255,0.80)')};
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
  max-width: 720px;
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

const InlineHint = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.60);
  margin-top: 6px;
`;

const formatISODate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
};

type TemplateFormState = {
  template_name: string;
  client_id: string;
  amount: string;
  currency: string;
  frequency: Frequency;
  frequency_interval: string;
  start_date: string;
  end_date: string;
  next_invoice_date: string;
  payment_terms: string;
  auto_send: boolean;
  is_active: boolean;
  description: string;
  notes: string;
};

const toTemplateForm = (t?: RecurringTemplate, todayISO?: string): TemplateFormState => {
  if (!t) {
    const today = todayISO || formatISODate(new Date());
    return {
      template_name: '',
      client_id: '',
      amount: '',
      currency: 'PKR',
      frequency: 'monthly',
      frequency_interval: '1',
      start_date: today,
      end_date: '',
      next_invoice_date: today,
      payment_terms: '30',
      auto_send: false,
      is_active: true,
      description: '',
      notes: ''
    };
  }

  return {
    template_name: t.template_name || '',
    client_id: t.client_id || '',
    amount: String(t.amount ?? ''),
    currency: t.currency || 'PKR',
    frequency: t.frequency,
    frequency_interval: String(t.frequency_interval ?? 1),
    start_date: (t.start_date || '').slice(0, 10),
    end_date: (t.end_date || '').slice(0, 10),
    next_invoice_date: (t.next_invoice_date || '').slice(0, 10),
    payment_terms: String(t.payment_terms ?? 30),
    auto_send: Boolean(t.auto_send),
    is_active: Boolean(t.is_active),
    description: t.description || '',
    notes: t.notes || ''
  };
};

export default function RecurringInvoicesPage() {
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showHistory, setShowHistory] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<RecurringTemplate | null>(null);
  const [form, setForm] = useState<TemplateFormState>(() => toTemplateForm(undefined));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);

  const getErrorText = (e: unknown) => {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message || 'Unknown error';
    const anyErr = e as { message?: string; error?: string; details?: string; hint?: string; code?: string };
    return anyErr.message || anyErr.error || anyErr.details || anyErr.hint || anyErr.code || 'Unknown error';
  };

  const fetchClients = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase.from('clients').select('id, name, email').eq('user_id', user.id).order('name');
    if (error) throw error;
    setClients((data || []) as ClientOption[]);
  }, [supabase, user?.id]);

  const fetchTemplates = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase
      .from('recurring_invoice_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    setTemplates((data || []) as RecurringTemplate[]);
  }, [supabase, user?.id]);

  const fetchHistory = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase.from('recurring_invoice_history').select('*').order('generated_date', { ascending: false }).limit(10);
    if (error) {
      const msg = getErrorText(error);
      if (msg.toLowerCase().includes('schema cache') || msg.toLowerCase().includes('recurring_invoice_history')) {
        setHistory([]);
        return;
      }
      throw error;
    }
    setHistory((data || []) as HistoryRow[]);
  }, [supabase, user?.id]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setPageError(null);
      await Promise.all([fetchClients(), fetchTemplates(), fetchHistory()]);
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setLoading(false);
    }
  }, [fetchClients, fetchHistory, fetchTemplates]);

  useEffect(() => {
    if (!user?.id) return;
    refresh();
  }, [refresh, user?.id]);

  const clientNameById = useMemo(() => {
    const m = new Map<string, ClientOption>();
    clients.forEach((c) => m.set(c.id, c));
    return m;
  }, [clients]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates
      .filter((t) => {
        if (statusFilter === 'active' && !t.is_active) return false;
        if (statusFilter === 'inactive' && t.is_active) return false;
        if (!q) return true;
        const client = t.client_id ? clientNameById.get(t.client_id) : undefined;
        return (
          t.template_name.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (client?.name || '').toLowerCase().includes(q) ||
          (client?.email || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.next_invoice_date || '').localeCompare(b.next_invoice_date || ''));
  }, [clientNameById, search, statusFilter, templates]);

  const stats = useMemo(() => {
    const active = templates.filter((t) => t.is_active);
    const upcoming7 = active.filter((t) => {
      const next = new Date(t.next_invoice_date);
      const now = new Date();
      const diff = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });
    const totalActiveAmount = active.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return {
      total: templates.length,
      active: active.length,
      upcoming: upcoming7.length,
      activeAmount: totalActiveAmount
    };
  }, [templates]);

  const openCreate = () => {
    setFormError(null);
    setEditing(null);
    setForm(toTemplateForm(undefined, formatISODate(new Date())));
    setShowCreate(true);
  };

  const openEdit = (t: RecurringTemplate) => {
    setFormError(null);
    setEditing(t);
    setForm(toTemplateForm(t));
    setShowEdit(true);
  };

  const closeModal = () => {
    setShowCreate(false);
    setShowEdit(false);
    setEditing(null);
    setFormError(null);
  };

  const saveTemplate = async () => {
    if (!supabase || !user?.id) return;
    try {
      setSaving(true);
      setFormError(null);

      const amount = Number(form.amount);
      if (!form.template_name.trim()) {
        setFormError('Template name is required.');
        return;
      }
      if (!form.client_id) {
        setFormError('Client is required.');
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
      if (!form.next_invoice_date) {
        setFormError('Next invoice date is required.');
        return;
      }

      const interval = Math.max(1, Number(form.frequency_interval || 1));
      const terms = Math.max(0, Number(form.payment_terms || 0));

      const payload = {
        user_id: user.id,
        client_id: form.client_id,
        template_name: form.template_name.trim(),
        description: form.description.trim() || null,
        amount,
        currency: form.currency || 'PKR',
        frequency: form.frequency,
        frequency_interval: interval,
        start_date: form.start_date,
        end_date: form.end_date || null,
        next_invoice_date: form.next_invoice_date,
        is_active: form.is_active,
        auto_send: form.auto_send,
        payment_terms: terms,
        notes: form.notes.trim() || null
      };

      if (editing) {
        const { error } = await supabase
          .from('recurring_invoice_templates')
          .update(payload)
          .eq('id', editing.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recurring_invoice_templates').insert(payload);
        if (error) throw error;
      }

      await fetchTemplates();
      closeModal();
    } catch (e) {
      setFormError(getErrorText(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (t: RecurringTemplate) => {
    if (!supabase || !user?.id) return;
    try {
      setBusyTemplateId(t.id);
      const { error } = await supabase
        .from('recurring_invoice_templates')
        .update({ is_active: !t.is_active })
        .eq('id', t.id)
        .eq('user_id', user.id);
      if (error) throw error;
      await fetchTemplates();
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setBusyTemplateId(null);
    }
  };

  const removeTemplate = async (t: RecurringTemplate) => {
    if (!supabase || !user?.id) return;
    const ok = window.confirm('Delete this recurring invoice template?');
    if (!ok) return;
    try {
      setBusyTemplateId(t.id);
      const { error } = await supabase.from('recurring_invoice_templates').delete().eq('id', t.id).eq('user_id', user.id);
      if (error) throw error;
      await fetchTemplates();
      await fetchHistory();
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setBusyTemplateId(null);
    }
  };

  const generateNow = async (t: RecurringTemplate) => {
    if (!supabase || !user?.id) return;
    try {
      setBusyTemplateId(t.id);
      setPageError(null);

      const issueDateISO = (t.next_invoice_date || formatISODate(new Date())).slice(0, 10);
      const dueDate = addDays(new Date(issueDateISO), Number(t.payment_terms || 30));
      const dueDateISO = formatISODate(dueDate);
      const amount = Number(t.amount || 0);

      let invoiceId: string | null = null;
      let lastInsertError: unknown = null;
      for (let i = 0; i < 3; i += 1) {
        const invoice_number = generateInvoiceNumber();
        const { data: invData, error: invError } = await supabase
          .from('invoices')
          .insert({
            invoice_number,
            client_id: t.client_id,
            project_id: null,
            amount,
            tax_amount: 0,
            total_amount: amount,
            currency: t.currency || 'PKR',
            status: t.auto_send ? 'sent' : 'draft',
            issue_date: issueDateISO,
            due_date: dueDateISO,
            description: t.description || null,
            notes: t.notes || null,
            terms_conditions: null,
            user_id: user.id
          })
          .select('id')
          .single();

        if (!invError && invData?.id) {
          invoiceId = invData.id as string;
          break;
        }
        lastInsertError = invError;
      }

      if (!invoiceId) throw lastInsertError || new Error('Failed to generate invoice');

      const nextDate = addByFrequency(new Date(issueDateISO), t.frequency, Math.max(1, Number(t.frequency_interval || 1)));
      const nextISO = formatISODate(nextDate);
      const endISO = t.end_date ? t.end_date.slice(0, 10) : null;
      const nextActive = endISO ? nextISO <= endISO : true;

      const { error: tmplError } = await supabase
        .from('recurring_invoice_templates')
        .update({ next_invoice_date: nextISO, is_active: nextActive && t.is_active })
        .eq('id', t.id)
        .eq('user_id', user.id);
      if (tmplError) throw tmplError;

      const { error: histError } = await supabase.from('recurring_invoice_history').insert({
        template_id: t.id,
        invoice_id: invoiceId,
        amount,
        status: t.auto_send ? 'sent' : 'generated',
        error_message: null
      });
      if (histError) {
        const msg = getErrorText(histError).toLowerCase();
        if (!msg.includes('schema cache') && !msg.includes('recurring_invoice_history')) throw histError;
      }

      await Promise.all([fetchTemplates(), fetchHistory()]);
    } catch (e) {
      setPageError(getErrorText(e));
    } finally {
      setBusyTemplateId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.85)' }}>
            <Loader2 className="animate-spin" size={28} style={{ marginBottom: '12px' }} />
            Loading recurring invoices...
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
            <h1>Recurring Invoices</h1>
            <p>Create invoice templates and generate invoices on schedule.</p>
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
              New Template
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
                <StatLabel>Total Templates</StatLabel>
                <StatValue>{stats.total}</StatValue>
              </div>
              <StatIcon $color="rgba(59, 130, 246, 0.18)" $textColor="#60a5fa">
                <FileText size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>All recurring invoice templates</StatHint>
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
            <StatHint>Running templates</StatHint>
          </StatCard>
          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Due Soon</StatLabel>
                <StatValue>{stats.upcoming}</StatValue>
              </div>
              <StatIcon $color="rgba(245, 158, 11, 0.18)" $textColor="#fbbf24">
                <Clock size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>Next 7 days</StatHint>
          </StatCard>
          <StatCard>
            <StatHeader>
              <div>
                <StatLabel>Active Amount</StatLabel>
                <StatValue>{formatPKR(stats.activeAmount)}</StatValue>
              </div>
              <StatIcon $color="rgba(255, 255, 255, 0.10)" $textColor="rgba(255,255,255,0.92)">
                <Zap size={22} />
              </StatIcon>
            </StatHeader>
            <StatHint>Sum of active template amounts</StatHint>
          </StatCard>
        </StatsGrid>

        <ControlsBar>
          <ControlsLeft>
            <TextInput placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </ControlsLeft>
          <ControlsRight>
            <InlineHint>{filteredTemplates.length} shown</InlineHint>
          </ControlsRight>
        </ControlsBar>

        <ContentGrid style={{ gridTemplateColumns: '1fr' }}>
          <ListCard>
            <ListHeader>
              <ListTitle>Templates</ListTitle>
            </ListHeader>

            <Table>
              <Row $header>
                <Th>Template</Th>
                <Th>Client</Th>
                <Th>Frequency</Th>
                <Th>Next</Th>
                <Th>Amount</Th>
                <Th style={{ textAlign: 'right' }}>Actions</Th>
              </Row>

              {filteredTemplates.length === 0 ? (
                <EmptyState>
                  <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>
                    {templates.length === 0 ? 'No templates yet' : 'No templates match your filters'}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    {templates.length === 0
                      ? 'Create a recurring invoice template to generate invoices faster.'
                      : 'Try adjusting search or status filter.'}
                  </div>
                  {templates.length === 0 && (
                    <div style={{ marginTop: '14px' }}>
                      <Button onClick={openCreate}>
                        <Plus size={16} />
                        Create Template
                      </Button>
                    </div>
                  )}
                </EmptyState>
              ) : (
                filteredTemplates.map((t) => {
                  const client = t.client_id ? clientNameById.get(t.client_id) : undefined;
                  const busy = busyTemplateId === t.id;
                  return (
                    <Row key={t.id}>
                      <Td>
                        <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{t.template_name}</div>
                        {t.description ? <Muted>{t.description}</Muted> : null}
                      </Td>
                      <Td>
                        <div style={{ fontWeight: 800 }}>{client?.name || '—'}</div>
                        {client?.email ? <Muted>{client.email}</Muted> : null}
                      </Td>
                      <Td>
                        <Pill $tone={t.is_active ? 'green' : 'gray'}>
                          {t.is_active ? <Play size={14} /> : <Pause size={14} />}
                          {t.frequency}
                        </Pill>
                      </Td>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={14} style={{ color: 'rgba(255,255,255,0.65)' }} />
                          {t.next_invoice_date ? format(new Date(t.next_invoice_date), 'MMM d, yyyy') : '—'}
                        </div>
                      </Td>
                      <Td style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{formatPKR(Number(t.amount || 0))}</Td>
                      <Td>
                        <Actions>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || !t.is_active}
                            onClick={() => generateNow(t)}
                            style={{ height: '34px', padding: '0 12px' }}
                          >
                            {busy ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                            Generate
                          </Button>
                          <ActionIconButton onClick={() => toggleActive(t)} disabled={busy} title={t.is_active ? 'Pause' : 'Activate'}>
                            {t.is_active ? <Pause size={16} /> : <Play size={16} />}
                          </ActionIconButton>
                          <ActionIconButton onClick={() => openEdit(t)} disabled={busy} title="Edit">
                            <Edit size={16} />
                          </ActionIconButton>
                          <ActionIconButton onClick={() => removeTemplate(t)} disabled={busy} title="Delete">
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
        </ContentGrid>

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
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    History appears after generating invoices from templates.
                  </div>
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
                          <div style={{ fontSize: '13px', fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>
                            {formatPKR(Number(h.amount || 0))}
                          </div>
                          <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
                            {h.generated_date ? format(new Date(h.generated_date), 'MMM d, yyyy • HH:mm') : '—'}
                          </div>
                        </div>
                        <Pill $tone={h.status === 'failed' ? 'gray' : h.status === 'sent' ? 'blue' : 'green'}>
                          {h.status === 'paid' ? <CheckCircle size={14} /> : <Clock size={14} />}
                          {h.status}
                        </Pill>
                      </div>
                      {h.error_message ? <div style={{ marginTop: '10px', fontSize: '12px', color: '#f87171' }}>{h.error_message}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </ModalContent>
          </ModalOverlay>
        )}

        {(showCreate || showEdit) && (
          <ModalOverlay onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>{showEdit ? 'Edit recurring template' : 'New recurring template'}</ModalTitle>
                <ActionIconButton onClick={closeModal} title="Close">
                  <X size={16} />
                </ActionIconButton>
              </ModalHeader>

              <FieldGrid>
                <Field>
                  <label>Template name</label>
                  <TextInput value={form.template_name} onChange={(e) => setForm((p) => ({ ...p, template_name: e.target.value }))} />
                </Field>
                <Field>
                  <label>Client</label>
                  <Select value={form.client_id} onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}>
                    <option value="">Select client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
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
                  <InlineHint>Every N periods (e.g., 1 month, 2 weeks)</InlineHint>
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
                  <label>Next invoice date</label>
                  <TextInput type="date" value={form.next_invoice_date} onChange={(e) => setForm((p) => ({ ...p, next_invoice_date: e.target.value }))} />
                </Field>
                <Field>
                  <label>Payment terms (days)</label>
                  <TextInput inputMode="numeric" value={form.payment_terms} onChange={(e) => setForm((p) => ({ ...p, payment_terms: e.target.value }))} />
                </Field>
                <Field>
                  <label>Auto send</label>
                  <Select value={form.auto_send ? 'yes' : 'no'} onChange={(e) => setForm((p) => ({ ...p, auto_send: e.target.value === 'yes' }))}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </Select>
                </Field>
                <Field>
                  <label>Status</label>
                  <Select value={form.is_active ? 'active' : 'inactive'} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'active' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
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
                <Button variant="outline" onClick={closeModal} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={saveTemplate} disabled={saving}>
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
