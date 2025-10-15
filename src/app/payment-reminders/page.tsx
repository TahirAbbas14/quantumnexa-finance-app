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

// Styled Components matching dashboard design
const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
    
    @media (max-width: 768px) {
      font-size: 1.75rem;
    }
  }
  
  p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0.5rem 0 0 0;
    font-size: 1rem;
  }
`

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  
  @media (max-width: 768px) {
    justify-content: stretch;
    
    > * {
      flex: 1;
    }
  }
`

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: rgba(99, 102, 241, 0.8);
          color: white;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.3);
          
          &:hover {
            background: rgba(99, 102, 241, 0.9);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
          }
        `;
      case 'danger':
        return `
          background: rgba(239, 68, 68, 0.8);
          color: white;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(239, 68, 68, 0.3);
          
          &:hover {
            background: rgba(239, 68, 68, 0.9);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
          }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          
          &:hover {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.95);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          }
        `;
    }
  }}
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

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
`

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`

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
`

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
`

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  font-weight: 500;
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`

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
`

const TableTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0;
`

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
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
  transition: all 0.2s ease;

  ${props => props.isHeader && `
    background: rgba(255, 255, 255, 0.02);
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
  `}

  &:last-child {
    border-bottom: none;
  }

  &:hover:not(:first-child) {
    background: rgba(255, 255, 255, 0.02);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1rem;
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
          color: rgba(239, 68, 68, 0.9);
          border: 1px solid rgba(239, 68, 68, 0.2);
        `;
      case 'medium':
        return `
          background: rgba(245, 158, 11, 0.1);
          color: rgba(245, 158, 11, 0.9);
          border: 1px solid rgba(245, 158, 11, 0.2);
        `;
      case 'low':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: rgba(34, 197, 94, 0.9);
          border: 1px solid rgba(34, 197, 94, 0.2);
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.1);
          color: rgba(156, 163, 175, 0.9);
          border: 1px solid rgba(156, 163, 175, 0.2);
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
          color: rgba(34, 197, 94, 0.9);
          border: 1px solid rgba(34, 197, 94, 0.2);
        `;
      case 'sent':
        return `
          background: rgba(99, 102, 241, 0.1);
          color: rgba(99, 102, 241, 0.9);
          border: 1px solid rgba(99, 102, 241, 0.2);
        `;
      case 'paused':
        return `
          background: rgba(156, 163, 175, 0.1);
          color: rgba(156, 163, 175, 0.9);
          border: 1px solid rgba(156, 163, 175, 0.2);
        `;
      case 'overdue':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: rgba(239, 68, 68, 0.9);
          border: 1px solid rgba(239, 68, 68, 0.2);
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.1);
          color: rgba(156, 163, 175, 0.9);
          border: 1px solid rgba(156, 163, 175, 0.2);
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
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.variant) {
      case 'edit':
        return `
          background: rgba(99, 102, 241, 0.1);
          color: rgba(99, 102, 241, 0.8);
          
          &:hover {
            background: rgba(99, 102, 241, 0.2);
            color: rgba(99, 102, 241, 1);
          }
        `;
      case 'delete':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: rgba(239, 68, 68, 0.8);
          
          &:hover {
            background: rgba(239, 68, 68, 0.2);
            color: rgba(239, 68, 68, 1);
          }
        `;
      case 'toggle':
        return `
          background: rgba(245, 158, 11, 0.1);
          color: rgba(245, 158, 11, 0.8);
          
          &:hover {
            background: rgba(245, 158, 11, 0.2);
            color: rgba(245, 158, 11, 1);
          }
        `;
      case 'send':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: rgba(34, 197, 94, 0.8);
          
          &:hover {
            background: rgba(34, 197, 94, 0.2);
            color: rgba(34, 197, 94, 1);
          }
        `;
      case 'view':
        return `
          background: rgba(156, 163, 175, 0.1);
          color: rgba(156, 163, 175, 0.8);
          
          &:hover {
            background: rgba(156, 163, 175, 0.2);
            color: rgba(156, 163, 175, 1);
          }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          
          &:hover {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
          }
        `;
    }
  }}
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1.5rem;
  color: rgba(255, 255, 255, 0.6);
