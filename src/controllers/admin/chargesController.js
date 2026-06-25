const { responseHelper } = require('../../utils');
const pool = require('../../config/db');

const getCharges = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM charges_config WHERE id = 1');
    if (rows.length === 0) {
      return responseHelper.sendError(res, 404, 'Charges configuration not found');
    }
    return responseHelper.sendSuccess(res, 200, 'Charges configuration fetched successfully', rows[0]);
  } catch (error) {
    console.error('Get Charges Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to fetch charges configuration');
  }
};

const updateCharges = async (req, res) => {
  try {
    const { 
      delivery_base_charge, 
      delivery_distance_rate, 
      free_delivery_threshold, 
      handling_fee, 
      free_handling_threshold 
    } = req.body;

    if (
      delivery_base_charge === undefined || 
      delivery_distance_rate === undefined || 
      free_delivery_threshold === undefined || 
      handling_fee === undefined || 
      free_handling_threshold === undefined
    ) {
      return responseHelper.sendError(res, 400, 'All fields are required');
    }

    await pool.query(
      `UPDATE charges_config SET 
        delivery_base_charge = ?, 
        delivery_distance_rate = ?, 
        free_delivery_threshold = ?, 
        handling_fee = ?, 
        free_handling_threshold = ? 
       WHERE id = 1`,
      [
        Number(delivery_base_charge), 
        Number(delivery_distance_rate), 
        Number(free_delivery_threshold), 
        Number(handling_fee), 
        Number(free_handling_threshold)
      ]
    );

    const [rows] = await pool.query('SELECT * FROM charges_config WHERE id = 1');
    return responseHelper.sendSuccess(res, 200, 'Charges configuration updated successfully', rows[0]);
  } catch (error) {
    console.error('Update Charges Error:', error);
    return responseHelper.sendError(res, 500, 'Failed to update charges configuration');
  }
};

module.exports = {
  getCharges,
  updateCharges
};
