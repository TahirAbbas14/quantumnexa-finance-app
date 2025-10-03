'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Zap } from 'lucide-react'
import styled from 'styled-components'

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: #000000;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(220, 38, 38, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(248, 113, 113, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
`

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    display: none;
  }
`

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    flex: none;
    width: 100%;
  }
`

const BrandSection = styled.div`
  text-align: center;
  max-width: 500px;
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  
  .icon {
    width: 3rem;
    height: 3rem;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
`

const BrandName = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--heading-primary);
  margin-bottom: 1rem;
`

const BrandTagline = styled.p`
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
`

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
`

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--text-primary);
  
  .icon {
    width: 2rem;
    height: 2rem;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--heading-primary);
  }
`

const LoginCard = styled.div`
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-primary);
  border-radius: 24px;
  padding: 3rem;
  width: 100%;
  max-width: 450px;
  box-shadow: var(--shadow-xl);
`

const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h2 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--heading-primary);
    margin-bottom: 0.5rem;
  }
  
  p {
    color: var(--text-secondary);
    font-size: 1rem;
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--border-accent);
  color: #fca5a5;
  padding: 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
`

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
`

const InputWrapper = styled.div`
  position: relative;
`

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: var(--text-muted);
  }
  
  &:focus {
    outline: none;
    border-color: var(--heading-primary);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    background: var(--bg-glass);
  }
`

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
`

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--text-secondary);
    transform: translateY(-50%) scale(1.1);
  }
`

const ForgotPassword = styled.div`
  text-align: right;
  
  a {
    color: var(--heading-primary);
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
    
    &:hover {
      color: var(--heading-secondary);
      text-decoration: underline;
    }
  }
`

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`

const SignupLink = styled.div`
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-primary);
  
  p {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
`

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginContainer>
      <LeftPanel>
        <BrandSection>
          <Logo>
            <div className="icon">
              <Zap size={24} />
            </div>
            <BrandName>QuantumNexa</BrandName>
          </Logo>
          
          <BrandTagline>
            Your Vision, Our Technology, Limitless Potential
          </BrandTagline>
          
          <FeatureList>
            <Feature>
              <div className="icon">
                <ArrowRight size={16} />
              </div>
              <span>Advanced Financial Analytics</span>
            </Feature>
            <Feature>
              <div className="icon">
                <ArrowRight size={16} />
              </div>
              <span>Real-time Business Insights</span>
            </Feature>
            <Feature>
              <div className="icon">
                <ArrowRight size={16} />
              </div>
              <span>Secure Cloud Infrastructure</span>
            </Feature>
          </FeatureList>
        </BrandSection>
      </LeftPanel>
      
      <RightPanel>
        <LoginCard>
          <LoginHeader>
            <h2>Welcome Back</h2>
            <p>Sign in to your QuantumNexa Finance account</p>
          </LoginHeader>
          
          <Form onSubmit={handleSubmit}>
            {error && (
              <ErrorMessage>
                {error}
              </ErrorMessage>
            )}
            
            <InputGroup>
              <Label htmlFor="email">Email Address</Label>
              <InputWrapper>
                <InputIcon>
                  <Mail size={20} />
                </InputIcon>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </InputWrapper>
            </InputGroup>
            
            <InputGroup>
              <Label htmlFor="password">Password</Label>
              <InputWrapper>
                <InputIcon>
                  <Lock size={20} />
                </InputIcon>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </PasswordToggle>
              </InputWrapper>
            </InputGroup>

            <ForgotPassword>
              <a href="/forgot-password">Forgot your password?</a>
            </ForgotPassword>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? 'Signing In...' : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </SubmitButton>

            <SignupLink>
              <p>
                For account access, please contact your system administrator.
              </p>
            </SignupLink>
          </Form>
        </LoginCard>
      </RightPanel>
    </LoginContainer>
  )
}