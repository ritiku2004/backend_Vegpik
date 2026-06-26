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

      // Top Accent Header Bar (Vegpik Green)
      doc.rect(0, 0, 612, 15).fill('#15803D');

      // Logo Image and Branding Text
      const logoPath = require('path').resolve(__dirname, '../../../App/assets/Logo/logo.png');
      try {
        doc.image(logoPath, 40, 32, { width: 45 });
      } catch (imgErr) {
        console.error('Failed to load receipt logo image:', imgErr);
        // Fallback graphical block if logo not loaded
        doc.rect(40, 32, 45, 45).fill('#15803D');
      }

      // Brand Title Text
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#15803D').text('Vegpik', 95, 34);
      doc.fontSize(9).font('Helvetica').fillColor('#4b5563').text('Premium Farm Fresh Groceries', 95, 54);
      doc.fontSize(8).fillColor('#9ca3af').text('www.vegpik.com | support@vegpik.com', 95, 66);

      // Invoice metadata (Right aligned in header)
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#111827').text('INVOICE / RECEIPT', 40, 34, { align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor('#4b5563').text(`Invoice #: INV-${order.order_number}`, 40, 52, { align: 'right' });
      doc.fontSize(9).text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 40, 66, { align: 'right' });

      // Horizontal separator line
      doc.moveTo(40, 90).lineTo(572, 90).strokeColor('#e5e7eb').lineWidth(1).stroke();

      // Customer Details (Light grey card block)
      doc.rect(40, 105, 532, 80).fill('#f8fafc');

      // Order info column
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1f2937').text('Order Details', 55, 115);
      doc.font('Helvetica').fillColor('#4b5563');
      doc.text(`Order Number: ${order.order_number}`, 55, 130);
      doc.text(`Payment: ${order.payment_method || 'Cash on Delivery'}`, 55, 145);
      doc.text(`Status: ${order.payment_status || 'Paid'}`, 55, 160);

      // Deliver to column
      const customerName = order.receiver_name || `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Valued Customer';
      doc.font('Helvetica-Bold').fillColor('#1f2937').text('Deliver To', 320, 115);
      doc.font('Helvetica').fillColor('#4b5563');
      doc.text(customerName, 320, 130);
      doc.text(order.receiver_mobile || order.user_phone || 'N/A', 320, 145);
      if (order.address_line1) {
        doc.text(order.address_line1.substring(0, 48), 320, 160);
      }

      // Items Table Header (Vegpik green banner)
      let y = 205;
      doc.rect(40, y, 532, 22).fill('#15803D');

      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
      doc.text('Item Description', 55, y + 6);
      doc.text('Qty', 320, y + 6, { width: 50, align: 'center' });
      doc.text('Price (AED)', 390, y + 6, { width: 80, align: 'right' });
      doc.text('Total (AED)', 480, y + 6, { width: 80, align: 'right' });
      
      y += 28;
      
      doc.font('Helvetica');
      
      // Items Rows
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          // Check page boundary
          if (y > 680) {
            doc.addPage();
            // Reprint Header Bar on new page
            doc.rect(0, 0, 612, 15).fill('#15803D');
            y = 50;
          }
          
          const itemPrice = parseFloat(item.price || 0);
          const itemQty = parseInt(item.quantity || 0);
          const itemTotal = itemPrice * itemQty;
          
          // Light background stripe for alternate rows
          if (index % 2 === 0) {
            doc.rect(40, y - 3, 532, 18).fill('#fbfbfb');
          }

          doc.fillColor('#374151').text(item.product_name || item.name || 'Product', 55, y);
          doc.fillColor('#4b5563').text(itemQty.toString(), 320, y, { width: 50, align: 'center' });
          doc.text(itemPrice.toFixed(2), 390, y, { width: 80, align: 'right' });
          doc.fillColor('#111827').text(itemTotal.toFixed(2), 480, y, { width: 80, align: 'right' });
          
          y += 18;
        });
      } else {
        doc.fillColor('#9ca3af').text('No items found', 55, y);
        y += 18;
      }

      y += 10;
      doc.moveTo(40, y).lineTo(572, y).strokeColor('#e5e7eb').lineWidth(1).stroke();
      y += 15;

      // Summary block
      const subtotal = order.items ? order.items.reduce((acc, item) => acc + (item.quantity * parseFloat(item.price || 0)), 0) : 0;
      
      const addSummaryRow = (label, val, isBold = false) => {
        if (isBold) {
          doc.font('Helvetica-Bold').fillColor('#15803D');
        } else {
          doc.font('Helvetica').fillColor('#4b5563');
        }
        doc.text(label, 350, y, { width: 120, align: 'right' });
        doc.text(val, 480, y, { width: 80, align: 'right' });
        y += 16;
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
      doc.moveTo(350, y).lineTo(572, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      y += 10;
      
      addSummaryRow('Grand Total:', `AED ${parseFloat(order.total_amount || 0).toFixed(2)}`, true);

      // Bottom Accent Footer Bar (Vegpik Green)
      doc.rect(0, doc.page.height - 15, 612, 15).fill('#15803D');

      // Footer text
      doc.fontSize(8).fillColor('#9ca3af').text('Thank you for shopping with Vegpik! For inquiries, contact support@vegpik.com', 40, doc.page.height - 40, { align: 'center' });

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
