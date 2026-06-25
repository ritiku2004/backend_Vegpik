const { responseHelper, ipHelper } = require('../../utils');
const { userModel } = require('../../models');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // comes from authMiddleware
    const user = await userModel.getUserById(userId);

    if (!user) {
      return responseHelper.sendError(res, 404, 'User not found');
    }

    // Normalize profile_picture_url on fetch for backwards compatibility
    if (user.profile_picture_url && (user.profile_picture_url.startsWith('http://') || user.profile_picture_url.startsWith('https://'))) {
      const uploadsIndex = user.profile_picture_url.indexOf('/uploads');
      if (uploadsIndex !== -1) {
        user.profile_picture_url = user.profile_picture_url.substring(uploadsIndex + 1); // "uploads/..."
      }
    }

    return responseHelper.sendSuccess(res, 200, 'Profile fetched successfully', user);
  } catch (error) {
    console.error('Get Profile Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to fetch profile');
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let { name, email, phone_number, profile_picture_url } = req.body;
    
    if (!name) {
      return responseHelper.sendError(res, 400, 'Name is required');
    }

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Normalize profile_picture_url to a relative path if it's an absolute URL
    if (profile_picture_url && (profile_picture_url.startsWith('http://') || profile_picture_url.startsWith('https://'))) {
      const uploadsIndex = profile_picture_url.indexOf('/uploads');
      if (uploadsIndex !== -1) {
        profile_picture_url = profile_picture_url.substring(uploadsIndex + 1); // "uploads/..."
      }
    }

    await userModel.updateUserProfile(userId, firstName, lastName, email, phone_number, profile_picture_url);
    
    const user = await userModel.getUserById(userId);

    return responseHelper.sendSuccess(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    console.error('Update Profile Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to update profile');
  }
};

const saveAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressData = req.body;
    
    if (!addressData.address_line1 || !addressData.city) {
      return responseHelper.sendError(res, 400, 'Required address fields missing');
    }

    const insertId = await userModel.saveUserAddress(userId, addressData);
    return responseHelper.sendSuccess(res, 201, 'Address saved successfully', { id: insertId });
  } catch (error) {
    console.error('Save Address Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to save address');
  }
};

const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await userModel.getUserAddresses(userId);
    return responseHelper.sendSuccess(res, 200, 'Addresses fetched successfully', addresses);
  } catch (error) {
    console.error('Get Addresses Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to fetch addresses');
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return responseHelper.sendError(res, 400, 'No file uploaded');
    }

    const userId = req.user.id;
    const fileUrl = ipHelper.getFormattedUrl(req, req.file);
    
    // Save relative path in database to keep it environment-independent
    let relativePath = fileUrl;
    const uploadsIndex = fileUrl.indexOf('/uploads');
    if (uploadsIndex !== -1) {
      relativePath = fileUrl.substring(uploadsIndex + 1); // "uploads/..."
    }

    await userModel.updateUserProfilePicture(userId, relativePath);

    return responseHelper.sendSuccess(res, 200, 'Avatar uploaded successfully', { url: fileUrl });
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to upload avatar');
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    const success = await userModel.deleteUserAddress(userId, addressId);
    if (!success) {
      return responseHelper.sendError(res, 404, 'Address not found or unauthorized');
    }
    return responseHelper.sendSuccess(res, 200, 'Address deleted successfully');
  } catch (error) {
    console.error('Delete Address Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to delete address');
  }
};

module.exports = {
  getProfile,
  updateProfile,
  saveAddress,
  getAddresses,
  uploadAvatar,
  deleteAddress
};
