const pool = require('../src/config/db');

async function deleteAllUsers() {
  try {
    // We should delete related rows first or simply delete users if ON DELETE CASCADE is enabled.
    // Assuming simple truncate or delete
    const [result] = await pool.query('DELETE FROM users');
    console.log(`Deleted ${result.affectedRows} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Error deleting users:', error);
    process.exit(1);
  }
}

deleteAllUsers();
