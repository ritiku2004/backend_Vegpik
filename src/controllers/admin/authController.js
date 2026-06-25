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

module.exports = {
  login
};
