const { shopProductModel } = require('../../models');
const { responseHelper } = require('../../utils');

const getShopInventory = async (req, res) => {
  try {
    const { shopId } = req.params;
    // For users, this only returns items where is_available = true and is_active = true
    const inventory = await shopProductModel.getInventoryByShopId(shopId);
    return responseHelper.sendSuccess(res, 200, 'Shop inventory fetched successfully', inventory);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch shop inventory', error);
  }
};

module.exports = {
  getShopInventory
};
