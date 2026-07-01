const pool = require('./src/config/db');

async function migrate() {
  try {
    console.log('Adding toggle columns to payment_settings...');
    
    try {
      await pool.query('ALTER TABLE payment_settings ADD COLUMN is_cod_active TINYINT(1) DEFAULT 1');
      console.log('Added is_cod_active');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('is_cod_active already exists');
      else throw e;
    }

    try {
      await pool.query('ALTER TABLE payment_settings ADD COLUMN is_paypal_active TINYINT(1) DEFAULT 1');
      console.log('Added is_paypal_active');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('is_paypal_active already exists');
      else throw e;
    }

    try {
      await pool.query('ALTER TABLE payment_settings ADD COLUMN is_bank_transfer_active TINYINT(1) DEFAULT 1');
      console.log('Added is_bank_transfer_active');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('is_bank_transfer_active already exists');
      else throw e;
    }
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
