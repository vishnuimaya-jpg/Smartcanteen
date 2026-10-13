import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from '../utils/appError.js';

export function authenticate(req, _res, next) {
  const authorization = req.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Please sign in to continue.'));
  }

  try {
    const payload = jwt.verify(authorization.slice(7), config.jwtSecret);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Your session is invalid or has expired. Please sign in again.'));
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') {
    return next(new AppError(403, 'Administrator access is required.'));
  }
  next();
}
