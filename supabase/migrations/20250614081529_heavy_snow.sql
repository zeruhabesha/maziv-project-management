DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_status') THEN
    CREATE TYPE item_status AS ENUM ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
    CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE project_status AS ENUM ('planning', 'active', 'completed', 'on_hold', 'cancelled');
  END IF;
END$$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ref_no VARCHAR(100) UNIQUE,
    start_date DATE,
    end_date DATE,
    client VARCHAR(255),
    manager_ids INTEGER[], -- Array of user IDs
    description TEXT,
    tender_value DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    status VARCHAR (50) DEFAULT 'planning'
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Phases table
CREATE TABLE IF NOT EXISTS phases (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sequence_order INTEGER,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'pending'  -- Using VARCHAR here
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    phase_id INTEGER REFERENCES phases(id) ON DELETE SET NULL,  -- Allow phase to be null
    type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    model VARCHAR(255),
    specifications TEXT,
    unit VARCHAR(50),
    quantity DECIMAL(10,2),
    unit_price DECIMAL(15,2),
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL, -- Allow supplier to be null
    deadline DATE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Allow assigned user to be null

    -- Shipment specific fields
    shipment_date DATE,
    arrival_date DATE,
    taxes DECIMAL(15,2),
    tracking_no VARCHAR(255),

    -- Local production fields
    contractor VARCHAR(255),
    production_start_date DATE,
    production_end_date DATE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    status item_status DEFAULT 'pending'
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    triggered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(255),
    budgeted_amount DECIMAL(15,2),
    actual_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_items_project_id ON items(project_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_deadline ON items(deadline);
CREATE INDEX IF NOT EXISTS idx_alerts_project_id ON alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(is_read);

ALTER TABLE projects ALTER COLUMN status TYPE project_status USING status::text::project_status;
ALTER TABLE items ALTER COLUMN status TYPE item_status USING status::text::item_status;
ALTER TABLE alerts ALTER COLUMN severity TYPE alert_severity USING severity::text::alert_severity;

-- Sample query to test users table
SELECT id, name, email, role, created_at FROM public.users ORDER BY created_at DESC;