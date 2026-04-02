'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import { formatPKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Building, 
  MapPin,
  Calendar,
  FileText,
  TrendingUp,
  CreditCard,
  Receipt,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type definitions for jsPDF autoTable
type JsPDFWithAutoTable = jsPDF & {
  autoTable?: (options: unknown) => void;
  lastAutoTable?: { finalY?: number };
  internal: jsPDF['internal'] & { pages: { length: number } };
};

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issue_date?: string;
  due_date: string;
  created_at: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  invoice_id?: string;
}

interface SupabaseError extends Error {
  details?: string;
  hint?: string;
  code?: string;
}

interface Project {
  id: string;
  name: string;
  project_type: 'marketing_retainer' | 'one_time_project' | 'maintenance_retainer';
  pricing_type: 'fixed' | 'hourly' | 'monthly';
  amount: number;
  status: 'active' | 'completed' | 'on_hold';
  created_at: string;
}

const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const BackButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const HeaderContent = styled.div`
  flex: 1;
  
  h1 {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ClientOverview = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 32px;
  margin-bottom: 32px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ClientInfo = styled(Card)`
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 20px;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
  
  .icon {
    color: var(--gray-400);
  }
  
  .content {
    flex: 1;
    
    .label {
      font-size: 14px;
      color: var(--gray-600);
      margin-bottom: 2px;
    }
    
    .value {
      font-size: 16px;
      color: var(--gray-800);
      font-weight: 500;
    }
  }
`;

const FinancialSummary = styled(Card)`
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 20px;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const SummaryCard = styled.div`
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  .icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    
    &.income {
      background: var(--success-100);
      color: var(--success-600);
    }
    
    &.expense {
      background: var(--error-100);
      color: var(--error-600);
    }
    
    &.pending {
      background: var(--warning-100);
      color: var(--warning-600);
    }
    
    &.projects {
      background: var(--primary-100);
      color: var(--primary-600);
    }
  }
  
  .value {
    font-size: 24px;
    font-weight: 700;
    color: var(--gray-800);
    margin-bottom: 4px;
  }
  
  .label {
    font-size: 14px;
    color: var(--gray-600);
  }
`;

const TabsContainer = styled.div`
  margin-bottom: 32px;
`;

const TabsList = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(20px);
`;

const Tab = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active: boolean }>`
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.active ? 'white' : 'transparent'};
  color: ${props => props.active ? 'var(--primary-600)' : 'rgba(255, 255, 255, 0.8)'};
  box-shadow: ${props => props.active ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'};
  
  &:hover {
    background: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.active ? 'var(--primary-700)' : 'white'};
  }
`;

const TabContent = styled.div`
  min-height: 400px;
