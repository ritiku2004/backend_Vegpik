const pool = require('../../config/db');

exports.getPaymentSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payment_settings WHERE id = 1');
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment settings not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updatePaymentSettings = async (req, res) => {
  try {
    const { 
      paypal_id, 
      bank_name, 
      bank_account, 
      bank_iban,
      is_cod_active,
      is_paypal_active,
      is_bank_transfer_active
    } = req.body;
    
    // Convert boolean/string values to integers for TINYINT
    const cod = is_cod_active === true || is_cod_active === 1 || is_cod_active === '1' || is_cod_active === 'true' ? 1 : 0;
    const paypal = is_paypal_active === true || is_paypal_active === 1 || is_paypal_active === '1' || is_paypal_active === 'true' ? 1 : 0;
    const bank = is_bank_transfer_active === true || is_bank_transfer_active === 1 || is_bank_transfer_active === '1' || is_bank_transfer_active === 'true' ? 1 : 0;

    await pool.query(
      `UPDATE payment_settings 
       SET paypal_id = ?, bank_name = ?, bank_account = ?, bank_iban = ?,
           is_cod_active = ?, is_paypal_active = ?, is_bank_transfer_active = ?
       WHERE id = 1`,
      [paypal_id, bank_name, bank_account, bank_iban, cod, paypal, bank]
    );
    
    res.json({ message: 'Payment settings updated successfully' });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
