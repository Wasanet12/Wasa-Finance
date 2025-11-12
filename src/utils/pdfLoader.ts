import { PDFReportData } from '@/utils/pdfGenerator';
import { Customer, Expense } from '@/lib/types';

// Dynamic import for PDF generation
export const generatePDFReport = async (data: PDFReportData, fileName?: string): Promise<void> => {
  const { PDFGenerator } = await import('@/utils/pdfGenerator');
  const generator = new PDFGenerator();

  // Transform data to match pdfGenerator interface
  const transformedData = {
    ...data,
    // Include the new payment obligation data
    officeToWasaPayment: data.officeToWasaPayment || 0,
    wasaToOfficePayment: data.wasaToOfficePayment || 0,
  };

  generator.generateReport(transformedData, fileName);
};

export const generateCustomerPDFReport = async (customers: Customer[], title: string, fileName?: string): Promise<void> => {
  const { generateCustomerPDFReport: generateReport } = await import('@/utils/pdfGenerator');
  generateReport(customers, title, fileName);
};

export const generateExpensePDFReport = async (expenses: Expense[], fileName?: string): Promise<void> => {
  const { generateExpensePDFReport: generateReport } = await import('@/utils/pdfGenerator');
  generateReport(expenses, fileName);
};