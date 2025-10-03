'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import { formatPKR, parsePKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  ArrowLeft,
  Download,
  Send,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  CreditCard,
  Receipt,
  TrendingUp,
  X,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id?: string;
  amount: number;
  tax_amount?: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  description?: string;
  notes?: string;
  terms_conditions?: string;
  created_at: string;
  clients?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  projects?: {
    id: string;
    name: string;
  };
}

interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 16px;
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
    transform: translateX(-2px);
  }
`;

const HeaderContent = styled.div`
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
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: stretch;
    
    > * {
      flex: 1;
    }
  }
`;

const StatusBadge = styled.div<{ status: string }>`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  text-transform: capitalize;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  width: fit-content;
  
  ${props => {
    switch (props.status) {
      case 'draft':
        return `
          background: var(--gray-100);
          color: var(--gray-700);
        `;
      case 'sent':
        return `
          background: var(--primary-100);
          color: var(--primary-700);
        `;
      case 'paid':
        return `
          background: var(--success-100);
          color: var(--success-700);
        `;
      case 'overdue':
        return `
          background: var(--error-100);
          color: var(--error-700);
        `;
      case 'cancelled':
        return `
          background: var(--gray-100);
          color: var(--gray-600);
        `;
      default:
        return `
          background: var(--gray-100);
          color: var(--gray-700);
        `;
    }
  }}
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const InvoiceDetails = styled(Card)`
  padding: 32px;
`;

const InvoiceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const InvoiceInfo = styled.div`
  .invoice-number {
    font-size: 24px;
    font-weight: 700;
    color: var(--gray-800);
    margin-bottom: 8px;
  }
  
  .dates {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: var(--gray-600);
  }
`;

const AmountSummary = styled.div`
  text-align: right;
  
  .total-amount {
    font-size: 32px;
    font-weight: 700;
    color: var(--gray-800);
    margin-bottom: 4px;
  }
  
  .currency {
    font-size: 14px;
    color: var(--gray-500);
  }
`;

const ClientSection = styled.div`
  margin-bottom: 32px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ClientInfo = styled.div`
  background: rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 20px;
  
  .name {
    font-size: 16px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 8px;
  }
  
  .detail {
    font-size: 14px;
    color: var(--gray-600);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ProjectSection = styled.div`
  margin-bottom: 32px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ProjectInfo = styled.div`
  background: rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 20px;
  
  .name {
    font-size: 16px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 8px;
  }
`;

const DescriptionSection = styled.div`
  margin-bottom: 32px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 16px;
  }
  
  .description {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 16px;
    padding: 20px;
    font-size: 14px;
    color: var(--gray-700);
    line-height: 1.6;
  }
`;

const PaymentSummary = styled(Card)`
  padding: 24px;
  height: fit-content;
`;

const SummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--gray-800);
  }
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
    font-weight: 600;
    font-size: 16px;
    color: var(--gray-800);
  }
  
  .label {
    font-size: 14px;
    color: var(--gray-600);
  }
  
  .value {
    font-size: 14px;
    color: var(--gray-800);
    font-weight: 500;
  }
`;

const PaymentSection = styled.div`
  margin-top: 32px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    font-size: 24px;
    font-weight: 700;
    color: white;
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

const PaymentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PaymentCard = styled(Card)`
  padding: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const PaymentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const PaymentInfo = styled.div`
  .amount {
    font-size: 18px;
    font-weight: 600;
    color: var(--success-600);
    margin-bottom: 4px;
  }
  
  .method {
    font-size: 14px;
    color: var(--gray-600);
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const PaymentDate = styled.div`
  font-size: 14px;
  color: var(--gray-500);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PaymentDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 12px;
  
  .detail {
    font-size: 14px;
    color: var(--gray-600);
    
    .label {
      font-weight: 500;
      margin-bottom: 2px;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  
  .icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
  }
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 24px;
  }
