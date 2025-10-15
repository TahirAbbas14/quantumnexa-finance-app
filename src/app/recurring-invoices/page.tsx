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
  FileText,
  DollarSign,

  Settings,
  Download,
  Filter
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
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  position: relative;
  overflow: hidden;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: var(--primary-600);
          color: white;
          
          &:hover {
            background: var(--primary-700);
            transform: translateY(-2px);
          }
        `;
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
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
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const StatIcon = styled.div<{ $color?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$color || 'var(--primary-100)'};
  color: ${props => props.$color?.replace('100', '600') || 'var(--primary-600)'};

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
  }
`;

const StatValue = styled.div`
  h3 {
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
  }
  
  p {
    font-size: 14px;
    color: var(--gray-300);
    display: flex;
    align-items: center;
    gap: 4px;

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    gap: 16px;
  }
`;

const MainContent = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TableTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
`;

const Table = styled.div`
  overflow-x: auto;
`;

const TableRow = styled.div<{ isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 140px;
  gap: 1.5rem;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  transition: all 0.2s ease;
  
  ${props => props.isHeader && `
    background: rgba(255, 255, 255, 0.05);
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `}
  
  &:last-child {
    border-bottom: none;
  }

  &:hover:not(:first-child) {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.status) {
      case 'active':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.2);
        `;
      case 'inactive':
        return `
          background: rgba(156, 163, 175, 0.1);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.2);
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.1);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.2);
        `;
    }
  }}
`;

const ActionButtonsGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const IconButton = styled.button<{ variant?: 'edit' | 'delete' | 'toggle' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  
  ${props => {
    switch (props.variant) {
      case 'edit':
        return `
          color: #3b82f6;
          &:hover {
            background: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.3);
          }
        `;
      case 'delete':
        return `
          color: #ef4444;
          &:hover {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
          }
        `;
      case 'toggle':
        return `
          color: #10b981;
          &:hover {
            background: rgba(16, 185, 129, 0.1);
            border-color: rgba(16, 185, 129, 0.3);
          }
        `;
      default:
        return `
          color: white;
          &:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `;
    }
  }}
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    margin: 1rem 0 0.5rem 0;
  }
  
  p {
    font-size: 0.875rem;
    margin: 0;
    max-width: 400px;
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
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 1rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SidebarCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const SidebarTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0 0 16px 0;
`;

