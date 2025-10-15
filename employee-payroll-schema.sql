-- Employee Payroll and Tracking System Schema
-- This schema includes employees, payroll, time tracking, attendance, and leave management

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    hire_date DATE NOT NULL,
    termination_date DATE,
    department VARCHAR(100),
    position VARCHAR(100) NOT NULL,
    employment_type VARCHAR(20) DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    base_salary DECIMAL(12,2) NOT NULL,
    hourly_rate DECIMAL(8,2),
    currency VARCHAR(3) DEFAULT 'PKR',
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    tax_id VARCHAR(50),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee benefits table
CREATE TABLE IF NOT EXISTS employee_benefits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL, -- health_insurance, provident_fund, bonus, allowance
    benefit_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2),
    percentage DECIMAL(5,2),
    is_taxable BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee deductions table
CREATE TABLE IF NOT EXISTS employee_deductions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    deduction_type VARCHAR(50) NOT NULL, -- tax, provident_fund, loan, advance
    deduction_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2),
    percentage DECIMAL(5,2),
    effective_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time tracking table
CREATE TABLE IF NOT EXISTS time_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    break_start TIMESTAMP WITH TIME ZONE,
    break_end TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half-day')),
    notes TEXT,
    location VARCHAR(100),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Leave management table
CREATE TABLE IF NOT EXISTS employee_leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL, -- annual, sick, casual, maternity, paternity, emergency
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    overtime_amount DECIMAL(10,2) DEFAULT 0,
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    allowances DECIMAL(10,2) DEFAULT 0,
    gross_salary DECIMAL(12,2) NOT NULL,
    tax_deduction DECIMAL(10,2) DEFAULT 0,
    provident_fund DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PKR',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid')),
    payment_method VARCHAR(20) DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'cash', 'cheque')),
    payment_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll items table (for detailed breakdown)
CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payroll_id UUID REFERENCES payroll(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('earning', 'deduction')),
    item_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_taxable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee attendance summary table
