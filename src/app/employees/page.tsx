'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import { formatPKR } from '@/lib/currency';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  Eye,
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Building, 
  MapPin,
  Calendar,
  Users,
  UserPlus,
  X,
  User,
  AtSign,
  Briefcase,
  Home,
  Download,
  CheckCircle,
  Filter,
  DollarSign,
  Badge,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'terminated';
  base_salary: number;
  hire_date: string;
  created_at: string;
  user_id: string;
}

// Styled Components
const Container = styled.div`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

const Header = styled.div`
  margin-bottom: 40px;

  @media (max-width: 768px) {
    margin-bottom: 24px;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 6px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const StatCard = styled.div`
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.3);
  box-shadow: 0 8px 32px rgba(220, 38, 38, 0.1);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(220, 38, 38, 0.15);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const StatIcon = styled.div<{ $color?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$color || 'var(--primary-100)'};
  color: ${props => props.$color?.replace('100', '600') || 'var(--primary-600)'};

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
  }
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    font-size: 24px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: var(--gray-300);

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 768px) {
    gap: 12px;
    margin-bottom: 24px;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 300px;

  @media (max-width: 480px) {
    min-width: 250px;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 40px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 14px;
  color: white;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    background: rgba(0, 0, 0, 0.8);
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.5);
`;

const FilterSelect = styled.select`
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 14px;
  color: white;
  min-width: 120px;
  transition: all 0.3s ease;

  option {
    background: #1a1a1a;
    color: white;
  }

  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    background: rgba(0, 0, 0, 0.8);
  }
`;

const TableContainer = styled.div`
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.3);
  box-shadow: 0 8px 32px rgba(220, 38, 38, 0.1);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: rgba(0, 0, 0, 0.4);
`;

const TableHeaderCell = styled.th`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: white;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    padding: 12px 8px;
    font-size: 12px;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const TableCell = styled.td`
  padding: 16px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);

  @media (max-width: 768px) {
    padding: 12px 8px;
    font-size: 12px;
  }
`;

const EmployeeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EmployeeAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const EmployeeDetails = styled.div``;

const EmployeeName = styled.div`
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
`;

const EmployeeId = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  
  ${props => {
    switch (props.status) {
      case 'active':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        `;
      case 'inactive':
        return `
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        `;
      case 'terminated':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.3);
        `;
    }
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  &.edit {
    &:hover {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }
  }

  &.view {
    &:hover {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }
  }

  &.delete {
    &:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: rgba(255, 255, 255, 0.6);
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 48px;
  color: rgba(255, 255, 255, 0.6);
`;

