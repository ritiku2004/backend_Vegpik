const express = require('express');
const router = express.Router();
const { receiptModel } = require('../../../models');

router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    let receipt = await receiptModel.getReceiptByOrderId(orderId);
    
    if (!receipt) {
      try {
        const { receiptService } = require('../../../services');
        await receiptService.generateAndStoreReceipt(orderId);
        receipt = await receiptModel.getReceiptByOrderId(orderId);
      } catch (genErr) {
        console.error('Failed to auto-generate receipt:', genErr);
      }
    }
    
    if (!receipt) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${receipt.file_name}"`,
      'Content-Length': receipt.file_data.length
    });
    
    res.send(receipt.file_data);
  } catch (error) {
    console.error('Error serving receipt:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve receipt' });
  }
});

module.exports = router;
