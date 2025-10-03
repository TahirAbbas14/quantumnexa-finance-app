'use client'

import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { FileText, Eye } from 'lucide-react'

const Container = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--gray-900);
  margin: 0;
`

const ViewAllLink = styled.a`
  color: var(--blue-600);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  
  &:hover {
    color: var(--blue-500);
  }
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const LoadingSkeleton = styled.div`
  height: 4rem;
  background-color: var(--gray-200);
  border-radius: 0.25rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 0;
`

const EmptyIcon = styled.div`
  margin: 0 auto 0.5rem;
  color: var(--gray-400);
`

const EmptyTitle = styled.h3`
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-900);
`

const EmptyDescription = styled.p`
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: var(--gray-500);
`

const EmptyAction = styled.div`
  margin-top: 1.5rem;
`

const CreateButton = styled.a`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  color: white;
  background-color: var(--blue-600);
  text-decoration: none;
  
  &:hover {
    background-color: var(--blue-700);
  }
`

const InvoicesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const InvoiceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  
  &:hover {
    background-color: var(--gray-50);
  }
`

const InvoiceLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const InvoiceIcon = styled.div`
  flex-shrink: 0;
  color: var(--gray-400);
`

const InvoiceDetails = styled.div`
  display: flex;
  flex-direction: column;
`

const InvoiceNumber = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-900);
  margin: 0;
`

const InvoiceInfo = styled.p`
  font-size: 0.875rem;
  color: var(--gray-500);
  margin: 0;
`

const InvoiceRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.$status) {
      case 'paid':
        return `
          background-color: var(--green-100);
          color: var(--green-800);
        `;
      case 'sent':
        return `
          background-color: var(--blue-100);
          color: var(--blue-800);
        `;
      case 'overdue':
        return `
          background-color: var(--red-100);
          color: var(--red-800);
        `;
      case 'draft':
        return `
          background-color: var(--gray-100);
          color: var(--gray-800);
        `;
      default:
        return `
          background-color: var(--gray-100);
          color: var(--gray-800);
        `;
    }
  }}
`

const InvoiceAmount = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-900);
`

const ViewButton = styled.button`
  color: var(--gray-400);
  background: none;
  border: none;
  cursor: pointer;
  
  &:hover {
    color: var(--gray-600);
  }
`

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  total_amount: number
  status: string
  issue_date: string
  clients: {
    name: string
  }
}

export default function RecentInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createSupabaseClient()

  useEffect(() => {
    if (user) {
      fetchRecentInvoices()
    }
  }, [user])

  const fetchRecentInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          client_id,
          total_amount,
          status,
          issue_date,
          clients (
            name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setInvoices(
        (data || []).map((item) => ({
          ...item,
          clients: item.clients?.[0] ?? { name: '' }
        }))
      )
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <Title>Recent Invoices</Title>
        <LoadingContainer>
          {[...Array(3)].map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </LoadingContainer>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <Title>Recent Invoices</Title>
        <ViewAllLink href="/invoices">
          View all
        </ViewAllLink>
      </Header>
      
      {invoices.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FileText size={48} />
          </EmptyIcon>
          <EmptyTitle>No invoices</EmptyTitle>
          <EmptyDescription>Get started by creating a new invoice.</EmptyDescription>
          <EmptyAction>
            <CreateButton href="/invoices/new">
              Create Invoice
            </CreateButton>
          </EmptyAction>
        </EmptyState>
      ) : (
        <InvoicesList>
          {invoices.map((invoice) => (
            <InvoiceItem key={invoice.id}>
              <InvoiceLeft>
                <InvoiceIcon>
                  <FileText size={20} />
                </InvoiceIcon>
                <InvoiceDetails>
                  <InvoiceNumber>
                    {invoice.invoice_number}
                  </InvoiceNumber>
                  <InvoiceInfo>
                    {invoice.clients?.name} • {format(new Date(invoice.issue_date), 'MMM d, yyyy')}
                  </InvoiceInfo>
                </InvoiceDetails>
              </InvoiceLeft>
              <InvoiceRight>
                <StatusBadge $status={invoice.status}>
                  {invoice.status}
                </StatusBadge>
                <InvoiceAmount>
                  ${invoice.total_amount.toLocaleString()}
                </InvoiceAmount>
                <ViewButton>
                  <Eye size={16} />
                </ViewButton>
              </InvoiceRight>
            </InvoiceItem>
          ))}
        </InvoicesList>
      )}
    </Container>
  )
}