import Database from 'better-sqlite3';
import path from 'path';
import { supabase } from './supabase';

const DB_PATH = path.join(process.cwd(), 'invoices.db');

let db: any = null;
// Force cloud mode if Supabase is initialized, otherwise try local SQLite
const isCloud = !!supabase;

if (!isCloud) {
  try {
    db = new Database(DB_PATH);
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
  } catch (err) {
    console.error('Failed to initialize local SQLite database:', err);
  }
}

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

export interface PaymentAudit {
  id?: number;
  order_no: string;
  alt_no: string;
  tracking_number: string;
  customer_name: string;
  profile_name: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  paid_amount: number;
  payment_provider: string;
  account_no: string;
  account_name: string;
  paid_at: string;
  sku: string;
  item_name: string;
  item_qty: number;
  item_price: number;
  grand_total: number;
  confirmed_at?: string;
  discrepancy: string;
  audit_date: string;
}

const ensureDb = () => {
  if (isCloud && supabase) return true;
  if (db) return false;
  throw new Error("Database not initialized. Please check your Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).");
};

export const dbService = {
  getAllInvoices: async (): Promise<InvoiceRecord[]> => {
    if (ensureDb()) {
      const { data, error } = await supabase!.from('invoices').select('*').order('synced_at', { ascending: false });
      if (error) throw error;
      return data as InvoiceRecord[];
    }
    return db.prepare('SELECT * FROM invoices ORDER BY synced_at DESC').all() as InvoiceRecord[];
  },

  upsertInvoice: async (invoice: Partial<InvoiceRecord>) => {
    if (ensureDb()) {
      const { data: existing } = await supabase!.from('invoices').select('*').eq('invoice_number', invoice.invoice_number).single();
      const isDuplicate = existing ? 1 : 0;
      const { error } = await supabase!.from('invoices').upsert({
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
    if (ensureDb()) {
      const { error } = await supabase!.from('invoices').update({ status, scanned_at: scanTime }).eq('invoice_number', invoiceNumber);
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
    if (ensureDb()) {
      const { error } = await supabase!.from('jnt_verification_logs').insert({
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
    if (ensureDb()) {
      const { data, error } = await supabase!.from('jnt_verification_logs').select('*').order('timestamp', { ascending: false });
      if (error) throw error;
      return data as JntVerificationLog[];
    }
    return db.prepare('SELECT * FROM jnt_verification_logs ORDER BY timestamp DESC').all() as JntVerificationLog[];
  },

  deleteInvoice: async (invoiceNumber: string) => {
    if (ensureDb()) {
      const { error } = await supabase!.from('invoices').delete().eq('invoice_number', invoiceNumber);
      if (error) throw error;
      return;
    }
    const stmt = db.prepare('DELETE FROM invoices WHERE invoice_number = ?');
    return stmt.run(invoiceNumber);
  },

  clearAll: async () => {
    if (ensureDb()) {
      await supabase!.from('jnt_verification_logs').delete().neq('log_id', 0);
      await supabase!.from('invoices').delete().neq('invoice_number', '');
      return;
    }
    db.prepare('DELETE FROM jnt_verification_logs').run();
    return db.prepare('DELETE FROM invoices').run();
  },

  getPaymentAudits: async (startDate?: string, endDate?: string): Promise<PaymentAudit[]> => {
    if (ensureDb()) {
      let query = supabase!.from('payment_audits').select('*');
      if (startDate) query = query.gte('audit_date', startDate);
      if (endDate) query = query.lte('audit_date', endDate);
      const { data, error } = await query.order('confirmed_at', { ascending: false });
      if (error) throw error;
      return data as PaymentAudit[];
    }
    
    let sql = 'SELECT * FROM payment_audits';
    const params: any[] = [];
    if (startDate || endDate) {
      sql += ' WHERE';
      if (startDate) {
        sql += ' audit_date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        if (startDate) sql += ' AND';
        sql += ' audit_date <= ?';
        params.push(endDate);
      }
    }
    sql += ' ORDER BY confirmed_at DESC';
    return db.prepare(sql).all(...params) as PaymentAudit[];
  },

  addPaymentAudits: async (audits: PaymentAudit[]) => {
    if (ensureDb()) {
      const { error } = await supabase!.from('payment_audits').insert(audits);
      if (error) throw error;
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO payment_audits (
        order_no, alt_no, tracking_number, customer_name, profile_name,
        subtotal, shipping_cost, discount, total, paid_amount,
        payment_provider, account_no, account_name, paid_at,
        sku, item_name, item_qty, item_price, grand_total,
        discrepancy, audit_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items: PaymentAudit[]) => {
      for (const item of items) {
        stmt.run(
          item.order_no, item.alt_no, item.tracking_number, item.customer_name, item.profile_name,
          item.subtotal, item.shipping_cost, item.discount, item.total, item.paid_amount,
          item.payment_provider, item.account_no, item.account_name, item.paid_at,
          item.sku, item.item_name, item.item_qty, item.item_price, item.grand_total,
          item.discrepancy, item.audit_date
        );
      }
    });

    return insertMany(audits);
  }
};

export default db;
