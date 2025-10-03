'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styled from 'styled-components'
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Receipt, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Target,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
  Calculator,
  Activity,
  Calendar,
  DollarSign,
  RefreshCw,
  Repeat,
  Bell,
  Clock
} from 'lucide-react'

const SidebarOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 40;
  background-color: rgba(0, 0, 0, 0.75);
  
  @media (min-width: 1024px) {
    display: none;
  }
`

const MobileSidebar = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isOpen',
})<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  width: 16rem;
  background: #000000;
  border-right: 1px solid rgba(239, 68, 68, 0.2);
  transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  transition: transform 0.3s ease-in-out;
  
  @media (min-width: 1024px) {
    display: none;
  }
`

const MobileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
  padding: 0 1rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
  border-bottom: 1px solid rgba(239, 68, 68, 0.2);
`

const BrandText = styled.span`
  color: var(--heading-primary);
  font-weight: bold;
  font-size: 1.125rem;
`

const CloseButton = styled.button`
  color: var(--text-secondary);
  
  &:hover {
    color: var(--heading-primary);
  }
`

const DesktopSidebar = styled.div`
  display: none;
  
  @media (min-width: 1024px) {
    display: flex;
    flex-shrink: 0;
  }
`

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 16rem;
`

const SidebarContent = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: #000000;
  border-right: 1px solid rgba(239, 68, 68, 0.2);
  padding-top: 1.25rem;
  padding-bottom: 1rem;
  overflow-y: auto;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(220, 38, 38, 0.03) 0%, transparent 50%);
    pointer-events: none;
  }
`

const DesktopBrandContainer = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 1rem;
  position: relative;
  z-index: 1;
`

const DesktopBrandText = styled.span`
  color: var(--heading-primary);
  font-weight: bold;
  font-size: 1.25rem;
`

const MobileMenuButton = styled.button`
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 30;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }
  
  @media (min-width: 1024px) {
    display: none;
  }
`

const NavigationContainer = styled.div`
  margin-top: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
`

const Navigation = styled.nav`
  flex: 1;
  padding: 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const NavigationLink = styled(Link)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 12px;
  transition: all 0.3s ease;
  color: ${props => props.$isActive ? 'white' : 'var(--text-secondary)'};
  background: ${props => props.$isActive ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent'};
  border: 1px solid ${props => props.$isActive ? 'rgba(239, 68, 68, 0.3)' : 'transparent'};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    background: ${props => props.$isActive ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : 'rgba(239, 68, 68, 0.1)'};
    color: ${props => props.$isActive ? 'white' : 'var(--heading-primary)'};
    transform: translateX(4px);
    border-color: rgba(239, 68, 68, 0.3);
    
    &::before {
      opacity: 1;
    }
  }
`

const NavigationSeparator = styled.div`
  height: 1px;
  background: rgba(239, 68, 68, 0.2);
  margin: 0.75rem 0.5rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 4px;
    background: rgba(239, 68, 68, 0.4);
    border-radius: 50%;
  }
`

const NavigationIcon = styled.div<{ $isActive: boolean }>`
  margin-right: 0.75rem;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  color: ${props => props.$isActive ? 'white' : 'var(--text-muted)'};
  transition: all 0.3s ease;

  ${NavigationLink}:hover & {
    color: ${props => props.$isActive ? 'white' : 'var(--heading-primary)'};
    transform: scale(1.1);
  }
`

const UserSection = styled.div`
  flex-shrink: 0;
  display: flex;
  border-top: 1px solid rgba(239, 68, 68, 0.2);
  padding: 1rem;
  position: relative;
  z-index: 1;
  background: rgba(239, 68, 68, 0.05);
`

const UserContainer = styled.div`
  flex-shrink: 0;
  width: 100%;
  display: block;
`

const UserInfo = styled.div`
  display: flex;
  align-items: center;
`

const UserDetails = styled.div`
  margin-left: 0.75rem;
`

const UserName = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
`

const SignOutButton = styled.button`
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    color: var(--heading-primary);
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    transform: translateX(2px);
    
    &::before {
      opacity: 1;
    }
    
    svg {
      transform: scale(1.1);
    }
  }
  
  &:active {
    transform: translateX(1px);
    background: rgba(239, 68, 68, 0.15);
  }
  
  svg {
    transition: transform 0.2s ease;
  }
