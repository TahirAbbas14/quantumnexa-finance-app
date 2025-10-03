import { LucideIcon } from 'lucide-react'
import styled from 'styled-components'

const Card = styled.div`
  background: white;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border-radius: 0.5rem;
`

const CardContent = styled.div`
  padding: 1.25rem;
`

const CardInner = styled.div`
  display: flex;
  align-items: center;
`

const IconContainer = styled.div`
  flex-shrink: 0;
`

const StyledIcon = styled.div<{ $iconColor: string }>`
  width: 1.5rem;
  height: 1.5rem;
  color: ${props => {
    switch (props.$iconColor) {
      case 'text-blue-600':
        return 'var(--blue-600)';
      case 'text-green-600':
        return 'var(--green-600)';
      case 'text-red-600':
        return 'var(--red-600)';
      case 'text-yellow-600':
        return 'var(--yellow-600)';
      case 'text-purple-600':
        return 'var(--purple-600)';
      case 'text-orange-600':
        return 'var(--orange-600)';
      case 'text-indigo-600':
        return 'var(--indigo-600)';
      default:
        return 'var(--blue-600)';
    }
  }};
`

const ContentContainer = styled.div`
  margin-left: 1.25rem;
  width: 0;
  flex: 1;
`

const DefinitionList = styled.dl`
  margin: 0;
`

const Title = styled.dt`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-500);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
`

const ValueContainer = styled.dd`
  display: flex;
  align-items: baseline;
  margin: 0;
`

const Value = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-900);
`

const Change = styled.div<{ $changeType: 'increase' | 'decrease' | 'neutral' }>`
  margin-left: 0.5rem;
  display: flex;
  align-items: baseline;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => {
    switch (props.$changeType) {
      case 'increase':
        return 'var(--green-600)';
      case 'decrease':
        return 'var(--red-600)';
      default:
        return 'var(--gray-600)';
    }
  }};
`

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: LucideIcon
  iconColor?: string
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-blue-600'
}: StatsCardProps) {
  return (
    <Card>
      <CardContent>
        <CardInner>
          <IconContainer>
            <StyledIcon $iconColor={iconColor}>
              <Icon size={24} />
            </StyledIcon>
          </IconContainer>
          <ContentContainer>
            <DefinitionList>
              <Title>
                {title}
              </Title>
              <ValueContainer>
                <Value>
                  {value}
                </Value>
                {change && (
                  <Change $changeType={changeType}>
                    {change}
                  </Change>
                )}
              </ValueContainer>
            </DefinitionList>
          </ContentContainer>
        </CardInner>
      </CardContent>
    </Card>
  )
}