const { responseHelper } = require('../../utils');
const { supportModel } = require('../../models');

// social-links management
const getSocialLinks = async (req, res) => {
  try {
    const links = await supportModel.getAllSocialLinks();
    return responseHelper.sendSuccess(res, 200, 'Social links fetched', links);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Error fetching social links', error.message);
  }
};

const createSocialLink = async (req, res) => {
  try {
    const { name, icon, link } = req.body;
    if (!name || !link) {
      return responseHelper.sendError(res, 400, 'Name and Link are required');
    }
    const id = await supportModel.addSocialLink(name, icon || 'Facebook', link);
    return responseHelper.sendSuccess(res, 201, 'Social link created successfully', { id, name, icon, link });
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Error creating social link', error.message);
  }
};

const updateSocialLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, link } = req.body;
    if (!name || !link) {
      return responseHelper.sendError(res, 400, 'Name and Link are required');
    }
    await supportModel.updateSocialLink(id, name, icon, link);
    return responseHelper.sendSuccess(res, 200, 'Social link updated successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Error updating social link', error.message);
  }
};

const deleteSocialLink = async (req, res) => {
  try {
    const { id } = req.params;
    await supportModel.deleteSocialLink(id);
    return responseHelper.sendSuccess(res, 200, 'Social link deleted successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Error deleting social link', error.message);
  }
};

// contact-info management
const getContactInfo = async (req, res) => {
  try {
    const info = await supportModel.getAllContactInfo();
    return responseHelper.sendSuccess(res, 200, 'Contact info fetched', info);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Error fetching contact info', error.message);
  }
};

const updateContactInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, value, action_label, icon } = req.body;
    if (!title) {
      return responseHelper.sendError(res, 400, 'Title is required');
    }
    await supportModel.updateContactInfo(id, title, description, value, action_label, icon);
    return responseHelper.sendSuccess(res, 200, 'Contact info updated successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Error updating contact info', error.message);
  }
};

// contact-queries management
const getQueries = async (req, res) => {
  try {
    const queries = await supportModel.getAllContactQueries();
    return responseHelper.sendSuccess(res, 200, 'Queries fetched successfully', queries);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Error fetching queries', error.message);
  }
};

const updateQueryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return responseHelper.sendError(res, 400, 'Status is required');
    }
    await supportModel.updateQueryStatus(id, status);
    return responseHelper.sendSuccess(res, 200, 'Query status updated successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Error updating query status', error.message);
  }
};

module.exports = {
  getSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
  getContactInfo,
  updateContactInfo,
  getQueries,
  updateQueryStatus
};
