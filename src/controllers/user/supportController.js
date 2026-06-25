const { responseHelper } = require('../../utils');
const emailSender = require('../../utils/emailSender');
const { userModel } = require('../../models');

const submitSupportQuery = async (req, res) => {
  try {
    const { subject, description, name, email, phone } = req.body;

    if (!subject || !subject.trim()) {
      return responseHelper.sendError(res, 400, 'Subject is required.');
    }

    if (!description || !description.trim()) {
      return responseHelper.sendError(res, 400, 'Description is required.');
    }

    let customerName = name;
    let customerEmail = email;
    let customerPhone = phone;
    const userId = req.user?.id || null;

    if (userId) {
      const dbUser = await userModel.getUserById(userId);
      if (dbUser) {
        customerName = customerName || `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || dbUser.name;
        customerEmail = customerEmail || dbUser.email;
        customerPhone = customerPhone || dbUser.phone_number;
      }
    }

    // Call the email utility function
    await emailSender.sendSupportQueryEmail({
      userId,
      name: customerName || 'Anonymous Customer',
      email: customerEmail || 'No email provided',
      phone: customerPhone || 'No phone provided',
      subject: subject.trim(),
      description: description.trim()
    });

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

module.exports = {
  submitSupportQuery
};