// Modal Components
const Modal = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => (props.$isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(8px);
`;

const ModalContent = styled.div`
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 38, 38, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  
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

const ModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0;
`;

const ModalCloseButton = styled.button`
  padding: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: white;
`;

const Input = styled.input`
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 14px;
  color: white;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    background: rgba(0, 0, 0, 0.8);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 14px;
  color: white;
  transition: all 0.3s ease;

  option {
    background: #1a1a1a;
    color: white;
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    background: rgba(0, 0, 0, 0.8);
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ModalFooter = styled.div`
  padding: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 14px;
  margin-top: 4px;
`;

export default function EmployeesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState('');

  // Local form state type to allow union values for status and employment_type
  type EmployeeFormState = {
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    employment_type: 'full-time' | 'part-time' | 'contract' | 'intern';
    status: 'active' | 'inactive' | 'terminated';
    base_salary: string;
    hire_date: string;
  };

  const [formData, setFormData] = useState<EmployeeFormState>({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employment_type: 'full-time',
    status: 'active',
    base_salary: '',
    hire_date: ''
  });

  // Helper to reset the form to default values
  const resetForm = () => {
    setFormData({
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      employment_type: 'full-time',
      status: 'active',
      base_salary: '',
      hire_date: ''
    });
  };

  const fetchEmployees = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase!
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEmployees();

  }, [fetchEmployees]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setError('');
      const supabase = createSupabaseClient();

      if (!supabase) {
        throw new Error('Supabase is not configured properly. Please check your environment variables.');
      }

      const baseSalary = Number(formData.base_salary);
      if (!Number.isFinite(baseSalary)) {
        throw new Error('Base salary is invalid');
      }

      const { error: insertError } = await supabase
        .from('employees')
        .insert([
          {
            user_id: user.id,
            employee_id: formData.employee_id.trim(),
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() ? formData.phone.trim() : null,
            department: formData.department.trim() ? formData.department.trim() : null,
            position: formData.position.trim(),
            employment_type: formData.employment_type,
            status: formData.status,
            base_salary: baseSalary,
            hire_date: formData.hire_date
          }
        ]);

      if (insertError) throw insertError;
      
      setIsAddModalOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error: unknown) {
      console.error('Error adding employee:', error);
      const message = error instanceof Error ? error.message : 'Failed to add employee';
      setError(message);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      setError('');
      const supabase = createSupabaseClient();
      
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { error } = await supabase
        .from('employees')
        .update({
          ...formData,
          base_salary: parseFloat(formData.base_salary)
        })
        .eq('id', editingEmployee.id);

      if (error) throw error;
      
      setIsEditModalOpen(false);
      setEditingEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (error: unknown) {
      console.error('Error updating employee:', error);
      const message = error instanceof Error ? error.message : 'Failed to update employee';
      setError(message);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const supabase = createSupabaseClient();
      
      const { error } = await supabase!
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchEmployees();
    } catch (error: unknown) {
      console.error('Error deleting employee:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete employee';
      setError(message);
    }
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_id: employee.employee_id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      department: employee.department,
      position: employee.position,
      employment_type: employee.employment_type,
      status: employee.status,
      base_salary: employee.base_salary.toString(),
      hire_date: employee.hire_date
    });
    setIsEditModalOpen(true);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
    departments: new Set(employees.map(e => e.department)).size
  };

  const departments = Array.from(new Set(employees.map(e => e.department)));

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [router, user]);

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <Title>
            <Users size={32} />
            Employees
          </Title>
          <Subtitle>Manage your team members and employee information</Subtitle>
        </Header>

        <Controls>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </FilterSelect>
          <FilterSelect
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </FilterSelect>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            Add Employee
          </Button>
        </Controls>

        <StatsContainer>
          <StatCard>
            <StatHeader>
              <StatIcon $color="var(--primary-100)">
                <Users size={24} />
              </StatIcon>
            </StatHeader>
            <StatContent>
              <StatValue>{stats.total}</StatValue>
              <StatLabel>Total Employees</StatLabel>
            </StatContent>
          </StatCard>
          <StatCard>
            <StatHeader>
              <StatIcon $color="var(--secondary-100)">
                <CheckCircle size={24} />
              </StatIcon>
            </StatHeader>
            <StatContent>
              <StatValue>{stats.active}</StatValue>
              <StatLabel>Active</StatLabel>
            </StatContent>
          </StatCard>
          <StatCard>
            <StatHeader>
              <StatIcon $color="var(--accent-100)">
                <Clock size={24} />
              </StatIcon>
            </StatHeader>
            <StatContent>
              <StatValue>{stats.inactive}</StatValue>
              <StatLabel>Inactive</StatLabel>
            </StatContent>
          </StatCard>
          <StatCard>
            <StatHeader>
              <StatIcon $color="var(--error-100)">
                <Building size={24} />
              </StatIcon>
            </StatHeader>
            <StatContent>
              <StatValue>{stats.departments}</StatValue>
              <StatLabel>Departments</StatLabel>
            </StatContent>
          </StatCard>
        </StatsContainer>

        <Controls>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </FilterSelect>
          <FilterSelect
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </FilterSelect>
        </Controls>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Employee</TableHeaderCell>
                <TableHeaderCell>Department</TableHeaderCell>
                <TableHeaderCell>Position</TableHeaderCell>
                <TableHeaderCell>Employment Type</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Salary</TableHeaderCell>
                <TableHeaderCell>Hire Date</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <tr>
                  <TableCell colSpan={8}>
                    <LoadingState>Loading employees...</LoadingState>
                  </TableCell>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <TableCell colSpan={8}>
                    <EmptyState>No employees found</EmptyState>
                  </TableCell>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <EmployeeInfo>
                        <EmployeeAvatar>
                          {employee.first_name[0]}{employee.last_name[0]}
                        </EmployeeAvatar>
                        <EmployeeDetails>
                          <EmployeeName>
                            {employee.first_name} {employee.last_name}
                          </EmployeeName>
                          <EmployeeId>ID: {employee.employee_id}</EmployeeId>
                        </EmployeeDetails>
                      </EmployeeInfo>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell style={{ textTransform: 'capitalize' }}>
                      {employee.employment_type.replace('-', ' ')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={employee.status}>
                        {employee.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{formatPKR(employee.base_salary)}</TableCell>
                    <TableCell>{format(new Date(employee.hire_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <ActionButtons>
                        <ActionButton
                          className="view"
                          onClick={() => router.push(`/employees/${employee.id}`)}
                        >
                          <Eye size={16} />
                        </ActionButton>
                        <ActionButton 
                          className="edit"
                          onClick={() => openEditModal(employee)}
                        >
                          <Edit size={16} />
                        </ActionButton>
                        <ActionButton 
                          className="delete"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          <Trash2 size={16} />
                        </ActionButton>
                      </ActionButtons>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Employee Modal */}
        <Modal $isOpen={isAddModalOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Add New Employee</ModalTitle>
              <ModalCloseButton onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <Form onSubmit={handleAddEmployee}>
                <FormRow>
                  <FormGroup>
                    <Label>Employee ID</Label>
                    <Input
                      type="text"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'terminated'})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="terminated">Terminated</option>
                    </Select>
                  </FormGroup>
                </FormRow>
                <FormRow>
                  <FormGroup>
                    <Label>First Name</Label>
                    <Input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Last Name</Label>
                    <Input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      required
                    />
                  </FormGroup>
                </FormRow>
                <FormGroup>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </FormGroup>
                <FormRow>
                  <FormGroup>
                    <Label>Department</Label>
                    <Input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Position</Label>
                    <Input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      required
                    />
                  </FormGroup>
                </FormRow>
                <FormRow>
                  <FormGroup>
                    <Label>Employment Type</Label>
                    <Select
                      value={formData.employment_type}
                      onChange={(e) => setFormData({...formData, employment_type: e.target.value as 'full-time' | 'part-time' | 'contract' | 'intern'})}
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>Base Salary</Label>
                    <Input
                      type="number"
                      value={formData.base_salary}
                      onChange={(e) => setFormData({...formData, base_salary: e.target.value})}
                      required
                    />
                  </FormGroup>
                </FormRow>
                <FormGroup>
                  <Label>Hire Date</Label>
                  <Input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                    required
                  />
                </FormGroup>
                <ModalFooter>
                  <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Employee</Button>
                </ModalFooter>
              </Form>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Edit Employee Modal */}
        <Modal $isOpen={isEditModalOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Edit Employee</ModalTitle>
              <ModalCloseButton onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <Form onSubmit={handleEditEmployee}>
                <FormRow>
                  <FormGroup>
                    <Label>Employee ID</Label>
                    <Input
                      type="text"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'terminated'})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="terminated">Terminated</option>
                    </Select>
                  </FormGroup>
                </FormRow>
                <FormRow>
                  <FormGroup>
                    <Label>First Name</Label>
                    <Input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Last Name</Label>
                    <Input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      required
                    />
                  </FormGroup>
                </FormRow>
                <FormGroup>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </FormGroup>
                <FormRow>
                  <FormGroup>
                    <Label>Department</Label>
                    <Input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Position</Label>
                    <Input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      required
                    />
                  </FormGroup>
                </FormRow>
                <FormRow>
                  <FormGroup>
                    <Label>Employment Type</Label>
                    <Select
                      value={formData.employment_type}
                      onChange={(e) => setFormData({...formData, employment_type: e.target.value as 'full-time' | 'part-time' | 'contract' | 'intern'})}
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>Base Salary</Label>
                    <Input
                      type="number"
                      value={formData.base_salary}
                      onChange={(e) => setFormData({...formData, base_salary: e.target.value})}
                      required
                    />
                  </FormGroup>
                </FormRow>
                <FormGroup>
                  <Label>Hire Date</Label>
                  <Input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                    required
                  />
                </FormGroup>
                <ModalFooter>
                  <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Employee</Button>
                </ModalFooter>
              </Form>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </DashboardLayout>
  );
}