CREATE TABLE IF NOT EXISTS attendance_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_working_days INTEGER NOT NULL,
    days_present INTEGER DEFAULT 0,
    days_absent INTEGER DEFAULT 0,
    days_late INTEGER DEFAULT 0,
    days_half_day INTEGER DEFAULT 0,
    total_hours DECIMAL(6,2) DEFAULT 0,
    overtime_hours DECIMAL(6,2) DEFAULT 0,
    leave_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, month, year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_time_tracking_employee_date ON time_tracking(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_time_tracking_user_id ON time_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_user_id ON payroll(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_pay_date ON payroll(pay_date);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_employee_id ON employee_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_status ON employee_leaves(status);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own employees" ON employees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own employees" ON employees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own employees" ON employees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own employees" ON employees FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own employee benefits" ON employee_benefits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own employee benefits" ON employee_benefits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own employee benefits" ON employee_benefits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own employee benefits" ON employee_benefits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own employee deductions" ON employee_deductions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own employee deductions" ON employee_deductions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own employee deductions" ON employee_deductions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own employee deductions" ON employee_deductions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own time tracking" ON time_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own time tracking" ON time_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own time tracking" ON time_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own time tracking" ON time_tracking FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own employee leaves" ON employee_leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own employee leaves" ON employee_leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own employee leaves" ON employee_leaves FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own employee leaves" ON employee_leaves FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payroll" ON payroll FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payroll" ON payroll FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payroll" ON payroll FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payroll" ON payroll FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payroll items" ON payroll_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM payroll WHERE payroll.id = payroll_items.payroll_id AND payroll.user_id = auth.uid())
);
CREATE POLICY "Users can insert their own payroll items" ON payroll_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM payroll WHERE payroll.id = payroll_items.payroll_id AND payroll.user_id = auth.uid())
);
CREATE POLICY "Users can update their own payroll items" ON payroll_items FOR UPDATE USING (
    EXISTS (SELECT 1 FROM payroll WHERE payroll.id = payroll_items.payroll_id AND payroll.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own payroll items" ON payroll_items FOR DELETE USING (
    EXISTS (SELECT 1 FROM payroll WHERE payroll.id = payroll_items.payroll_id AND payroll.user_id = auth.uid())
);

CREATE POLICY "Users can view their own attendance summary" ON attendance_summary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attendance summary" ON attendance_summary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attendance summary" ON attendance_summary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own attendance summary" ON attendance_summary FOR DELETE USING (auth.uid() = user_id);

-- Create functions for automatic calculations
CREATE OR REPLACE FUNCTION calculate_total_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
        NEW.total_hours := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600;
        
        -- Calculate break time if exists
        IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL THEN
            NEW.total_hours := NEW.total_hours - (EXTRACT(EPOCH FROM (NEW.break_end - NEW.break_start)) / 3600);
        END IF;
        
        -- Calculate overtime (assuming 8 hours is standard)
        IF NEW.total_hours > 8 THEN
            NEW.overtime_hours := NEW.total_hours - 8;
        ELSE
            NEW.overtime_hours := 0;
        END IF;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for time tracking calculations
CREATE TRIGGER calculate_hours_trigger
    BEFORE INSERT OR UPDATE ON time_tracking
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_hours();

-- Create function to update attendance summary
CREATE OR REPLACE FUNCTION update_attendance_summary()
RETURNS TRIGGER AS $$
DECLARE
    emp_month INTEGER;
    emp_year INTEGER;
BEGIN
    emp_month := EXTRACT(MONTH FROM NEW.date);
    emp_year := EXTRACT(YEAR FROM NEW.date);
    
    INSERT INTO attendance_summary (user_id, employee_id, month, year, total_working_days, days_present, days_absent, days_late, days_half_day, total_hours, overtime_hours)
    VALUES (NEW.user_id, NEW.employee_id, emp_month, emp_year, 
            (SELECT COUNT(*) FROM time_tracking WHERE employee_id = NEW.employee_id AND EXTRACT(MONTH FROM date) = emp_month AND EXTRACT(YEAR FROM date) = emp_year),
            (SELECT COUNT(*) FROM time_tracking WHERE employee_id = NEW.employee_id AND EXTRACT(MONTH FROM date) = emp_month AND EXTRACT(YEAR FROM date) = emp_year AND status = 'present'),
            (SELECT COUNT(*) FROM time_tracking WHERE employee_id = NEW.employee_id AND EXTRACT(MONTH FROM date) = emp_month AND EXTRACT(YEAR FROM date) = emp_year AND status = 'absent'),
            (SELECT COUNT(*) FROM time_tracking WHERE employee_id = NEW.employee_id AND EXTRACT(MONTH FROM date) = emp_month AND EXTRACT(YEAR FROM date) = emp_year AND status = 'late'),
            (SELECT COUNT(*) FROM time_tracking WHERE employee_id = NEW.employee_id AND EXTRACT(MONTH FROM date) = emp_month AND EXTRACT(YEAR FROM date) = emp_year AND status = 'half-day'),
            (SELECT COALESCE(SUM(total_hours), 0) FROM time_tracking WHERE employee_id = NEW.employee_id AND EXTRACT(MONTH FROM date) = emp_month AND EXTRACT(YEAR FROM date) = emp_year),
            (SELECT COALESCE(SUM(overtime_hours), 0) FROM time_tracking WHERE employee_id = NEW.employee_id AND EXTRACT(MONTH FROM date) = emp_month AND EXTRACT(YEAR FROM date) = emp_year)
    )
    ON CONFLICT (employee_id, month, year) 
    DO UPDATE SET
        total_working_days = EXCLUDED.total_working_days,
        days_present = EXCLUDED.days_present,
        days_absent = EXCLUDED.days_absent,
        days_late = EXCLUDED.days_late,
        days_half_day = EXCLUDED.days_half_day,
        total_hours = EXCLUDED.total_hours,
        overtime_hours = EXCLUDED.overtime_hours,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attendance summary updates
CREATE TRIGGER update_attendance_summary_trigger
    AFTER INSERT OR UPDATE ON time_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_summary();

-- Insert sample data for testing
INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, department, position, base_salary, hourly_rate, hire_date) VALUES
(auth.uid(), 'EMP001', 'Ahmed', 'Ali', 'ahmed.ali@company.com', '+92-300-1234567', 'Engineering', 'Software Developer', 80000.00, 500.00, '2023-01-15'),
(auth.uid(), 'EMP002', 'Fatima', 'Khan', 'fatima.khan@company.com', '+92-301-2345678', 'Marketing', 'Marketing Manager', 75000.00, 450.00, '2023-02-01'),
(auth.uid(), 'EMP003', 'Hassan', 'Sheikh', 'hassan.sheikh@company.com', '+92-302-3456789', 'Finance', 'Accountant', 60000.00, 350.00, '2023-03-10'),
(auth.uid(), 'EMP004', 'Ayesha', 'Malik', 'ayesha.malik@company.com', '+92-303-4567890', 'HR', 'HR Specialist', 65000.00, 400.00, '2023-04-05'),
(auth.uid(), 'EMP005', 'Usman', 'Ahmed', 'usman.ahmed@company.com', '+92-304-5678901', 'Engineering', 'Senior Developer', 95000.00, 600.00, '2022-11-20');