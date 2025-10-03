'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import styled from 'styled-components'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%);
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`

const HeaderContent = styled.div`
  h1 {
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }
  
  p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.1rem;
  }
`

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const FilterSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: white;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
  
  option {
    background: rgba(30, 30, 30, 0.95);
    color: white;
  }
`

const ExportButton = styled.button`
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
  }
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(220, 38, 38, 0.3);
  }
`

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`

const StatInfo = styled.div`
  h3 {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  p {
    color: white;
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
  }
`

const StatIcon = styled.div<{ bgColor?: string }>`
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.bgColor || 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'};
  
  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
`

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(220, 38, 38, 0.3);
  }
  
  h3 {
    color: white;
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`

const ClientList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const ClientItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(220, 38, 38, 0.3);
  }
`

const ClientInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const ClientIndicator = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
`

const ClientName = styled.span`
  color: white;
  font-weight: 500;
`

const ClientRevenue = styled.span`
  color: #dc2626;
  font-weight: 600;
  font-size: 1.1rem;
`

const LoadingContainer = styled.div`
  display: flex;
  items-center: center;
  justify-content: center;
  height: 400px;
`

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(220, 38, 38, 0.3);
  border-top: 3px solid #dc2626;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

interface ReportData {
  monthlyRevenue: Array<{ month: string; revenue: number; expenses: number; profit: number }>
  expensesByCategory: Array<{ category: string; amount: number; color: string }>
  clientRevenue: Array<{ client: string; revenue: number }>
  profitTrend: Array<{ month: string; profit: number }>
}

const COLORS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2']

export default function ReportsPage() {
  const { user } = useAuth()
  const [reportData, setReportData] = useState<ReportData>({
    monthlyRevenue: [],
    expensesByCategory: [],
    clientRevenue: [],
    profitTrend: []
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('6months')

  useEffect(() => {
    if (user) {
      fetchReportData()
    }
  }, [user, dateRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      const months = dateRange === '6months' ? 6 : dateRange === '12months' ? 12 : 3
      const startDate = startOfMonth(subMonths(new Date(), months - 1))
      
      // Fetch invoices for revenue data
      const { data: invoices } = await supabase!
        .from('invoices')
        .select(`
          *,
          clients (name)
        `)
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .eq('status', 'paid')

      // Fetch expenses
      const { data: expenses } = await supabase!
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', startDate.toISOString())

      // Process monthly revenue data
      const monthlyData = []
      for (let i = 0; i < months; i++) {
        const monthStart = startOfMonth(subMonths(new Date(), months - 1 - i))
        const monthEnd = endOfMonth(monthStart)
        const monthName = format(monthStart, 'MMM yyyy')

        const monthInvoices = invoices?.filter(inv => {
          const invDate = new Date(inv.created_at)
          return invDate >= monthStart && invDate <= monthEnd
        }) || []

        const monthExpenses = expenses?.filter(exp => {
          const expDate = new Date(exp.date)
          return expDate >= monthStart && expDate <= monthEnd
        }) || []

        const revenue = monthInvoices.reduce((sum, inv) => sum + inv.amount, 0)
        const expenseAmount = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0)

        monthlyData.push({
          month: monthName,
          revenue,
          expenses: expenseAmount,
          profit: revenue - expenseAmount
        })
      }

      // Process expenses by category
      const categoryMap = new Map()
      expenses?.forEach(expense => {
        const current = categoryMap.get(expense.category) || 0
        categoryMap.set(expense.category, current + expense.amount)
      })

      const expensesByCategory = Array.from(categoryMap.entries()).map(([category, amount], index) => ({
        category,
        amount,
        color: COLORS[index % COLORS.length]
      }))

      // Process client revenue
      const clientMap = new Map()
      invoices?.forEach(invoice => {
        const clientName = invoice.clients?.name || 'Unknown Client'
        const current = clientMap.get(clientName) || 0
        clientMap.set(clientName, current + invoice.amount)
      })

      const clientRevenue = Array.from(clientMap.entries())
        .map(([client, revenue]) => ({ client, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      setReportData({
        monthlyRevenue: monthlyData,
        expensesByCategory,
        clientRevenue,
        profitTrend: monthlyData.map(({ month, profit }) => ({ month, profit }))
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = reportData.monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0)
  const totalExpenses = reportData.monthlyRevenue.reduce((sum, item) => sum + item.expenses, 0)
  const totalProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <LoadingContainer>
            <LoadingSpinner />
          </LoadingContainer>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Container>
        {/* Header */}
        <Header>
          <HeaderContent>
            <h1>Financial Reports</h1>
            <p>Comprehensive analytics and insights</p>
          </HeaderContent>
          <HeaderActions>
            <FilterSelect
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </FilterSelect>
            <ExportButton>
              <Download size={16} />
              Export
            </ExportButton>
          </HeaderActions>
        </Header>

        {/* Summary Cards */}
        <StatsGrid>
          <StatCard>
            <StatHeader>
              <StatInfo>
                <h3>Total Revenue</h3>
                <p>${totalRevenue.toLocaleString()}</p>
              </StatInfo>
              <StatIcon bgColor="linear-gradient(135deg, #10b981 0%, #059669 100%)">
                <DollarSign />
              </StatIcon>
            </StatHeader>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatInfo>
                <h3>Total Expenses</h3>
                <p>${totalExpenses.toLocaleString()}</p>
              </StatInfo>
              <StatIcon bgColor="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
                <TrendingDown />
              </StatIcon>
            </StatHeader>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatInfo>
                <h3>Net Profit</h3>
                <p style={{ color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  ${totalProfit.toLocaleString()}
                </p>
              </StatInfo>
              <StatIcon bgColor={totalProfit >= 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}>
                {totalProfit >= 0 ? <TrendingUp /> : <TrendingDown />}
              </StatIcon>
            </StatHeader>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatInfo>
                <h3>Profit Margin</h3>
                <p style={{ color: profitMargin >= 0 ? '#10b981' : '#ef4444' }}>
                  {profitMargin.toFixed(1)}%
                </p>
              </StatInfo>
              <StatIcon bgColor="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)">
                <BarChart3 />
              </StatIcon>
            </StatHeader>
          </StatCard>
        </StatsGrid>

        {/* Charts Grid */}
        <ChartsGrid>
          {/* Revenue vs Expenses Chart */}
          <ChartCard>
            <h3>Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, '']} 
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(220,38,38,0.3)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Expenses by Category */}
          <ChartCard>
            <h3>Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {reportData.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} 
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(220,38,38,0.3)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Profit Trend */}
          <ChartCard>
            <h3>Profit Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.profitTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Profit']} 
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(220,38,38,0.3)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top Clients by Revenue */}
          <ChartCard>
            <h3>Top Clients by Revenue</h3>
            <ClientList>
              {reportData.clientRevenue.slice(0, 5).map((client, index) => (
                <ClientItem key={client.client}>
                  <ClientInfo>
                    <ClientIndicator color={COLORS[index % COLORS.length]} />
                    <ClientName>{client.client}</ClientName>
                  </ClientInfo>
                  <ClientRevenue>${client.revenue.toLocaleString()}</ClientRevenue>
                </ClientItem>
              ))}
            </ClientList>
          </ChartCard>
        </ChartsGrid>
      </Container>
    </DashboardLayout>
  )
}