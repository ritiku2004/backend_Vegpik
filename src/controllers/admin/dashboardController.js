const { responseHelper } = require('../../utils');
const { dashboardModel } = require('../../models');

const getDashboardStats = async (req, res) => {
  try {
    const { timeframe = 'overall' } = req.query;
    
    let startDate = null;
    const now = new Date();

    if (timeframe === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (timeframe === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (timeframe === '15days') {
      startDate = new Date(now.setDate(now.getDate() - 15));
    } else if (timeframe === 'month') {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    }
    
    // Convert to MySQL DATETIME string
    const sqlStartDate = startDate ? startDate.toISOString().slice(0, 19).replace('T', ' ') : null;

    const kpis = await dashboardModel.getKPIs(sqlStartDate);
    const timeSeries = await dashboardModel.getRevenueTimeSeries(sqlStartDate);
    const categoryData = await dashboardModel.getCategorySales(sqlStartDate);
    const orderStatusData = await dashboardModel.getOrderStatus(sqlStartDate);
    const topProductsData = await dashboardModel.getTopProducts(sqlStartDate);

    const stats = {
      ...kpis,
      revenueToday: kpis.revenue, // For backward compatibility if needed
      chartData: timeSeries,
      categoryData,
      orderStatusData,
      topProductsData
    };

    return responseHelper.sendSuccess(res, 200, 'Dashboard stats fetched', stats);
  } catch (error) {
    console.error('Dashboard Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to fetch dashboard stats');
  }
};

module.exports = {
  getDashboardStats
};
