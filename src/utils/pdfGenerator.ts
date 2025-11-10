import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, Expense } from '@/lib/types';

// Types for PDF generation
export interface PDFReportData {
  customers: Customer[];
  expenses: Expense[];
  selectedMonth: number;
  selectedYear: number;
  totalRevenue: number;
  wasaProfit: number;
  officeProfit: number;
  totalExpenses: number;
  wasaNetProfit: number;
  totalPaymentToWasa: number;
  totalPaymentToOffice: number;
  customersPayToWasa: number;
  customersPayToOffice: number;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private contentHeight: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Page dimensions
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 15; // 15mm margin
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.contentHeight = this.pageHeight - (this.margin * 2);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  private formatDate(date: Date | { toDate: () => Date } | undefined): string {
    if (!date) return '-';
    if (date instanceof Date) {
      return date.toLocaleDateString('id-ID');
    }
    return date.toDate().toLocaleDateString('id-ID');
  }

  private addHeader(title: string, selectedMonth: number, selectedYear: number): number {
    // Add header background
    this.doc.setFillColor(27, 35, 54); // #1B2336
    this.doc.rect(this.margin, this.margin, this.contentWidth, 30, 'F');

    // Add title in white
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(title, this.pageWidth / 2, this.margin + 20, { align: 'center' });

    // Add period info below header
    const months = [
      'Semua Data', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0); // Reset to black
    const period = selectedMonth === 0
      ? `Semua Data - Tahun ${selectedYear}`
      : `Periode: ${months[selectedMonth]} ${selectedYear}`;
    this.doc.text(period, this.pageWidth / 2, this.margin + 40, { align: 'center' });

    // Add generation date
    const generatedDate = `Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`;
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100); // Gray color
    this.doc.text(generatedDate, this.pageWidth / 2, this.margin + 48, { align: 'center' });

