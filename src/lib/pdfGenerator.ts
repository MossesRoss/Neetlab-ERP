import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(invoice: any) {
    // Standard A4 document
    const doc = new jsPDF();
    const invoiceId = `INV-${invoice.id.split('-')[0].toUpperCase()}`;

    // --- HEADER ---
    doc.setFontSize(22);
    doc.setTextColor(14, 165, 233); // Sky 500
    doc.text('CORE ERP', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('Enterprise Billing Engine', 14, 28);

    // --- INVOICE DETAILS ---
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('INVOICE', 130, 22);

    doc.setFontSize(10);
    doc.text(`Invoice Number: ${invoiceId}`, 130, 30);
    doc.text(`Date: ${invoice.transaction_date}`, 130, 36);
    doc.text(`Status: ${invoice.status}`, 130, 42);

    // --- CUSTOMER DETAILS ---
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Bill To:', 14, 50);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(invoice.entities.name, 14, 56);
    if (invoice.entities.email) {
        doc.text(invoice.entities.email, 14, 62);
    }

    // --- LINE ITEMS TABLE ---
    const tableColumn = ["Description", "Quantity", "Unit Price", "Total"];
    const tableRows = invoice.transaction_lines.map((line: any) => [
        line.description,
        line.quantity,
        `$${Number(line.unit_price).toFixed(2)}`,
        `$${Number(line.line_total).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 75,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { top: 10 }
    });

    // --- FINANCIAL TOTALS ---
    const finalY = (doc as any).lastAutoTable.finalY || 75;

    // Reverse engineer the subtotal from the tax (Tax is 10% in our engine)
    const totalAmount = Number(invoice.total_amount);
    const taxAmount = Number(invoice.tax_amount || 0);
    const subtotal = totalAmount - taxAmount;

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 130, finalY + 12);
    doc.text(`Tax (10%): $${taxAmount.toFixed(2)}`, 130, finalY + 18);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Due: $${totalAmount.toFixed(2)}`, 130, finalY + 28);

    // --- FOOTER ---
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated securely by Core ERP.', 14, 280);

    // Save the PDF locally
    doc.save(`${invoiceId}.pdf`);
}