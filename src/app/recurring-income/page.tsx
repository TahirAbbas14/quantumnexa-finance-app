'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
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

// Styled Components (reusing similar styles from other pages)
const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: var(--heading-primary);
  margin: 0;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: 1px solid rgba(239, 68, 68, 0.3);
          
          &:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: 1px solid rgba(239, 68, 68, 0.3);
          
          &:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          }
        `;
      default:
        return `
          background: rgba(239, 68, 68, 0.1);
          color: var(--text-primary);
          border: 1px solid rgba(239, 68, 68, 0.2);
          
          &:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.3);
          }
        `;
    }
  }}
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const StatCard = styled.div`
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }
`

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: var(--heading-primary);
  margin-bottom: 0.5rem;
`

const StatLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: 1200px) {
    grid-template-columns: 2fr 1fr;
  }
`

const MainContent = styled.div`
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
`

const TableHeader = styled.div`
  background: rgba(239, 68, 68, 0.05);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const TableTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--heading-primary);
  margin: 0;
`

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: var(--text-primary);
  }
`

const Table = styled.div`
  overflow-x: auto;
`

const TableRow = styled.div<{ isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  
  ${props => props.isHeader && `
    background: rgba(239, 68, 68, 0.02);
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.875rem;
  `}
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover:not(:first-child) {
    background: rgba(239, 68, 68, 0.02);
  }
`

const CategoryBadge = styled.span<{ category: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    const colors = {
      'Salary': { bg: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: 'rgba(34, 197, 94, 0.2)' },
      'Freelance': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
      'Investment': { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.2)' },
      'Rental': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
      'Business': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)' },
      'Other': { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.2)' },
      'default': { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.2)' }
    }
    const colorScheme = colors[props.category as keyof typeof colors] || colors.default
    return `
      background: ${colorScheme.bg};
      color: ${colorScheme.color};
      border: 1px solid ${colorScheme.border};
    `
  }}
`

const StatusBadge = styled.span<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'active':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
          border: 1px solid rgba(34, 197, 94, 0.2);
        `;
      case 'paused':
        return `
          background: rgba(251, 191, 36, 0.1);
          color: #d97706;
          border: 1px solid rgba(251, 191, 36, 0.2);
        `;
      case 'completed':
        return `
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.2);
        `;
      case 'overdue':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        `;
      default:
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        `;
    }
  }}
`

const ActionButtonsGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`

const IconButton = styled.button<{ variant?: 'edit' | 'delete' | 'toggle' | 'view' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.variant) {
      case 'edit':
        return `
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          
          &:hover {
            background: rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.3);
          }
        `;
      case 'delete':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          
          &:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.3);
          }
        `;
      case 'toggle':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          
          &:hover {
            background: rgba(34, 197, 94, 0.2);
            border-color: rgba(34, 197, 94, 0.3);
          }
        `;
      case 'view':
        return `
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          
          &:hover {
            background: rgba(107, 114, 128, 0.2);
            border-color: rgba(107, 114, 128, 0.3);
          }
        `;
      default:
        return `
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          
          &:hover {
            background: rgba(107, 114, 128, 0.2);
            border-color: rgba(107, 114, 128, 0.3);
          }
        `;
    }
  }}
`

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const SidebarCard = styled.div`
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
`

const SidebarTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--heading-primary);
  margin: 0 0 1rem 0;
`

const QuickAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  
  &:hover {
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.2);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--text-secondary);
`

const EmptyStateIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
`

const UpcomingIncome = styled.div<{ daysUntil: number }>`
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  border-left: 4px solid;
  
  ${props => {
    if (props.daysUntil <= 3) {
      return `
        background: rgba(34, 197, 94, 0.05);
        border-left-color: #22c55e;
      `;
    } else if (props.daysUntil <= 7) {
      return `
        background: rgba(59, 130, 246, 0.05);
        border-left-color: #3b82f6;
      `;
    } else {
      return `
        background: rgba(107, 114, 128, 0.05);
        border-left-color: #6b7280;
      `;
    }
  }}
