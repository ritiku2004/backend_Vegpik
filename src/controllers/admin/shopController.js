const { shopModel } = require('../../models');
const { responseHelper } = require('../../utils');

const getShops = async (req, res) => {
  try {
    const shops = await shopModel.getAllShops();
    return responseHelper.sendSuccess(res, 200, 'Shops fetched successfully', shops);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch shops', error);
  }
};

const getShopById = async (req, res) => {
  try {
    const shop = await shopModel.getShopById(req.params.id);
    if (!shop) return responseHelper.sendError(res, 404, 'Shop not found');
    return responseHelper.sendSuccess(res, 200, 'Shop fetched successfully', shop);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch shop', error);
  }
};

const createShop = async (req, res) => {
  try {
    const shopId = await shopModel.createShop(req.body);
    const newShop = await shopModel.getShopById(shopId);
    return responseHelper.sendSuccess(res, 201, 'Shop created successfully', newShop);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to create shop', error);
  }
};

const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await shopModel.updateShop(id, req.body);
    if (!success) {
      return responseHelper.sendError(res, 404, 'Shop not found or no changes made');
    }
    const updatedShop = await shopModel.getShopById(id);
    return responseHelper.sendSuccess(res, 200, 'Shop updated successfully', updatedShop);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to update shop', error);
  }
};

const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await shopModel.deleteShop(id);
    if (!success) {
      return responseHelper.sendError(res, 404, 'Shop not found');
    }
    return responseHelper.sendSuccess(res, 200, 'Shop deleted successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to delete shop', error);
  }
};

module.exports = {
  getShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop
};
