import jsPDF from 'jspdf';
import 'jspdf-autotable';

const NBA_BLUE = '#1e3c72';
const NBA_LIGHT_BLUE = '#2a5298';

const addNBAHeader = (doc, title) => {
  doc.setFillColor(NBA_BLUE);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('NBA LITIGMUS', 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Nigerian Bar Association - Case Management System', 105, 25, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 35, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
};

const addFooter = (doc, pageNumber, totalPages) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-NG')} at ${new Date().toLocaleTimeString('en-NG')}`,
    15,
    pageHeight - 7
  );
  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth - 15,
    pageHeight - 7,
    { align: 'right' }
  );
};

export const generateCaseReport = (caseData) => {
  const doc = new jsPDF();
  
  addNBAHeader(doc, 'CASE REPORT');
  
  let yPos = 50;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(NBA_BLUE);
  doc.text('Case Information', 15, yPos);
  yPos += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const caseInfo = [
    ['Case Number:', caseData.caseNumber || 'N/A'],
    ['Case Type:', caseData.caseType || 'N/A'],
    ['Status:', caseData.status || 'N/A'],
    ['Filing Date:', caseData.filingDate ? new Date(caseData.filingDate).toLocaleDateString('en-NG') : 'N/A'],
    ['Court:', caseData.court || 'N/A'],
    ['State:', caseData.state || 'N/A'],
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: caseInfo,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 130 }
    },
    margin: { left: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(NBA_BLUE);
  doc.text('Parties Involved', 15, yPos);
  yPos += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const parties = [
    ['Plaintiff:', caseData.plaintiff || 'N/A'],
    ['Defendant:', caseData.defendant || 'N/A'],
    ['Plaintiff Lawyer:', caseData.plaintiffLawyer || 'N/A'],
    ['Defendant Lawyer:', caseData.defendantLawyer || 'N/A'],
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: parties,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 130 }
    },
    margin: { left: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  if (caseData.assignedJudge) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(NBA_BLUE);
    doc.text('Assigned Judge', 15, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`${caseData.assignedJudge.firstName} ${caseData.assignedJudge.lastName}`, 15, yPos);
    yPos += 15;
  }
  
  if (caseData.hearings && caseData.hearings.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(NBA_BLUE);
    doc.text('Hearing Schedule', 15, yPos);
    yPos += 10;
    
    const hearingData = caseData.hearings.map(h => [
      new Date(h.date).toLocaleDateString('en-NG'),
      h.time || 'N/A',
      h.type || 'N/A',
      h.status || 'N/A'
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Time', 'Type', 'Status']],
      body: hearingData,
      theme: 'striped',
      headStyles: { fillColor: NBA_BLUE, textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 15, right: 15 }
    });
  }
  
  addFooter(doc, 1, 1);
  
  doc.save(`Case_Report_${caseData.caseNumber || 'Unknown'}.pdf`);
};

export const generatePaymentReceipt = (paymentData) => {
  const doc = new jsPDF();
  
  addNBAHeader(doc, 'PAYMENT RECEIPT');
  
  let yPos = 50;
  
  doc.setFillColor(NBA_LIGHT_BLUE);
  doc.rect(15, yPos, 180, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT DETAILS', 105, yPos + 7, { align: 'center' });
  yPos += 20;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const receiptInfo = [
    ['Receipt Number:', paymentData.receiptNumber || 'N/A'],
    ['Date:', paymentData.date ? new Date(paymentData.date).toLocaleDateString('en-NG') : new Date().toLocaleDateString('en-NG')],
    ['Payment Type:', paymentData.type || 'N/A'],
    ['Amount:', `₦${(paymentData.amount || 0).toLocaleString('en-NG')}`],
    ['Payment Method:', paymentData.method || 'N/A'],
    ['Status:', paymentData.status || 'N/A'],
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: receiptInfo,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 120 }
    },
    margin: { left: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  if (paymentData.caseNumber) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(NBA_BLUE);
    doc.text('Case Information', 15, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const caseInfo = [
      ['Case Number:', paymentData.caseNumber],
      ['Plaintiff:', paymentData.plaintiff || 'N/A'],
      ['Defendant:', paymentData.defendant || 'N/A'],
    ];
    
    doc.autoTable({
      startY: yPos,
      head: [],
      body: caseInfo,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 120 }
      },
      margin: { left: 15 }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  }
  
  yPos += 20;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos, 180, 30, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('This is an official receipt from the Nigerian Bar Association', 105, yPos + 10, { align: 'center' });
  doc.text('Case Management System (LITIGMUS)', 105, yPos + 17, { align: 'center' });
  doc.text('For inquiries, please contact your court registrar', 105, yPos + 24, { align: 'center' });
  
  addFooter(doc, 1, 1);
  
  doc.save(`Receipt_${paymentData.receiptNumber || 'Unknown'}.pdf`);
};

export const generateCourtStatisticsReport = (statsData) => {
  const doc = new jsPDF();
  
  addNBAHeader(doc, 'COURT STATISTICS REPORT');
  
  let yPos = 50;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(NBA_BLUE);
  doc.text('Summary Statistics', 15, yPos);
  yPos += 10;
  
  const summaryData = [
    ['Total Cases:', (statsData.totalCases || 0).toString()],
    ['Active Cases:', (statsData.activeCases || 0).toString()],
    ['Closed Cases:', (statsData.closedCases || 0).toString()],
    ['Pending Cases:', (statsData.pendingCases || 0).toString()],
    ['Total Judges:', (statsData.totalJudges || 0).toString()],
    ['Total Payments:', `₦${(statsData.totalPayments || 0).toLocaleString('en-NG')}`],
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: NBA_BLUE },
    styles: { fontSize: 11, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { cellWidth: 110 }
    },
    margin: { left: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  if (statsData.casesByType && Object.keys(statsData.casesByType).length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(NBA_BLUE);
    doc.text('Cases by Type', 15, yPos);
    yPos += 10;
    
    const caseTypeData = Object.entries(statsData.casesByType).map(([type, count]) => [
      type,
      count.toString()
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Case Type', 'Count']],
      body: caseTypeData,
      theme: 'striped',
      headStyles: { fillColor: NBA_BLUE, textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 15, right: 15 }
    });
  }
  
  addFooter(doc, 1, 1);
  
  doc.save(`Court_Statistics_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateCaseListReport = (cases) => {
  const doc = new jsPDF('landscape');
  
  addNBAHeader(doc, 'CASE LIST REPORT');
  
  const caseData = cases.map(c => [
    c.caseNumber || 'N/A',
    c.caseType || 'N/A',
    c.plaintiff || 'N/A',
    c.defendant || 'N/A',
    c.status || 'N/A',
    c.filingDate ? new Date(c.filingDate).toLocaleDateString('en-NG') : 'N/A'
  ]);
  
  doc.autoTable({
    startY: 50,
    head: [['Case Number', 'Type', 'Plaintiff', 'Defendant', 'Status', 'Filing Date']],
    body: caseData,
    theme: 'striped',
    headStyles: { fillColor: NBA_BLUE, textColor: 255 },
    styles: { fontSize: 9 },
    margin: { left: 15, right: 15 }
  });
  
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }
  
  doc.save(`Case_List_${new Date().toISOString().split('T')[0]}.pdf`);
};
