const PDFDocument = require('pdfkit');
const { addReceipt } = require('../models/receiptModel');
const { orderModel } = require('../models');

const generatePdfBuffer = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];
      doc.on('data', (buf) => buffers.push(buf));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header branding
      const logoPath = require('path').resolve(__dirname, '../../../admin-_Vegpik/src/assets/Vegpik-logo.png');
      try {
        doc.image(logoPath, 40, 35, { width: 50 });
      } catch (imgErr) {
        console.error('Failed to load receipt logo image:', imgErr);
        doc.fontSize(24).fillColor('#10b981').text('Vegpik', 40, 35, { align: 'left' });
      }

      doc.fontSize(10).fillColor('#4b5563').text('Premium Fresh Groceries', 105, 60);
      
      doc.fontSize(18).fillColor('#111827').text('ORDER RECEIPT', 40, 95, { align: 'right' });
      
      doc.moveTo(40, 120).lineTo(570, 120).strokeColor('#e5e7eb').stroke();

      // Meta Details (Two columns layout)
      doc.fontSize(10).fillColor('#4b5563');
      doc.text(`Order Number: ${order.order_number}`, 40, 140);
      doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`, 40, 155);
      doc.text('Payment Method: Cash on Delivery', 40, 170);
      doc.text(`Payment Status: ${order.payment_status || 'Pending'}`, 40, 185);

      // Customer Details (Column 2)
      const customerName = order.receiver_name || `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Valued Customer';
      doc.text('Deliver To:', 350, 140, { bold: true });
      doc.text(customerName, 350, 155);
      doc.text(order.receiver_mobile || order.user_phone || 'N/A', 350, 170);
      if (order.address_line1) {
        doc.text(order.address_line1.substring(0, 45), 350, 185);
      }

      doc.moveTo(40, 210).lineTo(570, 210).strokeColor('#e5e7eb').stroke();

      // Items Table Header
      let y = 230;
      doc.font('Helvetica-Bold').fillColor('#111827');
      doc.text('Item Description', 40, y);
      doc.text('Qty', 320, y, { width: 50, align: 'center' });
      doc.text('Price (AED)', 390, y, { width: 80, align: 'right' });
      doc.text('Total (AED)', 490, y, { width: 80, align: 'right' });
      
      doc.moveTo(40, 245).lineTo(570, 245).strokeColor('#f3f4f6').stroke();
      
      doc.font('Helvetica');
      y = 255;
      
      // Items Rows
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          // Check page boundary
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
          
          const itemPrice = parseFloat(item.price || 0);
          const itemQty = parseInt(item.quantity || 0);
          const itemTotal = itemPrice * itemQty;
          
          doc.fillColor('#374151').text(item.product_name || item.name || 'Product', 40, y);
          doc.fillColor('#4b5563').text(itemQty.toString(), 320, y, { width: 50, align: 'center' });
          doc.text(itemPrice.toFixed(2), 390, y, { width: 80, align: 'right' });
          doc.fillColor('#111827').text(itemTotal.toFixed(2), 490, y, { width: 80, align: 'right' });
          
          y += 20;
        });
      } else {
        doc.fillColor('#9ca3af').text('No items found', 40, y);
        y += 20;
      }

      doc.moveTo(40, y + 10).lineTo(570, y + 10).strokeColor('#e5e7eb').stroke();
      y += 25;

      // Summary block
      const subtotal = order.items ? order.items.reduce((acc, item) => acc + (item.quantity * parseFloat(item.price || 0)), 0) : 0;
      
      const addSummaryRow = (label, val, isBold = false) => {
        if (isBold) doc.font('Helvetica-Bold');
        doc.fillColor(isBold ? '#111827' : '#4b5563').text(label, 350, y, { width: 120, align: 'right' });
        doc.text(val, 490, y, { width: 80, align: 'right' });
        if (isBold) doc.font('Helvetica');
        y += 18;
      };

      addSummaryRow('Subtotal:', `AED ${subtotal.toFixed(2)}`);
      if (parseFloat(order.delivery_fee) > 0) {
        addSummaryRow('Delivery Fee:', `AED ${parseFloat(order.delivery_fee).toFixed(2)}`);
      }
      if (parseFloat(order.handling_fee) > 0) {
        addSummaryRow('Handling Fee:', `AED ${parseFloat(order.handling_fee).toFixed(2)}`);
      }
      if (parseFloat(order.tip_amount) > 0) {
        addSummaryRow('Tip:', `AED ${parseFloat(order.tip_amount).toFixed(2)}`);
      }
      if (parseFloat(order.discount_amount) > 0) {
        addSummaryRow('Discount:', `-AED ${parseFloat(order.discount_amount).toFixed(2)}`);
      }
      
      y += 5;
      doc.moveTo(350, y).lineTo(570, y).strokeColor('#e5e7eb').stroke();
      y += 10;
      
      addSummaryRow('Grand Total:', `AED ${parseFloat(order.total_amount || 0).toFixed(2)}`, true);

      // Footer
      doc.fontSize(8).fillColor('#9ca3af').text('Thank you for shopping with Vegpik! For inquiries, contact support@vegpik.com', 40, doc.page.height - 50, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const generateAndStoreReceipt = async (orderId) => {
  const order = await orderModel.getOrderById(orderId);
  if (!order) throw new Error('Order not found');
  const pdfBuffer = await generatePdfBuffer(order);
  const fileName = `receipt_${order.order_number}.pdf`;
  await addReceipt(orderId, fileName, pdfBuffer);
  return fileName;
};

module.exports = {
  generatePdfBuffer,
  generateAndStoreReceipt
};
