// Currency utilities for PKR (Pakistani Rupee)

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 10000000) { // 1 crore
    return `₨${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) { // 1 lakh
    return `₨${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) { // 1 thousand
    return `₨${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

export const parseCurrency = (value: string): number => {
  // Remove currency symbols and parse
  const cleanValue = value.replace(/[₨,\s]/g, '');
  return parseFloat(cleanValue) || 0;
};

// Alias for parseCurrency to match usage in invoices
export const parsePKR = parseCurrency;

export const getCurrencySymbol = (): string => {
  return '₨';
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-PK').format(num);
};

// PKR specific formatting for different contexts
export const formatPKR = (amount: number): string => formatCurrency(amount);

export const formatPKRObject = {
  // For display in cards and summaries
  display: (amount: number): string => formatCurrency(amount),
  
  // For compact display in charts
  compact: (amount: number): string => formatCurrencyCompact(amount),
  
  // For input fields (without currency symbol)
  input: (amount: number): string => formatNumber(amount),
  
  // For API/database (plain number)
  raw: (amount: number): number => amount,
};