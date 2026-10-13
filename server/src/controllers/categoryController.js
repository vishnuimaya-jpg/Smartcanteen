import { pool } from '../config/db.js';
import { AppError } from '../utils/appError.js';

export async function listCategories(_req, res) {
  const [rows] = await pool.execute(
    'SELECT c.id, c.name, COUNT(f.id) AS itemCount FROM categories c LEFT JOIN food_items f ON f.category_id = c.id GROUP BY c.id ORDER BY c.name'
  );
  res.json({ categories: rows });
}

export async function createCategory(req, res) {
  const [result] = await pool.execute('INSERT INTO categories (name) VALUES (?)', [req.body.name]);
  res.status(201).json({ category: { id: result.insertId, name: req.body.name } });
}

export async function updateCategory(req, res) {
  const [result] = await pool.execute('UPDATE categories SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
  if (!result.affectedRows) throw new AppError(404, 'Category not found.');
  res.json({ category: { id: Number(req.params.id), name: req.body.name } });
}

export async function deleteCategory(req, res) {
  const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) throw new AppError(404, 'Category not found.');
  res.json({ message: 'Category deleted.' });
}