`;

const Modal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
`;

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 500px;
  backdrop-filter: blur(20px);
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
  }
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  color: #1f2937;
  background: #ffffff;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  color: #1f2937;
  background: #ffffff;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  color: #1f2937;
  background: #ffffff;
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
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

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const supabase = createSupabaseClient();

  useEffect(() => {
    console.log('useEffect triggered with:', { user: user?.id, paramsId: params.id });
    if (user && params.id) {
      console.log('Conditions met, calling fetchInvoice and fetchPayments');
      fetchInvoice();
      fetchPayments();
    } else {
      console.log('Conditions not met:', { hasUser: !!user, hasParamsId: !!params.id });
    }
  }, [user, params.id]);

  const fetchInvoice = async () => {
    if (!user?.id || !params.id) {
      console.log('Missing user ID or invoice ID');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching invoice with ID:', params.id, 'for user:', user?.id);
      console.log('Invoice ID type:', typeof params.id);
      console.log('User ID type:', typeof user?.id);
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone,
            address
          ),
          projects (
            id,
            name
          )
        `)
        .eq('id', params.id)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error });
      console.log('Data length:', data?.length);
      console.log('Full data:', JSON.stringify(data, null, 2));

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Check if any invoice was found
      if (!data || data.length === 0) {
        console.log('Invoice not found for this user');
        console.log('Possible reasons:');
        console.log('1. Invoice ID does not exist in database');
        console.log('2. Invoice belongs to a different user');
        console.log('3. Database connection issue');
        setInvoice(null);
        return;
      }
      
      console.log('Invoice fetched successfully:', data[0]);
      setInvoice(data[0]);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', params.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={16} />;
      case 'sent': return <Send size={16} />;
      case 'paid': return <CheckCircle size={16} />;
      case 'overdue': return <AlertCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const updateInvoiceStatus = async (newStatus: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => {
    if (!invoice) return;
    
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoice.id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Update local state
      setInvoice({ ...invoice, status: newStatus });
      
      console.log(`Invoice status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const sendInvoice = async () => {
    if (!invoice || !invoice.clients?.email) {
      alert('Cannot send invoice: Client email is required');
      return;
    }
    
    try {
      // Update status to 'sent'
      await updateInvoiceStatus('sent');
      
      // Here you would typically integrate with an email service
      // For now, we'll just show a success message
      alert(`Invoice ${invoice.invoice_number} has been marked as sent to ${invoice.clients.email}`);
      
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice');
    }
  };
    const calculatePaymentSummary = () => {
    if (!invoice) {
      return {
        totalPaid: 0,
        remainingBalance: 0,
        paymentCount: 0
      };
    }
    
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = invoice.total_amount - totalPaid;
    
    return {
      totalPaid,
      remainingBalance,
      paymentCount: payments.length
    };
  };

  const summary = calculatePaymentSummary();

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingContainer>
          <div className="spinner" />
        </LoadingContainer>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <Container>
          <div>Invoice not found</div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <HeaderLeft>
            <BackButton onClick={() => router.push('/invoices')}>
              <ArrowLeft size={20} />
            </BackButton>
            <HeaderContent>
              <h1>{invoice.invoice_number}</h1>
              <p>Invoice details and payment tracking</p>
            </HeaderContent>
          </HeaderLeft>
          <HeaderActions>
            <Button variant="outline" size="md">
              <Download size={16} />
              Download PDF
            </Button>
            {invoice.status === 'draft' && (
              <Button variant="primary" size="md" onClick={() => sendInvoice()}>
                <Send size={16} />
                Send Invoice
              </Button>
            )}
            <Button variant="outline" size="md" onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>
              <Edit size={16} />
              Edit
            </Button>
          </HeaderActions>
        </Header>

        <MainContent>
          <InvoiceDetails variant="glass">
            <StatusBadge status={invoice.status} onClick={() => {
              if (invoice.status === 'draft') {
                updateInvoiceStatus('sent');
              }
            }} style={{ cursor: invoice.status === 'draft' ? 'pointer' : 'default' }}>
              {getStatusIcon(invoice.status)}
              {invoice.status}
            </StatusBadge>

            <InvoiceHeader>
              <InvoiceInfo>
                <div className="invoice-number">{invoice.invoice_number}</div>
                <div className="dates">
                  <div>Issue Date: {format(new Date(invoice.issue_date), 'MMM d, yyyy')}</div>
                  <div>Due Date: {format(new Date(invoice.due_date), 'MMM d, yyyy')}</div>
                </div>
              </InvoiceInfo>
              <AmountSummary>
                <div className="total-amount">{formatPKR(invoice.total_amount)}</div>
                <div className="currency">{invoice.currency || 'PKR'}</div>
              </AmountSummary>
            </InvoiceHeader>

            <ClientSection>
              <h3>
                <User size={18} />
                Client Information
              </h3>
              <ClientInfo>
                <div className="name">{invoice.clients?.name}</div>
                <div className="detail">
                  <FileText size={14} />
                  {invoice.clients?.email}
                </div>
                {invoice.clients?.phone && (
                  <div className="detail">
                    <FileText size={14} />
                    {invoice.clients?.phone}
                  </div>
                )}
                {invoice.clients?.address && (
                  <div className="detail">
                    <FileText size={14} />
                    {invoice.clients?.address}
                  </div>
                )}
              </ClientInfo>
            </ClientSection>

            {invoice.projects && (
              <ProjectSection>
                <h3>
                  <FileText size={18} />
                  Project
                </h3>
                <ProjectInfo>
                  <div className="name">{invoice.projects.name}</div>
                </ProjectInfo>
              </ProjectSection>
            )}

            {invoice.description && (
              <DescriptionSection>
                <h3>Description</h3>
                <div className="description">{invoice.description}</div>
              </DescriptionSection>
            )}

            {invoice.notes && (
              <DescriptionSection>
                <h3>Notes</h3>
                <div className="description">{invoice.notes}</div>
              </DescriptionSection>
            )}

            {invoice.terms_conditions && (
              <DescriptionSection>
                <h3>Terms & Conditions</h3>
                <div className="description">{invoice.terms_conditions}</div>
              </DescriptionSection>
            )}
          </InvoiceDetails>

          <PaymentSummary variant="glass">
            <SummaryHeader>
              <h3>Payment Summary</h3>
            </SummaryHeader>
            
            <SummaryItem>
              <span className="label">Invoice Amount</span>
              <span className="value">{formatPKR(invoice.total_amount)}</span>
            </SummaryItem>
            
            <SummaryItem>
              <span className="label">Total Paid</span>
              <span className="value">{formatPKR(summary.totalPaid)}</span>
            </SummaryItem>
            
            <SummaryItem>
              <span className="label">Remaining Balance</span>
              <span className="value">{formatPKR(summary.remainingBalance)}</span>
            </SummaryItem>
            
            <SummaryItem>
              <span className="label">Payment Status</span>
              <span className="value">
                {summary.remainingBalance <= 0 ? 'Fully Paid' : 
                 summary.totalPaid > 0 ? 'Partially Paid' : 'Unpaid'}
              </span>
            </SummaryItem>

            {summary.remainingBalance > 0 && (
              <Button 
                variant="primary" 
                size="md" 
                style={{ marginTop: '20px', width: '100%' }}
                onClick={() => setShowPaymentForm(true)}
              >
                <Plus size={16} />
                Record Payment
              </Button>
            )}
          </PaymentSummary>
        </MainContent>

        <PaymentSection>
          <SectionHeader>
            <h2>
              <Receipt size={24} />
              Payment History ({summary.paymentCount})
            </h2>
            {summary.remainingBalance > 0 && (
              <Button 
                variant="primary" 
                size="md"
                onClick={() => setShowPaymentForm(true)}
              >
                <Plus size={16} />
                Add Payment
              </Button>
            )}
          </SectionHeader>

          {payments.length === 0 ? (
            <EmptyState>
              <div className="icon">
                <Receipt size={32} />
              </div>
              <h3>No payments recorded</h3>
              <p>Start tracking payments for this invoice to monitor payment progress.</p>
              <Button 
                variant="primary" 
                size="md"
                onClick={() => setShowPaymentForm(true)}
              >
                <Plus size={16} />
                Record First Payment
              </Button>
            </EmptyState>
          ) : (
            <PaymentsList>
              {payments.map((payment) => (
                <PaymentCard key={payment.id} variant="glass" hover>
                  <PaymentHeader>
                    <PaymentInfo>
                      <div className="amount">{formatPKR(payment.amount)}</div>
                      <div className="method">
                        <CreditCard size={14} />
                        {payment.payment_method}
                      </div>
                    </PaymentInfo>
                    <PaymentDate>
                      <Calendar size={14} />
                      {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                    </PaymentDate>
                  </PaymentHeader>
                  
                  <PaymentDetails>
                    {payment.reference_number && (
                      <div className="detail">
                        <div className="label">Reference</div>
                        <div>{payment.reference_number}</div>
                      </div>
                    )}
                    {payment.notes && (
                      <div className="detail">
                        <div className="label">Notes</div>
                        <div>{payment.notes}</div>
                      </div>
                    )}
                  </PaymentDetails>
                </PaymentCard>
              ))}
            </PaymentsList>
          )}
        </PaymentSection>

        {showPaymentForm && (
          <AddPaymentModal
            invoice={invoice}
            onClose={() => setShowPaymentForm(false)}
            onSuccess={() => {
              setShowPaymentForm(false);
              fetchPayments();
              fetchInvoice();
            }}
          />
        )}
      </Container>
    </DashboardLayout>
  );
}

