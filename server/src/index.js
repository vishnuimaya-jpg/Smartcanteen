import app from './app.js';
import { pool } from './config/db.js';
import { config } from './config/env.js';

// Fix BigInt serialization for mysql2
BigInt.prototype.toJSON = function() {
  return Number(this);
};

try {
  await pool.query('SELECT 1');
  app.listen(config.port, () => {
    console.log(`SmartCanteen API listening on http://localhost:${config.port}`);
  });
} catch (error) {
  console.error('Unable to connect to MySQL. Check the database settings and ensure MySQL is running.', error.message);
  process.exitCode = 1;
}
