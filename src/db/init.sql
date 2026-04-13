CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  short_description VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  inventory INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_category (category)
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  address TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO products (name, category, price, short_description, image_url, inventory)
SELECT
  'Cloud Runner Sneakers',
  'Footwear',
  79.00,
  'Lightweight everyday sneakers designed for all-day comfort.',
  '/images/cloud-runner.svg',
  18
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Cloud Runner Sneakers');

INSERT INTO products (name, category, price, short_description, image_url, inventory)
SELECT
  'Summit Trail Jacket',
  'Outerwear',
  129.00,
  'Weather-ready jacket with clean styling for city and mountain use.',
  '/images/summit-trail.svg',
  11
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Summit Trail Jacket');

INSERT INTO products (name, category, price, short_description, image_url, inventory)
SELECT
  'Signal Backpack',
  'Accessories',
  64.00,
  'Durable commuter backpack with laptop sleeve and quick-access pockets.',
  '/images/signal-backpack.svg',
  14
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Signal Backpack');

INSERT INTO products (name, category, price, short_description, image_url, inventory)
SELECT
  'Harbor Tee',
  'Apparel',
  28.00,
  'Premium cotton tee with a relaxed fit and soft hand feel.',
  '/images/harbor-tee.svg',
  25
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Harbor Tee');

INSERT INTO products (name, category, price, short_description, image_url, inventory)
SELECT
  'Latitude Watch',
  'Accessories',
  149.00,
  'Minimal analog watch with brushed steel case and leather strap.',
  '/images/latitude-watch.svg',
  9
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Latitude Watch');

INSERT INTO products (name, category, price, short_description, image_url, inventory)
SELECT
  'Studio Bottle',
  'Lifestyle',
  22.00,
  'Insulated stainless steel bottle built for desk and gym rotation.',
  '/images/studio-bottle.svg',
  30
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Studio Bottle');
