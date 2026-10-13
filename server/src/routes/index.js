import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  categorySchema, foodQuerySchema, foodSchema, loginSchema, orderSchema,
  orderStatusSchema, registerSchema
} from '../schemas/index.js';
import * as auth from '../controllers/authController.js';
import * as categories from '../controllers/categoryController.js';
import * as foods from '../controllers/foodController.js';
import * as orders from '../controllers/orderController.js';
import { AppError } from '../utils/appError.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
const idParam = (req, _res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return next(new AppError(400, 'A valid record ID is required.'));
  next();
};

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.post('/auth/register', authLimiter, validate(registerSchema), asyncHandler(auth.register));
router.post('/auth/login', authLimiter, validate(loginSchema), asyncHandler(auth.login));
router.get('/auth/me', authenticate, asyncHandler(auth.currentUser));

router.get('/categories', asyncHandler(categories.listCategories));
router.post('/categories', authenticate, requireAdmin, validate(categorySchema), asyncHandler(categories.createCategory));
router.put('/categories/:id', authenticate, requireAdmin, idParam, validate(categorySchema), asyncHandler(categories.updateCategory));
router.delete('/categories/:id', authenticate, requireAdmin, idParam, asyncHandler(categories.deleteCategory));

router.get('/foods', validate(foodQuerySchema, 'query'), asyncHandler(foods.listFoods));
router.get('/foods/:id', idParam, asyncHandler(foods.getFood));
router.post('/foods', authenticate, requireAdmin, validate(foodSchema), asyncHandler(foods.createFood));
router.put('/foods/:id', authenticate, requireAdmin, idParam, validate(foodSchema), asyncHandler(foods.updateFood));
router.delete('/foods/:id', authenticate, requireAdmin, idParam, asyncHandler(foods.deleteFood));

router.post('/orders', authenticate, validate(orderSchema), asyncHandler(orders.createOrder));
router.get('/orders/mine', authenticate, asyncHandler(orders.listMyOrders));
router.get('/admin/orders', authenticate, requireAdmin, asyncHandler(orders.listAllOrders));
router.patch('/admin/orders/:id/status', authenticate, requireAdmin, idParam, validate(orderStatusSchema), asyncHandler(orders.updateOrderStatus));
router.get('/admin/reports', authenticate, requireAdmin, asyncHandler(orders.getReport));

export default router;
