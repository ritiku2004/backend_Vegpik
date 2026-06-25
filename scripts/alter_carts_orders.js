require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function dropForeignKeyIfExists(tableName, columnName, referencedTableName) {
  console.log(`Checking for foreign key on ${tableName}.${columnName} referencing ${referencedTableName}...`);
  const [rows] = await pool.query(`
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = ? 
    AND COLUMN_NAME = ? 
    AND REFERENCED_TABLE_NAME = ?
  `, [tableName, columnName, referencedTableName]);

  if (rows.length > 0) {
    const constraintName = rows[0].CONSTRAINT_NAME;
    console.log(`Dropping foreign key constraint ${constraintName} on ${tableName}...`);
    await pool.query(`ALTER TABLE ${tableName} DROP FOREIGN KEY \`${constraintName}\``);
    console.log(`Successfully dropped constraint ${constraintName}`);
  } else {
    console.log(`No foreign key constraint found on ${tableName}.${columnName}`);
  }
}

async function run() {
  try {
    // --- ALTER CARTS ---
    console.log('--- Altering CARTS table ---');
    await dropForeignKeyIfExists('carts', 'user_id', 'users');

    console.log('Modifying user_id to INT NULL in carts...');
    await pool.query('ALTER TABLE carts MODIFY user_id INT NULL');

    console.log('Adding guest_id column to carts...');
    try {
      await pool.query('ALTER TABLE carts ADD COLUMN guest_id VARCHAR(255) NULL');
      console.log('guest_id column added to carts.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('guest_id column already exists in carts.');
      } else {
        throw err;
      }
    }

    console.log('Adding unique constraint on guest_id in carts...');
    try {
      await pool.query('ALTER TABLE carts ADD CONSTRAINT unique_guest_id UNIQUE (guest_id)');
      console.log('Unique constraint unique_guest_id added to carts.');
    } catch (err) {
      if (err.code === 'ER_DUP_KEY' || err.code === 'ER_DUP_UNIQUE' || err.message.includes('Duplicate')) {
        console.log('Unique constraint on guest_id already exists.');
      } else {
        console.warn('Warning adding unique constraint:', err.message);
      }
    }

    console.log('Re-adding foreign key on carts.user_id...');
    await pool.query(`
      ALTER TABLE carts 
      ADD CONSTRAINT fk_carts_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);
    console.log('Foreign key fk_carts_user added successfully.');

    // --- ALTER ORDERS ---
    console.log('--- Altering ORDERS table ---');
    await dropForeignKeyIfExists('orders', 'user_id', 'users');

    console.log('Modifying user_id to INT NULL in orders...');
    await pool.query('ALTER TABLE orders MODIFY user_id INT NULL');

    console.log('Adding guest_id column to orders...');
    try {
      await pool.query('ALTER TABLE orders ADD COLUMN guest_id VARCHAR(255) NULL');
      console.log('guest_id column added to orders.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('guest_id column already exists in orders.');
      } else {
        throw err;
      }
    }

    console.log('Re-adding foreign key on orders.user_id...');
    await pool.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT fk_orders_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);
    console.log('Foreign key fk_orders_user added successfully.');

    console.log('Database schema updated successfully for Blinkit Guest Cart flow.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
