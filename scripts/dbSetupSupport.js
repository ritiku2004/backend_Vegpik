const pool = require('../src/config/db');

async function setupDatabase() {
  try {
    console.log('Creating database tables if they do not exist...');

    // 1. social_links
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(100) NOT NULL,
        link VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('social_links table verified.');

    // 2. contact_info
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        field_key VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(200) NOT NULL,
        description VARCHAR(500),
        value VARCHAR(500),
        action_label VARCHAR(100),
        icon VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('contact_info table verified.');

    // 3. contact_queries
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_queries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        name VARCHAR(255) NULL,
        email VARCHAR(255) NULL,
        phone VARCHAR(100) NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    console.log('contact_queries table verified.');

    // Seed social_links if empty
    const [socials] = await pool.query('SELECT COUNT(*) as count FROM social_links');
    if (socials[0].count === 0) {
      await pool.query(`
        INSERT INTO social_links (name, icon, link) VALUES 
        ('Facebook', 'Facebook', 'https://facebook.com/vegpik'),
        ('Twitter', 'Twitter', 'https://twitter.com/vegpik'),
        ('Instagram', 'Instagram', 'https://instagram.com/vegpik')
      `);
      console.log('Seeded social links.');
    }

    // Seed contact_info if empty
    const [contact] = await pool.query('SELECT COUNT(*) as count FROM contact_info');
    if (contact[0].count === 0) {
      await pool.query(`
        INSERT INTO contact_info (field_key, title, description, value, action_label, icon) VALUES 
        ('whatsapp', 'Live WhatsApp Chat', 'Best for returns, refunds & order issues', 'https://wa.me/971501234567?text=Hello%20Vegpik%20Support', 'Start conversation', 'whatsapp'),
        ('phone', 'Call Customer Care', 'Speak directly with our support team', '+971 (4) 397-9999 / +971 50 123 4567', 'tel:+97143979999', 'call'),
        ('email', 'Email Support', 'For bulk orders & corporate feedback', 'support@vegpik.com', 'mailto:support@vegpik.com', 'email'),
        ('office', 'Corporate Office', 'Bur Dubai, Dubai, UAE', 'Office 311, NBQ Building, Bur Dubai', 'https://www.google.com/maps/search/?api=1&query=Office+311,+NBQ+Building,+Bur+Dubai', 'map'),
        ('operating_hours', 'Operating Hours', 'Phone lines are active daily from 6:00 AM to 11:00 PM. Inquiries sent via Email or WhatsApp outside these hours will be handled first thing in the morning.', '', '', 'clock')
      `);
      console.log('Seeded contact info.');
    }

    console.log('Database setup completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database tables:', error);
    process.exit(1);
  }
}

setupDatabase();