`

// Types
interface RecurringIncomeDbRow {
  id: string
  source_name: string
  description?: string
  category: string
  amount: number
  currency: string
  frequency: string
  next_payment_date: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface RecurringIncome {
  id: string
  name: string
  description?: string
  category: string
  amount: number
  currency: string
  frequency: string
  interval: number
  next_date: string
  is_active: boolean
  source: string
  created_at: string
  last_generated?: string
}

interface IncomeStats {
  totalSources: number
  monthlyProjected: number
  yearlyProjected: number
  nextIncomes: number
}

export default function RecurringIncomePage() {
  const { user } = useAuth()
  const [incomes, setIncomes] = useState<RecurringIncome[]>([])
  const [stats, setStats] = useState<IncomeStats>({
    totalSources: 0,
    monthlyProjected: 0,
    yearlyProjected: 0,
    nextIncomes: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchIncomes()
      fetchStats()
    }
  }, [user])

  const fetchIncomes = async () => {
    try {
      const supabase = createSupabaseClient();
      
      if (!supabase) {
        console.error('Supabase client is null');
        return;
      }
      const { data, error } = await supabase
        .from('recurring_income')
        .select(`
          id,
          source_name,
          description,
          amount,
          currency,
          frequency,
          start_date,
          end_date,
          next_payment_date,
          category,
          status,
          is_active,
          notes,
          created_at,
          updated_at
        `)
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('next_payment_date', { ascending: true });

      if (error) {
        console.error('Error fetching recurring income:', error);
        return;
      }

      setIncomes((data || []).map((item: RecurringIncomeDbRow) => ({
        id: item.id,
        name: item.source_name,
        description: item.description,
        category: item.category,
        amount: item.amount,
        currency: item.currency,
        frequency: item.frequency,
        interval: 1, // default interval if not provided
        next_date: item.next_payment_date,
        is_active: item.is_active,
        source: item.category, // fallback mapping
        created_at: item.created_at,
        last_generated: item.updated_at
      })));
    } catch (error) {
      console.error('Error fetching recurring income:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchStats = async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Get all active recurring income for the user
      if (!supabase) return;
      const { data: allIncomes, error } = await supabase
        .from('recurring_income')
        .select('id, amount, frequency, next_payment_date, is_active')
        .eq('user_id', user!.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching income stats:', error);
        return;
      }

      const totalSources = allIncomes?.length || 0;
      
      // Calculate monthly projected income
      let monthlyProjected = 0;
      allIncomes?.forEach(income => {
        const amount = income.amount || 0;
        switch (income.frequency) {
          case 'weekly':
            monthlyProjected += amount * 4.33; // Average weeks per month
            break;
          case 'bi_weekly':
            monthlyProjected += amount * 2.17; // Average bi-weeks per month
            break;
          case 'monthly':
            monthlyProjected += amount;
            break;
          case 'quarterly':
            monthlyProjected += amount / 3;
            break;
          case 'yearly':
            monthlyProjected += amount / 12;
            break;
          default:
            monthlyProjected += amount; // Default to monthly
        }
      });

      const yearlyProjected = monthlyProjected * 12;

      // Get next 5 upcoming payments
      const now = new Date();
      const nextIncomes = allIncomes
        ?.filter(income => income.next_payment_date && new Date(income.next_payment_date) >= now)
        .sort((a, b) => new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime())
        .slice(0, 5)
        .length || 0;

      setStats({
        totalSources,
        monthlyProjected: Math.round(monthlyProjected),
        yearlyProjected: Math.round(yearlyProjected),
        nextIncomes
      });
    } catch (error) {
      console.error('Error fetching income stats:', error);
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatFrequency = (frequency: string, interval: number) => {
    const freq = interval > 1 ? `Every ${interval} ${frequency}s` : `${frequency.charAt(0).toUpperCase() + frequency.slice(1)}`
    return freq
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilNext = (dateString: string) => {
    const nextDate = new Date(dateString)
    const today = new Date()
    const diffTime = nextDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getIncomeStatus = (income: RecurringIncome) => {
    if (!income.is_active) return 'paused'
    const daysUntil = getDaysUntilNext(income.next_date)
    if (daysUntil < 0) return 'overdue'
    if (daysUntil <= 3) return 'due_soon'
    return 'active'
  }

  const toggleIncome = async (incomeId: string, currentStatus: boolean) => {
    try {
      // API call to toggle income status
      setIncomes(prev => 
        prev.map(income => 
          income.id === incomeId 
            ? { ...income, is_active: !currentStatus }
            : income
        )
      )
    } catch (error) {
      console.error('Error toggling income:', error)
    }
  }

  const deleteIncome = async (incomeId: string) => {
    if (window.confirm('Are you sure you want to delete this recurring income?')) {
      try {
        // API call to delete income
        setIncomes(prev => prev.filter(income => income.id !== incomeId))
      } catch (error) {
        console.error('Error deleting income:', error)
      }
    }
  }

  const filteredIncomes = incomes.filter(income => {
    switch (filter) {
      case 'active':
        return income.is_active
      case 'paused':
        return !income.is_active
      case 'due_soon':
        return income.is_active && getDaysUntilNext(income.next_date) <= 7 && getDaysUntilNext(income.next_date) >= 0
      case 'overdue':
        return income.is_active && getDaysUntilNext(income.next_date) < 0
      default:
        return true
    }
  })

  const upcomingIncomes = incomes
    .filter(income => income.is_active && getDaysUntilNext(income.next_date) <= 30 && getDaysUntilNext(income.next_date) >= 0)
    .sort((a, b) => getDaysUntilNext(a.next_date) - getDaysUntilNext(b.next_date))
    .slice(0, 5)

  if (loading) {
    return (
      <PageContainer>
        <div>Loading...</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer id="recurring-income-content">
      <Header>
        <Title>Recurring Income</Title>
        <ActionButtons>
          <Button variant="secondary">
            <Download size={20} />
            Export
          </Button>
          <Button variant="primary">
            <Plus size={20} />
            Add Income Source
          </Button>
        </ActionButtons>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalSources}</StatValue>
          <StatLabel>
            <Repeat size={16} />
            Income Sources
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{formatCurrency(stats.monthlyProjected)}</StatValue>
          <StatLabel>
            <DollarSign size={16} />
            Monthly Projected
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{formatCurrency(stats.yearlyProjected)}</StatValue>
          <StatLabel>
            <TrendingUp size={16} />
            Yearly Projected
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.nextIncomes}</StatValue>
          <StatLabel>
            <Calendar size={16} />
            Due This Week
          </StatLabel>
        </StatCard>
      </StatsGrid>

      <ContentGrid>
        <MainContent>
          <TableHeader>
            <TableTitle>Income Sources</TableTitle>
            <FilterButton onClick={() => {
              const filters = ['all', 'active', 'due_soon', 'overdue', 'paused']
              const currentIndex = filters.indexOf(filter)
              const nextIndex = (currentIndex + 1) % filters.length
              setFilter(filters[nextIndex])
            }}>
              <Filter size={16} />
              {filter === 'all' ? 'All' : 
               filter === 'due_soon' ? 'Due Soon' : 
               filter.charAt(0).toUpperCase() + filter.slice(1)}
            </FilterButton>
          </TableHeader>
          
          <Table>
            <TableRow isHeader>
              <div>Source & Category</div>
              <div>Amount</div>
              <div>Frequency</div>
              <div>Next Payment</div>
              <div>Status</div>
              <div>Actions</div>
            </TableRow>
            
            {filteredIncomes.length === 0 ? (
              <EmptyState>
                <EmptyStateIcon>
                  <DollarSign size={32} />
                </EmptyStateIcon>
                <h3>No income sources found</h3>
                <p>Add your first recurring income source to start tracking your regular earnings</p>
              </EmptyState>
            ) : (
              filteredIncomes.map((income) => (
                <TableRow key={income.id}>
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--heading-primary)', marginBottom: '0.25rem' }}>
                      {income.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CategoryBadge category={income.category}>
                        {income.category}
                      </CategoryBadge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {income.source}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontWeight: '500', color: '#16a34a' }}>
                    {formatCurrency(income.amount, income.currency)}
                  </div>
                  <div>
                    {formatFrequency(income.frequency, income.interval)}
                  </div>
                  <div>
                    <div>{formatDate(income.next_date)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {getDaysUntilNext(income.next_date) >= 0 
                        ? `${getDaysUntilNext(income.next_date)} days`
                        : `${Math.abs(getDaysUntilNext(income.next_date))} days overdue`
                      }
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={getIncomeStatus(income)}>
                      {getIncomeStatus(income) === 'active' && (
                        <>
                          <CheckCircle size={12} />
                          Active
                        </>
                      )}
                      {getIncomeStatus(income) === 'paused' && (
                        <>
                          <Pause size={12} />
                          Paused
                        </>
                      )}
                      {getIncomeStatus(income) === 'due_soon' && (
                        <>
                          <Clock size={12} />
                          Due Soon
                        </>
                      )}
                      {getIncomeStatus(income) === 'overdue' && (
                        <>
                          <AlertCircle size={12} />
                          Overdue
                        </>
                      )}
                    </StatusBadge>
                  </div>
                  <ActionButtonsGroup>
                    <IconButton variant="edit" title="Edit Income Source">
                      <Edit size={16} />
                    </IconButton>
                    <IconButton variant="view" title="View History">
                      <BarChart3 size={16} />
                    </IconButton>
                    <IconButton 
                      variant="toggle" 
                      title={income.is_active ? 'Pause Income' : 'Activate Income'}
                      onClick={() => toggleIncome(income.id, income.is_active)}
                    >
                      {income.is_active ? <Pause size={16} /> : <Play size={16} />}
                    </IconButton>
                    <IconButton 
                      variant="delete" 
                      title="Delete Income Source"
                      onClick={() => deleteIncome(income.id)}
                    >
                      <Trash2 size={16} />
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
            <QuickAction>
              <Plus size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>Add Income Source</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Set up a new recurring income
                </div>
              </div>
            </QuickAction>
            <QuickAction>
              <PieChart size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>Income Analytics</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  View income breakdown and trends
                </div>
              </div>
            </QuickAction>
            <QuickAction>
              <Target size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>Income Goals</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Set and track income targets
                </div>
              </div>
            </QuickAction>
            <QuickAction>
              <Settings size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>Categories</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Manage income categories
                </div>
              </div>
            </QuickAction>
          </SidebarCard>

          <SidebarCard>
            <SidebarTitle>Upcoming Payments</SidebarTitle>
            {upcomingIncomes.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                No payments expected in the next 30 days
              </div>
            ) : (
              upcomingIncomes.map((income) => {
                const daysUntil = getDaysUntilNext(income.next_date)
                return (
                  <UpcomingIncome key={income.id} daysUntil={daysUntil}>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {income.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {formatCurrency(income.amount)} • {daysUntil} days
                    </div>
                  </UpcomingIncome>
                )
              })
            )}
          </SidebarCard>
        </Sidebar>
      </ContentGrid>
    </PageContainer>
  )
}