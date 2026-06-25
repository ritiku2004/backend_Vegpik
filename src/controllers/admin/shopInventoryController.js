const { shopProductModel } = require('../../models');
const { responseHelper } = require('../../utils');

const toggleAvailability = async (req, res) => {
  try {
    const { shopId, productId, isAvailable } = req.body;
    
    if (!shopId || !productId || typeof isAvailable !== 'boolean') {
      return responseHelper.sendError(res, 400, 'shopId, productId, and isAvailable are required');
    }

    await shopProductModel.toggleShopProduct(shopId, productId, isAvailable);
    return responseHelper.sendSuccess(res, 200, 'Product availability updated successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to update product availability', error);
  }
};

const getShopInventory = async (req, res) => {
  try {
    const { shopId } = req.params;
    const inventory = await shopProductModel.getInventoryByShopId(shopId);
    return responseHelper.sendSuccess(res, 200, 'Shop inventory fetched successfully', inventory);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch shop inventory', error);
  }
};

module.exports = {
  toggleAvailability,
  getShopInventory
};