function AddPaymentModal({ 
  invoice, 
  onClose, 
  onSuccess 
}: { 
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parsePKR(formData.amount);
      
      const paymentData = {
        invoice_id: invoice.id,
        amount,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
        user_id: user?.id
      };

      const { error } = await supabase
        .from('payments')
        .insert([paymentData]);

      if (error) throw error;

      // Update invoice status if fully paid
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', invoice.id);

      const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0) + amount;
      
      if (totalPaid >= invoice.total_amount) {
        await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', invoice.id);
      }

      onSuccess();
    } catch (error: unknown) {
      console.error('Error adding payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Record Payment</h2>
          <CloseButton onClick={onClose}>
            <X size={16} />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Payment Amount (PKR) *</Label>
            <Input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </FormGroup>

          <FormGroup>
            <Label>Payment Date *</Label>
            <Input
              type="date"
              required
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
            />
          </FormGroup>

          <FormGroup>
            <Label>Payment Method *</Label>
            <Select
              required
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="online_payment">Online Payment</option>
              <option value="other">Other</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Reference Number</Label>
            <Input
              type="text"
              placeholder="Transaction reference or check number"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            />
          </FormGroup>

          <FormGroup>
            <Label>Notes</Label>
            <TextArea
              placeholder="Additional payment notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </FormGroup>

          <ModalActions>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Record Payment
            </Button>
          </ModalActions>
        </Form>
      </ModalContent>
    </Modal>
  );
}