`;

const TableContainer = styled(Card)`
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 16px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  th {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-600);
    background: rgba(255, 255, 255, 0.3);
  }
  
  td {
    font-size: 14px;
    color: var(--gray-800);
  }
  
  tr:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'paid':
        return `
          background: var(--success-100);
          color: var(--success-700);
        `;
      case 'pending':
      case 'sent':
        return `
          background: var(--warning-100);
          color: var(--warning-700);
        `;
      case 'overdue':
        return `
          background: var(--error-100);
          color: var(--error-700);
        `;
      case 'active':
        return `
          background: var(--primary-100);
          color: var(--primary-700);
        `;
      case 'completed':
        return `
          background: var(--success-100);
          color: var(--success-700);
        `;
      case 'on_hold':
        return `
          background: var(--gray-100);
          color: var(--gray-700);
        `;
      default:
        return `
          background: var(--gray-100);
          color: var(--gray-700);
        `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  
  .icon {
    width: 60px;
    height: 60px;
    margin: 0 auto 16px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
  }
  
  h4 {
    font-size: 18px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
    color: var(--gray-600);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const fetchClientData = useCallback(async () => {
    try {
      console.log('Fetching client data for:', { clientId, userId: user?.id });
      
      if (!user?.id) {
        console.error('No user ID available');
        return;
      }

      if (!clientId) {
        console.error('No client ID available');
        return;
      }

      // Fetch client details
      console.log('Fetching client details...');
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('user_id', user?.id)
        .single();

      if (clientError) {
        console.error('Client fetch error:', clientError);
        throw clientError;
      }
      
      console.log('Client data fetched:', clientData);
      setClient(clientData);

      // Fetch invoices
      console.log('Fetching invoices...');
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (invoicesError) {
        console.error('Invoices fetch error:', invoicesError);
        throw invoicesError;
      }
      
      console.log('Invoices data fetched:', invoicesData?.length || 0, 'records');
      setInvoices(invoicesData || []);

      // Fetch projects
      console.log('Fetching projects...');
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Projects fetch error:', projectsError);
        throw projectsError;
      }
      
      console.log('Projects data fetched:', projectsData?.length || 0, 'records');
      setProjects(projectsData || []);

      // Fetch transactions (from payments table via invoices)
      console.log('Fetching transactions...');
      console.log('Query parameters:', { clientId, userId: user?.id });
      
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('payments')
        .select(`
          *,
          invoices!inner(
            client_id,
            invoice_number,
            description
          )
        `)
        .eq('invoices.client_id', clientId)
        .eq('user_id', user?.id)
        .order('payment_date', { ascending: false });

      if (transactionsError) {
        console.error('Transactions fetch error:', transactionsError);
        throw transactionsError;
      }
      
      console.log('Raw transactions data:', transactionsData);
      console.log('Transactions data fetched:', transactionsData?.length || 0, 'records');
      
      // Also check if there are any payments at all for this user
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data: allPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id);
      
      console.log('Total payments for user:', allPayments?.length || 0);
      
      // Map payment data to transaction format
      const mappedTransactions = (transactionsData || []).map(payment => ({
        id: payment.id,
        type: 'income' as const,
        amount: payment.amount,
        description: payment.notes || `Payment for Invoice ${payment.invoices?.invoice_number || payment.invoice_id}`,
        category: payment.payment_method || 'N/A',
        date: payment.payment_date,
        invoice_id: payment.invoice_id
      }));
      
      console.log('Mapped transactions:', mappedTransactions);
      setTransactions(mappedTransactions);

      console.log('All client data fetched successfully');

    } catch (error) {
      console.error('Error fetching client data:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: (error as SupabaseError)?.details || 'No details available',
        hint: (error as SupabaseError)?.hint || 'No hint available',
        code: (error as SupabaseError)?.code || 'No code available'
      });
    } finally {
      setLoading(false);
    }
  }, [user, clientId, supabase]);

  useEffect(() => {
    if (user && clientId) {
      fetchClientData();
    }
  }, [user, clientId, fetchClientData]);

  const calculateFinancialSummary = () => {
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const totalPending = invoices.filter(inv => inv.status !== 'paid').reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const activeProjects = projects.filter(proj => proj.status === 'active').length;

    return {
      totalInvoiced,
      totalPaid,
      totalPending,
      activeProjects
    };
  };

  const exportToPDF = () => {
    if (!client) {
      console.error('No client data available for PDF export');
      alert('Client data is not loaded. Please wait for the page to load completely.');
      return;
    }

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const docWithAutoTable = doc as JsPDFWithAutoTable;
      const marginX = 16;
      const textColor: [number, number, number] = [17, 24, 39];
      const mutedColor: [number, number, number] = [107, 114, 128];
      const lineColor: [number, number, number] = [229, 231, 235];
      let yPosition = 16;

      const formatMoney = (amount: number) => formatPKR(Number(amount || 0));
      const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const formatMaybeDate = (iso: string | undefined | null) => (iso ? format(new Date(iso), 'MMM d, yyyy') : '—');

      const ensureRoom = (needed: number) => {
        if (yPosition + needed <= pageHeight - 14) return;
        doc.addPage();
        yPosition = 16;
      };

      const sectionTitle = (label: string) => {
        ensureRoom(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...textColor);
        doc.text(label, marginX, yPosition);
        yPosition += 3;
        doc.setDrawColor(...lineColor);
        doc.setLineWidth(0.3);
        doc.line(marginX, yPosition, pageWidth - marginX, yPosition);
        yPosition += 6;
      };

      const runAutoTable = (options: Record<string, unknown>) => {
        const anyDoc = docWithAutoTable as unknown as Record<string, unknown>;
        const maybeAutoTable = (docWithAutoTable as unknown as { autoTable?: (opts: unknown) => void }).autoTable;
        if (typeof maybeAutoTable === 'function') {
          maybeAutoTable(options);
        } else {
          const autoTableFn =
            (autoTable as unknown as { default?: (doc: unknown, opts: unknown) => void }).default ??
            (autoTable as unknown as (doc: unknown, opts: unknown) => void);
          if (typeof autoTableFn !== 'function') {
            throw new Error('PDF table generator is unavailable');
          }
          autoTableFn(docWithAutoTable, options);
        }
        const last = (anyDoc as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
        const finalY = typeof last?.finalY === 'number' ? last.finalY : undefined;
        if (typeof finalY === 'number') yPosition = finalY + 6;
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...textColor);
      doc.text('Client Report', marginX, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...mutedColor);
      doc.text(`Generated ${format(new Date(), 'MMM d, yyyy')}`, pageWidth - marginX, yPosition, { align: 'right' });
      yPosition += 7;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...textColor);
      doc.text(client.name || 'Client', marginX, yPosition);
      yPosition += 6;

      const metaLine = [client.company, client.email, client.phone].filter(Boolean).join(' • ');
      if (metaLine) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...mutedColor);
        doc.text(metaLine, marginX, yPosition);
        yPosition += 5;
      }

      doc.setDrawColor(...lineColor);
      doc.setLineWidth(0.3);
      doc.line(marginX, yPosition, pageWidth - marginX, yPosition);
      yPosition += 8;

      sectionTitle('Client Details');
      const clientRows: Array<[string, string]> = [
        ['Email', client.email || '—'],
        ['Phone', client.phone || '—'],
        ['Company', client.company || '—'],
        ['Address', client.address || '—'],
        ['Client Since', client.created_at ? format(new Date(client.created_at), 'MMM d, yyyy') : '—']
      ];

      runAutoTable({
        startY: yPosition,
        body: clientRows.map(([k, v]) => [k, v]),
        theme: 'plain',
        margin: { left: marginX, right: marginX },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          textColor,
          cellPadding: { top: 2, right: 2, bottom: 2, left: 0 }
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 34, textColor },
          1: { cellWidth: pageWidth - marginX * 2 - 34, textColor }
        }
      });

      sectionTitle('Summary');
      const financialSummary = calculateFinancialSummary();
      const kpis = [
        { label: 'Total Invoiced', value: formatMoney(financialSummary.totalInvoiced) },
        { label: 'Total Paid', value: formatMoney(financialSummary.totalPaid) },
        { label: 'Outstanding', value: formatMoney(financialSummary.totalPending) },
        { label: 'Active Projects', value: String(financialSummary.activeProjects) }
      ];

      const gap = 4;
      const boxW = (pageWidth - marginX * 2 - gap * 3) / 4;
      const boxH = 18;
      ensureRoom(boxH + 8);
      kpis.forEach((kpi, i) => {
        const x = marginX + i * (boxW + gap);
        doc.setDrawColor(...lineColor);
        doc.setLineWidth(0.3);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(x, yPosition, boxW, boxH, 2, 2, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...mutedColor);
        doc.text(kpi.label, x + 3, yPosition + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.text(kpi.value, x + 3, yPosition + 13);
      });
      yPosition += boxH + 10;

      const paidDateByInvoiceId = new Map<string, string>();
      transactions.forEach((t) => {
        if (!t.invoice_id || !t.date) return;
        const nextDate = new Date(t.date);
        const prev = paidDateByInvoiceId.get(t.invoice_id);
        if (!prev) {
          paidDateByInvoiceId.set(t.invoice_id, nextDate.toISOString().slice(0, 10));
          return;
        }
        const prevDate = new Date(prev);
        if (nextDate > prevDate) paidDateByInvoiceId.set(t.invoice_id, nextDate.toISOString().slice(0, 10));
      });

      sectionTitle('Invoices');
      runAutoTable({
        startY: yPosition,
        head: [['Invoice #', 'Amount', 'Issue Date', 'Due Date', 'Paid Date']],
        body:
          invoices.length > 0
            ? invoices.map((inv) => [
                inv.invoice_number || '—',
                formatMoney(inv.amount || 0),
                formatMaybeDate(inv.issue_date),
                formatMaybeDate(inv.due_date),
                (() => {
                  const paidISO = paidDateByInvoiceId.get(inv.id);
                  if (!paidISO) return '—';
                  return formatMaybeDate(paidISO);
                })()
              ])
            : [['No invoices', '—', '—', '—', '—']],
        theme: 'striped',
        margin: { left: marginX, right: marginX },
        styles: { font: 'helvetica', fontSize: 8.5, textColor, lineColor, lineWidth: 0.2, cellPadding: 3 },
        headStyles: { fillColor: [243, 244, 246], textColor, fontStyle: 'bold', lineColor, lineWidth: 0.2 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { halign: 'right', cellWidth: 34 },
          2: { cellWidth: 40 },
          3: { cellWidth: 40 },
          4: { cellWidth: 40 }
        }
      });
      yPosition += 2;

      sectionTitle('Projects');
      runAutoTable({
        startY: yPosition,
        head: [['Project Name', 'Type', 'Pricing', 'Amount', 'Status', 'Created']],
        body:
          projects.length > 0
            ? projects.map((p) => [
                p.name || '—',
                titleCase(p.project_type || ''),
                titleCase(p.pricing_type || ''),
                formatMoney(p.amount || 0),
                titleCase(p.status || ''),
                formatMaybeDate(p.created_at)
              ])
            : [['No projects', '—', '—', '—', '—', '—']],
        theme: 'striped',
        margin: { left: marginX, right: marginX },
        styles: { font: 'helvetica', fontSize: 8.5, textColor, lineColor, lineWidth: 0.2, cellPadding: 3 },
        headStyles: { fillColor: [243, 244, 246], textColor, fontStyle: 'bold', lineColor, lineWidth: 0.2 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 78 },
          1: { cellWidth: 38 },
          2: { cellWidth: 30 },
          3: { halign: 'right', cellWidth: 32 },
          4: { cellWidth: 28 },
          5: { cellWidth: 32 }
        }
      });
      yPosition += 2;

      sectionTitle('Transactions');
      runAutoTable({
        startY: yPosition,
        head: [['Date', 'Description', 'Amount', 'Method', 'Status']],
        body:
          transactions.length > 0
            ? transactions.map((t) => [formatMaybeDate(t.date), t.description || '—', formatMoney(t.amount || 0), t.category || 'N/A', 'Completed'])
            : [['—', 'No transactions', '—', '—', '—']],
        theme: 'striped',
        margin: { left: marginX, right: marginX },
        styles: { font: 'helvetica', fontSize: 8.5, textColor, lineColor, lineWidth: 0.2, cellPadding: 3 },
        headStyles: { fillColor: [243, 244, 246], textColor, fontStyle: 'bold', lineColor, lineWidth: 0.2 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { cellWidth: 34 },
          1: { cellWidth: 120 },
          2: { halign: 'right', cellWidth: 34 },
          3: { cellWidth: 34 },
          4: { cellWidth: 30 }
        }
      });
      yPosition += 2;

      const totalPages = (doc as JsPDFWithAutoTable).internal.pages.length;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...mutedColor);
        doc.text('Quantumnexa Finance App', marginX, pageHeight - 10);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 10, { align: 'right' });
      }

      const fileName = `client_report_${client.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please check the console for details.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingContainer>
          <div className="spinner" />
        </LoadingContainer>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <Container>
          <EmptyState>
            <div className="icon">
              <FileText size={24} />
            </div>
            <h4>Client not found</h4>
            <p>The client you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          </EmptyState>
        </Container>
      </DashboardLayout>
    );
  }

  const summary = calculateFinancialSummary();

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <BackButton onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </BackButton>
          <HeaderContent>
            <h1>{client.name}</h1>
            <p>Client details and transaction history</p>
          </HeaderContent>
          <HeaderActions>
            <Button 
              variant="outline" 
              size="md"
              onClick={() => {
                // Navigate to edit client page or open edit modal
                // For now, we'll redirect to the clients page with edit functionality
                router.push(`/clients?edit=${client.id}`);
              }}
            >
              <Edit size={16} />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="md"
              onClick={exportToPDF}
            >
              <Download size={16} />
              Export PDF
            </Button>
          </HeaderActions>
        </Header>

        <ClientOverview>
          <ClientInfo variant="glass" padding="lg">
            <h3>Client Information</h3>
            <InfoItem>
              <Mail className="icon" size={20} />
              <div className="content">
                <div className="label">Email</div>
                <div className="value">{client.email}</div>
              </div>
            </InfoItem>
            {client.phone && (
              <InfoItem>
                <Phone className="icon" size={20} />
                <div className="content">
                  <div className="label">Phone</div>
                  <div className="value">{client.phone}</div>
                </div>
              </InfoItem>
            )}
            {client.company && (
              <InfoItem>
                <Building className="icon" size={20} />
                <div className="content">
                  <div className="label">Company</div>
                  <div className="value">{client.company}</div>
                </div>
              </InfoItem>
            )}
            {client.address && (
              <InfoItem>
                <MapPin className="icon" size={20} />
                <div className="content">
                  <div className="label">Address</div>
                  <div className="value">{client.address}</div>
                </div>
              </InfoItem>
            )}
            <InfoItem>
              <Calendar className="icon" size={20} />
              <div className="content">
                <div className="label">Client Since</div>
                <div className="value">{format(new Date(client.created_at), 'MMM d, yyyy')}</div>
              </div>
            </InfoItem>
          </ClientInfo>

          <FinancialSummary variant="glass" padding="lg">
            <h3>Financial Summary</h3>
            <SummaryGrid>
              <SummaryCard>
                <div className="icon income">
                  <TrendingUp size={20} />
                </div>
                <div className="value">{formatPKR(summary.totalPaid || 0)}</div>
                <div className="label">Total Paid</div>
              </SummaryCard>
              <SummaryCard>
                <div className="icon pending">
                  <CreditCard size={20} />
                </div>
                <div className="value">{formatPKR(summary.totalPending || 0)}</div>
                <div className="label">Pending</div>
              </SummaryCard>
              <SummaryCard>
                <div className="icon income">
                  <Receipt size={20} />
                </div>
                <div className="value">{formatPKR(summary.totalInvoiced || 0)}</div>
                <div className="label">Total Invoiced</div>
              </SummaryCard>
              <SummaryCard>
                <div className="icon projects">
                  <FileText size={20} />
                </div>
                <div className="value">{summary.activeProjects}</div>
                <div className="label">Active Projects</div>
              </SummaryCard>
            </SummaryGrid>
          </FinancialSummary>
        </ClientOverview>

        <TabsContainer>
          <TabsList>
            <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              Overview
            </Tab>
            <Tab active={activeTab === 'invoices'} onClick={() => setActiveTab('invoices')}>
              Invoices ({invoices.length})
            </Tab>
            <Tab active={activeTab === 'projects'} onClick={() => setActiveTab('projects')}>
              Projects ({projects.length})
            </Tab>
            <Tab active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>
              Transactions ({transactions.length})
            </Tab>
          </TabsList>

          <TabContent>
            {activeTab === 'invoices' && (
              <TableContainer variant="glass">
                {invoices.length > 0 ? (
                  <Table>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td>{invoice.invoice_number}</td>
                          <td>{formatPKR(invoice.amount || 0)}</td>
                          <td>
                            <StatusBadge status={invoice.status}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </StatusBadge>
                          </td>
                          <td>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</td>
                          <td>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <EmptyState>
                    <div className="icon">
                      <Receipt size={24} />
                    </div>
                    <h4>No invoices yet</h4>
                    <p>Create your first invoice for this client to get started.</p>
                  </EmptyState>
                )}
              </TableContainer>
            )}

            {activeTab === 'projects' && (
              <TableContainer variant="glass" padding="sm">
                {projects.length > 0 ? (
                  <Table>
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Type</th>
                        <th>Pricing</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.id}>
                          <td>{project.name}</td>
                          <td>{project.project_type.replace('_', ' ')}</td>
                          <td>{project.pricing_type}</td>
                          <td>{formatPKR(project.amount || 0)}</td>
                          <td>
                            <StatusBadge status={project.status}>
                              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </StatusBadge>
                          </td>
                          <td>{format(new Date(project.created_at), 'MMM d, yyyy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <EmptyState>
                    <div className="icon">
                      <FileText size={24} />
                    </div>
                    <h4>No projects yet</h4>
                    <p>Create your first project for this client to get started.</p>
                  </EmptyState>
                )}
              </TableContainer>
            )}

            {activeTab === 'transactions' && (
              <TableContainer variant="glass">
                {transactions.length > 0 ? (
                  <Table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td>{format(new Date(transaction.date), 'MMM d, yyyy')}</td>
                          <td>{transaction.description || 'Payment received'}</td>
                          <td>{formatPKR(transaction.amount || 0)}</td>
                          <td>{transaction.category || 'N/A'}</td>
                          <td>
                            <StatusBadge status="paid">
                              Completed
                            </StatusBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <EmptyState>
                    <div className="icon">
                      <CreditCard size={24} />
                    </div>
                    <h4>No transactions yet</h4>
                    <p>Transactions will appear here once payments are recorded.</p>
                  </EmptyState>
                )}
              </TableContainer>
            )}

            {activeTab === 'overview' && (
              <div>
                <EmptyState>
                  <div className="icon">
                    <TrendingUp size={24} />
                  </div>
                  <h4>Overview Dashboard</h4>
                  <p>Detailed analytics and charts will be available here soon.</p>
                </EmptyState>
              </div>
            )}
          </TabContent>
        </TabsContainer>
      </Container>
    </DashboardLayout>
  );
}