`

const EmptyStateIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(99, 102, 241, 0.8);
`

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const SidebarCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`

const SidebarTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 16px 0;
`

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
`

const NotificationMethod = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
`

const UpcomingReminder = styled.div<{ priority: string }>`
  padding: 0.75rem;
  border-radius: 12px;
  margin-bottom: 0.75rem;
  border-left: 4px solid;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
  
  ${props => {
    switch (props.priority) {
      case 'high':
        return `
          border-left-color: rgba(239, 68, 68, 0.8);
          background: rgba(239, 68, 68, 0.05);
        `;
      case 'medium':
        return `
          border-left-color: rgba(245, 158, 11, 0.8);
          background: rgba(245, 158, 11, 0.05);
        `;
      case 'low':
        return `
          border-left-color: rgba(34, 197, 94, 0.8);
          background: rgba(34, 197, 94, 0.05);
        `;
      default:
        return `
          border-left-color: rgba(156, 163, 175, 0.8);
          background: rgba(156, 163, 175, 0.05);
        `;
    }
  }}
`

// Interfaces
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
      
      if (!supabase) {
        console.error('Supabase client is null');
        return;
      }
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
      const { data: allReminders, error } = await supabase!
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
      <DashboardLayout>
        <Container>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading...</div>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <div>
            <h1>Payment Reminders</h1>
            <p>Manage and track your payment reminders</p>
          </div>
          <HeaderActions>
            <Button variant="secondary">
              <Download size={20} />
              Export
            </Button>
            <Button variant="primary">
              <Plus size={20} />
              Add Reminder
            </Button>
          </HeaderActions>
        </Header>

        <StatsGrid>
          <StatCard color="var(--info-500)">
            <StatHeader>
              <div>
                <StatValue>{stats.totalReminders}</StatValue>
                <StatLabel>Total Reminders</StatLabel>
              </div>
              <StatIcon color="var(--info-500)">
                <Bell size={24} />
              </StatIcon>
            </StatHeader>
          </StatCard>
          <StatCard color="var(--success-500)">
            <StatHeader>
              <div>
                <StatValue>{stats.activeReminders}</StatValue>
                <StatLabel>Active Reminders</StatLabel>
              </div>
              <StatIcon color="var(--success-500)">
                <CheckCircle size={24} />
              </StatIcon>
            </StatHeader>
          </StatCard>
          <StatCard color="var(--warning-500)">
            <StatHeader>
              <div>
                <StatValue>{stats.sentThisWeek}</StatValue>
                <StatLabel>Sent This Week</StatLabel>
              </div>
              <StatIcon color="var(--warning-500)">
                <Send size={24} />
              </StatIcon>
            </StatHeader>
          </StatCard>
          <StatCard color="var(--error-500)">
            <StatHeader>
              <div>
                <StatValue>{stats.overdueReminders}</StatValue>
                <StatLabel>Overdue Reminders</StatLabel>
              </div>
              <StatIcon color="var(--error-500)">
                <AlertTriangle size={24} />
              </StatIcon>
            </StatHeader>
          </StatCard>
        </StatsGrid>

        <ContentGrid>
          <MainContent>
            <TableHeader>
              <TableTitle>Payment Reminders</TableTitle>
              <FilterButton onClick={() => setFilter(filter === 'all' ? 'active' : 'all')}>
                <Filter size={16} />
                {filter === 'all' ? 'All' : 'Active'}
              </FilterButton>
            </TableHeader>
            
            <Table>
              <TableRow isHeader>
                <div>Reminder</div>
                <div>Due Date</div>
                <div>Amount</div>
                <div>Priority</div>
                <div>Status</div>
                <div>Actions</div>
              </TableRow>
              
              {filteredReminders.length === 0 ? (
                <EmptyState>
                  <EmptyStateIcon>
                    <Bell size={32} />
                  </EmptyStateIcon>
                  <h3 style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>No reminders found</h3>
                  <p style={{ marginBottom: '1.5rem' }}>Create your first payment reminder to get started.</p>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button variant="primary">
                      <Plus size={20} />
                      Add Reminder
                    </Button>
                  </div>
                </EmptyState>
              ) : (
                filteredReminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <div>
                      <div style={{ fontWeight: '500', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0.25rem' }}>
                        {reminder.title}
                      </div>
                      {reminder.description && (
                        <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          {reminder.description}
                        </div>
                      )}
                      {reminder.notification_methods.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {reminder.notification_methods.map((method, index) => (
                            <NotificationMethod key={index}>
                              {getNotificationMethodIcon(method)}
                              {method}
                            </NotificationMethod>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {formatDate(reminder.due_date)}
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem' }}>
                        {getDaysUntilDue(reminder.due_date) >= 0 
                          ? `${getDaysUntilDue(reminder.due_date)} days left`
                          : `${Math.abs(getDaysUntilDue(reminder.due_date))} days overdue`
                        }
                      </div>
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {reminder.amount ? formatCurrency(reminder.amount, reminder.currency) : '-'}
                    </div>
                    <div>
                      <PriorityBadge priority={reminder.priority}>
                        {reminder.priority === 'high' && <AlertTriangle size={12} />}
                        {reminder.priority === 'medium' && <Clock size={12} />}
                        {reminder.priority === 'low' && <CheckCircle size={12} />}
                        {reminder.priority}
                      </PriorityBadge>
                    </div>
                    <div>
                      <StatusBadge status={reminder.status}>
                        {reminder.status === 'active' && <CheckCircle size={12} />}
                        {reminder.status === 'sent' && <Send size={12} />}
                        {reminder.status === 'paused' && <XCircle size={12} />}
                        {reminder.status === 'overdue' && <AlertTriangle size={12} />}
                        {reminder.status}
                      </StatusBadge>
                    </div>
                    <ActionButtonsGroup>
                      <IconButton variant="view" title="View Details">
                        <Eye size={16} />
                      </IconButton>
                      <IconButton variant="edit" title="Edit Reminder">
                        <Edit size={16} />
                      </IconButton>
                      <IconButton 
                        variant="toggle" 
                        title={reminder.is_active ? "Pause Reminder" : "Activate Reminder"}
                        onClick={() => toggleReminder(reminder.id, reminder.is_active)}
                      >
                        {reminder.is_active ? <BellOff size={16} /> : <Bell size={16} />}
                      </IconButton>
                      <IconButton 
                        variant="send" 
                        title="Send Now"
                        onClick={() => sendReminder(reminder.id)}
                      >
                        <Send size={16} />
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
              <SidebarTitle>Upcoming Reminders</SidebarTitle>
              {upcomingReminders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', padding: '1rem 0' }}>
                  No upcoming reminders
                </div>
              ) : (
                upcomingReminders.map((reminder) => (
                  <UpcomingReminder key={reminder.id} priority={reminder.priority}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: '500', color: 'rgba(255, 255, 255, 0.9)' }}>
                        {reminder.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {getDaysUntilDue(reminder.due_date)} days
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {formatDate(reminder.due_date)}
                    </div>
                    {reminder.amount && (
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.25rem' }}>
                        {formatCurrency(reminder.amount, reminder.currency)}
                      </div>
                    )}
                  </UpcomingReminder>
                ))
              )}
            </SidebarCard>

            <SidebarCard>
              <SidebarTitle>Quick Actions</SidebarTitle>
              <QuickAction>
                <Plus size={20} />
                Create New Reminder
              </QuickAction>
              <QuickAction>
                <Settings size={20} />
                Notification Settings
              </QuickAction>
              <QuickAction>
                <Target size={20} />
                Reminder Templates
              </QuickAction>
              <QuickAction>
                <Zap size={20} />
                Bulk Actions
              </QuickAction>
            </SidebarCard>
          </Sidebar>
        </ContentGrid>
      </Container>
    </DashboardLayout>
  )
}