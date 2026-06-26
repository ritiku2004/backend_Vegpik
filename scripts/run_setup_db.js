/**
 * run_setup_db.js
 * 
 * Reads setup_remote_db.sql and executes each statement against the
 * configured remote MySQL database using the .env credentials.
 * 
 * Usage:  node scripts/run_setup_db.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const SQL_FILE = path.resolve(__dirname, 'setup_remote_db.sql');

/**
 * Parse SQL file into individual statements, handling:
 * - Line comments (--)
 * - Multi-line statements
 * - Semicolons inside string literals
 */
function parseSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    // Handle string literals
    if (inString) {
      current += ch;
      if (ch === stringChar && sql[i - 1] !== '\\') {
        inString = false;
      }
      continue;
    }

    // Start of string literal
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }

    // Line comment
    if (ch === '-' && sql[i + 1] === '-') {
      const newline = sql.indexOf('\n', i);
      i = newline === -1 ? sql.length : newline;
      continue;
    }

    // Statement delimiter
    if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += ch;
  }

  // Handle last statement without semicolon
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }

  return statements;
}

async function run() {
  console.log('=== Vegpik Remote DB Setup ===');
  console.log(`Host    : ${process.env.DB_HOST}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`User    : ${process.env.DB_USER}`);
  console.log('');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 20000
  });

  try {
    console.log('✔ Connected to database.\n');

    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    const statements = parseSqlStatements(sqlContent);

    console.log(`Found ${statements.length} SQL statements to execute.\n`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.replace(/\s+/g, ' ').substring(0, 90);
      try {
        await connection.query(stmt);
        console.log(`  [${i + 1}] ✔ ${preview}`);
        successCount++;
      } catch (err) {
        const idempotentCodes = [
          'ER_DUP_FIELDNAME',        // Column already exists
          'ER_TABLE_EXISTS_ERROR',    // Table already exists
          'ER_DUP_KEYNAME',          // Duplicate key name
          'ER_CANT_DROP_FIELD_OR_KEY', // Key doesn't exist (drop)
          'ER_FK_DUP_NAME',           // Duplicate FK name
        ];
        const idempotentMessages = [
          'already exists',
          'Duplicate key name',
          'Duplicate entry',
          "Can't DROP",
        ];

        const isIdempotent =
          idempotentCodes.includes(err.code) ||
          idempotentMessages.some(m => (err.sqlMessage || '').includes(m));

        if (isIdempotent) {
          console.log(`  [${i + 1}] ⚠ SKIP (${err.code}): ${preview}`);
          skipCount++;
        } else {
          console.error(`  [${i + 1}] ✖ FAIL [${err.code}]: ${err.sqlMessage || err.message}`);
          console.error(`       Statement: ${preview}`);
          failCount++;
          // Keep going to set up as much as possible
        }
      }
    }

    console.log(`\n=== Setup Complete ===`);
    console.log(`  ✔ Executed : ${successCount}`);
    console.log(`  ⚠ Skipped  : ${skipCount}`);
    console.log(`  ✖ Failed   : ${failCount}`);

    // Verify tables exist
    console.log('\n--- Tables now in database ---');
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('  (none — check for errors above)');
    } else {
      tables.forEach(t => console.log(' ', Object.values(t)[0]));
    }

  } finally {
    await connection.end();
    console.log('\n✔ Connection closed.');
  }
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
