const pool = require('../src/config/db');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const banners = [
  {
    title: 'Super Saver Week',
    subtitle: 'UP TO 50% OFF',
    description: 'Get fresh fruits & vegetables at unmatched prices.',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&h=400&q=80',
    background_color: '#DCFCE7',
    text_color: '#15803D',
  },
  {
    title: 'Breakfast Special',
    subtitle: 'FLAT 20% OFF',
    description: 'Fresh milk, bread & eggs delivered in 10 mins.',
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&h=400&q=80',
    background_color: '#FEF3C7',
    text_color: '#B45309',
  },
  {
    title: 'Snack Attack',
    subtitle: 'BUY 1 GET 1 FREE',
    description: 'Munchies & cold drinks to power your binge watch.',
    image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&h=400&q=80',
    background_color: '#FEE2E2',
    text_color: '#B91C1C',
  },
];

const categories = [
  { name: 'Fruits & Vegetables', description: 'Fresh produce daily', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&h=400&q=80' },
  { name: 'Dairy, Bread & Eggs', description: 'Morning essentials', image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&h=400&q=80' },
  { name: 'Snacks & Munchies', description: 'Chips and biscuits', image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&h=400&q=80' },
  { name: 'Cold Drinks & Juices', description: 'Thirst quenchers', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&h=400&q=80' }
];

const products = [
  { catName: 'Fruits & Vegetables', name: 'Fresh Potato (Aloo)', price: 32, quantity: 1, quantity_type: 'kg', sku: 'PRD-POT-1', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&h=400&q=80' },
  { catName: 'Fruits & Vegetables', name: 'Hybrid Tomato', price: 45, quantity: 500, quantity_type: 'g', sku: 'PRD-TOM-1', image_url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=400&h=400&q=80' },
  { catName: 'Dairy, Bread & Eggs', name: 'Amul Taaza Toned Milk', price: 30, quantity: 500, quantity_type: 'ml', sku: 'PRD-MLK-1', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&h=400&q=80' },
  { catName: 'Snacks & Munchies', name: 'Lay\'s Classic Salted Chips', price: 20, quantity: 50, quantity_type: 'g', sku: 'PRD-CHP-1', image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&h=400&q=80' },
  { catName: 'Cold Drinks & Juices', name: 'Coca-Cola Zero Sugar Can', price: 40, quantity: 300, quantity_type: 'ml', sku: 'PRD-COK-1', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&h=400&q=80' },
];

const seedDB = async () => {
  try {
    console.log('Ensuring banners table exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banners (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          subtitle VARCHAR(255),
          description TEXT,
          image_url VARCHAR(500) NOT NULL,
          background_color VARCHAR(20),
          text_color VARCHAR(20),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    console.log('Seeding Banners...');
    for (const b of banners) {
      await pool.query(
        'INSERT INTO banners (title, subtitle, description, image_url, background_color, text_color) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=title',
        [b.title, b.subtitle, b.description, b.image_url, b.background_color, b.text_color]
      );
    }

    console.log('Seeding Categories...');
    for (const cat of categories) {
      await pool.query(
        'INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE description=VALUES(description)',
        [cat.name, cat.description, cat.image_url]
      );
    }

    console.log('Seeding Shops...');
    const shops = [
      { id: 1, name: 'North Warehouse', address: '123 North St', city: 'Metropolis', lat: 28.7, lng: 77.1 },
      { id: 2, name: 'South Warehouse', address: '456 South St', city: 'Metropolis', lat: 28.5, lng: 77.2 },
      { id: 3, name: 'Central Hub', address: '789 Central Ave', city: 'Metropolis', lat: 28.6, lng: 77.3 }
    ];
    for (const shop of shops) {
      await pool.query(
        `INSERT INTO shops (id, name, address, city, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [shop.id, shop.name, shop.address, shop.city, shop.lat, shop.lng]
      );
    }

    console.log('Seeding Products and mapping to Shops...');
    for (const p of products) {
      const [catRows] = await pool.query('SELECT id FROM categories WHERE name = ?', [p.catName]);
      if (catRows.length > 0) {
        const catId = catRows[0].id;
        
        // Insert Product
        await pool.query(
          `INSERT INTO products (category_id, name, mrp_price, quantity, quantity_type, sku, image_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), mrp_price=VALUES(mrp_price)`,
          [catId, p.name, p.price, p.quantity, p.quantity_type, p.sku, p.image_url]
        );
        
        const [prodRows] = await pool.query('SELECT id FROM products WHERE sku = ?', [p.sku]);
        if (prodRows.length > 0) {
          const prodId = prodRows[0].id;
          
          // Map to shops
          // Let's say:
          // Shop 1: Fruits & Veggies, Dairy
          // Shop 2: Snacks, Cold Drinks
          // Shop 3: All products
          let shopIds = [3]; // Everyone in shop 3
          if (catId === 1 || catId === 2) shopIds.push(1);
          if (catId === 3 || catId === 4) shopIds.push(2);

          for (const sId of shopIds) {
            await pool.query(
              `INSERT INTO shop_products (shop_id, product_id, is_available) VALUES (?, ?, true) ON DUPLICATE KEY UPDATE is_available=true`,
              [sId, prodId]
            );
          }
        }
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedDB();
