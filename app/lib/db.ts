import Database from 'better-sqlite3';
import path from 'path';
import { supabase } from './supabase';

const DB_PATH = path.join(process.cwd(), 'invoices.db');
const db = new Database(DB_PATH);

// Initialize the database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    invoice_number TEXT PRIMARY KEY,
    customer_name TEXT,
    status TEXT DEFAULT 'PENDING',
    scanned_at TEXT,
    synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_duplicate INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS jnt_verification_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_name TEXT,
    date_processed TEXT,
    invoice_number TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    sync_status INTEGER DEFAULT 0
  )
`);

// Add Indexing for Performance
db.exec(`CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_invoice ON jnt_verification_logs(invoice_number)`);

export interface InvoiceRecord {
  invoice_number: string;
  customer_name: string;
  status: string;
  scanned_at?: string;
  synced_at: string;
  is_duplicate: number;
}

export interface JntVerificationLog {
  log_id: number;
  staff_name: string;
  date_processed: string;
  invoice_number: string;
  timestamp: string;
  sync_status: number;
}

const isVercel = process.env.VERCEL === '1' && !!supabase;

export const dbService = {
  getAllInvoices: async (): Promise<InvoiceRecord[]> => {
    if (isVercel && supabase) {
      const { data, error } = await supabase.from('invoices').select('*').order('synced_at', { ascending: false });
      if (error) throw error;
      return data as InvoiceRecord[];
    }
    return db.prepare('SELECT * FROM invoices ORDER BY synced_at DESC').all() as InvoiceRecord[];
  },

  upsertInvoice: async (invoice: Partial<InvoiceRecord>) => {
    if (isVercel && supabase) {
      const { data: existing } = await supabase.from('invoices').select('*').eq('invoice_number', invoice.invoice_number).single();
      const isDuplicate = existing ? 1 : 0;
      const { error } = await supabase.from('invoices').upsert({
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        status: invoice.status || 'PENDING',
        is_duplicate: isDuplicate
      });
      if (error) throw error;
      return;
    }
    const existing = db.prepare('SELECT * FROM invoices WHERE invoice_number = ?').get(invoice.invoice_number);
    const isDuplicate = existing ? 1 : 0;

    const stmt = db.prepare(`
      INSERT INTO invoices (invoice_number, customer_name, status, is_duplicate)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(invoice_number) DO UPDATE SET
        customer_name = COALESCE(excluded.customer_name, invoices.customer_name),
        is_duplicate = 1
    `);

    return stmt.run(invoice.invoice_number, invoice.customer_name, invoice.status || 'PENDING', isDuplicate);
  },

  updateScanStatus: async (invoiceNumber: string, status: string, scanTime: string) => {
    if (isVercel && supabase) {
      const { error } = await supabase.from('invoices').update({ status, scanned_at: scanTime }).eq('invoice_number', invoiceNumber);
      if (error) throw error;
      return;
    }
    const stmt = db.prepare(`
      UPDATE invoices 
      SET status = ?, scanned_at = ?
      WHERE invoice_number = ?
    `);
    return stmt.run(status, scanTime, invoiceNumber);
  },

  addVerificationLog: async (log: Omit<JntVerificationLog, 'log_id' | 'timestamp' | 'sync_status'>) => {
    if (isVercel && supabase) {
      const { error } = await supabase.from('jnt_verification_logs').insert({
        staff_name: log.staff_name,
        date_processed: log.date_processed,
        invoice_number: log.invoice_number
      });
      if (error) throw error;
      return;
    }
    const stmt = db.prepare(`
      INSERT INTO jnt_verification_logs (staff_name, date_processed, invoice_number)
      VALUES (?, ?, ?)
    `);
    return stmt.run(log.staff_name, log.date_processed, log.invoice_number);
  },

  getVerificationLogs: async (): Promise<JntVerificationLog[]> => {
    if (isVercel && supabase) {
      const { data, error } = await supabase.from('jnt_verification_logs').select('*').order('timestamp', { ascending: false });
      if (error) throw error;
      return data as JntVerificationLog[];
    }
    return db.prepare('SELECT * FROM jnt_verification_logs ORDER BY timestamp DESC').all() as JntVerificationLog[];
  },

  clearAll: async () => {
    if (isVercel && supabase) {
      await supabase.from('jnt_verification_logs').delete().neq('log_id', 0);
      await supabase.from('invoices').delete().neq('invoice_number', '');
      return;
    }
    db.prepare('DELETE FROM jnt_verification_logs').run();
    return db.prepare('DELETE FROM invoices').run();
  }
};

export default db;
