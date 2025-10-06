import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import StyledComponentsRegistry from '@/lib/registry'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quantumnexa Finance - Financial Management System',
  description: 'Comprehensive financial management system for businesses',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <AuthProvider>
            {children}
          </AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
