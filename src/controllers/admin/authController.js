const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { adminModel } = require('../../models');
const { responseHelper } = require('../../utils');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await adminModel.getAdminByEmail(email);
    if (!admin) {
      return responseHelper.sendError(res, 401, 'Invalid credentials');
    }

    if (admin.is_active === 0 || admin.is_active === false) {
      return responseHelper.sendError(res, 403, 'Access denied. Your account is currently inactive.');
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return responseHelper.sendError(res, 401, 'Invalid credentials');
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    return responseHelper.sendSuccess(res, 200, 'Login successful', {
      token,
      admin: { id: admin.id, email: admin.email }
    });
  } catch (error) {
    console.error(error);
    return responseHelper.sendError(res, 500, 'Login failed', error);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin?.id;

    if (!adminId) {
      return responseHelper.sendError(res, 401, 'Unauthorized');
    }

    if (!currentPassword || !newPassword) {
      return responseHelper.sendError(res, 400, 'Current password and new password are required');
    }

    const admin = await adminModel.getAdminById(adminId);
    if (!admin) {
      return responseHelper.sendError(res, 404, 'Admin account not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      return responseHelper.sendError(res, 400, 'Incorrect current password');
    }

    if (newPassword.length < 6) {
      return responseHelper.sendError(res, 400, 'New password must be at least 6 characters long');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await adminModel.updateAdminPassword(adminId, hash);

    return responseHelper.sendSuccess(res, 200, 'Password changed successfully');
  } catch (error) {
    console.error('Change password error:', error);
    return responseHelper.sendError(res, 500, 'Failed to change password', error);
  }
};

const createAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminId = req.admin?.id;

    if (!adminId) {
      return responseHelper.sendError(res, 401, 'Unauthorized');
    }

    if (req.admin?.email !== 'superadmin@vegpik.com') {
      return responseHelper.sendError(res, 403, 'Access denied. Requires Super Admin privileges.');
    }

    if (!email || !password) {
      return responseHelper.sendError(res, 400, 'Email and password are required');
    }

    if (password.length < 6) {
      return responseHelper.sendError(res, 400, 'Password must be at least 6 characters long');
    }

    const existing = await adminModel.getAdminByEmail(email);
    if (existing) {
      return responseHelper.sendError(res, 400, 'An admin account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newAdminId = await adminModel.createAdmin({ email, passwordHash: hash });

    return responseHelper.sendSuccess(res, 201, 'New admin account created successfully', {
      admin: { id: newAdminId, email }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return responseHelper.sendError(res, 500, 'Failed to create new admin account', error);
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    if (!adminId) {
      return responseHelper.sendError(res, 401, 'Unauthorized');
    }

    if (req.admin?.email !== 'superadmin@vegpik.com') {
      return responseHelper.sendError(res, 403, 'Access denied. Requires Super Admin privileges.');
    }

    const admins = await adminModel.getAllAdmins();
    return responseHelper.sendSuccess(res, 200, 'Admins retrieved successfully', admins);
  } catch (error) {
    console.error('Get all admins error:', error);
    return responseHelper.sendError(res, 500, 'Failed to retrieve admin accounts', error);
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const currentAdminId = req.admin?.id;
    if (!currentAdminId) {
      return responseHelper.sendError(res, 401, 'Unauthorized');
    }

    if (req.admin?.email !== 'superadmin@vegpik.com') {
      return responseHelper.sendError(res, 403, 'Access denied. Requires Super Admin privileges.');
    }

    const { id } = req.params;
    if (parseInt(id) === parseInt(currentAdminId)) {
      return responseHelper.sendError(res, 400, 'You cannot delete your own admin account');
    }

    const adminToDelete = await adminModel.getAdminById(id);
    if (!adminToDelete) {
      return responseHelper.sendError(res, 404, 'Admin account not found');
    }

    await adminModel.deleteAdmin(id);
    return responseHelper.sendSuccess(res, 200, 'Admin account deleted successfully');
  } catch (error) {
    console.error('Delete admin error:', error);
    return responseHelper.sendError(res, 500, 'Failed to delete admin account', error);
  }
};

const toggleAdminStatus = async (req, res) => {
  try {
    const currentAdminId = req.admin?.id;
    if (!currentAdminId) {
      return responseHelper.sendError(res, 401, 'Unauthorized');
    }

    if (req.admin?.email !== 'superadmin@vegpik.com') {
      return responseHelper.sendError(res, 403, 'Access denied. Requires Super Admin privileges.');
    }

    const { id } = req.params;
    const { isActive } = req.body;

    if (parseInt(id) === parseInt(currentAdminId)) {
      return responseHelper.sendError(res, 400, 'You cannot toggle status on your own admin account');
    }

    const admin = await adminModel.getAdminById(id);
    if (!admin) {
      return responseHelper.sendError(res, 404, 'Admin account not found');
    }

    await adminModel.updateAdminStatus(id, isActive);
    return responseHelper.sendSuccess(res, 200, 'Admin status updated successfully');
  } catch (error) {
    console.error('Toggle admin status error:', error);
    return responseHelper.sendError(res, 500, 'Failed to update admin status', error);
  }
};

module.exports = {
  login,
  changePassword,
  createAdmin,
  getAllAdmins,
  deleteAdmin,
  toggleAdminStatus
};
