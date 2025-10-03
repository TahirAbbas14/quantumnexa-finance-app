-- Advanced Reporting Schema for Quantumnexa Finance App
-- This schema supports P&L statements, cash flow analysis, tax reports, and business metrics

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create enum types for reporting
CREATE TYPE report_type AS ENUM ('profit_loss', 'cash_flow', 'tax_report', 'business_metrics');
CREATE TYPE report_status AS ENUM ('draft', 'generated', 'finalized', 'archived');
CREATE TYPE cash_flow_type AS ENUM ('operating', 'investing', 'financing');
CREATE TYPE tax_category AS ENUM ('income_tax', 'sales_tax', 'payroll_tax', 'property_tax', 'other');

-- Reports table for storing generated reports metadata
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type report_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status report_status DEFAULT 'draft',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalized_at TIMESTAMP WITH TIME ZONE,
    report_data JSONB, -- Store calculated report data
    filters JSONB, -- Store applied filters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profit & Loss line items
CREATE TABLE IF NOT EXISTS profit_loss_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'revenue', 'cost_of_goods_sold', 'operating_expenses', 'other_income', 'other_expenses'
    subcategory VARCHAR(100),
    line_item VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    percentage_of_revenue DECIMAL(5,2),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    source_table VARCHAR(50), -- 'invoices', 'expenses', 'manual'
    source_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash Flow statements
CREATE TABLE IF NOT EXISTS cash_flow_statements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    flow_type cash_flow_type NOT NULL,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    cash_inflow DECIMAL(15,2) DEFAULT 0,
    cash_outflow DECIMAL(15,2) DEFAULT 0,
    net_cash_flow DECIMAL(15,2) GENERATED ALWAYS AS (cash_inflow - cash_outflow) STORED,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    source_table VARCHAR(50),
    source_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax calculations and reports
CREATE TABLE IF NOT EXISTS tax_calculations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    tax_category tax_category NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    taxable_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- e.g., 0.1500 for 15%
    tax_amount DECIMAL(15,2) GENERATED ALWAYS AS (taxable_amount * tax_rate) STORED,
    deductions DECIMAL(15,2) DEFAULT 0,
    net_tax_amount DECIMAL(15,2) GENERATED ALWAYS AS ((taxable_amount * tax_rate) - deductions) STORED,
    due_date DATE,
    paid_date DATE,
    payment_reference VARCHAR(100),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business performance metrics
