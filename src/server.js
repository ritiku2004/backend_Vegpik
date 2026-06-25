const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./app');
const pool = require('./config/db');

// Parse PORT to an integer so Node binds to a TCP port and stays alive
const PORT = parseInt(process.env.PORT || '3000', 10);

process.on('uncaughtException', (err) => {
  require('fs').appendFileSync('crash_log.txt', new Date().toISOString() + ' uncaughtException: ' + (err.stack || err) + '\n');
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  require('fs').appendFileSync('crash_log.txt', new Date().toISOString() + ' unhandledRejection: ' + (reason.stack || reason) + '\n');
});

// Test DB Connection before starting server
pool.getConnection()
  .then(async (connection) => {
    console.log('Database connected successfully');
    
    // Dynamically ensure database schema has the welcome_notified column
    try {
      const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'welcome_notified'");
      if (columns.length === 0) {
        console.log('Adding welcome_notified column to users table...');
        await connection.query("ALTER TABLE users ADD COLUMN welcome_notified BOOLEAN DEFAULT FALSE");
        console.log('✅ welcome_notified column added successfully');
      }
    } catch (schemaError) {
      console.error('⚠️ Failed to ensure users.welcome_notified column exists:', schemaError.message);
    }

    // Dynamically ensure notifications table exists
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'system',
          data JSON NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ notifications table verified/created successfully');
    } catch (schemaError) {
      console.error('⚠️ Failed to ensure notifications table exists:', schemaError.message);
    }

    connection.release();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err.message);
    process.exit(1);
  });
// Force nodemon restart for connection pool refresh 
