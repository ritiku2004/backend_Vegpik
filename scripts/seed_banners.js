const pool = require('../src/config/db');

const BASE_BANNERS = [
  {
    title: 'Fresh Vegetables\nBig Discounts',
    subtitle: 'Discover 100% organic',
    description: 'Save up to 30% on your first order',
    image_url: 'http://localhost:3000/uploads/banners/hero_banner.jpeg',
    background_color: '#F7E6D4',
    text_color: '#15803D',
    is_active: 1
  },
  {
    title: 'Organic Produce\nFresh Daily',
    subtitle: '100% Organic Promise',
    description: 'Straight from partner farms to your home',
    image_url: 'http://localhost:3000/uploads/banners/banner-01.webp',
    background_color: '#ECFDF5',
    text_color: '#16A34A',
    is_active: 1
  },
  {
    title: 'Daily Essentials\nFree Delivery',
    subtitle: 'Superfast Service',
    description: 'Free home delivery on orders above ₹499',
    image_url: 'http://localhost:3000/uploads/banners/banner-02.webp',
    background_color: '#EFF6FF',
    text_color: '#2563EB',
    is_active: 1
  },
  {
    title: 'Fresh Sweet Deals\nUp to 40% Off',
    subtitle: 'Summer Specials',
    description: 'Satisfy your sweet cravings instantly',
    image_url: 'http://localhost:3000/uploads/banners/banner-03.webp',
    background_color: '#FFFBEB',
    text_color: '#D97706',
    is_active: 1
  }
];

const NEW_BANNERS = [];
const LOCATIONS = ['home_top', 'home_middle', 'category_top'];

for (const loc of LOCATIONS) {
  for (const banner of BASE_BANNERS) {
    NEW_BANNERS.push({
      ...banner,
      location: loc
    });
  }
}

async function seed() {
  try {
    console.log('Cleaning old home and category banners from database...');
    await pool.query(
      "DELETE FROM banners WHERE location IN ('home_top', 'hometop', 'home_middle', 'homemiddle', 'category_top', 'categorytop')"
    );
    
    console.log('Seeding new dynamic banners across all locations...');
    for (const banner of NEW_BANNERS) {
      await pool.query(
        'INSERT INTO banners (title, subtitle, description, image_url, background_color, text_color, is_active, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          banner.title,
          banner.subtitle,
          banner.description,
          banner.image_url,
          banner.background_color,
          banner.text_color,
          banner.is_active,
          banner.location
        ]
      );
      console.log(`Added banner: "${banner.title.replace('\n', ' ')}" to "${banner.location}"`);
    }
    
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding banners:', err);
    process.exit(1);
  }
}

seed();
