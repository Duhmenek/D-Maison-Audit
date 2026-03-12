-- 001_initial_schema.sql: J&T Sync & Parcel Audit

-- Parcel Status Enum
CREATE TYPE parcel_status AS ENUM (
  'IN_BUILDING', 
  'SCHEDULED_FOR_PICKUP', 
  'OUT_FOR_DELIVERY', 
  'DELIVERED'
);

-- Core Parcels Table
CREATE TABLE IF NOT EXISTS parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- OUR INTERNAL DATA
  internal_invoice_no VARCHAR(50) UNIQUE NOT NULL, -- Match key for J&T portal
  recipient_name VARCHAR(255) NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  status parcel_status DEFAULT 'IN_BUILDING',
  
  -- J&T EXPRESS INTEGRATION DATA
  jt_waybill_no VARCHAR(100) UNIQUE, -- Filled via SyncService
  courier_name VARCHAR(100) DEFAULT 'J&T Express',
  
  -- SYNC AUDIT TRAIL
  last_synced_at TIMESTAMPTZ,
  sync_error_code VARCHAR(50), -- e.g., 'NOT_FOUND_IN_JT_PORTAL', 'SYNC_FAILED_NETWORK'
  
  -- LOGISTICS METRICS
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for Sync Efficiency
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_invoice_no ON parcels(internal_invoice_no);
CREATE INDEX idx_parcels_waybill_no ON parcels(jt_waybill_no);

-- Automatic UpdatedAt Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parcels_updated_at
BEFORE UPDATE ON parcels
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
