'use client';

import styled from 'styled-components';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'gradient';
  onClick?: (e: React.MouseEvent) => void;
}

const StyledCard = styled.div.withConfig({
  shouldForwardProp: (prop) => !['hover'].includes(prop),
})<{
  $hover?: boolean;
  $padding?: 'sm' | 'md' | 'lg';
  $variant?: 'default' | 'glass' | 'gradient';
}>`
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  ${({ $padding }) => {
    switch ($padding) {
      case 'sm':
        return 'padding: 16px;';
      case 'lg':
        return 'padding: 32px;';
      default:
        return 'padding: 24px;';
    }
  }}
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'glass':
        return `
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(220, 38, 38, 0.3);
          box-shadow: 0 8px 32px rgba(220, 38, 38, 0.1);
        `;
      case 'gradient':
        return `
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(26, 26, 26, 0.8) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(220, 38, 38, 0.4);
          box-shadow: 0 20px 40px rgba(220, 38, 38, 0.1);
        `;
      default:
        return `
          background: rgba(0, 0, 0, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        `;
    }
  }}
  
  ${({ $hover }) =>
    $hover &&
    `
    cursor: pointer;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }
  `}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  }
`;

const CardHeader = styled.div`
  margin-bottom: 20px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: white;
    margin-bottom: 4px;
  }
  
  p {
    font-size: 14px;
    color: var(--gray-300);
  }
`;

const CardContent = styled.div`
  color: white;
`;

const CardFooter = styled.div`
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

export const Card = ({ 
  children, 
  className, 
  hover = false, 
  padding = 'md',
  variant = 'default',
  onClick
}: CardProps) => {
  return (
    <StyledCard 
      className={className}
      $hover={hover}
      $padding={padding}
      $variant={variant}
      onClick={onClick}
    >
      {children}
    </StyledCard>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;