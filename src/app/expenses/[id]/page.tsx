'use client';

import { useState, useEffect } from 'react';
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
  Trash2, 
  Receipt, 
  Calendar, 
  Tag, 
  DollarSign,
  Building,
  CreditCard,
  FileText,
  User,
  Clock,
  ExternalLink,
  Download,
  Upload,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  subcategory?: string;
  vendor?: string;
  payment_method?: string;
  is_billable?: boolean;
  currency: string;
  date: string;
  receipt_url?: string;
  project_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  projects?: {
    id: string;
    name: string;
    client_id: string;
    clients?: {
      name: string;
    };
  };
}

const Container = styled.div`
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const BackButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const HeaderContent = styled.div`
  flex: 1;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: white;
    margin-bottom: 4px;
  }
  
  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.7);
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ExpenseCard = styled(Card)`
  padding: 32px;
`;

const ExpenseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ExpenseInfo = styled.div`
  flex: 1;
  
  .amount {
    font-size: 36px;
    font-weight: 700;
    color: var(--gray-800);
    margin-bottom: 8px;
  }
  
  .description {
    font-size: 18px;
    color: var(--gray-600);
    margin-bottom: 12px;
  }
  
  .category {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--primary-100);
    color: var(--primary-700);
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  
  .icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--primary-100);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-600);
  }
  
  .content {
    flex: 1;
    
    .label {
      font-size: 12px;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .value {
      font-size: 14px;
      font-weight: 500;
      color: var(--gray-800);
    }
  }
`;

const NotesSection = styled.div`
  padding: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--gray-800);
    margin-bottom: 12px;
  }
  
  p {
    font-size: 14px;
    color: var(--gray-600);
    line-height: 1.5;
  }
`;

const ReceiptCard = styled(Card)`
  padding: 24px;
`;

const ReceiptHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: 16px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--gray-800);
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ReceiptPreview = styled.div`
  aspect-ratio: 3/4;
  background: var(--gray-100);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .placeholder {
    text-align: center;
    color: var(--gray-500);
    
    .icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 12px;
      opacity: 0.5;
    }
  }
`;

const ReceiptActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ProjectCard = styled(Card)`
  padding: 24px;
`;

const ProjectHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  
  .icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--success-100);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--success-600);
  }
  
  .content {
    flex: 1;
    
    .name {
      font-size: 16px;
      font-weight: 600;
      color: var(--gray-800);
      margin-bottom: 4px;
    }
    
    .client {
      font-size: 14px;
      color: var(--gray-600);
    }
  }
