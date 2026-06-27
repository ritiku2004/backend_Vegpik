const express = require('express');
const router = express.Router();
const { receiptModel } = require('../../../models');

router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { receiptService } = require('../../../services');
    const { orderModel } = require('../../../models');
    
    const order = await orderModel.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    // Generate fresh HTML on the fly so design updates apply instantly
    const htmlContent = receiptService.generateHtmlReceipt(order);
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json({
      success: true,
      html: htmlContent
    });
  } catch (error) {
    console.error('Error serving receipt:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve receipt' });
  }
});

router.get('/:orderId/view', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { receiptService } = require('../../../services');
    const { orderModel } = require('../../../models');
    
    const order = await orderModel.getOrderById(orderId);
    if (!order) {
      return res.status(404).send('Order not found');
    }
    
    const htmlContent = receiptService.generateHtmlReceipt(order);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error serving receipt html:', error);
    res.status(500).send('Failed to retrieve receipt');
  }
});

module.exports = router;