`

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const navigation = [
    // Core Features
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, current: pathname === '/dashboard' },
    { name: 'Clients', href: '/clients', icon: Users, current: pathname === '/clients' },
    { name: 'Projects', href: '/projects', icon: Briefcase, current: pathname === '/projects' },
    { name: 'Invoices', href: '/invoices', icon: FileText, current: pathname === '/invoices' },
    { name: 'Expenses', href: '/expenses', icon: Receipt, current: pathname === '/expenses' },
    
    // Financial Management
    { name: 'Budgets', href: '/budgets', icon: Target, current: pathname === '/budgets' },
    { name: 'Savings', href: '/savings', icon: PiggyBank, current: pathname === '/savings' },
    { name: 'Budget Comparison', href: '/budget-comparison', icon: TrendingUp, current: pathname === '/budget-comparison' },
    { name: 'Budget Alerts', href: '/budget-alerts', icon: AlertTriangle, current: pathname === '/budget-alerts' },
    
    // Recurring Features
    { name: 'Recurring Invoices', href: '/recurring-invoices', icon: RefreshCw, current: pathname === '/recurring-invoices' },
    { name: 'Subscriptions', href: '/subscriptions', icon: Repeat, current: pathname === '/subscriptions' },
    { name: 'Recurring Income', href: '/recurring-income', icon: Clock, current: pathname === '/recurring-income' },
    { name: 'Payment Reminders', href: '/payment-reminders', icon: Bell, current: pathname === '/payment-reminders' },
    
    // Advanced Reports
    { name: 'Reports', href: '/reports', icon: BarChart3, current: pathname === '/reports' },
    { name: 'Profit & Loss', href: '/profit-loss', icon: Calculator, current: pathname === '/profit-loss' },
    { name: 'Cash Flow', href: '/cash-flow', icon: DollarSign, current: pathname === '/cash-flow' },
    { name: 'Tax Reports', href: '/tax-reports', icon: Calendar, current: pathname === '/tax-reports' },
    { name: 'Business Metrics', href: '/business-metrics', icon: Activity, current: pathname === '/business-metrics' },
    
    // Settings
    { name: 'Settings', href: '/settings', icon: Settings, current: pathname === '/settings' },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <SidebarOverlay onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <MobileSidebar isOpen={sidebarOpen}>
        <MobileHeader>
          <BrandText>Quantumnexa</BrandText>
          <CloseButton onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </CloseButton>
        </MobileHeader>
        <SidebarContentComponent pathname={pathname} onSignOut={handleSignOut} user={user || { email: undefined }} navigation={navigation} />
      </MobileSidebar>

      {/* Desktop sidebar */}
      <DesktopSidebar>
        <SidebarContainer>
          <SidebarContent>
            <DesktopBrandContainer>
              <DesktopBrandText>Quantumnexa Finance</DesktopBrandText>
            </DesktopBrandContainer>
            <SidebarContentComponent pathname={pathname} onSignOut={handleSignOut} user={user || { email: undefined }} navigation={navigation} />
          </SidebarContent>
        </SidebarContainer>
      </DesktopSidebar>

      {/* Mobile menu button */}
      <MobileMenuButton onClick={() => setSidebarOpen(true)}>
        <Menu size={24} />
      </MobileMenuButton>
    </>
  )
}

function SidebarContentComponent({ pathname, onSignOut, user, navigation }: { 
  pathname: string
  onSignOut: () => void
  user: { email?: string }
  navigation: Array<{ name: string; href: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }>
}) {
  // Group navigation items by category
  const coreFeatures = navigation.slice(0, 5) // Dashboard through Expenses
  const financialManagement = navigation.slice(5, 9) // Budgets through Budget Alerts
  const recurringFeatures = navigation.slice(9, 13) // Recurring Invoices through Payment Reminders
  const advancedReports = navigation.slice(13, 18) // Reports through Business Metrics
  const settings = navigation.slice(18) // Settings

  return (
    <NavigationContainer>
      <Navigation>
        {/* Core Features */}
        {coreFeatures.map((item) => {
          const isActive = pathname === item.href
          return (
            <NavigationLink
              key={item.name}
              href={item.href}
              $isActive={isActive}
            >
              <NavigationIcon $isActive={isActive}>
                <item.icon width={24} height={24} />
              </NavigationIcon>
              {item.name}
            </NavigationLink>
          )
        })}
        
        <NavigationSeparator />
        
        {/* Financial Management */}
        {financialManagement.map((item) => {
          const isActive = pathname === item.href
          return (
            <NavigationLink
              key={item.name}
              href={item.href}
              $isActive={isActive}
            >
              <NavigationIcon $isActive={isActive}>
                <item.icon width={24} height={24} />
              </NavigationIcon>
              {item.name}
            </NavigationLink>
          )
        })}
        
        <NavigationSeparator />
        
        {/* Recurring Features */}
        {recurringFeatures.map((item) => {
          const isActive = pathname === item.href
          return (
            <NavigationLink
              key={item.name}
              href={item.href}
              $isActive={isActive}
            >
              <NavigationIcon $isActive={isActive}>
                <item.icon width={24} height={24} />
              </NavigationIcon>
              {item.name}
            </NavigationLink>
          )
        })}
        
        <NavigationSeparator />
        
        {/* Advanced Reports */}
        {advancedReports.map((item) => {
          const isActive = pathname === item.href
          return (
            <NavigationLink
              key={item.name}
              href={item.href}
              $isActive={isActive}
            >
              <NavigationIcon $isActive={isActive}>
                <item.icon width={24} height={24} />
              </NavigationIcon>
              {item.name}
            </NavigationLink>
          )
        })}
        
        <NavigationSeparator />
        
        {/* Settings */}
        {settings.map((item) => {
          const isActive = pathname === item.href
          return (
            <NavigationLink
              key={item.name}
              href={item.href}
              $isActive={isActive}
            >
              <NavigationIcon $isActive={isActive}>
                <item.icon width={24} height={24} />
              </NavigationIcon>
              {item.name}
            </NavigationLink>
          )
        })}
      </Navigation>
      
      {/* User info and sign out */}
      <UserSection>
        <UserContainer>
          <UserInfo>
            <UserDetails>
              <UserName>
                {user?.email || 'User'}
              </UserName>
              <SignOutButton onClick={onSignOut}>
                <LogOut size={16} style={{ marginRight: '0.25rem' }} />
                Sign out
              </SignOutButton>
            </UserDetails>
          </UserInfo>
        </UserContainer>
      </UserSection>
    </NavigationContainer>
  )
}