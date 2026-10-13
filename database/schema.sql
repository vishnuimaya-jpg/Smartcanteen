CREATE DATABASE IF NOT EXISTS smartcanteen
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE smartcanteen;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS food_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(1000) NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_food_category (category_id),
  KEY idx_food_name (name),
  CONSTRAINT chk_food_price CHECK (price > 0),
  CONSTRAINT fk_food_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('Cash at Pickup') NOT NULL DEFAULT 'Cash at Pickup',
  status ENUM('Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled')
    NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_user_created (user_id, created_at),
  KEY idx_orders_status_created (status, created_at),
  CONSTRAINT chk_order_total CHECK (total_amount >= 0),
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  food_item_id BIGINT UNSIGNED NULL,
  item_name VARCHAR(120) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_food (food_item_id),
  CONSTRAINT chk_order_item_price CHECK (unit_price > 0),
  CONSTRAINT chk_order_item_quantity CHECK (quantity > 0),
  CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_item_food FOREIGN KEY (food_item_id) REFERENCES food_items(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  food_item_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  change_amount INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_food_created (food_item_id, created_at),
  KEY idx_inventory_user (user_id),
  CONSTRAINT chk_inventory_change CHECK (change_amount <> 0),
  CONSTRAINT fk_inventory_food FOREIGN KEY (food_item_id) REFERENCES food_items(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_inventory_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO categories (name) VALUES
  ('Breakfast'),
  ('Meals'),
  ('Snacks'),
  ('Beverages'),
  ('Desserts');

INSERT INTO food_items (category_id, name, description, price, stock, is_available)
SELECT c.id, seed.name, seed.description, seed.price, seed.stock, TRUE
FROM (
  SELECT 'Breakfast' AS category, 'Masala Dosa' AS name, 'Crispy dosa with spiced potato filling and chutneys.' AS description, 55.00 AS price, 25 AS stock
  UNION ALL SELECT 'Breakfast', 'Idli Sambar', 'Steamed rice cakes served with sambar and coconut chutney.', 40.00, 30
  UNION ALL SELECT 'Meals', 'Veg Thali', 'A filling meal with rice, dal, seasonal vegetables and roti.', 95.00, 20
  UNION ALL SELECT 'Meals', 'Paneer Wrap', 'Soft wrap filled with paneer, fresh vegetables and mint sauce.', 80.00, 18
  UNION ALL SELECT 'Snacks', 'Samosa (2 pcs)', 'Golden pastry filled with seasoned potatoes.', 30.00, 40
  UNION ALL SELECT 'Snacks', 'Veg Sandwich', 'Toasted sandwich with vegetables and house spread.', 50.00, 20
  UNION ALL SELECT 'Beverages', 'Masala Chai', 'Freshly brewed tea with milk and warming spices.', 18.00, 50
  UNION ALL SELECT 'Beverages', 'Fresh Lime Soda', 'Chilled lime soda, available sweet or salted.', 35.00, 25
  UNION ALL SELECT 'Desserts', 'Gulab Jamun (2 pcs)', 'Soft milk-solid dumplings in fragrant syrup.', 35.00, 20
) AS seed
JOIN categories c ON c.name = seed.category
WHERE NOT EXISTS (
  SELECT 1 FROM food_items f WHERE f.name = seed.name AND f.category_id = c.id
);
