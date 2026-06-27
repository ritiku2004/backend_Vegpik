const { addReceipt } = require('../models/receiptModel');
const { orderModel } = require('../models');
const fs = require('fs');
const path = require('path');

let base64Logo = '';
try {
  const logoPath = path.resolve(__dirname, '../../../App/assets/Logo/logo.png');
  const buf = fs.readFileSync(logoPath);
  base64Logo = `data:image/png;base64,${buf.toString('base64')}`;
} catch (e) {
  console.error('Could not load logo for receipt:', e);
}

const generateHtmlReceipt = (order) => {
  const customerName = order.receiver_name || `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Valued Customer';
  const orderDate = new Date(order.created_at).toLocaleDateString();
  const subtotal = order.items ? order.items.reduce((acc, item) => acc + (item.quantity * parseFloat(item.price || 0)), 0) : 0;
  
  const addressParts = [
    order.address_line1,
    order.address_line2,
    order.city,
    order.state,
    order.zip_code
  ].filter(Boolean).join(', ');

  const fullAddress = addressParts.length > 0 ? addressParts : 'No address provided';

  let itemsHtml = '';
  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      const itemPrice = parseFloat(item.price || 0);
      const itemQty = parseInt(item.quantity || 0);
      const itemTotal = itemPrice * itemQty;
      itemsHtml += `
        <tr>
          <td>${item.product_name || item.name || 'Product'}</td>
          <td style="text-align: center;">${itemQty}</td>
          <td style="text-align: right;">AED ${itemPrice.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 600;">AED ${itemTotal.toFixed(2)}</td>
        </tr>
      `;
    });
  } else {
    itemsHtml = `<tr><td colspan="4" style="text-align: center; color: #6b7280; padding: 15px;">No items found</td></tr>`;
  }

  let summaryHtml = `
    <div class="summary-row"><span>Subtotal:</span><span>AED ${subtotal.toFixed(2)}</span></div>
  `;
  if (parseFloat(order.delivery_fee) > 0) summaryHtml += `<div class="summary-row"><span>Delivery Fee:</span><span>AED ${parseFloat(order.delivery_fee).toFixed(2)}</span></div>`;
  if (parseFloat(order.handling_fee) > 0) summaryHtml += `<div class="summary-row"><span>Handling Fee:</span><span>AED ${parseFloat(order.handling_fee).toFixed(2)}</span></div>`;
  if (parseFloat(order.tip_amount) > 0) summaryHtml += `<div class="summary-row"><span>Tip:</span><span>AED ${parseFloat(order.tip_amount).toFixed(2)}</span></div>`;
  if (parseFloat(order.discount_amount) > 0) summaryHtml += `<div class="summary-row discount"><span>Discount:</span><span>-AED ${parseFloat(order.discount_amount).toFixed(2)}</span></div>`;
  
  summaryHtml += `
    <div class="summary-row grand-total-box">
      <span>Grand Total:</span>
      <span>AED ${parseFloat(order.total_amount || 0).toFixed(2)}</span>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Receipt - INV-${order.order_number}</title>
      <style>
        body { 
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
          margin: 0; 
          padding: 0; 
          color: #111827; 
          background: #fff; 
          font-size: 13px;
          line-height: 1.4;
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #15803D;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .logo-box {
          margin-bottom: 12px;
        }
        .logo-box img {
          height: 100px;
          object-fit: contain;
        }
        .company-details {
          margin-top: 5px;
          font-size: 13px;
          color: #4b5563;
          line-height: 1.5;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-details h2 {
          margin: 0 0 10px 0;
          color: #15803D;
          font-size: 26px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .invoice-details table {
          margin-left: auto;
          width: auto;
          margin-bottom: 0;
        }
        .invoice-details td {
          padding: 3px 0 3px 15px;
          text-align: right;
          border: none;
        }
        .details-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .details-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 15px;
          width: 48%;
          border-radius: 6px;
        }
        .details-box h3 {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }
        .details-box p {
          margin: 4px 0;
          font-size: 13px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table th {
          background: #111827;
          color: #ffffff;
          padding: 10px 12px;
          font-size: 12px;
          text-transform: uppercase;
          text-align: left;
        }
        .items-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .items-table tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .summary-wrapper {
          display: flex;
          justify-content: flex-end;
        }
        .summary-box {
          width: 320px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .summary-row.discount {
          color: #059669;
        }
        .grand-total-box {
          background: #15803D;
          color: #ffffff;
          font-weight: bold;
          font-size: 18px;
          padding: 12px 15px;
          border: none;
          margin-top: 10px;
          border-radius: 6px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 13px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
        @media print {
          .container { padding: 25px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        
        <div class="header">
          <div>
            <div class="logo-box">
              <img src="${base64Logo}" alt="Vegpik Logo" onerror="this.outerHTML='<h1 style=\\'color:#15803D;margin:0;\\'>Vegpik</h1>'" />
            </div>
            <div class="company-details">
              <strong>Premium Farm Fresh Groceries</strong><br>
              vegpik.com<br>
              support@vegpik.com
            </div>
          </div>
          <div class="invoice-details">
            <h2>INVOICE</h2>
            <table>
              <tr><td style="color:#6b7280;">Invoice No:</td><td><strong>INV-${order.order_number}</strong></td></tr>
              <tr><td style="color:#6b7280;">Date:</td><td><strong>${orderDate}</strong></td></tr>
              <tr><td style="color:#6b7280;">Status:</td><td style="color:#15803D;"><strong>${(order.payment_status || 'Paid').toUpperCase()}</strong></td></tr>
            </table>
          </div>
        </div>

        <div class="details-grid">
          <div class="details-box">
            <h3>Billed To</h3>
            <p><strong>${customerName}</strong></p>
            <p>${order.receiver_mobile || order.user_phone || 'N/A'}</p>
            <p>${fullAddress}</p>
          </div>
          <div class="details-box" style="text-align: right;">
            <h3>Payment Method</h3>
            <p><strong>${order.payment_method || 'Cash on Delivery'}</strong></p>
            <p>Order ID: #${order.id}</p>
            <p>Currency: AED</p>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary-wrapper">
          <div class="summary-box">
            ${summaryHtml}
          </div>
        </div>

        <div class="footer">
          <strong>Thank you for shopping with Vegpik!</strong><br>
          If you have any questions about this invoice, please contact support@vegpik.com
        </div>
        
      </div>
    </body>
    </html>
  `;
};

const generateAndStoreReceipt = async (orderId) => {
  const order = await orderModel.getOrderById(orderId);
  if (!order) throw new Error('Order not found');
  
  const htmlString = generateHtmlReceipt(order);
  const htmlBuffer = Buffer.from(htmlString, 'utf8');
  const fileName = `receipt_${order.order_number}.html`;
  
  await addReceipt(orderId, fileName, htmlBuffer);
  return fileName;
};

module.exports = {
  generateHtmlReceipt,
  generateAndStoreReceipt
};
