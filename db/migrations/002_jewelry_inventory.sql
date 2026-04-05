-- 002_jewelry_inventory.sql: D-Maison Jewelry Management

-- Jewelry Status Enum
CREATE TYPE jewelry_status AS ENUM (
  'IN_STOCK', 
  'SOLD', 
  'MEMO', 
  'REPAIR',
  'APPRAISAL'
);

-- Jewelry Categories Enum
CREATE TYPE jewelry_category AS ENUM (
  'RING',
  'NECKLACE',
  'BRACELET',
  'EARRINGS',
  'WATCH',
  'LOOSE_STONE',
  'OTHER'
);

-- Core Jewelry Inventory Table
CREATE TABLE IF NOT EXISTS jewelry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category jewelry_category NOT NULL,
  material VARCHAR(100), -- e.g., '18k Yellow Gold', 'Platinum'
  gemstone_details TEXT, -- e.g., '1.2ct Round Brilliant Diamond, VVS1, F'
  weight_grams DECIMAL(10, 3),
  cost_price DECIMAL(12, 2) NOT NULL,
  retail_price DECIMAL(12, 2) NOT NULL,
  status jewelry_status DEFAULT 'IN_STOCK',
  image_url TEXT,
  
  -- METADATA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for Inventory Management
CREATE INDEX idx_jewelry_sku ON jewelry_items(sku);
CREATE INDEX idx_jewelry_category ON jewelry_items(category);
CREATE INDEX idx_jewelry_status ON jewelry_items(status);

-- Automatic UpdatedAt Trigger for Jewelry
CREATE TRIGGER update_jewelry_items_updated_at
BEFORE UPDATE ON jewelry_items
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
