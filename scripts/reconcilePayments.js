const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = require('../src/config/db');
const { orderModel } = require('../src/models');
const { razorpay } = require('../src/utils');
const { notificationService } = require('../src/services');

async function reconcile() {
  console.log(`[${new Date().toISOString()}] Starting payment reconciliation job...`);
  
  try {
    // 1. Fetch pending orders between 5 minutes and 12 hours old
    const [pendingOrders] = await pool.query(`
      SELECT * FROM orders 
      WHERE status = 'Pending Payment' 
      AND payment_status = 'Pending'
      AND created_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      AND created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)
    `);

    console.log(`Found ${pendingOrders.length} pending orders to reconcile.`);

    for (const order of pendingOrders) {
      console.log(`Processing Order ID: ${order.id}, Number: ${order.order_number}, Razorpay Order ID: ${order.razorpay_order_id}`);

      if (!order.razorpay_order_id) {
        // No payment registration, cancel after 30 minutes
        const elapsedMinutes = (new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60);
        if (elapsedMinutes > 30) {
          console.log(`Order #${order.order_number} has no Razorpay Order ID and is older than 30 mins. Cancelling order...`);
          await pool.query(
            "UPDATE orders SET status = 'Cancelled', payment_status = 'Failed' WHERE id = ?",
            [order.id]
          );
          await orderModel.recordPaymentLog(order.id, null, null, 'reconcile_auto_cancel_no_razorpay', { message: 'Cancelled due to no payment generated after 30 minutes.' });
        }
        continue;
      }

      try {
        // Fetch payments for this Razorpay Order
        const response = await razorpay.orders.fetchPayments(order.razorpay_order_id);
        const payments = response.items || [];
        
        // Find if there is any successful payment (captured status)
        const successfulPayment = payments.find(p => p.status === 'captured');

        if (successfulPayment) {
          console.log(`Found captured payment ${successfulPayment.id} for Order #${order.order_number}. Reconciling...`);
          
          const signature = successfulPayment.signature || 'reconciled_fallback';
          const result = await orderModel.verifyAndConfirmPayment(order.id, successfulPayment.id, signature);
          
          await orderModel.recordPaymentLog(
            order.id, 
            order.razorpay_order_id, 
            successfulPayment.id, 
            'reconcile_success', 
            { successfulPayment }
          );

          if (!result.alreadyPaid) {
            try {
              await notificationService.sendOrderStatus(order.user_id, order.id, 'placed');
              await notificationService.sendAdminOrderArrived(order.id);
            } catch (notifErr) {
              console.error('Failed to send reconciliation notifications:', notifErr);
            }
          }
          console.log(`Successfully reconciled Order #${order.order_number}.`);
        } else {
          // No captured payments. If older than 1 hour, auto-cancel
          const elapsedMinutes = (new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60);
          if (elapsedMinutes > 60) {
            console.log(`Order #${order.order_number} has no captured payments after 60 mins. Auto-cancelling...`);
            await pool.query(
              "UPDATE orders SET status = 'Cancelled', payment_status = 'Failed' WHERE id = ?",
              [order.id]
            );
            await orderModel.recordPaymentLog(
              order.id, 
              order.razorpay_order_id, 
              null, 
              'reconcile_auto_cancel_unpaid', 
              { paymentsFetched: payments.map(p => ({ id: p.id, status: p.status })) }
            );
          }
        }
      } catch (rzpErr) {
        console.error(`Error querying Razorpay API for order ${order.order_number}:`, rzpErr.message);
      }
    }

    console.log('Payment reconciliation job finished.');
  } catch (err) {
    console.error('Failed to run reconciliation job:', err);
  } finally {
    process.exit(0);
  }
}

reconcile();
