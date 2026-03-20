import Database from 'better-sqlite3';
import path from 'path';

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

export interface InvoiceRecord {
  invoice_number: string;
  customer_name: string;
  status: string;
  scanned_at?: string;
  synced_at: string;
  is_duplicate: number;
}

export const dbService = {
  getAllInvoices: (): InvoiceRecord[] => {
    return db.prepare('SELECT * FROM invoices ORDER BY synced_at DESC').all() as InvoiceRecord[];
  },

  upsertInvoice: (invoice: Partial<InvoiceRecord>) => {
    const existing = db.prepare('SELECT * FROM invoices WHERE invoice_number = ?').get(invoice.invoice_number);
    const isDuplicate = existing ? 1 : 0;

    const stmt = db.prepare(`
      INSERT INTO invoices (invoice_number, customer_name, status, is_duplicate)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(invoice_number) DO UPDATE SET
        customer_name = excluded.customer_name,
        is_duplicate = 1
    `);

    return stmt.run(invoice.invoice_number, invoice.customer_name, invoice.status || 'PENDING', isDuplicate);
  },

  updateScanStatus: (invoiceNumber: string, status: string, scanTime: string) => {
    const stmt = db.prepare(`
      UPDATE invoices 
      SET status = ?, scanned_at = ?
      WHERE invoice_number = ?
    `);
    return stmt.run(status, scanTime, invoiceNumber);
  },

  clearAll: () => {
    return db.prepare('DELETE FROM invoices').run();
  }
};

export default db;
