const pool = require('../src/config/db');

async function run() {
  try {
    // 1. Create payment_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id INT PRIMARY KEY,
        paypal_id VARCHAR(255),
        bank_name VARCHAR(255),
        bank_account VARCHAR(255),
        bank_iban VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    // 2. Insert default settings row if it doesn't exist
    await pool.query(`
      INSERT INTO payment_settings (id, paypal_id, bank_name, bank_account, bank_iban) 
      VALUES (1, 'paypal@example.com', 'Example Bank', '1234567890', 'EXAM123456')
      ON DUPLICATE KEY UPDATE id=id;
    `);

    // 3. Alter orders table to add new columns (ignore errors if columns exist)
    const columns = [
      'ADD COLUMN payment_screenshot_url VARCHAR(500) NULL',
      'ADD COLUMN transaction_id VARCHAR(255) NULL',
      'ADD COLUMN user_bank_name VARCHAR(100) NULL',
      'ADD COLUMN user_bank_account VARCHAR(100) NULL',
      'ADD COLUMN user_bank_iban VARCHAR(100) NULL'
    ];
    
    for (const col of columns) {
      try {
        await pool.query(`ALTER TABLE orders ${col}`);
      } catch (e) {
        // usually ER_DUP_FIELDNAME (error 1060) if already exists
        if(e.code !== 'ER_DUP_FIELDNAME') {
          console.error(`Failed to add column ${col}:`, e);
        }
      }
    }

    console.log('Database updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating DB:', error);
    process.exit(1);
  }
}

run();
