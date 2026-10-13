import { pool } from '../config/db.js';
import { AppError } from '../utils/appError.js';

export async function createOrder(req, res) {
  const quantities = new Map();
  for (const item of req.body.items) {
    quantities.set(item.foodItemId, (quantities.get(item.foodItemId) || 0) + item.quantity);
  }
  for (const quantity of quantities.values()) {
    if (quantity > 50) throw new AppError(400, 'A maximum of 50 of each item may be ordered.');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const ids = [...quantities.keys()];
    const placeholders = ids.map(() => '?').join(',');
    const [foods] = await connection.execute(
      `SELECT id, name, price, stock, is_available FROM food_items WHERE id IN (${placeholders}) FOR UPDATE`,
      ids
    );
    if (foods.length !== ids.length) throw new AppError(400, 'One or more selected food items no longer exist.');
    const foodsById = new Map(foods.map((food) => [food.id, food]));
    let total = 0;
    for (const [id, quantity] of quantities) {
      const food = foodsById.get(id);
      if (!food.is_available) throw new AppError(409, `${food.name} is not currently available.`);
      if (food.stock < quantity) throw new AppError(409, `Not enough stock for ${food.name}. Available: ${food.stock}.`);
      total += Number(food.price) * quantity;
    }

    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, total_amount, payment_method, status) VALUES (?, ?, ?, ?)',
      [req.user.id, total.toFixed(2), 'Cash at Pickup', 'Pending']
    );
    for (const [id, quantity] of quantities) {
      const food = foodsById.get(id);
      await connection.execute(
        `INSERT INTO order_items (order_id, food_item_id, item_name, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [orderResult.insertId, id, food.name, food.price, quantity]
      );
      await connection.execute('UPDATE food_items SET stock = stock - ? WHERE id = ?', [quantity, id]);
      await connection.execute(
        `INSERT INTO inventory_logs (food_item_id, user_id, change_amount, reason)
         VALUES (?, ?, ?, ?)`,
        [id, req.user.id, -quantity, `Order #${orderResult.insertId}`]
      );
    }
    await connection.commit();
    res.status(201).json({
      order: { id: orderResult.insertId, totalAmount: Number(total.toFixed(2)), paymentMethod: 'Cash at Pickup', status: 'Pending' }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const orderSummary = `SELECT o.id, o.user_id AS userId, u.name AS studentName, u.email AS studentEmail,
  o.total_amount AS totalAmount, o.payment_method AS paymentMethod, o.status,
  o.created_at AS createdAt
  FROM orders o JOIN users u ON u.id = o.user_id`;

export async function listMyOrders(req, res) {
  const [orders] = await pool.execute(`${orderSummary} WHERE o.user_id = ? ORDER BY o.created_at DESC`, [req.user.id]);
  for (const order of orders) {
    const [items] = await pool.execute(
      `SELECT item_name AS name, unit_price AS unitPrice, quantity
       FROM order_items WHERE order_id = ? ORDER BY id`,
      [order.id]
    );
    order.items = items;
  }
  res.json({ orders });
}

export async function listAllOrders(_req, res) {
  const [orders] = await pool.execute(`${orderSummary} ORDER BY o.created_at DESC LIMIT 300`);
  if (orders.length) {
    const placeholders = orders.map(() => '?').join(',');
    const [items] = await pool.execute(
      `SELECT order_id AS orderId, item_name AS name, unit_price AS unitPrice, quantity
       FROM order_items WHERE order_id IN (${placeholders}) ORDER BY order_id, id`,
      orders.map((order) => order.id)
    );
    const itemsByOrder = new Map();
    for (const item of items) {
      const list = itemsByOrder.get(item.orderId) || [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }
    for (const order of orders) order.items = itemsByOrder.get(order.id) || [];
  }
  res.json({ orders });
}

export async function updateOrderStatus(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute('SELECT id, status FROM orders WHERE id = ? FOR UPDATE', [req.params.id]);
    const order = orders[0];
    if (!order) throw new AppError(404, 'Order not found.');
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      throw new AppError(409, `A ${order.status.toLowerCase()} order cannot be changed.`);
    }
    const nextStatus = req.body.status;
    if (nextStatus === 'Cancelled') {
      const [items] = await connection.execute(
        'SELECT food_item_id AS foodItemId, quantity FROM order_items WHERE order_id = ?',
        [order.id]
      );
      for (const item of items) {
        if (item.foodItemId === null) continue;
        await connection.execute('UPDATE food_items SET stock = stock + ? WHERE id = ?', [item.quantity, item.foodItemId]);
        await connection.execute(
          'INSERT INTO inventory_logs (food_item_id, user_id, change_amount, reason) VALUES (?, ?, ?, ?)',
          [item.foodItemId, req.user.id, item.quantity, `Cancellation of order #${order.id}`]
        );
      }
    }
    await connection.execute('UPDATE orders SET status = ? WHERE id = ?', [nextStatus, order.id]);
    await connection.commit();
    res.json({ message: 'Order status updated.', status: nextStatus });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getReport(_req, res) {
  const [[summary]] = await pool.execute(
    `SELECT COUNT(*) AS totalOrders,
      COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN total_amount ELSE 0 END), 0) AS grossSales,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pendingOrders,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completedOrders
     FROM orders`
  );
  const [dailySales] = await pool.execute(
    `SELECT DATE(created_at) AS date, COUNT(*) AS orderCount,
      SUM(CASE WHEN status != 'Cancelled' THEN total_amount ELSE 0 END) AS sales
     FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL 6 DAY
     GROUP BY DATE(created_at) ORDER BY date`
  );
  res.json({ summary, dailySales });
}
