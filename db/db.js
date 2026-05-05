// db/db.js
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT
    )
  `);

  // สินค้า: เก็บราคาทุนและราคาขายต่อหน่วย พร้อมสต็อก
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT,
      cost_price REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // บันทึกการซื้อสินค้าเข้ามา (เพิ่มสต็อก)
  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL,
      total REAL NOT NULL,
      purchased_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // บันทึกการขายสินค้า (ลดสต็อก)
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      unit_cost REAL NOT NULL,
      total REAL NOT NULL,
      sold_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // ต้นทุนคงที่ เช่น ค่าเช่า เงินเดือน ค่าน้ำค่าไฟ
  db.run(`
    CREATE TABLE IF NOT EXISTS fixed_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL DEFAULT 'monthly',
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ต้นทุนแปรผันอื่น ๆ นอกเหนือจากต้นทุนสินค้า เช่น ค่าขนส่ง ค่าบรรจุภัณฑ์
  db.run(`
    CREATE TABLE IF NOT EXISTS variable_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount_per_unit REAL NOT NULL,
      product_id INTEGER,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);
});

module.exports = db;
