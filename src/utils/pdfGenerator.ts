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
  totalRevenueBeforeDiscount: number;
  wasaProfit: number;
  wasaProfitBeforeDiscount: number;
  officeProfit: number;
  totalExpenses: number;
  wasaNetProfit: number;
  wasaNetProfitBeforeDiscount: number;
  totalDiscount: number;
  totalActiveCustomers: number;
  paidCustomers: number;
  unpaidCustomers: number;
  customersPayToWasa: number;
  customersPayToOffice: number;
  totalPaymentToWasa: number;
  totalPaymentToOffice: number;
  officeToWasaPayment?: number;
  wasaToOfficePayment?: number;
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
    try {
      if (date instanceof Date) {
        return date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
      if (typeof date === 'object' && 'toDate' in date) {
        return date.toDate().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
      return '-';
    } catch (error) {
      console.warn('Error formatting date:', date, error);
      return '-';
    }
  }

  private addHeader(title: string, selectedMonth: number, selectedYear: number): number {
    // Add header background
    this.doc.setFillColor(27, 35, 54); // #1B2336
    this.doc.rect(this.margin, this.margin, this.contentWidth, 25, 'F');

    // Add title in white centered
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(title, this.pageWidth / 2, this.margin + 18, { align: 'center' });

    // Add period info below header
    const months = [
      'Semua Data', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(27, 35, 54);
    const period = selectedMonth === 0
      ? `Laporan Tahun ${selectedYear}`
      : `Periode: ${months[selectedMonth]} ${selectedYear}`;
    this.doc.text(period, this.pageWidth / 2, this.margin + 40, { align: 'center' });

    // Add generation date
    const generatedDate = `Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    this.doc.setFontSize(9);
    this.doc.setTextColor(27, 35, 54);
    this.doc.text(generatedDate, this.pageWidth / 2, this.margin + 48, { align: 'center' });

    return this.margin + 55; // Return Y position after header
  }

  private addColorfulSummaryMetrics(data: PDFReportData, startY: number): number {
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
      ['Total Diskon', this.formatCurrency(data.totalDiscount || 0)],
      ['Total Pelanggan', `${data.totalActiveCustomers} pelanggan`],
      ['Pelanggan Aktif', `${data.paidCustomers} pelanggan`],
      ['Pelanggan Non-Aktif', `${data.unpaidCustomers} pelanggan`],
    ];

    // Create financial summary table
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
      ['Wasa Bayar ke Kantor', this.formatCurrency(data.wasaToOfficePayment || 0)],
      ['Pelanggan Bayar ke Kantor', `${data.customersPayToOffice} pelanggan`],
      ['Total Pembayaran ke Kantor', this.formatCurrency(data.totalPaymentToOffice)],
      ['Kantor Bayar ke Wasa', this.formatCurrency(data.officeToWasaPayment || 0)],
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

  private addCustomerSummary(customers: Customer[], startY: number): number {
    let yPosition = startY;

    // Calculate metrics
    const totalRevenue = customers.reduce((sum, customer) => sum + (customer.packagePrice - (customer.discountAmount || 0)), 0);
    const wasaRevenue = customers
      .filter(customer => customer.paymentTarget === 'Wasa')
      .reduce((sum, customer) => sum + (customer.packagePrice - (customer.discountAmount || 0)), 0);
    const officeRevenue = customers
      .filter(customer => customer.paymentTarget === 'Kantor')
      .reduce((sum, customer) => sum + (customer.packagePrice - (customer.discountAmount || 0)), 0);
    const wasaCustomers = customers.filter(customer => customer.paymentTarget === 'Wasa').length;
    const officeCustomers = customers.filter(customer => customer.paymentTarget === 'Kantor').length;
    const totalDiscount = customers.reduce((sum, customer) => sum + (customer.discountAmount || 0), 0);

    // Section Title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(27, 35, 54);
    this.doc.text('Ringkasan Pelanggan', this.margin, yPosition);
    yPosition += 15;

    // Create minimal summary boxes
    const boxWidth = this.contentWidth / 2 - 6;
    const boxHeight = 40;
    let currentX = this.margin;

    // Total Customers Box
    this.doc.setFillColor(27, 35, 54);
    this.doc.rect(currentX, yPosition, boxWidth, boxHeight, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.text('Total Pelanggan', currentX + 8, yPosition + 15);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${customers.length}`, currentX + 8, yPosition + 30);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('pelanggan', currentX + 35, yPosition + 30);

    // Total Revenue Box
    currentX += boxWidth + 12;
    this.doc.setFillColor(27, 35, 54);
    this.doc.rect(currentX, yPosition, boxWidth, boxHeight, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.text('Total Pendapatan', currentX + 8, yPosition + 15);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.formatCurrency(totalRevenue), currentX + 8, yPosition + 30);

    yPosition += boxHeight + 12;
    currentX = this.margin;

    // Wasa Revenue Box
    this.doc.setFillColor(27, 35, 54);
    this.doc.rect(currentX, yPosition, boxWidth, boxHeight, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.text('Pendapatan Wasa', currentX + 8, yPosition + 15);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.formatCurrency(wasaRevenue), currentX + 8, yPosition + 28);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`${wasaCustomers} pelanggan`, currentX + 8, yPosition + 35);

    // Office Revenue Box
    currentX += boxWidth + 12;
    this.doc.setFillColor(27, 35, 54);
    this.doc.rect(currentX, yPosition, boxWidth, boxHeight, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.text('Pendapatan Kantor', currentX + 8, yPosition + 15);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.formatCurrency(officeRevenue), currentX + 8, yPosition + 28);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`${officeCustomers} pelanggan`, currentX + 8, yPosition + 35);

    yPosition += boxHeight + 20;

    // Simple Statistics Table
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(27, 35, 54);
    this.doc.text('Statistik Lengkap', this.margin, yPosition);
    yPosition += 10;

    const statsData = [
      ['Total Pelanggan', `${customers.length}`],
      ['Pendapatan Kotor', this.formatCurrency(totalRevenue)],
      ['Total Diskon', this.formatCurrency(totalDiscount)],
      ['Pendapatan Wasa', this.formatCurrency(wasaRevenue)],
      ['Pendapatan Kantor', this.formatCurrency(officeRevenue)],
      ['Rata-rata per Pelanggan', this.formatCurrency(customers.length > 0 ? totalRevenue / customers.length : 0)],
    ];

    // Create simple table
    const tableRowHeight = 8;
    const colWidth = this.contentWidth / 2;

    statsData.forEach(([label, value], index) => {
      // Left column
      this.doc.setFontSize(9);
      this.doc.setTextColor(27, 35, 54);
      this.doc.text(label, this.margin, yPosition + 5);

      // Right column
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(value, this.margin + colWidth, yPosition + 5);

      yPosition += tableRowHeight;
    });

    return yPosition + 15; // Return Y position after summary
  }

  private addCustomersTable(customers: Customer[]): void {
    // Add new page for customers table
    this.doc.addPage();

    // Add page header
    this.doc.setFillColor(27, 35, 54);
    this.doc.rect(this.margin, this.margin, this.contentWidth, 15, 'F');

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('Daftar Pelanggan', this.pageWidth / 2, this.margin + 10, { align: 'center' });

    // Prepare table data
    const tableData = customers.map(customer => [
      customer.name,
      customer.packageName,
      this.formatCurrency(customer.packagePrice),
      customer.discountAmount ? this.formatCurrency(customer.discountAmount) : 'Rp 0',
      this.formatCurrency(customer.discountAmount ? customer.packagePrice - customer.discountAmount : customer.packagePrice),
      customer.status,
      customer.paymentTarget || 'Wasa',
      this.formatDate(customer.createdAt)
    ]);

    // Add table with minimal styling
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
        lineColor: [27, 35, 54],
        lineWidth: 0.1,
        fillColor: [255, 255, 255],
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
        0: { cellWidth: 'auto' }, // Nama
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
        this.doc.setTextColor(27, 35, 54);
        this.doc.text(
          `Halaman ${data.pageNumber} - Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`,
          this.pageWidth / 2,
          this.pageHeight - 10,
          { align: 'center' }
        );
      },
    });
  }

  private addExpenseSummary(expenses: Expense[], startY: number): number {
    let yPosition = startY;

    // Calculate expense metrics
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Get categories
    const categories = [...new Set(expenses.map(expense => expense.category).filter(Boolean))];
    const categoryCounts = categories.reduce((acc, category) => {
      acc[category] = expenses.filter(e => e.category === category).length;
      return acc;
    }, {} as Record<string, number>);

    // Section Title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(27, 35, 54);
    this.doc.text('Ringkasan Biaya Operasional', this.margin, yPosition);
    yPosition += 15;

    // Create summary boxes similar to customer summary
    const boxWidth = this.contentWidth / 2 - 6;
    const boxHeight = 40;
    let currentX = this.margin;

    // Total Expenses Box
    this.doc.setFillColor(27, 35, 54);
    this.doc.rect(currentX, yPosition, boxWidth, boxHeight, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.text('Total Biaya', currentX + 8, yPosition + 15);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.formatCurrency(totalExpenses), currentX + 8, yPosition + 30);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('semua biaya', currentX + 35, yPosition + 30);

    // Total Transactions Box
    currentX += boxWidth + 12;
    this.doc.setFillColor(27, 35, 54);
    this.doc.rect(currentX, yPosition, boxWidth, boxHeight, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.text('Total Transaksi', currentX + 8, yPosition + 15);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${expenses.length}`, currentX + 8, yPosition + 30);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('transaksi', currentX + 35, yPosition + 30);

    yPosition += boxHeight + 12;
    currentX = this.margin;

    // Categories Box
    this.doc.setFillColor(27, 35, 54);
    this.doc.rect(currentX, yPosition, boxWidth, boxHeight, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.text('Kategori', currentX + 8, yPosition + 15);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${categories.length}`, currentX + 8, yPosition + 30);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('kategori', currentX + 35, yPosition + 30);

    // Average Expense Box
    currentX += boxWidth + 12;
    this.doc.setFillColor(27, 35, 54);
    this.doc.rect(currentX, yPosition, boxWidth, boxHeight, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.text('Rata-rata', currentX + 8, yPosition + 15);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.formatCurrency(expenses.length > 0 ? totalExpenses / expenses.length : 0), currentX + 8, yPosition + 28);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('per transaksi', currentX + 8, yPosition + 35);

    yPosition += boxHeight + 20;

    // Category Breakdown Table
    if (categories.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(27, 35, 54);
      this.doc.text('Breakdown Kategori', this.margin, yPosition);
      yPosition += 10;

      const categoryData = categories.map(category => {
        const categoryExpenses = expenses.filter(e => e.category === category);
        const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        return [category, `${categoryCounts[category]} transaksi`, this.formatCurrency(categoryTotal)];
      });

      // Create simple table
      const tableRowHeight = 8;
      const colWidths = [this.contentWidth * 0.4, this.contentWidth * 0.3, this.contentWidth * 0.3];

      // Header row
      this.doc.setFillColor(27, 35, 54);
      this.doc.rect(this.margin, yPosition, this.contentWidth, tableRowHeight, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Kategori', this.margin + 2, yPosition + 5);
      this.doc.text('Jumlah', this.margin + colWidths[0] + 2, yPosition + 5);
      this.doc.text('Total', this.margin + colWidths[0] + colWidths[1] + 2, yPosition + 5);

      yPosition += tableRowHeight;

      // Data rows
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont('helvetica', 'normal');
      categoryData.forEach(([category, count, total], index) => {
        // Alternate row color
        if (index % 2 === 0) {
          this.doc.setFillColor(245, 245, 245);
          this.doc.rect(this.margin, yPosition, this.contentWidth, tableRowHeight, 'F');
        }

        this.doc.setFontSize(9);
        this.doc.text(category, this.margin + 2, yPosition + 5);
        this.doc.text(count, this.margin + colWidths[0] + 2, yPosition + 5);
        this.doc.text(total, this.margin + colWidths[0] + colWidths[1] + 2, yPosition + 5);
        yPosition += tableRowHeight;
      });

      yPosition += 10;
    }

    return yPosition + 15; // Return Y position after summary
  }

  private addExpensesTable(expenses: Expense[]): void {
    // Add new page for expenses table
    this.doc.addPage();

    // Add page header
    this.doc.setFillColor(27, 35, 54);
    this.doc.rect(this.margin, this.margin, this.contentWidth, 15, 'F');

    this.doc.setFontSize(14);
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

    // Add table with minimal styling
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
        lineColor: [27, 35, 54],
        lineWidth: 0.1,
        fillColor: [255, 255, 255],
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
        this.doc.setTextColor(27, 35, 54);
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

    // Add colorful summary metrics for dashboard
    this.addColorfulSummaryMetrics(data, headerEndY);

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

    // Add customer summary
    const summaryEndY = this.addCustomerSummary(customers, headerEndY);

    // Add customers table
    this.addCustomersTable(customers);

    // Save the PDF
    this.doc.save(fileName || `Daftar-Pelanggan-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  public generateExpenseReport(expenses: Expense[], fileName?: string): void {
    // Add header
    const headerEndY = this.addHeader('Laporan Biaya Operasional', 0, new Date().getFullYear());

    // Add expense summary
    this.addExpenseSummary(expenses, headerEndY);

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