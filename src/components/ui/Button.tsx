'use client';

import styled from 'styled-components';
import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const StyledButton = styled.button<{
  $variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  $size?: 'sm' | 'md' | 'lg';
  $loading?: boolean;
  $fullWidth?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: none;
  cursor: pointer;
  font-family: inherit;
  
  ${({ $fullWidth }) => $fullWidth && 'width: 100%;'}
  
  ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return `
          padding: 8px 16px;
          font-size: 14px;
          height: 36px;
        `;
      case 'lg':
        return `
          padding: 16px 32px;
          font-size: 16px;
          height: 52px;
        `;
      default:
        return `
          padding: 12px 24px;
          font-size: 15px;
          height: 44px;
        `;
    }
  }}
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
            transform: translateY(-2px);
          }
          
          &:active {
            transform: translateY(0);
          }
        `;
      case 'secondary':
        return `
          background: linear-gradient(135deg, var(--secondary-500) 0%, var(--secondary-600) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, var(--secondary-600) 0%, var(--secondary-700) 100%);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
            transform: translateY(-2px);
          }
        `;
      case 'outline':
        return `
          background: rgba(0, 0, 0, 0.3);
          color: var(--primary-500);
          border: 2px solid var(--primary-500);
          backdrop-filter: blur(10px);
          
          &:hover:not(:disabled) {
            background: var(--primary-600);
            color: white;
            border-color: var(--primary-600);
            transform: translateY(-2px);
          }
        `;
      case 'ghost':
        return `
          background: transparent;
          color: white;
          
          &:hover:not(:disabled) {
            background: rgba(220, 38, 38, 0.2);
            color: white;
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, var(--error-500) 0%, var(--error-600) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, var(--error-600) 0%, #b91c1c 100%);
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
            transform: translateY(-2px);
          }
        `;
      default:
        return `
          background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
          color: white;
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
  
  ${({ $loading }) =>
    $loading &&
    `
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $loading={loading}
      $fullWidth={fullWidth}
      disabled={disabled || loading}
      {...props}
    >
      {!loading && children}
    </StyledButton>
  );
};

export default Button;