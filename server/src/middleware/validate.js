import { AppError } from '../utils/appError.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new AppError(400, result.error.issues.map((issue) => issue.message).join('. ')));
    }
    req[source] = result.data;
    next();
  };
}
