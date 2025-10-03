'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
import styled from 'styled-components'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Download,
  Filter,
  ExternalLink,
  Bell,
  Settings
} from 'lucide-react'

// Styled Components (reusing similar styles from recurring invoices)
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
      'Software & Tools': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)' },
      'Entertainment': { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.2)' },
      'Utilities': { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)' },
      'Insurance': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
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
      case 'cancelled':
        return `
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.2);
        `;
      case 'due_soon':
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

const IconButton = styled.button<{ variant?: 'edit' | 'delete' | 'toggle' | 'external' }>`
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
      case 'external':
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

const UpcomingRenewal = styled.div<{ daysUntil: number }>`
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  border-left: 4px solid;
  
  ${props => {
    if (props.daysUntil <= 3) {
      return `
        background: rgba(239, 68, 68, 0.05);
        border-left-color: #ef4444;
      `;
    } else if (props.daysUntil <= 7) {
      return `
        background: rgba(251, 191, 36, 0.05);
        border-left-color: #f59e0b;
      `;
    } else {
      return `
        background: rgba(34, 197, 94, 0.05);
        border-left-color: #22c55e;
      `;
    }
  }}
`

// Types
interface SubscriptionDbRow {
  id: string
  service_name: string
  description?: string
  category: string
  amount: number
  currency?: string
  billing_cycle: string
  next_billing_date: string
  is_active: boolean
  payment_method?: string
  created_at: string
}

interface Subscription {
  id: string
  name: string
  description?: string
  category: string
  amount: number
  currency: string
  billing_frequency: string
  billing_interval: number
  next_billing_date: string
  is_active: boolean
  vendor: string
  website_url?: string
  created_at: string
}

interface SubscriptionStats {
  totalSubscriptions: number
  monthlyTotal: number
  yearlyTotal: number
  upcomingRenewals: number
}

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats>({
    totalSubscriptions: 0,
    monthlyTotal: 0,
    yearlyTotal: 0,
    upcomingRenewals: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchSubscriptions()
      fetchStats()
    }
  }, [user])

  const fetchSubscriptions = async () => {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('subscriptions')
        .select(`
          id,
          service_name,
          description,
          amount,
          currency,
          billing_cycle,
          start_date,
          next_billing_date,
          end_date,
          category,
          status,
          is_active,
          auto_renewal,
          payment_method,
          notes,
          created_at,
          updated_at
        `)
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('next_billing_date', { ascending: true });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return;
      }

      setSubscriptions(
        (data || []).map((item: SubscriptionDbRow) => ({
          id: item.id,
          name: item.service_name,
          description: item.description,
          category: item.category,
          amount: item.amount,
          currency: item.currency || 'USD',
          billing_frequency: item.billing_cycle,
          billing_interval: 1, // default to 1 if not provided
          next_billing_date: item.next_billing_date,
          is_active: item.is_active,
          vendor: item.payment_method || 'Unknown',
          website_url: undefined,
          created_at: item.created_at
        }))
      );
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchStats = async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Get all active subscriptions for the user
      const { data: allSubscriptions, error } = await (supabase as NonNullable<typeof supabase>)
        .from('subscriptions')
        .select('id, amount, billing_cycle, next_billing_date, is_active')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching subscription stats:', error);
        return;
      }

      const totalSubscriptions = allSubscriptions?.length || 0;
      
      // Calculate monthly total
      let monthlyTotal = 0;
      allSubscriptions?.forEach(sub => {
        const amount = sub.amount || 0;
        switch (sub.billing_cycle) {
          case 'weekly':
            monthlyTotal += amount * 4.33; // Average weeks per month
            break;
          case 'monthly':
            monthlyTotal += amount;
            break;
          case 'quarterly':
            monthlyTotal += amount / 3;
            break;
          case 'yearly':
            monthlyTotal += amount / 12;
            break;
          default:
            monthlyTotal += amount; // Default to monthly
        }
      });

      const yearlyTotal = monthlyTotal * 12;

      // Get upcoming renewals (next 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const upcomingRenewals = allSubscriptions
        ?.filter(sub => 
          sub.next_billing_date && 
          new Date(sub.next_billing_date) >= now && 
          new Date(sub.next_billing_date) <= thirtyDaysFromNow
        )
        .length || 0;

      setStats({
        totalSubscriptions,
        monthlyTotal: Math.round(monthlyTotal),
        yearlyTotal: Math.round(yearlyTotal),
        upcomingRenewals
      });
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
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

  const getDaysUntilRenewal = (dateString: string) => {
    const renewalDate = new Date(dateString)
    const today = new Date()
    const diffTime = renewalDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getSubscriptionStatus = (subscription: Subscription) => {
    if (!subscription.is_active) return 'paused'
    const daysUntil = getDaysUntilRenewal(subscription.next_billing_date)
    if (daysUntil <= 3) return 'due_soon'
    return 'active'
  }

  const toggleSubscription = async (subscriptionId: string, currentStatus: boolean) => {
    try {
      // API call to toggle subscription status
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, is_active: !currentStatus }
            : sub
        )
      )
    } catch (error) {
      console.error('Error toggling subscription:', error)
    }
  }

  const deleteSubscription = async (subscriptionId: string) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        // API call to delete subscription
        setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId))
      } catch (error) {
        console.error('Error deleting subscription:', error)
      }
    }
  }

  const filteredSubscriptions = subscriptions.filter(subscription => {
    switch (filter) {
      case 'active':
        return subscription.is_active
      case 'paused':
        return !subscription.is_active
      case 'due_soon':
        return subscription.is_active && getDaysUntilRenewal(subscription.next_billing_date) <= 7
      default:
        return true
    }
  })

  const upcomingRenewals = subscriptions
    .filter(sub => sub.is_active && getDaysUntilRenewal(sub.next_billing_date) <= 30)
    .sort((a, b) => getDaysUntilRenewal(a.next_billing_date) - getDaysUntilRenewal(b.next_billing_date))
    .slice(0, 5)

  if (loading) {
    return (
      <PageContainer>
        <div>Loading...</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer id="subscriptions-content">
      <Header>
        <Title>Subscription Management</Title>
        <ActionButtons>
          <Button variant="secondary">
            <Download size={20} />
            Export
          </Button>
          <Button variant="primary">
            <Plus size={20} />
            Add Subscription
          </Button>
        </ActionButtons>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalSubscriptions}</StatValue>
          <StatLabel>
            <CreditCard size={16} />
            Active Subscriptions
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{formatCurrency(stats.monthlyTotal)}</StatValue>
          <StatLabel>
            <DollarSign size={16} />
            Monthly Total
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{formatCurrency(stats.yearlyTotal)}</StatValue>
          <StatLabel>
            <TrendingUp size={16} />
            Yearly Projection
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.upcomingRenewals}</StatValue>
          <StatLabel>
            <AlertTriangle size={16} />
            Renewals This Week
          </StatLabel>
        </StatCard>
      </StatsGrid>

      <ContentGrid>
        <MainContent>
          <TableHeader>
            <TableTitle>Your Subscriptions</TableTitle>
            <FilterButton onClick={() => {
              const filters = ['all', 'active', 'due_soon', 'paused']
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
              <div>Service & Category</div>
              <div>Amount</div>
              <div>Frequency</div>
              <div>Next Billing</div>
              <div>Status</div>
              <div>Actions</div>
            </TableRow>
            
            {filteredSubscriptions.length === 0 ? (
              <EmptyState>
                <EmptyStateIcon>
                  <CreditCard size={32} />
                </EmptyStateIcon>
                <h3>No subscriptions found</h3>
                <p>Add your first subscription to start tracking your recurring expenses</p>
              </EmptyState>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--heading-primary)', marginBottom: '0.25rem' }}>
                      {subscription.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CategoryBadge category={subscription.category}>
                        {subscription.category}
                      </CategoryBadge>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {subscription.vendor}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontWeight: '500' }}>
                    {formatCurrency(subscription.amount, subscription.currency)}
                  </div>
                  <div>
                    {formatFrequency(subscription.billing_frequency, subscription.billing_interval)}
                  </div>
                  <div>
                    <div>{formatDate(subscription.next_billing_date)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {getDaysUntilRenewal(subscription.next_billing_date)} days
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={getSubscriptionStatus(subscription)}>
                      {getSubscriptionStatus(subscription) === 'active' && (
                        <>
                          <Play size={12} />
                          Active
                        </>
                      )}
                      {getSubscriptionStatus(subscription) === 'paused' && (
                        <>
                          <Pause size={12} />
                          Paused
                        </>
                      )}
                      {getSubscriptionStatus(subscription) === 'due_soon' && (
                        <>
                          <AlertTriangle size={12} />
                          Due Soon
                        </>
                      )}
                    </StatusBadge>
                  </div>
                  <ActionButtonsGroup>
                    <IconButton variant="edit" title="Edit Subscription">
                      <Edit size={16} />
                    </IconButton>
                    {subscription.website_url && (
                      <IconButton 
                        variant="external" 
                        title="Visit Website"
                        onClick={() => window.open(subscription.website_url, '_blank')}
                      >
                        <ExternalLink size={16} />
                      </IconButton>
                    )}
                    <IconButton 
                      variant="toggle" 
                      title={subscription.is_active ? 'Pause Subscription' : 'Activate Subscription'}
                      onClick={() => toggleSubscription(subscription.id, subscription.is_active)}
                    >
                      {subscription.is_active ? <Pause size={16} /> : <Play size={16} />}
                    </IconButton>
                    <IconButton 
                      variant="delete" 
                      title="Delete Subscription"
                      onClick={() => deleteSubscription(subscription.id)}
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
                <div style={{ fontWeight: '500' }}>Add Subscription</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Track a new recurring expense
                </div>
              </div>
            </QuickAction>
            <QuickAction>
              <Bell size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>Notification Settings</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Configure renewal reminders
                </div>
              </div>
            </QuickAction>
            <QuickAction>
              <Settings size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>Categories</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Manage subscription categories
                </div>
              </div>
            </QuickAction>
          </SidebarCard>

          <SidebarCard>
            <SidebarTitle>Upcoming Renewals</SidebarTitle>
            {upcomingRenewals.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                No renewals in the next 30 days
              </div>
            ) : (
              upcomingRenewals.map((subscription) => {
                const daysUntil = getDaysUntilRenewal(subscription.next_billing_date)
                return (
                  <UpcomingRenewal key={subscription.id} daysUntil={daysUntil}>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {subscription.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {formatCurrency(subscription.amount)} • {daysUntil} days
                    </div>
                  </UpcomingRenewal>
                )
              })
            )}
          </SidebarCard>
        </Sidebar>
      </ContentGrid>
    </PageContainer>
  )
}