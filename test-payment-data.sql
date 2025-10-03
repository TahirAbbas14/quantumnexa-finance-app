-- Test script to check if there are any payment records in the database
-- Run this in your Supabase SQL editor to verify payment data

-- Check total payments in the database
SELECT COUNT(*) as total_payments FROM payments;

-- Check payments with invoice relationships
SELECT 
  p.id,
  p.amount,
  p.payment_date,
  p.payment_method,
  p.notes,
  i.invoice_number,
  i.client_id,
  c.name as client_name
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
JOIN clients c ON i.client_id = c.id
ORDER BY p.payment_date DESC
LIMIT 10;

-- Check if there are any invoices that could have payments
SELECT 
  i.id,
  i.invoice_number,
  i.amount,
  i.status,
  c.name as client_name
FROM invoices i
JOIN clients c ON i.client_id = c.id
ORDER BY i.created_at DESC
LIMIT 10;

-- Sample payment data insertion (uncomment and modify as needed)
/*
INSERT INTO payments (invoice_id, amount, currency, payment_date, payment_method, reference_number, notes, user_id)
SELECT 
  i.id,
  i.amount,
  'PKR',
  CURRENT_DATE - INTERVAL '30 days',
  'Bank Transfer',
  'REF-' || EXTRACT(epoch FROM NOW())::text,
  'Sample payment for testing',
  i.user_id
FROM invoices i
WHERE i.status = 'sent'
LIMIT 5;
*/