`;

const BillableStatus = styled.div<{ billable: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  
  ${props => props.billable ? `
    background: var(--success-100);
    color: var(--success-700);
  ` : `
    background: var(--gray-100);
    color: var(--gray-700);
  `}
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

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchExpense();
    }
  }, [user, params.id]);

  const fetchExpense = async () => {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          projects (
            id,
            name,
            client_id,
            clients (
              name
            )
          )
        `)
        .eq('id', params.id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setExpense(data);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async () => {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', params.id)
        .eq('user_id', user?.id);

      if (error) throw error;
      router.push('/expenses');
    } catch (error: unknown) {
      console.error('Error deleting expense:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete expense. Please try again.');
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

  if (error || !expense) {
    return (
      <DashboardLayout>
        <Container>
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <h2 style={{ color: 'white', marginBottom: '16px' }}>Error Loading Expense</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' }}>
              {error || 'Expense not found'}
            </p>
            <Button onClick={() => router.push('/expenses')}>
              <ArrowLeft size={20} />
              Back to Expenses
            </Button>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <BackButton
            variant="outline"
            onClick={() => router.push('/expenses')}
          >
            <ArrowLeft size={20} />
            Back to Expenses
          </BackButton>
          <HeaderContent>
            <h1>Expense Details</h1>
            <p>View and manage expense information</p>
          </HeaderContent>
          <ActionButtons>
            <Button variant="outline">
              <Edit size={20} />
              Edit
            </Button>
            <Button variant="outline" onClick={deleteExpense}>
              <Trash2 size={20} />
              Delete
            </Button>
          </ActionButtons>
        </Header>

        <ContentGrid>
          <MainContent>
            <ExpenseCard variant="glass">
              <ExpenseHeader>
                <ExpenseInfo>
                  <div className="amount">{formatPKR(expense.amount)}</div>
                  <div className="description">{expense.description}</div>
                  <div className="category">
                    <Tag size={14} />
                    {expense.category}
                    {expense.subcategory && ` • ${expense.subcategory}`}
                  </div>
                </ExpenseInfo>
              </ExpenseHeader>

              <DetailsGrid>
                <DetailItem>
                  <div className="icon">
                    <Calendar size={20} />
                  </div>
                  <div className="content">
                    <div className="label">Date</div>
                    <div className="value">{format(new Date(expense.date), 'MMMM d, yyyy')}</div>
                  </div>
                </DetailItem>

                {expense.vendor && (
                  <DetailItem>
                    <div className="icon">
                      <Building size={20} />
                    </div>
                    <div className="content">
                      <div className="label">Vendor</div>
                      <div className="value">{expense.vendor}</div>
                    </div>
                  </DetailItem>
                )}

                {expense.payment_method && (
                  <DetailItem>
                    <div className="icon">
                      <CreditCard size={20} />
                    </div>
                    <div className="content">
                      <div className="label">Payment Method</div>
                      <div className="value">{expense.payment_method}</div>
                    </div>
                  </DetailItem>
                )}

                <DetailItem>
                  <div className="icon">
                    <DollarSign size={20} />
                  </div>
                  <div className="content">
                    <div className="label">Currency</div>
                    <div className="value">{expense.currency}</div>
                  </div>
                </DetailItem>

                <DetailItem>
                  <div className="icon">
                    <Clock size={20} />
                  </div>
                  <div className="content">
                    <div className="label">Created</div>
                    <div className="value">{format(new Date(expense.created_at), 'MMM d, yyyy')}</div>
                  </div>
                </DetailItem>

                <DetailItem>
                  <div className="icon">
                    <Clock size={20} />
                  </div>
                  <div className="content">
                    <div className="label">Last Updated</div>
                    <div className="value">{format(new Date(expense.updated_at), 'MMM d, yyyy')}</div>
                  </div>
                </DetailItem>
              </DetailsGrid>

              {expense.notes && (
                <NotesSection>
                  <h3>Notes</h3>
                  <p>{expense.notes}</p>
                </NotesSection>
              )}
            </ExpenseCard>
          </MainContent>

          <Sidebar>
            <ReceiptCard variant="glass">
              <ReceiptHeader>
                <h3>
                  <Receipt size={20} />
                  Receipt
                </h3>
              </ReceiptHeader>
              
              <ReceiptPreview>
                {expense.receipt_url ? (
                  <img src={expense.receipt_url} alt="Receipt" />
                ) : (
                  <div className="placeholder">
                    <Receipt className="icon" size={48} />
                    <p>No receipt uploaded</p>
                  </div>
                )}
              </ReceiptPreview>
              
              <ReceiptActions>
                {expense.receipt_url ? (
                  <>
                    <Button variant="outline" size="sm">
                      <ExternalLink size={16} />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download size={16} />
                      Download
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm">
                    <Upload size={16} />
                    Upload Receipt
                  </Button>
                )}
              </ReceiptActions>
            </ReceiptCard>

            {expense.projects && (
              <ProjectCard variant="glass">
                <ProjectHeader>
                  <div className="icon">
                    <FileText size={20} />
                  </div>
                  <div className="content">
                    <div className="name">{expense.projects.name}</div>
                    <div className="client">{expense.projects.clients?.name}</div>
                  </div>
                </ProjectHeader>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/projects/${expense.projects?.id}`)}
                >
                  View Project
                </Button>
              </ProjectCard>
            )}

            <Card variant="glass" padding="lg">
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--gray-800)' }}>
                Billing Status
              </h3>
              <BillableStatus billable={expense.is_billable || false}>
                {expense.is_billable ? (
                  <>
                    <Check size={16} />
                    Billable Expense
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} />
                    Non-billable Expense
                  </>
                )}
              </BillableStatus>
              {expense.is_billable && (
                <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginTop: '12px' }}>
                  This expense can be billed to the client or project.
                </p>
              )}
            </Card>
          </Sidebar>
        </ContentGrid>
      </Container>
    </DashboardLayout>
  );
}