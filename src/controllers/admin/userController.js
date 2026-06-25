const { userModel } = require('../../models');
const { responseHelper } = require('../../utils');

const getUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    return responseHelper.sendSuccess(res, 200, 'Users fetched successfully', users);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch users', error);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await userModel.deleteUser(id);
    if (!deleted) {
      return responseHelper.sendError(res, 404, 'User not found');
    }
    return responseHelper.sendSuccess(res, 200, 'User deleted successfully');
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to delete user', error);
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const details = await userModel.getUserDetailsById(id);
    if (!details) {
      return responseHelper.sendError(res, 404, 'User not found');
    }
    return responseHelper.sendSuccess(res, 200, 'User details fetched successfully', details);
  } catch (error) {
    return responseHelper.sendError(res, 500, 'Failed to fetch user details', error);
  }
};

module.exports = {
  getUsers,
  deleteUser,
  getUserDetails
};
