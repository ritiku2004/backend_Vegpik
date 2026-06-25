const { productModel } = require('../../models');
const { responseHelper } = require('../../utils');

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

const createProduct = async (req, res) => {
  try {
    const { features, ...productData } = req.body;
    const productId = await productModel.createProduct(productData, features);
    const newProduct = await productModel.getProductById(productId);
    return responseHelper.sendSuccess(res, 201, 'Product created successfully', newProduct);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to create product', error);
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { features, ...productData } = req.body;
    await productModel.updateProduct(id, productData, features);
    const updatedProduct = await productModel.getProductById(id);
    return responseHelper.sendSuccess(res, 200, 'Product updated successfully', updatedProduct);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to update product', error);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await productModel.deleteProduct(id);
    if (!success) {
      return responseHelper.sendError(res, 404, 'Product not found');
    }
    return responseHelper.sendSuccess(res, 200, 'Product deleted successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to delete product', error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
