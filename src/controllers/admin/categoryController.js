const { categoryModel } = require('../../models');
const { responseHelper } = require('../../utils');

const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getAllCategories();
    return responseHelper.sendSuccess(res, 200, 'Categories fetched successfully', categories);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch categories', error);
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.getCategoryById(id);
    if (!category) {
      return responseHelper.sendError(res, 404, 'Category not found');
    }
    return responseHelper.sendSuccess(res, 200, 'Category fetched successfully', category);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch category', error);
  }
};

const createCategory = async (req, res) => {
  try {
    const categoryId = await categoryModel.createCategory(req.body);
    const newCategory = await categoryModel.getCategoryById(categoryId);
    return responseHelper.sendSuccess(res, 201, 'Category created successfully', newCategory);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to create category', error);
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await categoryModel.updateCategory(id, req.body);
    if (!success) {
      return responseHelper.sendError(res, 404, 'Category not found or no changes made');
    }
    const updatedCategory = await categoryModel.getCategoryById(id);
    return responseHelper.sendSuccess(res, 200, 'Category updated successfully', updatedCategory);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to update category', error);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await categoryModel.deleteCategory(id);
    if (!success) {
      return responseHelper.sendError(res, 404, 'Category not found');
    }
    return responseHelper.sendSuccess(res, 200, 'Category deleted successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to delete category. Ensure no products are attached.', error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
