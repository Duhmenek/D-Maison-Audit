-- 003_repairs.sql: D-Maison Repair Tracking

-- Repair Status Enum
CREATE TYPE repair_status AS ENUM (
  'INTAKE', 
  'IN_PROGRESS', 
  'AWAITING_PARTS', 
  'READY',
  'PICKED_UP'
);

-- Repairs Table
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  item_description TEXT NOT NULL,
  issue_details TEXT,
  estimated_cost DECIMAL(12, 2),
  status repair_status DEFAULT 'INTAKE',
  due_date TIMESTAMPTZ,
  
  -- METADATA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for Repair Management
CREATE INDEX idx_repairs_ticket ON repairs(ticket_number);
CREATE INDEX idx_repairs_status ON repairs(status);
CREATE INDEX idx_repairs_customer ON repairs(customer_name);

-- Automatic UpdatedAt Trigger for Repairs
CREATE TRIGGER update_repairs_updated_at
BEFORE UPDATE ON repairs
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
