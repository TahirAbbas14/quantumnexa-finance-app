'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import styled from 'styled-components'
import Sidebar from './Sidebar'

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
`

const LoadingSpinner = styled.div`
  width: 8rem;
  height: 8rem;
  border: 2px solid transparent;
  border-bottom: 2px solid var(--primary-600);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const DashboardContainer = styled.div`
  height: 100vh;
  display: flex;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
`

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 0;
  flex: 1;
  overflow: hidden;
`

const MainArea = styled.main`
  flex: 1;
  position: relative;
  overflow-y: auto;
  
  &:focus {
    outline: none;
  }
`

const ContentWrapper = styled.div`
  padding: 1.5rem 0;
`

const ContentContainer = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem;
  
  @media (min-width: 640px) {
    padding: 0 1.5rem;
  }
  
  @media (min-width: 768px) {
    padding: 0 2rem;
  }
`

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardContainer>
      <Sidebar />
      <MainContent>
        <MainArea>
          <ContentWrapper>
            <ContentContainer>
              {children}
            </ContentContainer>
          </ContentWrapper>
        </MainArea>
      </MainContent>
    </DashboardContainer>
  )
}