const QuickAction = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  margin-bottom: 8px;
  color: white;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(4px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
  
  svg {
    color: var(--primary-500);
    flex-shrink: 0;
  }
`;

// Types
interface RecurringInvoiceTemplate {
  id: string
  user_id: string
  client_id?: string
  template_name: string
  description?: string
  amount: number
  currency: string
  frequency: string
  frequency_interval: number
  start_date: string
  end_date?: string
  next_invoice_date: string
  is_active: boolean
  auto_send: boolean
  payment_terms: number
  notes?: string
  created_at: string
  updated_at: string
  // Joined data
  client_name?: string
}

interface DashboardStats {
  activeTemplates: number
  totalMonthlyValue: number
  nextInvoicesDue: number
  generatedThisMonth: number
}

export default function RecurringInvoicesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<RecurringInvoiceTemplate[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    activeTemplates: 0,
    totalMonthlyValue: 0,
    nextInvoicesDue: 0,
    generatedThisMonth: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        const supabase = createSupabaseClient()

        // Fetch recurring invoice templates with client information
        if (!supabase) {
          console.error('Supabase client is null')
          return
        }

        const { data: templatesData, error: templatesError } = await supabase
          .from('recurring_invoice_templates')
          .select(`
            *,
            clients (
              name,
              email
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (templatesError) {
          console.error('Error fetching templates:', templatesError)
        } else {
          // Transform data to include client_name
          const transformedTemplates = templatesData?.map(template => ({
            ...template,
            client_name: template.clients?.name || 'No Client'
          })) || []
          
          setTemplates(transformedTemplates)
        }

        // Calculate dashboard stats
        const activeTemplates = templatesData?.filter(t => t.is_active).length || 0
        const totalMonthlyValue = templatesData
          ?.filter(t => t.is_active && t.frequency === 'monthly')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0

        // Count templates with next_invoice_date in the next 7 days
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        const nextInvoicesDue = templatesData?.filter(t => 
          t.is_active && 
          new Date(t.next_invoice_date) <= nextWeek
        ).length || 0

        // Fetch generated invoices this month from recurring_invoice_history
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const { data: historyData } = await supabase
          .from('recurring_invoice_history')
          .select('id')
          .gte('generated_date', startOfMonth.toISOString())

        const generatedThisMonth = historyData?.length || 0

        setStats({
          activeTemplates,
          totalMonthlyValue,
          nextInvoicesDue,
          generatedThisMonth
        })

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

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

  const toggleTemplate = async (templateId: string, currentStatus: boolean) => {
    try {
      const supabase = createSupabaseClient()
      
      if (!supabase) {
        console.error('Supabase client is null')
        return
      }
      const { error } = await supabase
        .from('recurring_invoice_templates')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error updating template:', error)
        return
      }

      // Update local state
      setTemplates(prev => 
        prev.map(template => 
          template.id === templateId 
            ? { ...template, is_active: !currentStatus }
            : template
        )
      )

      // Recalculate stats
      const updatedTemplates = templates.map(template => 
        template.id === templateId 
          ? { ...template, is_active: !currentStatus }
          : template
      )
      
      const activeTemplates = updatedTemplates.filter(t => t.is_active).length
      const totalMonthlyValue = updatedTemplates
        .filter(t => t.is_active && t.frequency === 'monthly')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      setStats(prev => ({
        ...prev,
        activeTemplates,
        totalMonthlyValue
      }))

    } catch (error) {
      console.error('Error toggling template:', error)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this recurring invoice template?')) {
      return
    }

    try {
      const supabase = createSupabaseClient()
      
      if (!supabase) {
        console.error('Supabase client is null')
        return
      }

      const { error } = await supabase
        .from('recurring_invoice_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error deleting template:', error)
        return
      }

      // Update local state
      setTemplates(prev => prev.filter(template => template.id !== templateId))

      // Recalculate stats
      const updatedTemplates = templates.filter(template => template.id !== templateId)
      const activeTemplates = updatedTemplates.filter(t => t.is_active).length
      const totalMonthlyValue = updatedTemplates
        .filter(t => t.is_active && t.frequency === 'monthly')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      setStats(prev => ({
        ...prev,
        activeTemplates,
        totalMonthlyValue
      }))

    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const filteredTemplates = templates.filter(template => {
    switch (filter) {
      case 'active':
        return template.is_active
      case 'paused':
        return !template.is_active
      default:
        return true
    }
  })

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
          <h1>Recurring Invoices</h1>
          <p>Manage your recurring invoice templates and automation</p>
          <HeaderActions>
            <Button variant="secondary">
              <Download size={20} />
              Export
            </Button>
            <Button variant="primary">
              <Plus size={20} />
              New Template
            </Button>
          </HeaderActions>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatHeader>
              <StatIcon>
                <FileText size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{stats.activeTemplates}</h3>
              <p>Active Templates</p>
            </StatValue>
          </StatCard>
          <StatCard>
            <StatHeader>
              <StatIcon>
                <DollarSign size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{formatCurrency(stats.totalMonthlyValue)}</h3>
              <p>Monthly Recurring Value</p>
            </StatValue>
          </StatCard>
          <StatCard>
            <StatHeader>
              <StatIcon>
                <Calendar size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{stats.nextInvoicesDue}</h3>
              <p>Due This Week</p>
            </StatValue>
          </StatCard>
          <StatCard>
            <StatHeader>
              <StatIcon>
                <Clock size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>
              <h3>{stats.generatedThisMonth}</h3>
              <p>Generated This Month</p>
            </StatValue>
          </StatCard>
        </StatsGrid>

        <ContentGrid>
          <MainContent>
            <TableHeader>
              <TableTitle>Invoice Templates</TableTitle>
              <FilterButton onClick={() => setFilter(filter === 'all' ? 'active' : 'all')}>
                <Filter size={16} />
                {filter === 'all' ? 'All' : 'Active Only'}
              </FilterButton>
            </TableHeader>
            
            <Table>
              <TableRow isHeader>
                <div>Template & Client</div>
                <div>Amount</div>
                <div>Frequency</div>
                <div>Next Invoice</div>
                <div>Status</div>
                <div>Actions</div>
              </TableRow>
              
              {filteredTemplates.length === 0 ? (
                <EmptyState>
                  <EmptyStateIcon>
                    <FileText size={32} />
                  </EmptyStateIcon>
                  <h3>No recurring invoice templates</h3>
                  <p>Create your first template to start generating automatic invoices</p>
                </EmptyState>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <div>
                      <div style={{ fontWeight: '500', color: 'white' }}>
                        {template.template_name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {template.client_name || 'No client assigned'}
                      </div>
                    </div>
                    <div style={{ fontWeight: '500', color: 'white' }}>
                      {formatCurrency(template.amount, template.currency)}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {formatFrequency(template.frequency, template.frequency_interval)}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {formatDate(template.next_invoice_date)}
                    </div>
                    <div>
                      <StatusBadge status={template.is_active ? 'active' : 'inactive'}>
                        {template.is_active ? (
                          <>
                            <Play size={12} />
                            Active
                          </>
                        ) : (
                          <>
                            <Pause size={12} />
                            Paused
                          </>
                        )}
                      </StatusBadge>
                    </div>
                    <ActionButtonsGroup>
                      <IconButton
                        variant="toggle"
                        onClick={() => toggleTemplate(template.id, template.is_active)}
                        title={template.is_active ? 'Pause Template' : 'Activate Template'}
                      >
                        {template.is_active ? <Pause size={16} /> : <Play size={16} />}
                      </IconButton>
                      <IconButton
                        variant="edit"
                        onClick={() => {/* TODO: Implement edit functionality */}}
                        title="Edit Template"
                      >
                        <Edit size={16} />
                      </IconButton>
                      <IconButton
                        variant="delete"
                        onClick={() => deleteTemplate(template.id)}
                        title="Delete Template"
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
                  <div style={{ fontWeight: '500' }}>Create Template</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Set up a new recurring invoice
                  </div>
                </div>
              </QuickAction>
              <QuickAction>
                <Settings size={20} />
                <div>
                  <div style={{ fontWeight: '500' }}>Automation Settings</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Configure auto-send options
                  </div>
                </div>
              </QuickAction>
              <QuickAction>
                <Calendar size={20} />
                <div>
                  <div style={{ fontWeight: '500' }}>Schedule Preview</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    View upcoming invoices
                  </div>
                </div>
              </QuickAction>
            </SidebarCard>

            <SidebarCard>
              <SidebarTitle>Recent Activity</SidebarTitle>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: '500', color: 'white' }}>
                    Invoice #INV-2024-001 generated
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>2 hours ago</div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: '500', color: 'white' }}>
                    Template &quot;Monthly Retainer&quot; updated
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>1 day ago</div>
                </div>
                <div>
                  <div style={{ fontWeight: '500', color: 'white' }}>
                    New template created
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>3 days ago</div>
                </div>
              </div>
            </SidebarCard>
          </Sidebar>
        </ContentGrid>
      </Container>
    </DashboardLayout>
  )
}