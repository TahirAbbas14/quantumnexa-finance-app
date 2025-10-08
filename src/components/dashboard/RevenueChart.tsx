'use client'

import styled from 'styled-components'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatPKR } from '@/lib/currency'

const Container = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
`

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--gray-900);
  margin: 0 0 1rem 0;
`

const ChartContainer = styled.div`
  height: 20rem;
`

const data = [
  { month: 'Jan', revenue: 450000, expenses: 280000 },
  { month: 'Feb', revenue: 520000, expenses: 320000 },
  { month: 'Mar', revenue: 480000, expenses: 290000 },
  { month: 'Apr', revenue: 580000, expenses: 350000 },
  { month: 'May', revenue: 620000, expenses: 380000 },
  { month: 'Jun', revenue: 550000, expenses: 340000 },
  { month: 'Jul', revenue: 680000, expenses: 420000 },
]

export default function RevenueChart() {
  return (
    <Container>
      <Title>Revenue vs Expenses</Title>
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name) => [formatPKR(value), name === 'revenue' ? 'Revenue' : 'Expenses']}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6' }}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#EF4444" 
              strokeWidth={2}
              dot={{ fill: '#EF4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Container>
  )
}