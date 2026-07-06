const { shopProductModel } = require('../../models');
const { responseHelper } = require('../../utils');

const getShopInventory = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { categoryId, sortBy, page, limit, search, type, forHome } = req.query;

    const filters = {};
    if (categoryId) filters.categoryId = categoryId;
    if (sortBy) filters.sortBy = sortBy;
    if (page) filters.page = parseInt(page, 10);
    if (limit) filters.limit = parseInt(limit, 10);
    if (search) filters.search = search;
    if (type) filters.type = type;
    if (forHome === 'true') filters.forHome = true;

    const inventory = await shopProductModel.getInventoryByShopId(shopId, filters);
    return responseHelper.sendSuccess(res, 200, 'Shop inventory fetched successfully', inventory);
  } catch (error) {
    console.error('Error in getShopInventory controller:', error);
    return responseHelper.sendError(res, 500, 'Failed to fetch shop inventory', error);
  }
};

module.exports = {
  getShopInventory
};
