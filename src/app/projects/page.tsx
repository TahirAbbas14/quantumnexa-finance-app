'use client'

import { useState, useEffect } from 'react'
import styled from 'styled-components'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { createSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatPKR } from '@/lib/currency'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Plus, Search, Edit, Trash2, Calendar, DollarSign, User, Briefcase, Clock, Target, AlertCircle, CheckCircle, Pause, X, Filter } from 'lucide-react'
import { format } from 'date-fns'

// Styled Components matching dashboard theme
const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  padding: 32px;
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(30, 30, 30, 0.9) 100%);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(220, 38, 38, 0.6) 50%, 
      transparent 100%
    );
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.03) 0%, transparent 50%, rgba(220, 38, 38, 0.03) 100%);
    pointer-events: none;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
    padding: 24px;
  }
`;

const HeaderContent = styled.div`
  position: relative;
  z-index: 1;

  h1 {
    font-size: 36px;
    font-weight: 800;
    background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #dc2626 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 12px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 16px;

    &::before {
      content: '';
      width: 6px;
      height: 36px;
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      border-radius: 3px;
      box-shadow: 
        0 0 15px rgba(220, 38, 38, 0.4),
        0 0 30px rgba(220, 38, 38, 0.2);
    }
  }
  
  p {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 400;
    line-height: 1.6;
    max-width: 500px;
    margin: 0;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 28px;
    }
    
    p {
      font-size: 16px;
    }
  }
`;

const StyledButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.9) 100%);
  color: white;
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 32px rgba(220, 38, 38, 0.3),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(239, 68, 68, 1) 100%);
    border-color: rgba(220, 38, 38, 0.5);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 
      0 12px 48px rgba(220, 38, 38, 0.4),
      0 0 0 1px rgba(220, 38, 38, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  &:hover::before {
    left: 100%;
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
    box-shadow: 
      0 6px 24px rgba(220, 38, 38, 0.3),
      0 0 0 1px rgba(220, 38, 38, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  svg {
    width: 20px;
    height: 20px;
    transition: all 0.3s ease;
  }

  &:hover svg {
    transform: rotate(90deg) scale(1.1);
  }

  @media (max-width: 768px) {
    justify-content: center;
    width: 100%;
    padding: 14px 24px;
  }
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInput = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;
  
  input {
    width: 100%;
    padding: 16px 20px 16px 48px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(220, 38, 38, 0.2);
    border-radius: 16px;
    color: white;
    font-size: 14px;
    font-weight: 400;
    backdrop-filter: blur(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 4px 20px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
      font-weight: 400;
    }
    
    &:focus {
      outline: none;
      border-color: rgba(220, 38, 38, 0.4);
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 
        0 0 0 3px rgba(220, 38, 38, 0.1),
        0 8px 32px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
      transform: translateY(-1px);
    }
    
    &:hover:not(:focus) {
      border-color: rgba(220, 38, 38, 0.3);
      background: rgba(255, 255, 255, 0.07);
      transform: translateY(-0.5px);
    }
  }
  
  svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(220, 38, 38, 0.6);
    width: 18px;
    height: 18px;
    transition: all 0.3s ease;
    z-index: 1;
  }
  
  &:focus-within svg {
    color: rgba(220, 38, 38, 0.8);
    transform: translateY(-50%) scale(1.1);
  }
`;

const FilterSelect = styled.select`
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 16px;
  color: white;
  font-size: 14px;
  font-weight: 400;
  backdrop-filter: blur(20px);
  min-width: 160px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  option {
    background: rgba(20, 20, 20, 0.95);
    color: white;
    padding: 12px;
    border: none;
  }
  
  &:focus {
    outline: none;
    border-color: rgba(220, 38, 38, 0.4);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 
      0 0 0 3px rgba(220, 38, 38, 0.1),
      0 8px 32px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
  
  &:hover:not(:focus) {
    border-color: rgba(220, 38, 38, 0.3);
    background: rgba(255, 255, 255, 0.07);
    transform: translateY(-0.5px);
  }
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const ProjectCard = styled(Card)<{ $status: string }>`
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(220, 38, 38, 0.15);
  backdrop-filter: blur(20px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(220, 38, 38, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: rgba(220, 38, 38, 0.25);
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(220, 38, 38, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      switch (props.$status) {
        case 'active': return 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
        case 'completed': return 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)';
        case 'on_hold': return 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';
        case 'cancelled': return 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)';
        default: return 'linear-gradient(90deg, #6b7280 0%, #9ca3af 100%)';
      }
    }};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.02) 0%, transparent 50%, rgba(220, 38, 38, 0.02) 100%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::after {
    opacity: 1;
  }
