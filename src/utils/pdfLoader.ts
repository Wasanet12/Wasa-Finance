import { PDFReportData, Customer, Expense } from '@/lib/types';

// Dynamic import for PDF generation
export const generatePDFReport = async (data: PDFReportData, fileName?: string): Promise<void> => {
  const { generatePDFReport: generateReport } = await import('@/utils/pdfGenerator');
  generateReport(data, fileName);
};

export const generateCustomerPDFReport = async (customers: Customer[], title: string, fileName?: string): Promise<void> => {
  const { generateCustomerPDFReport: generateReport } = await import('@/utils/pdfGenerator');
  generateReport(customers, title, fileName);
};

export const generateExpensePDFReport = async (expenses: Expense[], fileName?: string): Promise<void> => {
  const { generateExpensePDFReport: generateReport } = await import('@/utils/pdfGenerator');
  generateReport(expenses, fileName);
};