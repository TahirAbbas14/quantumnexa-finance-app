'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
import { formatPKR } from '@/lib/currency'
import DashboardLayout from '@/components/layout/DashboardLayout'
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
          background: var(--primary-600);
          color: white;
          
          &:hover {
            background: var(--primary-700);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
          }
        `;
      case 'danger':
        return `
          background: var(--error-600);
          color: white;
          
          &:hover {
            background: var(--error-700);
            transform: translateY(-2px);
          }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
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
      case 'cancelled':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.3);
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
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
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

interface Subscription {
  id: string
  service_name: string
  cost: number
  billing_cycle: string
  next_billing_date: string
  status: string
  category: string
  description?: string
  auto_renew: boolean
  created_at: string
}

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    monthlyTotal: 0,
    yearlyTotal: 0,
    activeSubscriptions: 0
  })

  useEffect(() => {
    if (user) {
      fetchSubscriptions()
    }
  }, [user])

  const fetchSubscriptions = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase!
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSubscriptions(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (subs: Subscription[]) => {
    const activeSubs = subs.filter(sub => sub.status === 'active')
    const monthlyTotal = activeSubs
      .filter(sub => sub.billing_cycle === 'monthly')
      .reduce((sum, sub) => sum + sub.cost, 0)
    const yearlyTotal = activeSubs
      .filter(sub => sub.billing_cycle === 'yearly')
      .reduce((sum, sub) => sum + sub.cost, 0)

    setStats({
      totalSubscriptions: subs.length,
      monthlyTotal,
      yearlyTotal,
      activeSubscriptions: activeSubs.length
    })
  }

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return

    try {
      const supabase = createSupabaseClient()
      if (!supabase) throw new Error('Supabase client is null')
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)

      if (error) throw error

      fetchSubscriptions()
    } catch (error) {
      console.error('Error deleting subscription:', error)
    }
  }

  const toggleSubscriptionStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
    try {
      const supabase = createSupabaseClient()
      if (!supabase) throw new Error('Supabase client is null')
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      fetchSubscriptions()
    } catch (error) {
      console.error('Error updating subscription status:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            Loading subscriptions...
          </div>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <div>
            <h1>Subscriptions</h1>
            <p>Manage your recurring subscriptions and track expenses</p>
          </div>
          <HeaderActions>
            <Button variant="secondary">
              <Download size={16} />
              Export
            </Button>
            <Button variant="primary">
              <Plus size={16} />
              Add Subscription
            </Button>
          </HeaderActions>
        </Header>

        <StatsGrid>
          <StatCard color="var(--primary-500)">
            <StatHeader>
              <StatIcon color="var(--primary-500)">
                <CreditCard />
              </StatIcon>
            </StatHeader>
            <StatValue>{stats.totalSubscriptions}</StatValue>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Total Subscriptions
            </div>
          </StatCard>

          <StatCard color="var(--success-500)">
            <StatHeader>
              <StatIcon color="var(--success-500)">
                <DollarSign />
              </StatIcon>
            </StatHeader>
            <StatValue>{formatPKR(stats.monthlyTotal)}</StatValue>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Monthly Total
            </div>
          </StatCard>

          <StatCard color="var(--warning-500)">
            <StatHeader>
              <StatIcon color="var(--warning-500)">
                <TrendingUp />
              </StatIcon>
            </StatHeader>
            <StatValue>{formatPKR(stats.yearlyTotal)}</StatValue>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Yearly Total
            </div>
          </StatCard>

          <StatCard color="var(--info-500)">
            <StatHeader>
              <StatIcon color="var(--info-500)">
                <Play />
              </StatIcon>
            </StatHeader>
            <StatValue>{stats.activeSubscriptions}</StatValue>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              Active Subscriptions
            </div>
          </StatCard>
        </StatsGrid>

        <ContentGrid>
          <MainContent>
            <TableHeader>
              <TableTitle>All Subscriptions</TableTitle>
              <FilterButton>
                <Filter size={16} />
                Filter
              </FilterButton>
            </TableHeader>

            <Table>
              <TableRow isHeader>
                <div>Service</div>
                <div>Cost</div>
                <div>Billing</div>
                <div>Next Bill</div>
                <div>Status</div>
                <div>Actions</div>
              </TableRow>

              {subscriptions.length === 0 ? (
                <EmptyState>
                  <EmptyStateIcon>
                    <CreditCard />
                  </EmptyStateIcon>
                  <h3 style={{ margin: '0 0 8px 0', color: 'rgba(255, 255, 255, 0.8)' }}>
                    No subscriptions found
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Add your first subscription to start tracking expenses
                  </p>
                </EmptyState>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <div>
                      <div style={{ fontWeight: '500', color: 'white', marginBottom: '4px' }}>
                        {subscription.service_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {subscription.category}
                      </div>
                    </div>
                    <div style={{ fontWeight: '500', color: 'white' }}>
                      {formatPKR(subscription.cost)}
                    </div>
                    <div style={{ textTransform: 'capitalize' }}>
                      {subscription.billing_cycle}
                    </div>
                    <div>
                      {new Date(subscription.next_billing_date).toLocaleDateString()}
                    </div>
                    <div>
                      <StatusBadge status={subscription.status}>
                        {subscription.status}
                      </StatusBadge>
                    </div>
                    <ActionButtonsGroup>
                      <IconButton
                        variant="action"
                        onClick={() => toggleSubscriptionStatus(subscription.id, subscription.status)}
                        title={subscription.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {subscription.status === 'active' ? <Pause /> : <Play />}
                      </IconButton>
                      <IconButton variant="edit" title="Edit">
                        <Edit />
                      </IconButton>
                      <IconButton
                        variant="delete"
                        onClick={() => handleDeleteSubscription(subscription.id)}
                        title="Delete"
                      >
                        <Trash2 />
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
                <Plus />
                Add New Subscription
              </QuickAction>
              <QuickAction>
                <Bell />
                Set Billing Reminders
              </QuickAction>
              <QuickAction>
                <Settings />
                Manage Categories
              </QuickAction>
              <QuickAction>
                <ExternalLink />
                Export Data
              </QuickAction>
            </SidebarCard>

            <SidebarCard>
              <SidebarTitle>Upcoming Bills</SidebarTitle>
              {subscriptions
                .filter(sub => sub.status === 'active')
                .sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime())
                .slice(0, 3)
                .map(sub => (
                  <div key={sub.id} style={{ 
                    padding: '12px 0', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                        {sub.service_name}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                        {new Date(sub.next_billing_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ color: 'white', fontWeight: '600' }}>
                      {formatPKR(sub.cost)}
                    </div>
                  </div>
                ))}
              {subscriptions.filter(sub => sub.status === 'active').length === 0 && (
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '14px', 
                  textAlign: 'center',
                  padding: '20px 0'
                }}>
                  No upcoming bills
                </div>
              )}
            </SidebarCard>
          </Sidebar>
        </ContentGrid>
      </Container>
    </DashboardLayout>
  )
}
