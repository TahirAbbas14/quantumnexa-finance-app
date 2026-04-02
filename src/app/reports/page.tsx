'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import styled from 'styled-components'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Download
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
import { addMonths, endOfMonth, endOfYear, format, startOfMonth, startOfYear, subMonths, subYears } from 'date-fns'

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`

const HeaderContent = styled.div`
  h1 {
    color: #ffffff;
    font-size: 26px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.01em;
  }
  
  p {
    margin: 8px 0 0 0;
    color: rgba(255, 255, 255, 0.65);
    font-size: 14px;
    line-height: 1.4;
  }
`

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const FilterSelect = styled.select`
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  padding: 12px 14px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
  }
  
  option {
    background: #101010;
    color: #ffffff;
  }
`

const ExportButton = styled.button`
  background: linear-gradient(135deg, var(--error-500) 0%, #dc2626 100%);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 12px;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`

const CustomDateInput = styled.input`
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  padding: 12px 14px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.8;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 18px;
`

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.10);
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
    color: rgba(255, 255, 255, 0.65);
    font-size: 12px;
    font-weight: 700;
    margin: 0;
  }
  
  p {
    color: white;
    font-size: 24px;
    font-weight: 900;
    margin: 6px 0 0 0;
  }
`

const StatIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$bgColor'
})<{ $bgColor?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$bgColor || 'rgba(255,255,255,0.10)'};
  
  svg {
    width: 22px;
    height: 22px;
    color: rgba(255, 255, 255, 0.92);
  }
`

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 18px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.10);
  }
  
  h3 {
    color: rgba(255, 255, 255, 0.92);
    font-size: 16px;
    font-weight: 900;
    margin: 0 0 12px 0;
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
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.10);
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
  color: #f87171;
  font-weight: 900;
  font-size: 14px;
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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  const { user } = useAuth()
  const [reportData, setReportData] = useState<ReportData>({
    monthlyRevenue: [],
    expensesByCategory: [],
    clientRevenue: [],
    profitTrend: []
  })
  const [loading, setLoading] = useState(true)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [dateRange, setDateRange] = useState<'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'last_year' | 'custom'>('last_6_months')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const period = useMemo(() => {
    const now = new Date()
    const toISO = (d: Date) => d.toISOString().slice(0, 10)

    if (dateRange === 'this_month') {
      const start = startOfMonth(now)
      const end = endOfMonth(now)
      return { start, end, startISO: toISO(start), endISO: toISO(end), label: 'This Month' }
    }
    if (dateRange === 'last_month') {
      const start = startOfMonth(subMonths(now, 1))
      const end = endOfMonth(start)
      return { start, end, startISO: toISO(start), endISO: toISO(end), label: 'Last Month' }
    }
    if (dateRange === 'last_3_months') {
      const start = startOfMonth(subMonths(now, 2))
      const end = endOfMonth(now)
      return { start, end, startISO: toISO(start), endISO: toISO(end), label: 'Last 3 Months' }
    }
    if (dateRange === 'last_6_months') {
      const start = startOfMonth(subMonths(now, 5))
      const end = endOfMonth(now)
      return { start, end, startISO: toISO(start), endISO: toISO(end), label: 'Last 6 Months' }
    }
    if (dateRange === 'this_year') {
      const start = startOfYear(now)
      const end = endOfYear(now)
      return { start, end, startISO: toISO(start), endISO: toISO(end), label: 'This Year' }
    }
    if (dateRange === 'last_year') {
      const start = startOfYear(subYears(now, 1))
      const end = endOfYear(start)
      return { start, end, startISO: toISO(start), endISO: toISO(end), label: 'Last Year' }
    }

    const fallbackStart = startOfMonth(now)
    const fallbackEnd = endOfMonth(now)
    const parsedFrom = customFrom ? new Date(customFrom) : fallbackStart
    const parsedTo = customTo ? new Date(customTo) : fallbackEnd
    const start = parsedFrom <= parsedTo ? parsedFrom : parsedTo
    const end = parsedFrom <= parsedTo ? parsedTo : parsedFrom
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      return { start: fallbackStart, end: fallbackEnd, startISO: toISO(fallbackStart), endISO: toISO(fallbackEnd), label: 'Custom' }
    }
    return { start, end, startISO: toISO(start), endISO: toISO(end), label: 'Custom' }
  }, [customFrom, customTo, dateRange])

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true)
      
      const supabase = createSupabaseClient()
      if (!supabase) {
        setReportData({ monthlyRevenue: [], expensesByCategory: [], clientRevenue: [], profitTrend: [] })
        return
      }

      const startDate = period.start
      const endDate = period.end
      const startISO = period.startISO
      const endISO = period.endISO
      
      // Fetch payments for revenue data (actual cash inflows)
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          amount,
          payment_date,
          invoices!inner(user_id, clients(name))
        `)
        .eq('invoices.user_id', user?.id)
        .gte('payment_date', startISO)
        .lte('payment_date', endISO)

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user?.id)
        .gte('date', startISO)
        .lte('date', endISO)

      // Process monthly revenue data
      const monthlyData = []
      const monthCount = Math.max(
        1,
        (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1
      )
      for (let i = 0; i < monthCount; i++) {
        const monthStart = startOfMonth(addMonths(startDate, i))
        const monthEnd = endOfMonth(monthStart)
        const monthName = format(monthStart, 'MMM yyyy')

        const monthPayments = payments?.filter(payment => {
          const paymentDate = new Date(payment.payment_date)
          return paymentDate >= monthStart && paymentDate <= monthEnd
        }) || []

        const monthExpenses = expenses?.filter(exp => {
          const expDate = new Date(exp.date)
          return expDate >= monthStart && expDate <= monthEnd
        }) || []

        const revenue = monthPayments.reduce((sum, payment) => sum + payment.amount, 0)
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
      payments?.forEach(payment => {
        const clientName = (payment.invoices as { clients?: { name?: string } })?.clients?.name || 'Unknown Client'
        const current = clientMap.get(clientName) || 0
        clientMap.set(clientName, current + payment.amount)
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
  }, [period.end, period.endISO, period.start, period.startISO, user])

  useEffect(() => {
    if (user) {
      fetchReportData()
    }
  }, [fetchReportData, user])

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true)
      const { exportToPDF, formatCurrencyForExport, formatPercentageForExport } = await import('@/lib/exportUtils')

      const exportData = {
        title: 'Financial Reports',
        subtitle: period.label,
        dateRange: `${format(period.start, 'MMM dd, yyyy')} - ${format(period.end, 'MMM dd, yyyy')}`,
        data: reportData.monthlyRevenue.map((row) => ({
          Month: row.month,
          Revenue: formatCurrencyForExport(row.revenue),
          Expenses: formatCurrencyForExport(row.expenses),
          Profit: formatCurrencyForExport(row.profit)
        })),
        summary: {
          'Total Revenue': formatCurrencyForExport(totalRevenue),
          'Total Expenses': formatCurrencyForExport(totalExpenses),
          'Net Profit': formatCurrencyForExport(totalProfit),
          'Profit Margin': formatPercentageForExport(profitMargin)
        },
        metadata: {
          'Top Clients (Count)': String(reportData.clientRevenue.length),
          'Expense Categories (Count)': String(reportData.expensesByCategory.length)
        }
      }

      await exportToPDF('reports-export-content', exportData, {
        filename: `financial-reports-${period.startISO}-to-${period.endISO}`,
        orientation: 'landscape',
        format: 'a4',
        includeHeader: true,
        includeFooter: true
      })
    } catch (error) {
      console.error('Error exporting reports PDF:', error)
      alert('Failed to export PDF')
    } finally {
      setExportingPDF(false)
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
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom</option>
            </FilterSelect>
            {dateRange === 'custom' && (
              <>
                <CustomDateInput type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                <CustomDateInput type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </>
            )}
            <ExportButton onClick={handleExportPDF} disabled={exportingPDF} style={{ opacity: exportingPDF ? 0.7 : 1 }}>
              <Download size={16} />
              Export PDF
            </ExportButton>
          </HeaderActions>
        </Header>

        {/* Summary Cards */}
        <StatsGrid>
          <StatCard>
            <StatHeader>
              <StatInfo>
                <h3>Total Revenue</h3>
                <p>{formatCurrency(totalRevenue)}</p>
              </StatInfo>
              <StatIcon $bgColor="linear-gradient(135deg, #10b981 0%, #059669 100%)">
                <DollarSign />
              </StatIcon>
            </StatHeader>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatInfo>
                <h3>Total Expenses</h3>
                <p>{formatCurrency(totalExpenses)}</p>
              </StatInfo>
              <StatIcon $bgColor="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
                <TrendingDown />
              </StatIcon>
            </StatHeader>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatInfo>
                <h3>Net Profit</h3>
                <p style={{ color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatCurrency(totalProfit)}
                </p>
              </StatInfo>
              <StatIcon $bgColor={totalProfit >= 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}>
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
              <StatIcon $bgColor="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)">
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
                  formatter={(value: number) => [`${formatCurrency(value)}`, '']}
                  labelFormatter={(label) => `Month: ${label}`}
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
                  formatter={(value: number) => [`${formatCurrency(value)}`, 'Amount']}
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
                  formatter={(value) => [`${formatCurrency(value as number)}`, 'Profit']}
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
                  <ClientRevenue>{formatCurrency(client.revenue)}</ClientRevenue>
                </ClientItem>
              ))}
            </ClientList>
          </ChartCard>
        </ChartsGrid>

        <div
          id="reports-export-content"
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '1120px',
            padding: '24px',
            background: '#ffffff',
            color: '#111827',
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
            {[
              { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
              { label: 'Total Expenses', value: formatCurrency(totalExpenses) },
              { label: 'Net Profit', value: formatCurrency(totalProfit) },
              { label: 'Profit Margin', value: `${profitMargin.toFixed(2)}%` }
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px',
                  background: '#ffffff'
                }}
              >
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>{item.label}</div>
                <div style={{ marginTop: '6px', fontSize: '18px', fontWeight: 800 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ height: '1px', background: '#e5e7eb', marginTop: '16px', marginBottom: '12px' }} />

          <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>Revenue vs Expenses (Monthly)</div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Month', 'Revenue', 'Expenses', 'Profit'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        fontSize: '11px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: '#6b7280',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.monthlyRevenue.length === 0 ? (
                  <tr>
                    <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px' }} colSpan={4}>
                      No data found for selected period.
                    </td>
                  </tr>
                ) : (
                  reportData.monthlyRevenue.slice(0, 24).map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}>{row.month}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}>{formatCurrency(row.revenue)}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}>{formatCurrency(row.expenses)}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}>{formatCurrency(row.profit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ height: '1px', background: '#e5e7eb', marginTop: '16px', marginBottom: '12px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>Top Expense Categories</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Category', 'Amount'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '10px 12px',
                            fontSize: '11px',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: '#6b7280',
                            borderBottom: '1px solid #e5e7eb'
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.expensesByCategory || []).slice(0, 10).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 12px', fontSize: '13px' }}>{row.category}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}>{formatCurrency(row.amount)}</td>
                      </tr>
                    ))}
                    {(reportData.expensesByCategory || []).length === 0 ? (
                      <tr>
                        <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px' }} colSpan={2}>
                          No expenses found for selected period.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>Top Clients by Revenue</div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Client', 'Revenue'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '10px 12px',
                            fontSize: '11px',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: '#6b7280',
                            borderBottom: '1px solid #e5e7eb'
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.clientRevenue || []).slice(0, 10).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 12px', fontSize: '13px' }}>{row.client}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', whiteSpace: 'nowrap' }}>{formatCurrency(row.revenue)}</td>
                      </tr>
                    ))}
                    {(reportData.clientRevenue || []).length === 0 ? (
                      <tr>
                        <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px' }} colSpan={2}>
                          No payments found for selected period.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {(reportData.monthlyRevenue || []).length > 24 && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
              Showing first 24 months in PDF.
            </div>
          )}
        </div>
      </Container>
    </DashboardLayout>
  )
}
