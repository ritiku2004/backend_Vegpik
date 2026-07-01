const { responseHelper } = require('../../utils');
const emailSender = require('../../utils/emailSender');
const { userModel, supportModel } = require('../../models');

const submitSupportQuery = async (req, res) => {
  try {
    const { subject, description, name, email, phone } = req.body;

    if (!subject || !subject.trim()) {
      return responseHelper.sendError(res, 400, 'Subject is required.');
    }

    if (!description || !description.trim()) {
      return responseHelper.sendError(res, 400, 'Description is required.');
    }

    let customerName = name ? name.trim() : '';
    let customerEmail = email ? email.trim() : '';
    let customerPhone = phone ? phone.trim() : '';
    const userId = req.user?.id || null;

    if (userId) {
      const dbUser = await userModel.getUserById(userId);
      if (dbUser) {
        customerName = customerName || `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || dbUser.name || 'Anonymous Customer';
        customerEmail = customerEmail || dbUser.email || 'No email provided';
        customerPhone = customerPhone || dbUser.phone_number || 'No phone provided';
      }
    }

    if (!customerName) customerName = 'Anonymous Customer';
    if (!customerEmail) customerEmail = 'No email provided';
    if (!customerPhone) customerPhone = 'No phone provided';

    // Save to the database
    await supportModel.saveContactQuery(
      userId,
      customerName || 'Anonymous Customer',
      customerEmail || 'No email provided',
      customerPhone || 'No phone provided',
      subject.trim(),
      description.trim()
    );

    // Call the email utility function (we wrap in try-catch so email failure doesn't block db success response)
    try {
      await emailSender.sendSupportQueryEmail({
        userId,
        name: customerName || 'Anonymous Customer',
        email: customerEmail || 'No email provided',
        phone: customerPhone || 'No phone provided',
        subject: subject.trim(),
        description: description.trim()
      });
    } catch (emailErr) {
      console.error('Failed to send support email but saved to database:', emailErr);
    }

    return responseHelper.sendSuccess(
      res,
      200,
      'Your support query has been submitted successfully. Our team will contact you shortly.'
    );
  } catch (error) {
    console.error('Error in submitSupportQuery controller:', error);
    return responseHelper.sendError(
      res,
      500,
      'Failed to submit support query. Please try again later.',
      error.message
    );
  }
};

const getSocialLinks = async (req, res) => {
  try {
    const links = await supportModel.getAllSocialLinks();
    return responseHelper.sendSuccess(res, 200, 'Social links retrieved successfully', links);
  } catch (error) {
    console.error('Error in getSocialLinks controller:', error);
    return responseHelper.sendError(res, 500, 'Failed to fetch social links', error.message);
  }
};

const getContactInfo = async (req, res) => {
  try {
    const info = await supportModel.getAllContactInfo();
    return responseHelper.sendSuccess(res, 200, 'Contact info retrieved successfully', info);
  } catch (error) {
    console.error('Error in getContactInfo controller:', error);
    return responseHelper.sendError(res, 500, 'Failed to fetch contact info', error.message);
  }
};

module.exports = {
  submitSupportQuery,
  getSocialLinks,
  getContactInfo
};
