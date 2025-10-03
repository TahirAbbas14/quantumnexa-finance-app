'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase';
import { formatPKR, parsePKR } from '@/lib/currency';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  ArrowLeft,
  Save,
  X,
  Calendar,
  User,
  FileText,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id?: string;
  amount: number;
  tax_amount?: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  description?: string;
  notes?: string;
  terms_conditions?: string;
  created_at: string;
}

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
}

const Container = styled.div`
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 16px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-2px);
  }
`;

const HeaderContent = styled.div`
  h1 {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: stretch;
    
    > * {
      flex: 1;
    }
  }
`;

const FormCard = styled(Card)`
  padding: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  color: #1f2937;
  background: #ffffff;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  color: #1f2937;
  background: #ffffff;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  color: #1f2937;
  background: #ffffff;
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  
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

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 16px;
`;

export default function InvoiceEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    invoice_number: '',
    client_id: '',
    project_id: '',
    amount: '',
    tax_amount: '',
    status: 'draft' as const,
    issue_date: '',
    due_date: '',
    description: '',
    notes: '',
    terms_conditions: ''
  });

  useEffect(() => {
    if (user && params.id) {
      fetchInvoice();
      fetchClients();
      fetchProjects();
    }
  }, [user, params.id]);

  const fetchInvoice = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setInvoice(data);
        setFormData({
          invoice_number: data.invoice_number || '',
          client_id: data.client_id || '',
          project_id: data.project_id || '',
          amount: data.amount?.toString() || '',
          tax_amount: data.tax_amount?.toString() || '',
          status: data.status || 'draft',
          issue_date: data.issue_date ? format(new Date(data.issue_date), 'yyyy-MM-dd') : '',
          due_date: data.due_date ? format(new Date(data.due_date), 'yyyy-MM-dd') : '',
          description: data.description || '',
          notes: data.notes || '',
          terms_conditions: data.terms_conditions || ''
        });
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotalAmount = () => {
    const amount = parseFloat(formData.amount) || 0;
    const taxAmount = parseFloat(formData.tax_amount) || 0;
    return amount + taxAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      
      const amount = parseFloat(formData.amount) || 0;
      const taxAmount = parseFloat(formData.tax_amount) || 0;
      const totalAmount = amount + taxAmount;

      const updateData = {
        invoice_number: formData.invoice_number,
        client_id: formData.client_id || null,
        project_id: formData.project_id || null,
        amount: amount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: formData.status,
        issue_date: formData.issue_date || null,
        due_date: formData.due_date || null,
        description: formData.description || null,
        notes: formData.notes || null,
        terms_conditions: formData.terms_conditions || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', params.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Navigate back to invoice detail page
      router.push(`/invoices/${params.id}`);
    } catch (error) {
      console.error('Error updating invoice:', error);
      setError('Failed to update invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingContainer>
          <div className="spinner" />
        </LoadingContainer>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <Container>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ color: 'white', marginBottom: '16px' }}>Invoice not found</h2>
            <Button variant="outline" onClick={() => router.push('/invoices')}>
              <ArrowLeft size={16} />
              Back to Invoices
            </Button>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <Header>
          <HeaderLeft>
            <BackButton onClick={() => router.push(`/invoices/${params.id}`)}>
              <ArrowLeft size={20} />
            </BackButton>
            <HeaderContent>
              <h1>Edit Invoice</h1>
              <p>Update invoice details and information</p>
            </HeaderContent>
          </HeaderLeft>
          <HeaderActions>
            <Button 
              variant="outline" 
              size="md"
              onClick={() => router.push(`/invoices/${params.id}`)}
            >
              <X size={16} />
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="md"
              onClick={handleSubmit}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </HeaderActions>
        </Header>

        <FormCard>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <Form onSubmit={handleSubmit}>
            <FormRow>
              <FormGroup>
                <Label>
                  <FileText size={16} />
                  Invoice Number
                </Label>
                <Input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleInputChange}
                  placeholder="INV-001"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Status</Label>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>
                  <User size={16} />
                  Client
                </Label>
                <Select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Project (Optional)</Label>
                <Select
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>
                  <DollarSign size={16} />
                  Amount (PKR)
                </Label>
                <Input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Tax Amount (PKR)</Label>
                <Input
                  type="number"
                  name="tax_amount"
                  value={formData.tax_amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>
                Total Amount: {formatPKR(calculateTotalAmount())}
              </Label>
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>
                  <Calendar size={16} />
                  Issue Date
                </Label>
                <Input
                  type="date"
                  name="issue_date"
                  value={formData.issue_date}
                  onChange={handleInputChange}
                />
              </FormGroup>
              <FormGroup>
                <Label>
                  <Calendar size={16} />
                  Due Date
                </Label>
                <Input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>Description</Label>
              <TextArea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Invoice description..."
              />
            </FormGroup>

            <FormGroup>
              <Label>Notes</Label>
              <TextArea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes..."
              />
            </FormGroup>

            <FormGroup>
              <Label>Terms & Conditions</Label>
              <TextArea
                name="terms_conditions"
                value={formData.terms_conditions}
                onChange={handleInputChange}
                placeholder="Terms and conditions..."
              />
            </FormGroup>
          </Form>
        </FormCard>
      </Container>
    </DashboardLayout>
  );
}