export function notFound(_req, res) {
  res.status(404).json({ message: 'The requested endpoint was not found.' });
}

export function errorHandler(error, _req, res, _next) {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'That email address or category name is already in use.' });
  }
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ message: 'This category still contains food items. Move or delete them before deleting the category.' });
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ message: 'A referenced record does not exist.' });
  }
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: error.message || 'An unexpected server error occurred.', stack: error.stack });
}
