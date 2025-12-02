import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { InvoiceData } from "./types";

export {
  DEFAULT_SENDER,
  DEFAULT_BANK_DETAILS,
  DEFAULT_EVM_ADDRESS,
  DEFAULT_CLIENT,
  DEFAULT_SERVICE,
} from "./template.config";

const COLORS = {
  black: rgb(0, 0, 0),
  darkGray: rgb(0.2, 0.2, 0.2),
  mediumGray: rgb(0.4, 0.4, 0.4),
  lightGray: rgb(0.6, 0.6, 0.6),
  tableHeader: rgb(0.95, 0.95, 0.95),
  accent: rgb(0.2, 0.2, 0.2),
};

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  // Invoice Title
  page.drawText(`INVOICE #${data.invoiceNumber}`, {
    x: margin,
    y: y,
    size: 28,
    font: fontBold,
    color: COLORS.black,
  });
  y -= 35;

  // Date
  page.drawText("Date:", {
    x: margin,
    y: y,
    size: 10,
    font: fontBold,
    color: COLORS.mediumGray,
  });
  y -= 15;
  page.drawText(data.date, {
    x: margin,
    y: y,
    size: 11,
    font: fontRegular,
    color: COLORS.darkGray,
  });
  y -= 40;

  // Two columns: From (left) and Billed To (right)
  const colWidth = (width - margin * 2) / 2;

  // FROM section (left)
  let leftY = y;
  page.drawText("From:", {
    x: margin,
    y: leftY,
    size: 10,
    font: fontBold,
    color: COLORS.mediumGray,
  });
  leftY -= 18;
  page.drawText(data.sender.name, {
    x: margin,
    y: leftY,
    size: 11,
    font: fontRegular,
    color: COLORS.darkGray,
  });
  leftY -= 15;
  page.drawText(`${data.sender.country}, ${data.sender.city},`, {
    x: margin,
    y: leftY,
    size: 10,
    font: fontRegular,
    color: COLORS.mediumGray,
  });
  leftY -= 13;
  page.drawText(data.sender.address, {
    x: margin,
    y: leftY,
    size: 10,
    font: fontRegular,
    color: COLORS.mediumGray,
  });
  leftY -= 13;
  page.drawText(data.sender.email, {
    x: margin,
    y: leftY,
    size: 10,
    font: fontRegular,
    color: COLORS.mediumGray,
  });
  leftY -= 13;
  page.drawText(data.sender.phone, {
    x: margin,
    y: leftY,
    size: 10,
    font: fontRegular,
    color: COLORS.mediumGray,
  });

  // BILLED TO section (right)
  let rightY = y;
  const rightX = margin + colWidth;
  page.drawText("Billed to:", {
    x: rightX,
    y: rightY,
    size: 10,
    font: fontBold,
    color: COLORS.mediumGray,
  });
  rightY -= 18;
  page.drawText(data.client.name, {
    x: rightX,
    y: rightY,
    size: 11,
    font: fontRegular,
    color: COLORS.darkGray,
  });
  rightY -= 15;
  page.drawText(data.client.addressLine1, {
    x: rightX,
    y: rightY,
    size: 10,
    font: fontRegular,
    color: COLORS.mediumGray,
  });
  rightY -= 13;
  page.drawText(data.client.addressLine2, {
    x: rightX,
    y: rightY,
    size: 10,
    font: fontRegular,
    color: COLORS.mediumGray,
  });
  if (data.client.addressLine3) {
    rightY -= 13;
    page.drawText(data.client.addressLine3, {
      x: rightX,
      y: rightY,
      size: 10,
      font: fontRegular,
      color: COLORS.mediumGray,
    });
  }

  y = Math.min(leftY, rightY) - 40;

  // Services Table Header
  const tableX = margin;
  const serviceColWidth = 220;
  const periodColWidth = 140;

  // Header background
  page.drawRectangle({
    x: tableX,
    y: y - 5,
    width: width - margin * 2,
    height: 25,
    color: COLORS.tableHeader,
  });

  page.drawText("Service", {
    x: tableX + 10,
    y: y + 5,
    size: 10,
    font: fontBold,
    color: COLORS.darkGray,
  });
  page.drawText("Time Period", {
    x: tableX + serviceColWidth + 10,
    y: y + 5,
    size: 10,
    font: fontBold,
    color: COLORS.darkGray,
  });
  page.drawText("Price", {
    x: tableX + serviceColWidth + periodColWidth + 10,
    y: y + 5,
    size: 10,
    font: fontBold,
    color: COLORS.darkGray,
  });

  y -= 35;

  // Service rows
  for (const service of data.services) {
    page.drawText(service.description, {
      x: tableX + 10,
      y: y,
      size: 10,
      font: fontRegular,
      color: COLORS.darkGray,
    });
    page.drawText(service.timePeriod, {
      x: tableX + serviceColWidth + 10,
      y: y,
      size: 10,
      font: fontRegular,
      color: COLORS.darkGray,
    });
    page.drawText(service.price, {
      x: tableX + serviceColWidth + periodColWidth + 10,
      y: y,
      size: 10,
      font: fontBold,
      color: COLORS.darkGray,
    });
    y -= 25;
  }

  // Separator line
  y -= 10;
  page.drawLine({
    start: { x: tableX, y: y },
    end: { x: width - margin, y: y },
    thickness: 1,
    color: COLORS.tableHeader,
  });

  y -= 25;

  // Total
  page.drawText("Total", {
    x: tableX + serviceColWidth + periodColWidth - 40,
    y: y,
    size: 12,
    font: fontBold,
    color: COLORS.darkGray,
  });
  page.drawText(data.total, {
    x: tableX + serviceColWidth + periodColWidth + 10,
    y: y,
    size: 14,
    font: fontBold,
    color: COLORS.black,
  });

  y -= 50;

  // Bank Details Section
  page.drawText("Bank details", {
    x: margin,
    y: y,
    size: 12,
    font: fontBold,
    color: COLORS.darkGray,
  });
  y -= 20;

  page.drawText(`Bank Name: ${data.bankDetails.bankName} ${data.bankDetails.bankAddress}`, {
    x: margin,
    y: y,
    size: 9,
    font: fontRegular,
    color: COLORS.mediumGray,
  });
  y -= 14;

  page.drawText(
    `Beneficiary name and address: ${data.bankDetails.beneficiaryName}, ${data.bankDetails.beneficiaryAddress}`,
    {
      x: margin,
      y: y,
      size: 9,
      font: fontRegular,
      color: COLORS.mediumGray,
    },
  );
  y -= 20;

  page.drawText(`IBAN: ${data.bankDetails.iban}`, {
    x: margin,
    y: y,
    size: 12,
    font: fontBold,
    color: COLORS.darkGray,
  });
  y -= 18;

  page.drawText(`SWIFT/BIC: ${data.bankDetails.swiftBic}`, {
    x: margin,
    y: y,
    size: 12,
    font: fontBold,
    color: COLORS.darkGray,
  });

  // EVM Address (if provided)
  if (data.evmAddress) {
    y -= 30;
    page.drawText(`EVM Address: ${data.evmAddress}`, {
      x: margin,
      y: y,
      size: 10,
      font: fontRegular,
      color: COLORS.mediumGray,
    });
  }

  return await pdfDoc.save();
}