    return this.margin + 55; // Return Y position after header
  }

  private addSummaryMetrics(data: PDFReportData, startY: number): number {
    let yPosition = startY;

    // Financial Summary Table
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Ringkasan Keuangan', this.margin, yPosition);
    yPosition += 8;

    const financialData = [
      ['Total Pendapatan Kotor', this.formatCurrency(data.totalRevenue)],
      ['Laba Wasa (40%)', this.formatCurrency(data.wasaProfit)],
      ['Laba Kantor (60%)', this.formatCurrency(data.officeProfit)],
      ['Total Biaya Operasional', this.formatCurrency(data.totalExpenses)],
      ['Keuntungan Bersih Wasa', this.formatCurrency(data.wasaNetProfit)],
    ];

    // Create financial summary table
    const tableColumnWidth = [this.contentWidth * 0.7, this.contentWidth * 0.3];
    const tableRowHeight = 8;

    // Header row
    this.doc.setFillColor(27, 35, 54); // #1B2336
    this.doc.rect(this.margin, yPosition, this.contentWidth, tableRowHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Keterangan', this.margin + 2, yPosition + 5);
    this.doc.text('Jumlah', this.margin + this.contentWidth - 2, yPosition + 5, { align: 'right' });

    yPosition += tableRowHeight;

    // Data rows
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    financialData.forEach(([label, value], index) => {
      // Alternate row color
      if (index % 2 === 0) {
        this.doc.setFillColor(245, 245, 245);
        this.doc.rect(this.margin, yPosition, this.contentWidth, tableRowHeight, 'F');
      }

      this.doc.setFontSize(9);
      this.doc.text(label, this.margin + 2, yPosition + 5);
      this.doc.text(value, this.margin + this.contentWidth - 2, yPosition + 5, { align: 'right' });
      yPosition += tableRowHeight;
    });

    yPosition += 10;

    // Payment Summary Table
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Ringkasan Pembayaran', this.margin, yPosition);
    yPosition += 8;

    const paymentData = [
      ['Pelanggan Bayar ke Wasa', `${data.customersPayToWasa} pelanggan`],
      ['Total Pembayaran ke Wasa', this.formatCurrency(data.totalPaymentToWasa)],
      ['Pelanggan Bayar ke Kantor', `${data.customersPayToOffice} pelanggan`],
      ['Total Pembayaran ke Kantor', this.formatCurrency(data.totalPaymentToOffice)],
    ];

    // Header row
    this.doc.setFillColor(27, 35, 54); // #1B2336
    this.doc.rect(this.margin, yPosition, this.contentWidth, tableRowHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Keterangan', this.margin + 2, yPosition + 5);
    this.doc.text('Jumlah', this.margin + this.contentWidth - 2, yPosition + 5, { align: 'right' });

    yPosition += tableRowHeight;

    // Data rows
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    paymentData.forEach(([label, value], index) => {
      // Alternate row color
      if (index % 2 === 0) {
        this.doc.setFillColor(245, 245, 245);
        this.doc.rect(this.margin, yPosition, this.contentWidth, tableRowHeight, 'F');
      }

      this.doc.setFontSize(9);
      this.doc.text(label, this.margin + 2, yPosition + 5);
      this.doc.text(value, this.margin + this.contentWidth - 2, yPosition + 5, { align: 'right' });
      yPosition += tableRowHeight;
    });

    return yPosition + 10; // Return Y position after summary
  }

  private addCustomersTable(customers: Customer[]): void {
    // Add new page for customers table
    this.doc.addPage();

    // Add page header
    this.doc.setFillColor(27, 35, 54); // #1B2336
    this.doc.rect(this.margin, this.margin, this.contentWidth, 15, 'F');

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('Daftar Pelanggan', this.pageWidth / 2, this.margin + 10, { align: 'center' });

    // Prepare table data
    const tableData = customers.map(customer => [
      customer.name,
      customer.packageName,
      this.formatCurrency(customer.packagePrice),
      customer.discount ? this.formatCurrency(customer.discount) : 'Rp 0',
      this.formatCurrency(customer.discount ? customer.packagePrice - customer.discount : customer.packagePrice),
      customer.status,
      customer.paymentTarget || 'Wasa',
      this.formatDate(customer.createdAt)
    ]);

    // Add full-width table
    autoTable(this.doc, {
      head: [['Nama', 'Paket', 'Harga', 'Diskon', 'Harga Final', 'Status', 'Bayar ke', 'Tanggal']],
      body: tableData,
      startY: this.margin + 25,
      margin: { left: this.margin, right: this.margin, top: this.margin, bottom: this.margin },
      pageBreak: 'auto',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [27, 35, 54],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      columnStyles: {
        0: { cellWidth: 'auto' }, // Nama - auto width
        1: { cellWidth: 'auto' }, // Paket
        2: { cellWidth: 'auto', halign: 'right' }, // Harga
        3: { cellWidth: 'auto', halign: 'right' }, // Diskon
        4: { cellWidth: 'auto', halign: 'right' }, // Harga Final
        5: { cellWidth: 'auto' }, // Status
        6: { cellWidth: 'auto' }, // Bayar ke
        7: { cellWidth: 'auto' }, // Tanggal
      },
      didDrawPage: (data) => {
        // Add footer
        this.doc.setFontSize(8);
        this.doc.setTextColor(128, 128, 128);
        this.doc.text(
          `Halaman ${data.pageNumber} - Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`,
          this.pageWidth / 2,
          this.pageHeight - 10,
          { align: 'center' }
        );
      },
    });
  }

  private addExpensesTable(expenses: Expense[]): void {
    // Add new page for expenses table
    this.doc.addPage();

    // Add page header
    this.doc.setFillColor(27, 35, 54); // #1B2336
    this.doc.rect(this.margin, this.margin, this.contentWidth, 15, 'F');

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('Daftar Biaya Operasional', this.pageWidth / 2, this.margin + 10, { align: 'center' });

    // Prepare table data
    const tableData = expenses.map(expense => [
      expense.description,
      expense.category || '',
      this.formatCurrency(expense.amount),
      this.formatDate(expense.date)
    ]);

    // Add full-width table
    autoTable(this.doc, {
      head: [['Deskripsi', 'Kategori', 'Jumlah', 'Tanggal']],
      body: tableData,
      startY: this.margin + 25,
      margin: { left: this.margin, right: this.margin, top: this.margin, bottom: this.margin },
      pageBreak: 'auto',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [27, 35, 54],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      columnStyles: {
        0: { cellWidth: 'auto' }, // Deskripsi
        1: { cellWidth: 'auto' }, // Kategori
        2: { cellWidth: 'auto', halign: 'right' }, // Jumlah
        3: { cellWidth: 'auto' }, // Tanggal
      },
      didDrawPage: (data) => {
        // Add footer
        this.doc.setFontSize(8);
        this.doc.setTextColor(128, 128, 128);
        this.doc.text(
          `Halaman ${data.pageNumber} - Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`,
          this.pageWidth / 2,
          this.pageHeight - 10,
          { align: 'center' }
        );
      },
    });
  }

  public generateReport(data: PDFReportData, fileName?: string): void {
    // Add header and get Y position
    const headerEndY = this.addHeader('Laporan Keuangan Wasa Finance', data.selectedMonth, data.selectedYear);

    // Add summary metrics and get Y position
    const summaryEndY = this.addSummaryMetrics(data, headerEndY);

    // Add customers table if there are customers
    if (data.customers.length > 0) {
      this.addCustomersTable(data.customers);
    }

    // Add expenses table if there are expenses
    if (data.expenses.length > 0) {
      this.addExpensesTable(data.expenses);
    }

    // Save the PDF
    const defaultFileName = data.selectedMonth === 0
      ? `Laporan-Keuangan-${data.selectedYear}.pdf`
      : `Laporan-Keuangan-${data.selectedMonth}-${data.selectedYear}.pdf`;

    this.doc.save(fileName || defaultFileName);
  }

  public generateCustomerReport(customers: Customer[], title: string, fileName?: string): void {
    // Add header
    const headerEndY = this.addHeader(title, 0, new Date().getFullYear());

    // Add customers table
    this.addCustomersTable(customers);

    // Save the PDF
    this.doc.save(fileName || `Daftar-Pelanggan-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  public generateExpenseReport(expenses: Expense[], fileName?: string): void {
    // Add header
    const headerEndY = this.addHeader('Laporan Biaya Operasional', 0, new Date().getFullYear());

    // Add expenses table
    this.addExpensesTable(expenses);

    // Save the PDF
    this.doc.save(fileName || `Laporan-Biaya-${new Date().toISOString().split('T')[0]}.pdf`);
  }
}

// Helper function to generate PDF report
export const generatePDFReport = (data: PDFReportData, fileName?: string): void => {
  const pdfGenerator = new PDFGenerator();
  pdfGenerator.generateReport(data, fileName);
};

// Helper function to generate customer PDF report
export const generateCustomerPDFReport = (customers: Customer[], title: string, fileName?: string): void => {
  const pdfGenerator = new PDFGenerator();
  pdfGenerator.generateCustomerReport(customers, title, fileName);
};

// Helper function to generate expense PDF report
export const generateExpensePDFReport = (expenses: Expense[], fileName?: string): void => {
  const pdfGenerator = new PDFGenerator();
  pdfGenerator.generateExpenseReport(expenses, fileName);
};