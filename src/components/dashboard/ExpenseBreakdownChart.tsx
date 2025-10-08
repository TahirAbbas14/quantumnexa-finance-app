'use client'

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import { formatPKR } from '@/lib/currency'

interface ExpenseData {
  category: string
  amount: number
  color: string
}

interface ExpenseBreakdownChartProps {
  data?: ExpenseData[]
  height?: number
}

// Default sample data for expense categories
const defaultData: ExpenseData[] = [
  { category: 'Office Supplies', amount: 25000, color: '#3B82F6' },
  { category: 'Marketing', amount: 45000, color: '#10B981' },
  { category: 'Travel', amount: 15000, color: '#F59E0B' },
  { category: 'Software', amount: 35000, color: '#EF4444' },
  { category: 'Utilities', amount: 20000, color: '#8B5CF6' },
  { category: 'Rent', amount: 80000, color: '#06B6D4' },
  { category: 'Other', amount: 12000, color: '#84CC16' }
]

const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({ 
  data = defaultData, 
  height = 300 
}) => {
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ExpenseData & { total: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.amount / data.total) * 100).toFixed(1)
      
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '12px',
          color: 'white',
          fontSize: '14px'
        }}>
          <p style={{ 
            margin: '0 0 8px 0', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              width: '12px',
              height: '12px',
              backgroundColor: data.color,
              borderRadius: '50%',
              display: 'inline-block'
            }}></span>
            {data.category}
          </p>
          <p style={{ margin: '4px 0', color: '#10b981' }}>
            Amount: {formatPKR(data.amount)}
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>
            {percentage}% of total expenses
          </p>
        </div>
      )
    }
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
    if (percent < 0.05) return null // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Calculate total for percentage calculations
  const dataWithTotal = data.map(item => ({
    ...item,
    total: data.reduce((sum, d) => sum + d.amount, 0)
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={dataWithTotal}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={CustomLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="amount"
        >
          {dataWithTotal.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '12px',
            paddingTop: '20px'
          }}
          formatter={(value, entry) => (
            <span style={{ color: entry.color || 'inherit' }}>
              {value} ({formatPKR((entry.payload as ExpenseData).amount)})
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default ExpenseBreakdownChart