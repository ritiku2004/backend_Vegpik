const pool = require('../config/db');

const getKPIs = async (startDate) => {
  let queryModifier = "WHERE status != 'Cancelled'";
  let queryParams = [];

  if (startDate) {
    queryModifier = "WHERE status != 'Cancelled' AND created_at >= ?";
    queryParams = [startDate];
  }

  // Active Orders (Not Delivered/Cancelled)
  const [activeOrdersRows] = await pool.query(`SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('Delivered', 'Cancelled')`);
  
  // Total Sales & Revenue in timeframe
  const [salesRows] = await pool.query(`
    SELECT COUNT(*) as totalSales, COALESCE(SUM(total_amount), 0) as revenue 
    FROM orders 
    ${queryModifier}
  `, queryParams);

  // New Customers in timeframe
  let userQueryModifier = '';
  let userQueryParams = [];
  if (startDate) {
    userQueryModifier = 'WHERE created_at >= ?';
    userQueryParams = [startDate];
  }

  const [customersRows] = await pool.query(`
    SELECT COUNT(*) as newCustomers 
    FROM users 
    ${userQueryModifier}
  `, userQueryParams);

  // Total active products (no 'stock' column on products table - use is_active flag)
  const [productsRows] = await pool.query(`SELECT COUNT(*) as count FROM products WHERE is_active = 1`);

  return {
    activeOrders: activeOrdersRows[0].count,
    totalSales: salesRows[0].totalSales,
    revenue: parseFloat(salesRows[0].revenue),
    newCustomers: customersRows[0].newCustomers,
    productsAvailable: productsRows[0].count
  };
};

const getRevenueTimeSeries = async (startDate) => {
  let queryModifier = "WHERE status != 'Cancelled'";
  let queryParams = [];

  if (startDate) {
    queryModifier = "WHERE status != 'Cancelled' AND created_at >= ?";
    queryParams = [startDate];
  }

  // Group revenue and order count by DATE
  const [rows] = await pool.query(`
    SELECT 
      DATE(created_at) as date, 
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*) as orders
    FROM orders 
    ${queryModifier}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `, queryParams);

  // Format dates to strings for JSON serialization
  return rows.map(r => ({
    date: r.date.toISOString().split('T')[0], // YYYY-MM-DD
    revenue: parseFloat(r.revenue),
    orders: r.orders
  }));
};

const getCategorySales = async (startDate) => {
  let queryModifier = '';
  let queryParams = [];

  if (startDate) {
    queryModifier = 'AND o.created_at >= ?';
    queryParams = [startDate];
  }

  const [rows] = await pool.query(`
    SELECT 
      c.name as name, 
      COALESCE(SUM(oi.quantity * oi.price), 0) as value
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE o.status != 'Cancelled' ${queryModifier}
    GROUP BY c.id, c.name
    ORDER BY value DESC
  `, queryParams);

  return rows.map(r => ({ ...r, value: parseFloat(r.value) }));
};

const getOrderStatus = async (startDate) => {
  let queryModifier = '';
  let queryParams = [];

  if (startDate) {
    queryModifier = 'WHERE created_at >= ?';
    queryParams = [startDate];
  }

  const [rows] = await pool.query(`
    SELECT 
      status as name, 
      COUNT(*) as value
    FROM orders 
    ${queryModifier}
    GROUP BY status
  `, queryParams);

  return rows;
};

const getTopProducts = async (startDate) => {
  let queryModifier = '';
  let queryParams = [];

  if (startDate) {
    queryModifier = 'AND o.created_at >= ?';
    queryParams = [startDate];
  }

  const [rows] = await pool.query(`
    SELECT 
      oi.product_name as name, 
      SUM(oi.quantity) as sales
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'Cancelled' ${queryModifier}
    GROUP BY oi.product_id, oi.product_name
    ORDER BY sales DESC
    LIMIT 5
  `, queryParams);

  return rows.map(r => ({ ...r, sales: parseInt(r.sales) }));
};

module.exports = {
  getKPIs,
  getRevenueTimeSeries,
  getCategorySales,
  getOrderStatus,
  getTopProducts
};
