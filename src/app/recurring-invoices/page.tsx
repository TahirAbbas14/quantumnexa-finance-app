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
  FileText,
  DollarSign,
  User,
  Settings,
  Download,
  Filter
} from 'lucide-react'

// Styled Components
const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: between;
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
      case 'ended':
        return `
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.2);
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

const IconButton = styled.button<{ variant?: 'edit' | 'delete' | 'toggle' }>`
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

// Types
interface RecurringInvoiceTemplate {
  id: string
  template_name: string
  client_name?: string
  amount: number
  currency: string
  frequency: string
  frequency_interval: number
  next_invoice_date: string
  is_active: boolean
  auto_send: boolean
  created_at: string
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
    if (user) {
      fetchTemplates()
      fetchStats()
    }
  }, [user])

  const fetchTemplates = async () => {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('recurring_invoice_templates')
        .select(`
          id,
          template_name,
          client_id,
          amount,
          currency,
          frequency,
          frequency_interval,
          next_invoice_date,
          is_active,
          auto_send,
          created_at,
          clients (
            name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recurring invoice templates:', error);
        return;
      }

      // Transform data to match interface
      const transformedTemplates = data?.map(template => ({
        ...template,
        client_name: template.clients?.[0]?.name || 'No client assigned'
      })) || [];

      setTemplates(transformedTemplates);
    } catch (error) {
      console.error('Error fetching recurring invoice templates:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchStats = async () => {
    try {
      const supabase = createSupabaseClient();
      
      // Get all templates for the user
      const { data: allTemplates, error } = await supabase
        .from('recurring_invoice_templates')
        .select('id, amount, frequency, frequency_interval, next_invoice_date, is_active, created_at')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching template stats:', error);
        return;
      }

      const activeTemplates = allTemplates?.filter(t => t.is_active).length || 0;
      
      // Calculate total monthly value
      let totalMonthlyValue = 0;
      allTemplates?.forEach(template => {
        if (!template.is_active) return;
        
        const amount = template.amount || 0;
        const interval = template.frequency_interval || 1;
        
        switch (template.frequency) {
          case 'weekly':
            totalMonthlyValue += (amount * 4.33) / interval; // Average weeks per month
            break;
          case 'monthly':
            totalMonthlyValue += amount / interval;
            break;
          case 'quarterly':
            totalMonthlyValue += (amount / 3) / interval;
            break;
          case 'yearly':
            totalMonthlyValue += (amount / 12) / interval;
            break;
          default:
            totalMonthlyValue += amount / interval; // Default to monthly
        }
      });

      // Get invoices due this week
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextInvoicesDue = allTemplates
        ?.filter(template => 
          template.is_active && 
          template.next_invoice_date && 
          new Date(template.next_invoice_date) >= now && 
          new Date(template.next_invoice_date) <= oneWeekFromNow
        )
        .length || 0;

      // Get generated invoices this month (from recurring_invoice_history)
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const { data: generatedInvoices, error: historyError } = await supabase
        .from('recurring_invoice_history')
        .select('id')
        .eq('user_id', user?.id || '')
        .gte('generated_at', firstDayOfMonth.toISOString());

      if (historyError) {
        console.error('Error fetching invoice history:', historyError);
      }

      const generatedThisMonth = generatedInvoices?.length || 0;

      setStats({
        activeTemplates,
        totalMonthlyValue: Math.round(totalMonthlyValue),
        nextInvoicesDue,
        generatedThisMonth
      });
    } catch (error) {
      console.error('Error fetching template stats:', error);
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

  const toggleTemplate = async (templateId: string, currentStatus: boolean) => {
    try {
      // API call to toggle template status
      setTemplates(prev => 
        prev.map(template => 
          template.id === templateId 
            ? { ...template, is_active: !currentStatus }
            : template
        )
      )
    } catch (error) {
      console.error('Error toggling template:', error)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this recurring invoice template?')) {
      try {
        // API call to delete template
        setTemplates(prev => prev.filter(template => template.id !== templateId))
      } catch (error) {
        console.error('Error deleting template:', error)
      }
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
      <PageContainer>
        <div>Loading...</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer id="recurring-invoices-content">
      <Header>
        <Title>Recurring Invoices</Title>
        <ActionButtons>
          <Button variant="secondary">
            <Download size={20} />
            Export
          </Button>
          <Button variant="primary">
            <Plus size={20} />
            New Template
          </Button>
        </ActionButtons>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.activeTemplates}</StatValue>
          <StatLabel>
            <FileText size={16} />
            Active Templates
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{formatCurrency(stats.totalMonthlyValue)}</StatValue>
          <StatLabel>
            <DollarSign size={16} />
            Monthly Recurring Value
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.nextInvoicesDue}</StatValue>
          <StatLabel>
            <Calendar size={16} />
            Due This Week
          </StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.generatedThisMonth}</StatValue>
          <StatLabel>
            <Clock size={16} />
            Generated This Month
          </StatLabel>
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
                    <div style={{ fontWeight: '500', color: 'var(--heading-primary)' }}>
                      {template.template_name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {template.client_name || 'No client assigned'}
                    </div>
                  </div>
                  <div style={{ fontWeight: '500' }}>
                    {formatCurrency(template.amount, template.currency)}
                  </div>
                  <div>
                    {formatFrequency(template.frequency, template.frequency_interval)}
                  </div>
                  <div>
                    {formatDate(template.next_invoice_date)}
                  </div>
                  <div>
                    <StatusBadge status={template.is_active ? 'active' : 'paused'}>
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
                    <IconButton variant="edit" title="Edit Template">
                      <Edit size={16} />
                    </IconButton>
                    <IconButton 
                      variant="toggle" 
                      title={template.is_active ? 'Pause Template' : 'Activate Template'}
                      onClick={() => toggleTemplate(template.id, template.is_active)}
                    >
                      {template.is_active ? <Pause size={16} /> : <Play size={16} />}
                    </IconButton>
                    <IconButton 
                      variant="delete" 
                      title="Delete Template"
                      onClick={() => deleteTemplate(template.id)}
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
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Set up a new recurring invoice
                </div>
              </div>
            </QuickAction>
            <QuickAction>
              <Settings size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>Automation Settings</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Configure auto-send options
                </div>
              </div>
            </QuickAction>
            <QuickAction>
              <Calendar size={20} />
              <div>
                <div style={{ fontWeight: '500' }}>Schedule Preview</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  View upcoming invoices
                </div>
              </div>
            </QuickAction>
          </SidebarCard>

          <SidebarCard>
            <SidebarTitle>Recent Activity</SidebarTitle>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  Invoice #INV-2024-001 generated
                </div>
                <div style={{ fontSize: '0.75rem' }}>2 hours ago</div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  Template &quot;Monthly Retainer&quot; updated
                </div>
                <div style={{ fontSize: '0.75rem' }}>1 day ago</div>
              </div>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                  New template created
                </div>
                <div style={{ fontSize: '0.75rem' }}>3 days ago</div>
              </div>
            </div>
          </SidebarCard>
        </Sidebar>
      </ContentGrid>
    </PageContainer>
  )
}