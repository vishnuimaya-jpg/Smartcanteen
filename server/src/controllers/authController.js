import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/appError.js';

function issueToken(user) {
  const token = jwt.sign(
    { email: user.email, role: user.role },
    config.jwtSecret,
    { subject: String(user.id), expiresIn: config.jwtExpiresIn }
  );
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email.toLowerCase(), passwordHash, 'student']
  );
  res.status(201).json(issueToken({ id: result.insertId, name, email: email.toLowerCase(), role: 'student' }));
}

export async function login(req, res) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
    [req.body.email.toLowerCase()]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
    throw new AppError(401, 'Email or password is incorrect.');
  }
  res.json(issueToken(user));
}

export async function currentUser(req, res) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1',
    [req.user.id]
  );
  if (!rows[0]) throw new AppError(401, 'Your account is no longer available.');
  res.json({ user: rows[0] });
}
