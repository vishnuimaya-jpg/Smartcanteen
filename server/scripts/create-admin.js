import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'ADMIN_NAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.ADMIN_PASSWORD.length < 12 || process.env.ADMIN_PASSWORD.length > 72) {
  console.error('ADMIN_PASSWORD must be between 12 and 72 characters.');
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME
});
try {
  const [existing] = await connection.execute('SELECT id, role FROM users WHERE email = ?', [process.env.ADMIN_EMAIL.toLowerCase()]);
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  if (existing[0]) {
    if (existing[0].role !== 'admin') {
      throw new Error('The configured email already belongs to a non-admin account; refusing to elevate it.');
    }
    await connection.execute('UPDATE users SET name = ?, password_hash = ? WHERE id = ?', [
      process.env.ADMIN_NAME, passwordHash, existing[0].id
    ]);
    console.log('Administrator password and name updated.');
  } else {
    await connection.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [process.env.ADMIN_NAME, process.env.ADMIN_EMAIL.toLowerCase(), passwordHash, 'admin']
    );
    console.log('Administrator account created.');
  }
} finally {
  await connection.end();
}
