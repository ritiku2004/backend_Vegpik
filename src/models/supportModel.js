const pool = require('../config/db');

// Social links queries
const getAllSocialLinks = async () => {
  const [rows] = await pool.query('SELECT * FROM social_links ORDER BY id ASC');
  return rows;
};

const getSocialLinkById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM social_links WHERE id = ?', [id]);
  return rows[0];
};

const addSocialLink = async (name, icon, link) => {
  const [result] = await pool.query(
    'INSERT INTO social_links (name, icon, link) VALUES (?, ?, ?)',
    [name, icon, link]
  );
  return result.insertId;
};

const updateSocialLink = async (id, name, icon, link) => {
  await pool.query(
    'UPDATE social_links SET name = ?, icon = ?, link = ? WHERE id = ?',
    [name, icon, link, id]
  );
};

const deleteSocialLink = async (id) => {
  await pool.query('DELETE FROM social_links WHERE id = ?', [id]);
};

// Contact info queries
const getAllContactInfo = async () => {
  const [rows] = await pool.query('SELECT * FROM contact_info ORDER BY id ASC');
  return rows;
};

const getContactInfoById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM contact_info WHERE id = ?', [id]);
  return rows[0];
};

const updateContactInfo = async (id, title, description, value, action_label, icon) => {
  await pool.query(
    'UPDATE contact_info SET title = ?, description = ?, value = ?, action_label = ?, icon = ? WHERE id = ?',
    [title, description, value, action_label, icon, id]
  );
};

// Contact queries
const getAllContactQueries = async () => {
  const [rows] = await pool.query(
    'SELECT cq.*, u.phone_number as user_phone, CONCAT(u.first_name, " ", u.last_name) as user_name FROM contact_queries cq LEFT JOIN users u ON cq.user_id = u.id ORDER BY cq.created_at DESC'
  );
  return rows;
};

const saveContactQuery = async (userId, name, email, phone, subject, message) => {
  const [result] = await pool.query(
    'INSERT INTO contact_queries (user_id, name, email, phone, subject, message, status) VALUES (?, ?, ?, ?, ?, ?, "Pending")',
    [userId, name, email, phone, subject, message]
  );
  return result.insertId;
};

const updateQueryStatus = async (id, status) => {
  await pool.query('UPDATE contact_queries SET status = ? WHERE id = ?', [status, id]);
};

module.exports = {
  getAllSocialLinks,
  getSocialLinkById,
  addSocialLink,
  updateSocialLink,
  deleteSocialLink,
  getAllContactInfo,
  getContactInfoById,
  updateContactInfo,
  getAllContactQueries,
  saveContactQuery,
  updateQueryStatus
};
