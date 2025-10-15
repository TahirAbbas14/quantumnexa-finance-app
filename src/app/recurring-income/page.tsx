'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import styled from 'styled-components'
import { 
  Plus, 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  DollarSign,
  TrendingUp,
  Repeat,
  CheckCircle,
  AlertCircle,
  Download,
  Filter,
  Settings,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react'

// Styled Components - Dashboard Theme
const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const Header = styled.div`
  margin-bottom: 40px;

  @media (max-width: 768px) {
    margin-bottom: 24px;
  }

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    @media (max-width: 768px) {
      font-size: 24px;
      margin-bottom: 6px;
    }

    @media (max-width: 480px) {
      font-size: 20px;
    }
  }

  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);

    @media (max-width: 768px) {
      font-size: 14px;
    }

    @media (max-width: 480px) {
      font-size: 13px;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  white-space: nowrap;

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 13px;
  }

  @media (max-width: 480px) {
    padding: 12px 16px;
    justify-content: center;
  }

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
          
          &:hover {
            background: linear-gradient(135deg, var(--primary-700) 0%, var(--primary-800) 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
          
          &:hover {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);
          }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
          }
        `;
    }
  }}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const StatCard = styled.div<{ color?: string }>`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.color || 'var(--primary-500)'};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
`;

const StatIcon = styled.div<{ color?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.color || 'var(--primary-500)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px ${props => props.color ? `${props.color}40` : 'rgba(239, 68, 68, 0.25)'};

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
  }

  svg {
    width: 24px;
    height: 24px;

    @media (max-width: 768px) {
      width: 20px;
      height: 20px;
    }

    @media (max-width: 480px) {
      width: 18px;
      height: 18px;
    }
  }
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    font-size: 24px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  
  @media (min-width: 1200px) {
    grid-template-columns: 2fr 1fr;
  }

  @media (max-width: 768px) {
    gap: 24px;
  }

  @media (max-width: 480px) {
    gap: 16px;
  }
`;

const MainContent = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    padding: 20px;
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  @media (max-width: 480px) {
    padding: 16px;
    gap: 12px;
  }
`;

const TableTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 18px;
  }

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 13px;
  }

  @media (max-width: 480px) {
    justify-content: center;
    width: 100%;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Table = styled.div`
  overflow-x: auto;
`;

const TableRow = styled.div<{ isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  transition: all 0.2s ease;
  min-width: 800px;

  ${props => props.isHeader ? `
    background: rgba(255, 255, 255, 0.05);
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
  ` : `
    color: rgba(255, 255, 255, 0.8);
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }
  `}

  @media (max-width: 768px) {
    padding: 12px 20px;
    gap: 12px;
    font-size: 13px;
  }

  @media (max-width: 480px) {
    padding: 12px 16px;
    gap: 8px;
    font-size: 12px;
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.status.toLowerCase()) {
      case 'active':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        `;
      case 'paused':
        return `
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        `;
      case 'ended':
        return `
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.3);
        `;
      default:
        return `
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        `;
    }
  }}

  @media (max-width: 768px) {
    padding: 4px 8px;
    font-size: 11px;
  }

  @media (max-width: 480px) {
    padding: 3px 6px;
    font-size: 10px;
  }
`;

const ActionButtonsGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;

  @media (max-width: 768px) {
    gap: 6px;
  }

  @media (max-width: 480px) {
    gap: 4px;
  }
`;

const IconButton = styled.button<{ variant?: 'edit' | 'delete' | 'action' }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.variant) {
      case 'edit':
        return `
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          
          &:hover {
            background: rgba(59, 130, 246, 0.3);
            transform: scale(1.1);
          }
        `;
      case 'delete':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          
          &:hover {
            background: rgba(239, 68, 68, 0.3);
            transform: scale(1.1);
          }
        `;
      default:
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          
          &:hover {
            background: rgba(34, 197, 94, 0.3);
            transform: scale(1.1);
          }
        `;
    }
  }}

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }

  @media (max-width: 480px) {
    width: 24px;
    height: 24px;
  }

  svg {
    width: 16px;
    height: 16px;

    @media (max-width: 768px) {
      width: 14px;
      height: 14px;
    }

    @media (max-width: 480px) {
      width: 12px;
      height: 12px;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 24px;
  color: rgba(255, 255, 255, 0.6);

  @media (max-width: 768px) {
    padding: 60px 20px;
  }

  @media (max-width: 480px) {
    padding: 40px 16px;
  }
`;

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: rgba(255, 255, 255, 0.4);

  @media (max-width: 768px) {
    width: 64px;
    height: 64px;
    margin-bottom: 20px;
  }

  @media (max-width: 480px) {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
  }

  svg {
    width: 40px;
    height: 40px;

    @media (max-width: 768px) {
      width: 32px;
      height: 32px;
    }

    @media (max-width: 480px) {
      width: 24px;
      height: 24px;
    }
  }
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (max-width: 768px) {
    gap: 20px;
  }

  @media (max-width: 480px) {
    gap: 16px;
  }
`;

const SidebarCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const SidebarTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 16px 0;

  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 12px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    margin-bottom: 8px;
  }
`;

const QuickAction = styled.button`
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
    transform: translateX(4px);
  }

  @media (max-width: 768px) {
    padding: 12px;
    gap: 10px;
    margin-bottom: 10px;
  }

  @media (max-width: 480px) {
    padding: 10px;
    gap: 8px;
    margin-bottom: 8px;
  }

  svg {
    width: 20px;
    height: 20px;
    color: var(--primary-400);

    @media (max-width: 768px) {
      width: 18px;
      height: 18px;
    }

    @media (max-width: 480px) {
      width: 16px;
      height: 16px;
    }
  }
`;

interface RecurringIncome {
  id: string
  source_name: string
  amount: number
  frequency: string
  next_payment_date: string
  status: string
  category: string
  description?: string
  auto_deposit: boolean
  created_at: string
}

export default function RecurringIncomePage() {
  const { user } = useAuth()
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState<RecurringIncome | null>(null)

  // Stats calculation
  const totalMonthlyIncome = recurringIncomes
    .filter(income => income.status === 'active')
    .reduce((sum, income) => {
      const multiplier = income.frequency === 'weekly' ? 4.33 : 
                        income.frequency === 'bi-weekly' ? 2.17 : 
                        income.frequency === 'monthly' ? 1 : 
                        income.frequency === 'quarterly' ? 0.33 : 
                        income.frequency === 'yearly' ? 0.083 : 1
      return sum + (income.amount * multiplier)
    }, 0)

  const activeIncomes = recurringIncomes.filter(income => income.status === 'active').length
  const totalIncomes = recurringIncomes.length
  const nextPayment = recurringIncomes
    .filter(income => income.status === 'active')
    .sort((a, b) => new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime())[0]

  useEffect(() => {
    fetchRecurringIncomes()
  }, [user])

  const fetchRecurringIncomes = async () => {
    if (!user) return

    try {
      const supabase = createSupabaseClient()
      if (!supabase) throw new Error('Supabase client is not initialized')
      const { data, error } = await supabase
        .from('recurring_income')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRecurringIncomes(data || [])
    } catch (error) {
      console.error('Error fetching recurring incomes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring income?')) return

    try {
      const supabase = createSupabaseClient()
      if (!supabase) throw new Error('Supabase client is not initialized')
      const { error } = await supabase
        .from('recurring_income')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchRecurringIncomes()
    } catch (error) {
      console.error('Error deleting recurring income:', error)
    }
  }

  const toggleStatus = async (income: RecurringIncome) => {
    try {
      const supabase = createSupabaseClient()
      const newStatus = income.status === 'active' ? 'paused' : 'active'
      
      if (!supabase) throw new Error('Supabase client is not initialized')
      const { error } = await supabase
        .from('recurring_income')
        .update({ status: newStatus })
        .eq('id', income.id)

      if (error) throw error
      await fetchRecurringIncomes()
    } catch (error) {
      console.error('Error updating income status:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <div>Loading...</div>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <div>
            <h1>Recurring Income</h1>
            <p>Manage your recurring income sources and track regular payments</p>
          </div>
          <HeaderActions>
            <Button variant="secondary">
              <Download size={16} />
              Export
            </Button>
            <Button variant="primary" onClick={() => setShowAddForm(true)}>
              <Plus size={16} />
              Add Income Source
            </Button>
          </HeaderActions>
        </Header>

        <StatsGrid>
          <StatCard color="var(--primary-500)">
            <StatHeader>
              <StatIcon color="var(--primary-500)">
                <DollarSign />
              </StatIcon>
            </StatHeader>
            <StatValue>{formatCurrency(totalMonthlyIncome)}</StatValue>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Monthly Income
            </div>
          </StatCard>

          <StatCard color="#22c55e">
            <StatHeader>
              <StatIcon color="#22c55e">
                <TrendingUp />
              </StatIcon>
            </StatHeader>
            <StatValue>{activeIncomes}</StatValue>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Active Sources
            </div>
          </StatCard>

          <StatCard color="#3b82f6">
            <StatHeader>
              <StatIcon color="#3b82f6">
                <Repeat />
              </StatIcon>
            </StatHeader>
            <StatValue>{totalIncomes}</StatValue>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Total Sources
            </div>
          </StatCard>

          <StatCard color="#f59e0b">
            <StatHeader>
              <StatIcon color="#f59e0b">
                <Calendar />
              </StatIcon>
            </StatHeader>
            <StatValue>
              {nextPayment ? formatDate(nextPayment.next_payment_date) : 'N/A'}
            </StatValue>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Next Payment
            </div>
          </StatCard>
        </StatsGrid>

        <ContentGrid>
          <MainContent>
            <TableHeader>
              <TableTitle>Income Sources</TableTitle>
              <FilterButton>
                <Filter size={16} />
                Filter
              </FilterButton>
            </TableHeader>

            <Table>
              <TableRow isHeader>
                <div>Source</div>
                <div>Amount</div>
                <div>Frequency</div>
                <div>Next Payment</div>
                <div>Status</div>
                <div>Actions</div>
              </TableRow>

              {recurringIncomes.length === 0 ? (
                <EmptyState>
                  <EmptyStateIcon>
                    <Repeat />
                  </EmptyStateIcon>
                  <h3 style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
                    No recurring income sources
                  </h3>
                  <p style={{ marginBottom: '24px' }}>
                    Add your first recurring income source to start tracking regular payments.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button variant="primary" onClick={() => setShowAddForm(true)}>
                      <Plus size={16} />
                      Add Income Source
                    </Button>
                  </div>
                </EmptyState>
              ) : (
                recurringIncomes.map((income) => (
                  <TableRow key={income.id}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                        {income.source_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {income.category}
                      </div>
                    </div>
                    <div style={{ fontWeight: '600', color: 'white' }}>
                      {formatCurrency(income.amount)}
                    </div>
                    <div style={{ textTransform: 'capitalize' }}>
                      {income.frequency}
                    </div>
                    <div>{formatDate(income.next_payment_date)}</div>
                    <div>
                      <StatusBadge status={income.status}>
                        {income.status}
                      </StatusBadge>
                    </div>
                    <ActionButtonsGroup>
                      <IconButton 
                        variant="action"
                        onClick={() => toggleStatus(income)}
                        title={income.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {income.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                      </IconButton>
                      <IconButton 
                        variant="edit"
                        onClick={() => setEditingIncome(income)}
                      >
                        <Edit size={14} />
                      </IconButton>
                      <IconButton 
                        variant="delete"
                        onClick={() => handleDelete(income.id)}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </ActionButtonsGroup>
                  </TableRow>
                ))
              )}
            </Table>
          </MainContent>

          <Sidebar>
            <SidebarCard>
              <SidebarTitle>Quick Actions</SidebarTitle>
              <QuickAction onClick={() => setShowAddForm(true)}>
                <Plus />
                Add New Income Source
              </QuickAction>
              <QuickAction>
                <BarChart3 />
                View Income Analytics
              </QuickAction>
              <QuickAction>
                <Settings />
                Income Settings
              </QuickAction>
            </SidebarCard>

            <SidebarCard>
              <SidebarTitle>Income Overview</SidebarTitle>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                  This Month
                </div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'white' }}>
                  {formatCurrency(totalMonthlyIncome)}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                  Annual Projection
                </div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: 'white' }}>
                  {formatCurrency(totalMonthlyIncome * 12)}
                </div>
              </div>
            </SidebarCard>
          </Sidebar>
        </ContentGrid>
      </Container>
    </DashboardLayout>
  )
}