CREATE TABLE IF NOT EXISTS business_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL, -- 'financial', 'operational', 'growth', 'efficiency'
    current_value DECIMAL(15,4) NOT NULL,
    previous_value DECIMAL(15,4),
    target_value DECIMAL(15,4),
    percentage_change DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN previous_value IS NOT NULL AND previous_value != 0 
            THEN ((current_value - previous_value) / previous_value) * 100
            ELSE NULL
        END
    ) STORED,
    unit VARCHAR(20), -- '%', 'PKR', 'days', 'count', etc.
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    calculation_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report templates for standardized reporting
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    report_type report_type NOT NULL,
    template_config JSONB NOT NULL, -- Store template configuration
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export history for tracking PDF/Excel exports
CREATE TABLE IF NOT EXISTS report_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    export_format VARCHAR(10) NOT NULL, -- 'pdf', 'excel', 'csv'
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_type_date ON reports(report_type, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_profit_loss_user_period ON profit_loss_items(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_cash_flow_user_period ON cash_flow_statements(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_tax_calc_user_period ON tax_calculations(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_business_metrics_user_period ON business_metrics(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_report_exports_user ON report_exports(user_id);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_loss_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reports" ON reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reports" ON reports FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own P&L items" ON profit_loss_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own P&L items" ON profit_loss_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own P&L items" ON profit_loss_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own P&L items" ON profit_loss_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own cash flow statements" ON cash_flow_statements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own cash flow statements" ON cash_flow_statements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cash flow statements" ON cash_flow_statements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cash flow statements" ON cash_flow_statements FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own tax calculations" ON tax_calculations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tax calculations" ON tax_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tax calculations" ON tax_calculations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tax calculations" ON tax_calculations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own business metrics" ON business_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own business metrics" ON business_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own business metrics" ON business_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own business metrics" ON business_metrics FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own report templates" ON report_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own report templates" ON report_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own report templates" ON report_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own report templates" ON report_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own report exports" ON report_exports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own report exports" ON report_exports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own report exports" ON report_exports FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profit_loss_items_updated_at BEFORE UPDATE ON profit_loss_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_flow_statements_updated_at BEFORE UPDATE ON cash_flow_statements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_calculations_updated_at BEFORE UPDATE ON tax_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_metrics_updated_at BEFORE UPDATE ON business_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for automatic report generation
CREATE OR REPLACE FUNCTION generate_profit_loss_data(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    category VARCHAR,
    subcategory VARCHAR,
    line_item VARCHAR,
    amount DECIMAL,
    percentage_of_revenue DECIMAL
) AS $$
BEGIN
    -- Revenue from invoices
    RETURN QUERY
    SELECT 
        'revenue'::VARCHAR as category,
        'sales_revenue'::VARCHAR as subcategory,
        'Invoice Revenue'::VARCHAR as line_item,
        COALESCE(SUM(i.amount), 0)::DECIMAL as amount,
        NULL::DECIMAL as percentage_of_revenue
    FROM invoices i
    WHERE i.user_id = p_user_id 
        AND i.status = 'paid'
        AND i.created_at::DATE BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    -- Expenses
    SELECT 
        'operating_expenses'::VARCHAR as category,
        e.category::VARCHAR as subcategory,
        COALESCE(e.category, 'General Expenses')::VARCHAR as line_item,
        COALESCE(SUM(e.amount), 0)::DECIMAL as amount,
        NULL::DECIMAL as percentage_of_revenue
    FROM expenses e
    WHERE e.user_id = p_user_id 
        AND e.date BETWEEN p_start_date AND p_end_date
    GROUP BY e.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate cash flow data
CREATE OR REPLACE FUNCTION generate_cash_flow_data(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    flow_type cash_flow_type,
    category VARCHAR,
    description VARCHAR,
    cash_inflow DECIMAL,
    cash_outflow DECIMAL
) AS $$
BEGIN
    -- Operating cash flows - Revenue
    RETURN QUERY
    SELECT 
        'operating'::cash_flow_type as flow_type,
        'revenue'::VARCHAR as category,
        'Invoice Payments'::VARCHAR as description,
        COALESCE(SUM(i.amount), 0)::DECIMAL as cash_inflow,
        0::DECIMAL as cash_outflow
    FROM invoices i
    WHERE i.user_id = p_user_id 
        AND i.status = 'paid'
        AND i.created_at::DATE BETWEEN p_start_date AND p_end_date
    
    UNION ALL
    
    -- Operating cash flows - Expenses
    SELECT 
        'operating'::cash_flow_type as flow_type,
        'expenses'::VARCHAR as category,
        COALESCE(e.category, 'General Expenses')::VARCHAR as description,
        0::DECIMAL as cash_inflow,
        COALESCE(SUM(e.amount), 0)::DECIMAL as cash_outflow
    FROM expenses e
    WHERE e.user_id = p_user_id 
        AND e.date BETWEEN p_start_date AND p_end_date
    GROUP BY e.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate business metrics
CREATE OR REPLACE FUNCTION calculate_business_metrics(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    metric_name VARCHAR,
    metric_category VARCHAR,
    current_value DECIMAL,
    unit VARCHAR
) AS $$
DECLARE
    total_revenue DECIMAL := 0;
    total_expenses DECIMAL := 0;
    total_invoices INTEGER := 0;
    paid_invoices INTEGER := 0;
    avg_invoice_value DECIMAL := 0;
BEGIN
    -- Calculate totals
    SELECT COALESCE(SUM(amount), 0) INTO total_revenue
    FROM invoices 
    WHERE user_id = p_user_id 
        AND status = 'paid'
        AND created_at::DATE BETWEEN p_start_date AND p_end_date;
    
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM expenses 
    WHERE user_id = p_user_id 
        AND date BETWEEN p_start_date AND p_end_date;
    
    SELECT COUNT(*) INTO total_invoices
    FROM invoices 
    WHERE user_id = p_user_id 
        AND created_at::DATE BETWEEN p_start_date AND p_end_date;
    
    SELECT COUNT(*) INTO paid_invoices
    FROM invoices 
    WHERE user_id = p_user_id 
        AND status = 'paid'
        AND created_at::DATE BETWEEN p_start_date AND p_end_date;
    
    IF paid_invoices > 0 THEN
        avg_invoice_value := total_revenue / paid_invoices;
    END IF;
    
    -- Return metrics
    RETURN QUERY
    SELECT 'Gross Revenue'::VARCHAR, 'financial'::VARCHAR, total_revenue, 'PKR'::VARCHAR
    UNION ALL
    SELECT 'Total Expenses'::VARCHAR, 'financial'::VARCHAR, total_expenses, 'PKR'::VARCHAR
    UNION ALL
    SELECT 'Net Profit'::VARCHAR, 'financial'::VARCHAR, (total_revenue - total_expenses), 'PKR'::VARCHAR
    UNION ALL
    SELECT 'Profit Margin'::VARCHAR, 'financial'::VARCHAR, 
        CASE WHEN total_revenue > 0 THEN ((total_revenue - total_expenses) / total_revenue) * 100 ELSE 0 END, '%'::VARCHAR
    UNION ALL
    SELECT 'Average Invoice Value'::VARCHAR, 'operational'::VARCHAR, avg_invoice_value, 'PKR'::VARCHAR
    UNION ALL
    SELECT 'Invoice Collection Rate'::VARCHAR, 'operational'::VARCHAR,
        CASE WHEN total_invoices > 0 THEN (paid_invoices::DECIMAL / total_invoices::DECIMAL) * 100 ELSE 0 END, '%'::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default report templates
INSERT INTO report_templates (user_id, template_name, report_type, template_config, is_default)
SELECT 
    auth.uid(),
    'Standard P&L Statement',
    'profit_loss',
    '{"sections": ["revenue", "cost_of_goods_sold", "gross_profit", "operating_expenses", "operating_income", "other_income", "other_expenses", "net_income"], "show_percentages": true, "compare_periods": false}'::jsonb,
    true
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO report_templates (user_id, template_name, report_type, template_config, is_default)
SELECT 
    auth.uid(),
    'Standard Cash Flow Statement',
    'cash_flow',
    '{"sections": ["operating_activities", "investing_activities", "financing_activities"], "show_net_change": true, "include_beginning_balance": true}'::jsonb,
    true
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;