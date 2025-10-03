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
  Bell, 
  BellOff, 
  Mail,
  MessageSquare,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Download,
  Filter,
  Eye,
  Send,
  Users,
  Target,
  Zap
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

const TableRow = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isHeader'
})<{ isHeader?: boolean }>`
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

const PriorityBadge = styled.span<{ priority: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.priority) {
      case 'high':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        `;
      case 'medium':
        return `
          background: rgba(251, 191, 36, 0.1);
          color: #d97706;
          border: 1px solid rgba(251, 191, 36, 0.2);
        `;
      case 'low':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
          border: 1px solid rgba(34, 197, 94, 0.2);
        `;
      default:
        return `
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.2);
        `;
    }
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
      case 'sent':
        return `
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
        `;
      case 'paused':
        return `
          background: rgba(251, 191, 36, 0.1);
          color: #d97706;
          border: 1px solid rgba(251, 191, 36, 0.2);
        `;
      case 'overdue':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.2);
        `;
      default:
        return `
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.2);
        `;
    }
  }}
`

const ActionButtonsGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`

const IconButton = styled.button<{ variant?: 'edit' | 'delete' | 'toggle' | 'send' | 'view' }>`
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
      case 'send':
        return `
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          
          &:hover {
            background: rgba(139, 92, 246, 0.2);
            border-color: rgba(139, 92, 246, 0.3);
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

const NotificationMethod = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
`

const UpcomingReminder = styled.div<{ priority: string }>`
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  border-left: 4px solid;
  
  ${props => {
    switch (props.priority) {
      case 'high':
        return `
          background: rgba(239, 68, 68, 0.05);
          border-left-color: #ef4444;
        `;
      case 'medium':
        return `
          background: rgba(251, 191, 36, 0.05);
          border-left-color: #f59e0b;
        `;
      case 'low':
        return `
          background: rgba(34, 197, 94, 0.05);
          border-left-color: #22c55e;
        `;
      default:
        return `
          background: rgba(107, 114, 128, 0.05);
          border-left-color: #6b7280;
        `;
    }
  }}
`

// Types
interface PaymentReminder {
  id: string
  title: string
  description?: string
  due_date: string
  amount?: number
  currency: string
  priority: 'high' | 'medium' | 'low'
  notification_methods: string[]
  days_before: number[]
  is_active: boolean
  recipient_email?: string
  recipient_phone?: string
  status: 'active' | 'sent' | 'paused' | 'overdue'
  created_at: string
  last_sent?: string
}

interface ReminderStats {
  totalReminders: number
  activeReminders: number
  sentThisWeek: number
  overdueReminders: number
}

export default function PaymentRemindersPage() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<PaymentReminder[]>([])
  const [stats, setStats] = useState<ReminderStats>({
    totalReminders: 0,
    activeReminders: 0,
    sentThisWeek: 0,
    overdueReminders: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchReminders()
      fetchStats()
    }
  }, [user])

  const fetchReminders = async () => {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('payment_reminders')
        .select(`
          id,
          title,
          description,
          amount,
          currency,
          due_date,
          reminder_type,
          priority,
          status,
          is_recurring,
          recurring_frequency,
          next_reminder_date,
          notes,
          created_at,
          updated_at
        `)
        .eq('user_id', user?.id ?? '')
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching reminders:', error);
        return;
      }

      const mappedData = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        due_date: item.due_date,
        amount: item.amount,
        currency: item.currency,
        priority: item.priority,
        notification_methods: [], // default empty
        days_before: [],          // default empty
        is_active: item.status === 'pending',
        recipient_email: undefined,
        recipient_phone: undefined,
        status: item.status,
        created_at: item.created_at,
        last_sent: undefined
      }));
      setReminders(mappedData);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchStats = async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Get all reminders for the user
      const { data: allReminders, error } = await supabase
        .from('payment_reminders')
        .select('id, status, due_date, created_at')
        .eq('user_id', user?.id ?? '');

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const totalReminders = allReminders?.length || 0;
      const activeReminders = allReminders?.filter(r => r.status === 'pending').length || 0;
      const sentThisWeek = allReminders?.filter(r => 
        new Date(r.created_at) >= oneWeekAgo && new Date(r.created_at) <= now
      ).length || 0;
      const overdueReminders = allReminders?.filter(r => 
        r.status === 'pending' && new Date(r.due_date) < now
      ).length || 0;

      setStats({
        totalReminders,
        activeReminders,
        sentThisWeek,
        overdueReminders
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysUntilDue = (dateString: string) => {
    const dueDate = new Date(dateString)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getNotificationMethodIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail size={12} />
      case 'sms':
        return <MessageSquare size={12} />
      case 'push':
        return <Smartphone size={12} />
      default:
        return <Bell size={12} />
    }
  }

  const toggleReminder = async (reminderId: string, currentStatus: boolean) => {
    try {
      // API call to toggle reminder status
      setReminders(prev => 
        prev.map(reminder => 
          reminder.id === reminderId 
            ? { ...reminder, is_active: !currentStatus }
            : reminder
        )
      )
    } catch (error) {
      console.error('Error toggling reminder:', error)
    }
  }

  const sendReminder = async (reminderId: string) => {
    try {
      // API call to send reminder immediately
      setReminders(prev => 
        prev.map(reminder => 
          reminder.id === reminderId 
            ? { ...reminder, status: 'sent', last_sent: new Date().toISOString() }
            : reminder
        )
      )
    } catch (error) {
      console.error('Error sending reminder:', error)
    }
  }

  const deleteReminder = async (reminderId: string) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        // API call to delete reminder
        setReminders(prev => prev.filter(reminder => reminder.id !== reminderId))
      } catch (error) {
        console.error('Error deleting reminder:', error)
      }
    }
  }

  const filteredReminders = reminders.filter(reminder => {
    switch (filter) {
      case 'active':
        return reminder.is_active && reminder.status === 'active'
      case 'sent':
        return reminder.status === 'sent'
      case 'overdue':
        return reminder.status === 'overdue'
      case 'paused':
        return !reminder.is_active
      default:
        return true
    }
  })

  const upcomingReminders = reminders
    .filter(reminder => reminder.is_active && getDaysUntilDue(reminder.due_date) <= 14 && getDaysUntilDue(reminder.due_date) >= 0)
    .sort((a, b) => getDaysUntilDue(a.due_date) - getDaysUntilDue(b.due_date))
    .slice(0, 5)

  if (loading) {
    return (
      <PageContainer>
        <div>Loading...</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer id="payment-reminders-content">
      <Header>
        <Title>Payment Reminders</Title>
        <ActionButtons>
          <Button variant="secondary">
            <Download size={20} />
            Export
          </Button>
          <Button variant="primary">
            <Plus size={20} />
            Add Reminder
          </Button>
        </ActionButtons>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalReminders}</StatValue>
          <StatLabel>
            <Bell size={16} />
            Total Reminders
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.activeReminders}</StatValue>
          <StatLabel>
            <CheckCircle size={16} />
            Active Reminders
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.sentThisWeek}</StatValue>
          <StatLabel>
            <Send size={16} />
            Sent This Week
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.overdueReminders}</StatValue>
          <StatLabel>
            <AlertTriangle size={16} />
            Overdue Reminders
          </StatLabel>
        </StatCard>
      </StatsGrid>

      <ContentGrid>
        <MainContent>
          <TableHeader>
            <TableTitle>Payment Reminders</TableTitle>
            <FilterButton onClick={() => {
              const filters = ['all', 'active', 'sent', 'overdue', 'paused']
              const currentIndex = filters.indexOf(filter)
              const nextIndex = (currentIndex + 1) % filters.length
              setFilter(filters[nextIndex])
            }}>
              <Filter size={16} />
              {filter === 'all' ? 'All' : 
               filter.charAt(0).toUpperCase() + filter.slice(1)}
            </FilterButton>
          </TableHeader>
          
          <Table>
            <TableRow isHeader>
              <div>Reminder & Priority</div>
              <div>Due Date</div>
              <div>Amount</div>
              <div>Methods</div>
              <div>Status</div>
              <div>Actions</div>
            </TableRow>
            
            {filteredReminders.length === 0 ? (
              <EmptyState>
                <EmptyStateIcon>
                  <Bell size={32} />
                </EmptyStateIcon>
                <h3>No reminders found</h3>
                <p>Create your first payment reminder to stay on top of due dates</p>
              </EmptyState>
            ) : (
              filteredReminders.map((reminder) => (
                <TableRow key={reminder.id}>
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--heading-primary)', marginBottom: '0.25rem' }}>
                      {reminder.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <PriorityBadge priority={reminder.priority}>
                        {reminder.priority === 'high' && <AlertTriangle size={12} />}
                        {reminder.priority === 'medium' && <Clock size={12} />}
                        {reminder.priority === 'low' && <CheckCircle size={12} />}
                        {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                      </PriorityBadge>
                    </div>
                  </div>
                  <div>
                    <div>{formatDate(reminder.due_date)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {getDaysUntilDue(reminder.due_date) >= 0 
                        ? `${getDaysUntilDue(reminder.due_date)} days`
                        : `${Math.abs(getDaysUntilDue(reminder.due_date))} days overdue`
                      }
                    </div>
                  </div>
                  <div style={{ fontWeight: '500' }}>
                    {reminder.amount ? formatCurrency(reminder.amount, reminder.currency) : '-'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {reminder.notification_methods.map((method, index) => (
                        <NotificationMethod key={index}>
                          {getNotificationMethodIcon(method)}
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </NotificationMethod>
                      ))}
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={reminder.status}>
                      {reminder.status === 'active' && (
                        <>
                          <CheckCircle size={12} />
                          Active
                        </>
                      )}
                      {reminder.status === 'sent' && (
                        <>
                          <Send size={12} />
                          Sent
                        </>
                      )}
                      {reminder.status === 'paused' && (
                        <>
                          <BellOff size={12} />
                          Paused
                        </>
                      )}
                      {reminder.status === 'overdue' && (
                        <>
                          <XCircle size={12} />
                          Overdue
                        </>
                      )}
                    </StatusBadge>
                  </div>
                  <ActionButtonsGroup>
                    <IconButton variant="edit" title="Edit Reminder">
                      <Edit size={16} />
                    </IconButton>
                    <IconButton variant="view" title="View History">
                      <Eye size={16} />
                    </IconButton>
                    <IconButton 
                      variant="send" 
                      title="Send Now"
                      onClick={() => sendReminder(reminder.id)}
                    >
                      <Send size={16} />
                    </IconButton>
                    <IconButton 
                      variant="toggle" 
                      title={reminder.is_active ? 'Pause Reminder' : 'Activate Reminder'}
                      onClick={() => toggleReminder(reminder.id, reminder.is_active)}
                    >
                      {reminder.is_active ? <BellOff size={16} /> : <Bell size={16} />}
                    </IconButton>
                    <IconButton 
                      variant="delete" 
                      title="Delete Reminder"
                      onClick={() => deleteReminder(reminder.id)}
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
                <div style={{ fontWeight: '500' }}>Add Reminder</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Create a new payment reminder
                </div>
              </div>
            </QuickAction>
            <QuickAction>
              <Settings size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>Notification Settings</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Configure default preferences
                </div>
              </div>
            </QuickAction>
            <QuickAction>
              <Users size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>Contact Management</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Manage recipient contacts
                </div>
              </div>
            </QuickAction>
            <QuickAction>
              <Zap size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>Automation Rules</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Set up automatic reminders
                </div>
              </div>
            </QuickAction>
          </SidebarCard>

          <SidebarCard>
            <SidebarTitle>Upcoming Reminders</SidebarTitle>
            {upcomingReminders.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                No reminders due in the next 14 days
              </div>
            ) : (
              upcomingReminders.map((reminder) => {
                const daysUntil = getDaysUntilDue(reminder.due_date)
                return (
                  <UpcomingReminder key={reminder.id} priority={reminder.priority}>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {reminder.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {reminder.amount ? formatCurrency(reminder.amount) : 'No amount'} • {daysUntil} days
                    </div>
                  </UpcomingReminder>
                )
              })
            )}
          </SidebarCard>
        </Sidebar>
      </ContentGrid>
    </PageContainer>
  )
}