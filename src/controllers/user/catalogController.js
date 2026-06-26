const { categoryModel, productModel, shopModel, bannerModel } = require('../../models');
const { responseHelper } = require('../../utils');
const { haversineDistanceKm } = require('../../services/distanceService');

const getBanners = async (req, res) => {
  try {
    const banners = await bannerModel.getAllActiveBanners();
    return responseHelper.sendSuccess(res, 200, 'Banners fetched successfully', banners);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch banners', error);
  }
};

const getCategories = async (req, res) => {
  try {
    const { shopId } = req.query;
    let categories;
    if (shopId) {
      categories = await categoryModel.getCategoriesByShopId(shopId);
    } else {
      categories = await categoryModel.getAllCategories();
    }
    return responseHelper.sendSuccess(res, 200, 'Categories fetched successfully', categories);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch categories', error);
  }
};


const getNearestShop = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return responseHelper.sendError(res, 400, 'Latitude and longitude are required');
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    const shops = await shopModel.getAllShops();
    const activeShops = shops.filter(s => s.is_active);

    if (activeShops.length === 0) {
      return responseHelper.sendError(res, 404, 'No active shops found');
    }

    let nearestShop = null;
    let minDistance = Infinity;

    for (const shop of activeShops) {
      if (shop.latitude && shop.longitude) {
        const distance = haversineDistanceKm(
          parseFloat(shop.latitude),
          parseFloat(shop.longitude),
          userLat,
          userLon
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestShop = shop;
        }
      }
    }

    if (nearestShop) {
      const shopRadius = parseFloat(nearestShop.delivery_radius_km) || 15.0;
      const serviceAvailable = minDistance <= shopRadius;
      const responseData = {
        ...nearestShop,
        distanceKm: minDistance,
        serviceAvailable,
        delivery_radius_km: shopRadius
      };
      return responseHelper.sendSuccess(res, 200, 'Shop fetched successfully', responseData);
    } else {
      return responseHelper.sendError(res, 404, 'No active shops found');
    }


  } catch (error) {
    console.error('Error fetching nearest shop:', error);
    return responseHelper.sendError(res, 500, 'Failed to fetch nearest shop', error);
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await productModel.getAllProducts();
    return responseHelper.sendSuccess(res, 200, 'Products fetched successfully', products);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch products', error);
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    if (!product) return responseHelper.sendError(res, 404, 'Product not found');
    return responseHelper.sendSuccess(res, 200, 'Product fetched successfully', product);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch product', error);
  }
};

const getShops = async (req, res) => {
  try {
    const shops = await shopModel.getAllShops();
    return responseHelper.sendSuccess(res, 200, 'Shops fetched successfully', shops);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch shops', error);
  }
};

module.exports = {
  getBanners,
  getCategories,
  getNearestShop,
  getProducts,
  getProductById,
  getShops
};
