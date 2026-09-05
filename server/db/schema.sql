-- DealFlow360 - Complete PostgreSQL Relational Schema DDL

DROP TABLE IF EXISTS fulfillment_splits CASCADE;
DROP TABLE IF EXISTS quotation_comments CASCADE;
DROP TABLE IF EXISTS approval_logs CASCADE;
DROP TABLE IF EXISTS quotation_lines CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS upsell_rules CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS stock_levels CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS discount_rules CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users & RBAC Roles
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'sales_rep', 'sales_manager', 'finance', 'customer', 'admin'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers & Tier Assignment
CREATE TABLE customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  tier VARCHAR(20) NOT NULL DEFAULT 'Bronze', -- 'Bronze', 'Silver', 'Gold'
  email VARCHAR(150) NOT NULL,
  rep_id VARCHAR(50) REFERENCES users(id)
);

-- 3. Product Catalog
CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'Hardware', 'Service', 'Subscription'
  list_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'Unit',
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Variants
CREATE TABLE product_variants (
  id VARCHAR(50) PRIMARY KEY,
  product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
  attribute_name VARCHAR(50) NOT NULL,
  attribute_value VARCHAR(50) NOT NULL,
  extra_price DECIMAL(10,2) DEFAULT 0.00
);

-- 5. Discount Rules & Governance Ceilings
CREATE TABLE discount_rules (
  id VARCHAR(50) PRIMARY KEY,
  tier VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  max_allowed_discount DECIMAL(5,2) NOT NULL
);

-- 6. Warehouses
CREATE TABLE warehouses (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  shipping_weight_cost DECIMAL(4,2) DEFAULT 1.00
);

-- 7. Warehouse Stock Inventories
CREATE TABLE stock_levels (
  id VARCHAR(50) PRIMARY KEY,
  warehouse_id VARCHAR(50) REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0
);

-- 8. Subscription Plans
CREATE TABLE subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  frequency VARCHAR(20) NOT NULL, -- 'Monthly', 'Quarterly', 'Yearly'
  billing_in_advance BOOLEAN DEFAULT TRUE,
  proration_rule VARCHAR(100) NOT NULL
);

-- 9. Upsell Rules
CREATE TABLE upsell_rules (
  id VARCHAR(50) PRIMARY KEY,
  trigger_product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
  suggested_product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  margin_delta DECIMAL(5,2) NOT NULL,
  is_promoted BOOLEAN DEFAULT FALSE
);

-- 10. Quotations
CREATE TABLE quotations (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  customer_id VARCHAR(50) REFERENCES customers(id),
  rep_id VARCHAR(50) REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Pending Approval', 'Approved', 'Sent to Customer', 'In Negotiation', 'Confirmed', 'Invoiced'
  blended_risk_score DECIMAL(5,2) DEFAULT 0.00,
  total_net_revenue DECIMAL(12,2) DEFAULT 0.00,
  overall_gross_margin_pct DECIMAL(5,2) DEFAULT 0.00,
  days_inactive INT DEFAULT 0,
  portal_token VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Quotation Lines
CREATE TABLE quotation_lines (
  id VARCHAR(50) PRIMARY KEY,
  quotation_id VARCHAR(50) REFERENCES quotations(id) ON DELETE CASCADE,
  product_id VARCHAR(50) REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_pct DECIMAL(5,2) DEFAULT 0.00,
  is_recurring BOOLEAN DEFAULT FALSE,
  billing_frequency VARCHAR(50) DEFAULT 'One-Time'
);

-- 12. Approval Audit Logs
CREATE TABLE approval_logs (
  id VARCHAR(50) PRIMARY KEY,
  quotation_id VARCHAR(50) REFERENCES quotations(id) ON DELETE CASCADE,
  user_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  blended_risk_score DECIMAL(5,2) DEFAULT 0.00,
  reason TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Quotation Negotiation Comments
CREATE TABLE quotation_comments (
  id VARCHAR(50) PRIMARY KEY,
  quotation_id VARCHAR(50) REFERENCES quotations(id) ON DELETE CASCADE,
  sender_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Warehouse Fulfillment Splits
CREATE TABLE fulfillment_splits (
  id VARCHAR(50) PRIMARY KEY,
  quotation_id VARCHAR(50) REFERENCES quotations(id) ON DELETE CASCADE,
  total_shipments_count INT DEFAULT 1,
  total_shipping_cost DECIMAL(10,2) DEFAULT 0.00,
  total_backordered_qty INT DEFAULT 0,
  allocation_data_json JSONB
);
