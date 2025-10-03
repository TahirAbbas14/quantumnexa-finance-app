'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '@/components/layout/DashboardLayout'
import styled from 'styled-components'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Save,
  Eye,
  EyeOff,
  Bell,
  Shield
} from 'lucide-react'

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: transparent;
  color: white;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
`

const ContentWrapper = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 1.5rem;
  }
`

const Sidebar = styled.div`
  width: 280px;
  
  @media (max-width: 1024px) {
    width: 100%;
  }
`

const TabButton = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  margin-bottom: 0.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)'
    : 'rgba(255, 255, 255, 0.05)'
  };
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.$active 
    ? 'rgba(220, 38, 38, 0.3)'
    : 'rgba(255, 255, 255, 0.1)'
  };
  color: ${props => props.$active ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.8)'};
  
  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(239, 68, 68, 0.2) 100%)'
      : 'rgba(255, 255, 255, 0.1)'
    };
    transform: translateY(-2px);
  }
  
  svg {
    margin-right: 0.75rem;
    width: 20px;
    height: 20px;
  }
`

const ContentArea = styled.div`
  flex: 1;
`

const SettingsCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1.5rem;
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const FormGroup = styled.div`
  &.full-width {
    grid-column: 1 / -1;
  }
`

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
`

const InputWrapper = styled.div`
  position: relative;
`

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    background: rgba(255, 255, 255, 0.15);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }
`

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    background: rgba(255, 255, 255, 0.15);
  }
`

const IconWrapper = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  z-index: 1;
`

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(220, 38, 38, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const NotificationItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`

const NotificationInfo = styled.div`
  flex: 1;
`

const NotificationTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: white;
  margin-bottom: 0.25rem;
`

const NotificationDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  cursor: pointer;
`

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%);
  }
  
  &:checked + span:before {
    transform: translateX(26px);
  }
`

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2);
  transition: 0.3s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`

const PasswordSection = styled.div`
  margin-bottom: 2rem;
`

const PasswordTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 500;
  color: white;
  margin-bottom: 1rem;
`

const PasswordGrid = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`

const PasswordInputWrapper = styled.div`
  position: relative;
`

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: rgba(255, 255, 255, 0.8);
  }
`

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
`

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(239, 68, 68, 0.3);
  border-top: 3px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

interface UserProfile {
  full_name: string
  email: string
  phone?: string
  address?: string
  company?: string
  avatar_url?: string
}

interface NotificationSettings {
  email_notifications: boolean
  invoice_reminders: boolean
  payment_alerts: boolean
  expense_alerts: boolean
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    company: ''
  })
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    invoice_reminders: true,
    payment_alerts: true,
    expense_alerts: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      // Fetch user profile
      const { data: profileData } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: user?.email || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          company: profileData.company || ''
        })
      } else {
        // Create profile if it doesn't exist
        setProfile({
          full_name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
          phone: '',
          address: '',
          company: ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async () => {
    try {
      setSaving(true)
      
      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          company: profile.company,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    try {
      setSaving(true)
      
      if (!supabase) {
        throw new Error('Supabase client is not initialized')
      }
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      alert('Password updated successfully!')
    } catch (error) {
      console.error('Error updating password:', error)
      alert('Error updating password')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield }
  ]

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
        <Header>
          <Title>Settings</Title>
          <Subtitle>Manage your account settings and preferences</Subtitle>
        </Header>

        <ContentWrapper>
          <Sidebar>
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabButton
                  key={tab.id}
                  $active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon />
                  {tab.name}
                </TabButton>
              )
            })}
          </Sidebar>

          <ContentArea>
            {activeTab === 'profile' && (
              <SettingsCard>
                <CardTitle>Profile Information</CardTitle>
                
                <FormGrid>
                  <FormGroup>
                    <Label>Full Name</Label>
                    <InputWrapper>
                      <IconWrapper>
                        <User size={20} />
                      </IconWrapper>
                      <Input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </InputWrapper>
                  </FormGroup>

                  <FormGroup>
                    <Label>Email Address</Label>
                    <InputWrapper>
                      <IconWrapper>
                        <Mail size={20} />
                      </IconWrapper>
                      <Input
                        type="email"
                        value={profile.email}
                        disabled
                        placeholder="Email address"
                      />
                    </InputWrapper>
                  </FormGroup>

                  <FormGroup>
                    <Label>Phone Number</Label>
                    <InputWrapper>
                      <IconWrapper>
                        <Phone size={20} />
                      </IconWrapper>
                      <Input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="Enter your phone number"
                      />
                    </InputWrapper>
                  </FormGroup>

                  <FormGroup>
                    <Label>Company</Label>
                    <InputWrapper>
                      <IconWrapper>
                        <Building size={20} />
                      </IconWrapper>
                      <Input
                        type="text"
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        placeholder="Enter your company name"
                      />
                    </InputWrapper>
                  </FormGroup>

                  <FormGroup className="full-width">
                    <Label>Address</Label>
                    <InputWrapper>
                      <IconWrapper>
                        <MapPin size={20} />
                      </IconWrapper>
                      <TextArea
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="Enter your address"
                      />
                    </InputWrapper>
                  </FormGroup>
                </FormGrid>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <SaveButton
                    onClick={handleProfileSave}
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </SaveButton>
                </div>
              </SettingsCard>
            )}

            {activeTab === 'notifications' && (
              <SettingsCard>
                <CardTitle>Notification Preferences</CardTitle>
                
                <div>
                  {Object.entries(notifications).map(([key, value]) => (
                    <NotificationItem key={key}>
                      <NotificationInfo>
                        <NotificationTitle>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </NotificationTitle>
                        <NotificationDescription>
                          {key === 'email_notifications' && 'Receive email notifications for important updates'}
                          {key === 'invoice_reminders' && 'Get reminders for overdue invoices'}
                          {key === 'payment_alerts' && 'Notifications when payments are received'}
                          {key === 'expense_alerts' && 'Alerts for expense tracking and budgets'}
                        </NotificationDescription>
                      </NotificationInfo>
                      <Toggle>
                        <ToggleInput
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                        />
                        <ToggleSlider />
                      </Toggle>
                    </NotificationItem>
                  ))}
                </div>
              </SettingsCard>
            )}

            {activeTab === 'security' && (
              <SettingsCard>
                <CardTitle>Security Settings</CardTitle>
                
                <PasswordSection>
                  <PasswordTitle>Change Password</PasswordTitle>
                  <PasswordGrid>
                    <div>
                      <Label>Current Password</Label>
                      <PasswordInputWrapper>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                          style={{ paddingLeft: '1rem', paddingRight: '3rem' }}
                        />
                        <PasswordToggle
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </PasswordToggle>
                      </PasswordInputWrapper>
                    </div>

                    <div>
                      <Label>New Password</Label>
                      <Input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        style={{ paddingLeft: '1rem' }}
                      />
                    </div>

                    <div>
                      <Label>Confirm New Password</Label>
                      <Input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        style={{ paddingLeft: '1rem' }}
                      />
                    </div>
                  </PasswordGrid>

                  <SaveButton
                    onClick={handlePasswordChange}
                    disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </SaveButton>
                </PasswordSection>
              </SettingsCard>
            )}
          </ContentArea>
        </ContentWrapper>
      </Container>
    </DashboardLayout>
  )
}