`;

const ProjectHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  
  h3 {
    color: white;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    flex: 1;
    margin-right: 16px;
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  display: flex;
  align-items: center;
  gap: 6px;
  
  ${props => {
    switch (props.status) {
      case 'active':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: var(--success-400);
          border: 1px solid rgba(34, 197, 94, 0.3);
        `;
      case 'completed':
        return `
          background: rgba(59, 130, 246, 0.2);
          color: var(--primary-400);
          border: 1px solid rgba(59, 130, 246, 0.3);
        `;
      case 'on_hold':
        return `
          background: rgba(245, 158, 11, 0.2);
          color: var(--warning-400);
          border: 1px solid rgba(245, 158, 11, 0.3);
        `;
      case 'cancelled':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: var(--error-400);
          border: 1px solid rgba(239, 68, 68, 0.3);
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.2);
          color: var(--gray-400);
          border: 1px solid rgba(156, 163, 175, 0.3);
        `;
    }
  }}
`;

const ProjectDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
  line-height: 1.6;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProjectDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  
  svg {
    width: 16px;
    height: 16px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .value {
    font-weight: 500;
    color: white;
  }
`;

const ProjectFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CreatedDate = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  
  button {
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
    
    &:hover.delete {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.3);
      color: var(--error-400);
    }
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 32px;
  color: rgba(255, 255, 255, 0.8);
  
  svg {
    width: 64px;
    height: 64px;
    margin: 0 auto 24px;
    color: rgba(255, 255, 255, 0.4);
  }
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
    color: white;
  }
  
  p {
    margin-bottom: 32px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 16px;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
  animation: fadeIn 0.3s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled.div`
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 
    0 25px 80px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(220, 38, 38, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(220, 38, 38, 0.6) 50%, 
      transparent 100%
    );
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.03) 0%, transparent 50%, rgba(220, 38, 38, 0.03) 100%);
    pointer-events: none;
    border-radius: 24px;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const ModalHeader = styled.div`
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
  
  h3 {
    color: white;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #dc2626 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: flex;
    align-items: center;
    gap: 12px;
    
    &::before {
      content: '';
      width: 4px;
      height: 28px;
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      border-radius: 2px;
      box-shadow: 
        0 0 10px rgba(220, 38, 38, 0.4),
        0 0 20px rgba(220, 38, 38, 0.2);
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
  
  label {
    display: block;
    color: white;
    font-weight: 600;
    margin-bottom: 12px;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(220, 38, 38, 0.2);
    border-radius: 16px;
    color: white;
    font-size: 14px;
    font-weight: 400;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(20px);
    box-shadow: 
      0 4px 20px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
      font-weight: 400;
    }
    
    &:focus {
      outline: none;
      border-color: rgba(220, 38, 38, 0.4);
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 
        0 0 0 3px rgba(220, 38, 38, 0.1),
        0 8px 32px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
      transform: translateY(-1px);
    }
    
    &:hover:not(:focus) {
      border-color: rgba(220, 38, 38, 0.3);
      background: rgba(255, 255, 255, 0.07);
      transform: translateY(-0.5px);
    }
  }
  
  select option {
    background: rgba(20, 20, 20, 0.95);
    color: white;
    padding: 12px;
    border: none;
  }
  
  textarea {
    resize: vertical;
    min-height: 120px;
    font-family: inherit;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--error-400);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 14px;
`;

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  project_type: 'retainer' | 'one_time' | 'maintenance';
  pricing_type?: 'fixed' | 'hourly';
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  budget?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  currency: string;
  priority: 'low' | 'medium' | 'high';
  progress: number;
  estimated_hours?: number;
  actual_hours?: number;
  notes?: string;
  clients?: {
    name: string;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchClients();
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching projects');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase!
        .from('projects')
        .select(`
          *,
          clients (
            name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching projects:', error);
        throw error;
      }
      console.log('Projects fetched successfully:', data?.length || 0, 'projects');
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching clients');
      return;
    }

    try {
      const { data, error } = await supabase!
        .from('clients')
        .select('id, name')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Supabase error fetching clients:', error);
        throw error;
      }
      console.log('Clients fetched successfully:', data?.length || 0, 'clients');
      setClients((data as Client[]) || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      if (!supabase) {
      console.error('Supabase client is not available');
        setLoading(false);
        return;
      }
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditForm(true);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Target className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'on_hold': return <Pause className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container>
          <LoadingSpinner>
            <div className="spinner"></div>
          </LoadingSpinner>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <HeaderContent>
            <h1>Projects</h1>
            <p>Manage your client projects and track their progress</p>
          </HeaderContent>
        </Header>

        <TopSection>
          <FilterSection>
            <SearchInput>
              <Search />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchInput>
            <FilterSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </FilterSelect>
          </FilterSection>
          <StyledButton onClick={() => setShowAddForm(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Project
          </StyledButton>
        </TopSection>

        {filteredProjects.length === 0 ? (
          <EmptyState>
            <Briefcase />
            <h3>No projects found</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'No projects match your current filters.' 
                : 'Get started by creating your first project.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <StyledButton onClick={() => setShowAddForm(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Project
              </StyledButton>
            )}
          </EmptyState>
        ) : (
          <ProjectsGrid>
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} $status={project.status}>
                <ProjectHeader>
                  <h3>{project.name}</h3>
                  <StatusBadge status={project.status}>
                    {getStatusIcon(project.status)}
                    {project.status.replace('_', ' ')}
                  </StatusBadge>
                </ProjectHeader>
                
                {project.description && (
                  <ProjectDescription>{project.description}</ProjectDescription>
                )}
                
                <ProjectDetails>
                  {project.clients && (
                    <DetailItem>
                      <User />
                      <span>{project.clients.name}</span>
                    </DetailItem>
                  )}
                  
                  {project.budget && (
                    <DetailItem>
                      <DollarSign />
                      <span>{formatPKR(project.budget)}</span>
                    </DetailItem>
                  )}
                  
                  {project.start_date && (
                    <DetailItem>
                      <Calendar />
                      <span>
                        {format(new Date(project.start_date), 'MMM d, yyyy')}
                        {project.end_date && ` - ${format(new Date(project.end_date), 'MMM d, yyyy')}`}
                      </span>
                    </DetailItem>
                  )}

                  {project.estimated_hours && (
                    <DetailItem>
                      <Clock />
                      <span>
                        {project.actual_hours || 0} / {project.estimated_hours} hours
                        {project.progress && ` (${project.progress}%)`}
                      </span>
                    </DetailItem>
                  )}
                </ProjectDetails>
                
                <ProjectFooter>
                  <CreatedDate>
                    Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                  </CreatedDate>
                  <ActionButtons>
                    <button 
                      title="Edit Project"
                      onClick={() => handleEditProject(project)}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      className="delete"
                      title="Delete Project"
                      onClick={() => deleteProject(project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </ActionButtons>
                </ProjectFooter>
              </ProjectCard>
            ))}
          </ProjectsGrid>
        )}

        {showAddForm && (
          <AddProjectModal
            clients={clients}
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              setShowAddForm(false);
              fetchProjects();
            }}
          />
        )}

        {showEditForm && editingProject && (
          <EditProjectModal
            project={editingProject}
            clients={clients}
            onClose={() => {
              setShowEditForm(false);
              setEditingProject(null);
            }}
            onSuccess={() => {
              setShowEditForm(false);
              setEditingProject(null);
              fetchProjects();
            }}
          />
        )}
      </Container>
    </DashboardLayout>
  );
}

function EditProjectModal({ 
  project,
  clients, 
  onClose, 
  onSuccess 
}: { 
  project: Project;
  clients: Client[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: project.name || '',
    description: project.description || '',
    client_id: project.client_id || '',
    project_type: project.project_type || 'one_time',
    pricing_type: project.pricing_type || 'fixed',
    status: project.status || 'active',
    budget: project.budget ? project.budget.toString() : '',
    start_date: project.start_date || '',
    end_date: project.end_date || '',
    currency: project.currency || 'PKR',
    priority: project.priority || 'medium',
    progress: project.progress ? project.progress.toString() : '0',
    estimated_hours: project.estimated_hours ? project.estimated_hours.toString() : '',
    notes: project.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createSupabaseClient();

    // Check if user is authenticated
    if (!user?.id) {
      setError('You must be logged in to edit a project');
      setLoading(false);
      return;
    }

    console.log('Updating project with user ID:', user.id);

    try {
      const projectData = {
        name: formData.name,
        description: formData.description || null,
        client_id: formData.client_id,
        project_type: formData.project_type,
        pricing_type: formData.project_type === 'one_time' ? formData.pricing_type : null,
        status: formData.status,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        currency: formData.currency,
        priority: formData.priority,
        progress: parseInt(formData.progress),
        estimated_hours: (formData.project_type === 'one_time' && formData.pricing_type === 'hourly' && formData.estimated_hours) ? parseFloat(formData.estimated_hours) : null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      };

      console.log('Project data to update:', projectData);

      if (!supabase) {
        console.error('Supabase client is not available');
        setError('Database connection unavailable. Please refresh and try again.');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', project.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Project updated successfully');
      onSuccess();
    } catch (error: unknown) {
      console.error('Error updating project:', error);
      setError((error as Error).message || 'Failed to update project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>Edit Project</h3>
        </ModalHeader>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Project Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
            />
          </FormGroup>
          
          <FormGroup>
            <label>Client *</label>
            <select
              required
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </FormGroup>
          
          <FormGroup>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project description..."
            />
          </FormGroup>
          
          <FormGrid>
            <FormGroup>
              <label>Project Type *</label>
              <select
                required
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value as 'retainer' | 'one_time' | 'maintenance' })}
              >
                <option value="one_time">One-Time Project</option>
                <option value="retainer">Marketing Retainer</option>
                <option value="maintenance">Maintenance Contract</option>
              </select>
            </FormGroup>
            
            {formData.project_type === 'one_time' && (
              <FormGroup>
                <label>Pricing Type *</label>
                <select
                  required
                  value={formData.pricing_type}
                  onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value as 'fixed' | 'hourly' })}
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </FormGroup>
            )}
            
            <FormGroup>
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "completed" | "on_hold" | "cancelled" })}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </FormGroup>
          </FormGrid>
          
          <FormGrid>
            <FormGroup>
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </FormGroup>
            
            <FormGroup>
              <label>Budget (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
              />
            </FormGroup>
          </FormGrid>
          
          {formData.project_type === 'one_time' && formData.pricing_type === 'hourly' && (
            <FormGrid>
              <FormGroup>
                <label>Estimated Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  placeholder="0"
                />
              </FormGroup>
            </FormGrid>
          )}
          
          <FormGrid>
            <FormGroup>
              <label>Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </FormGroup>
            
            <FormGroup>
              <label>End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </FormGroup>
          </FormGrid>

          <FormGroup>
            <label>Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
              placeholder="0"
            />
          </FormGroup>

          <FormGroup>
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </FormGroup>

          <ModalActions>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Project'}
            </Button>
          </ModalActions>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}

function AddProjectModal({ 
  clients, 
  onClose, 
  onSuccess 
}: { 
  clients: Client[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    project_type: 'one_time',
    pricing_type: 'fixed',
    status: 'active',
    budget: '',
    start_date: '',
    end_date: '',
    currency: 'PKR',
    priority: 'medium',
    progress: '0',
    estimated_hours: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const supabase = createSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createSupabaseClient();

    // Check if user is authenticated
    if (!user?.id) {
      setError('You must be logged in to add a project');
      setLoading(false);
      return;
    }

    console.log('Submitting project with user ID:', user.id);

    try {
      const projectData = {
        name: formData.name,
        description: formData.description || null,
        client_id: formData.client_id,
        project_type: formData.project_type,
        pricing_type: formData.project_type === 'one_time' ? formData.pricing_type : null,
        status: formData.status,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        currency: formData.currency,
        priority: formData.priority,
        progress: parseInt(formData.progress),
        estimated_hours: (formData.project_type === 'one_time' && formData.pricing_type === 'hourly' && formData.estimated_hours) ? parseFloat(formData.estimated_hours) : null,
        notes: formData.notes || null,
        user_id: user?.id
      };

      console.log('Project data to insert:', projectData);

      if (!supabase) {
        console.error('Supabase client is not available');
        setError('Supabase client is not available');
        setLoading(false);
        return;
      }
      const { error } = await supabase
        .from('projects')
        .insert([projectData]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Project added successfully');
      onSuccess();
    } catch (error: unknown) {
      console.error('Error creating project:', error);
      setError(error instanceof Error ? error.message : 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>Add New Project</h3>
        </ModalHeader>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Project Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
            />
          </FormGroup>
          
          <FormGroup>
            <label>Client *</label>
            <select
              required
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </FormGroup>
          
          <FormGroup>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project description..."
            />
          </FormGroup>
          
          <FormGrid>
            <FormGroup>
              <label>Project Type *</label>
              <select
                required
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
              >
                <option value="one_time">One-Time Project</option>
                <option value="retainer">Marketing Retainer</option>
                <option value="maintenance">Maintenance Contract</option>
              </select>
            </FormGroup>
            
            {formData.project_type === 'one_time' && (
              <FormGroup>
                <label>Pricing Type *</label>
                <select
                  required
                  value={formData.pricing_type}
                  onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value })}
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </FormGroup>
            )}
            
            <FormGroup>
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </FormGroup>
          </FormGrid>
          
          <FormGrid>
            <FormGroup>
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </FormGroup>
            
            <FormGroup>
              <label>Budget (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
              />
            </FormGroup>
          </FormGrid>
          
          {formData.project_type === 'one_time' && formData.pricing_type === 'hourly' && (
            <FormGrid>
              <FormGroup>
                <label>Estimated Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  placeholder="0"
                />
              </FormGroup>
            </FormGrid>
          )}
          
          <FormGrid>
            <FormGroup>
              <label>Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </FormGroup>
            
            <FormGroup>
              <label>End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </FormGroup>
          </FormGrid>

          <FormGroup>
            <label>Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
            />
          </FormGroup>
          
          <FormGroup>
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </FormGroup>
          
          <ModalActions>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Project'}
            </Button>
          </ModalActions>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}