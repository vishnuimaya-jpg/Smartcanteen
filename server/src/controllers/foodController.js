import { pool } from '../config/db.js';
import { AppError } from '../utils/appError.js';

const selectFood = `SELECT f.id, f.name, f.description, f.price, f.image_url AS imageUrl,
  f.stock, f.is_available AS isAvailable, f.category_id AS categoryId,
  c.name AS categoryName, (f.is_available = 1 AND f.stock > 0) AS available
  FROM food_items f JOIN categories c ON c.id = f.category_id`;

export async function listFoods(req, res) {
  const { search, categoryId, available } = req.query;
  const filters = [];
  const values = [];
  if (search) {
    filters.push('f.name LIKE ?');
    values.push(`%${search}%`);
  }
  if (categoryId) {
    filters.push('f.category_id = ?');
    values.push(categoryId);
  }
  if (available === 'true') filters.push('f.is_available = 1 AND f.stock > 0');
  if (available === 'false') filters.push('(f.is_available = 0 OR f.stock = 0)');
  const [foods] = await pool.execute(
    `${selectFood} ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} ORDER BY f.name`,
    values
  );
  res.json({ foods });
}

export async function getFood(req, res) {
  const [rows] = await pool.execute(`${selectFood} WHERE f.id = ?`, [req.params.id]);
  if (!rows[0]) throw new AppError(404, 'Food item not found.');
  res.json({ food: rows[0] });
}

export async function createFood(req, res) {
  const food = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO food_items (category_id, name, description, price, image_url, stock, is_available)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [food.categoryId, food.name, food.description, food.price, food.imageUrl || null, food.stock, food.isAvailable]
    );
    if (food.stock > 0) {
      await connection.execute(
        'INSERT INTO inventory_logs (food_item_id, user_id, change_amount, reason) VALUES (?, ?, ?, ?)',
        [result.insertId, req.user.id, food.stock, 'Initial stock']
      );
    }
    await connection.commit();
    res.status(201).json({ food: { id: result.insertId, ...food } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateFood(req, res) {
  const food = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT stock FROM food_items WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!rows[0]) throw new AppError(404, 'Food item not found.');
    const stockChange = food.stock - rows[0].stock;
    await connection.execute(
      `UPDATE food_items SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?,
       stock = ?, is_available = ? WHERE id = ?`,
      [food.categoryId, food.name, food.description, food.price, food.imageUrl || null, food.stock, food.isAvailable, req.params.id]
    );
    if (stockChange !== 0) {
      await connection.execute(
        'INSERT INTO inventory_logs (food_item_id, user_id, change_amount, reason) VALUES (?, ?, ?, ?)',
        [req.params.id, req.user.id, stockChange, 'Admin stock adjustment']
      );
    }
    await connection.commit();
    res.json({ food: { id: Number(req.params.id), ...food } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteFood(req, res) {
  const [result] = await pool.execute('DELETE FROM food_items WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) throw new AppError(404, 'Food item not found.');
  res.json({ message: 'Food item deleted.' });
}
