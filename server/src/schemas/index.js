import { z } from 'zod';

const positiveId = z.coerce.number().int().positive();

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().trim().email('Enter a valid email address.').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(72)
});
export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254),
  password: z.string().min(1, 'Password is required.').max(72)
});
export const foodQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  categoryId: positiveId.optional(),
  available: z.enum(['true', 'false']).optional()
});
export const categorySchema = z.object({ name: z.string().trim().min(2).max(80) });
export const foodSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(''),
  price: z.coerce.number().positive().max(100000),
  categoryId: positiveId,
  imageUrl: z.string().trim().url().max(1000).or(z.literal('')).default(''),
  stock: z.coerce.number().int().min(0).max(100000),
  isAvailable: z.boolean().default(true)
});
export const orderSchema = z.object({
  paymentMethod: z.literal('cash_at_pickup'),
  items: z.array(z.object({
    foodItemId: positiveId,
    quantity: z.coerce.number().int().min(1).max(50)
  })).min(1).max(50)
});
export const orderStatusSchema = z.object({
  status: z.enum(['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'])
});
