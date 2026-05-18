const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'ecotote.db');
const db = new sqlite3.Database(dbPath, error => {
  if (error) {
    console.error('Помилка підключення до SQLite:', error.message);
  }
});

function ensureColumn(tableName, columnName, columnDefinition) {
  db.all(`PRAGMA table_info(${tableName})`, [], (error, columns) => {
    if (error) {
      console.error(`Помилка перевірки таблиці ${tableName}:`, error.message);
      return;
    }

    const columnExists = columns.some(column => column.name === columnName);

    if (columnExists) {
      return;
    }

    db.run(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
      alterError => {
        if (alterError) {
          console.error(
            `Помилка додавання колонки ${columnName} до таблиці ${tableName}:`,
            alterError.message
          );
        }
      }
    );
  });
}

function createDefaultAdmin() {
  db.get(
    'SELECT id FROM users WHERE email = ?',
    ['admin@ecotote.com'],
    (error, user) => {
      if (error) {
        console.error('Помилка перевірки адміністратора:', error.message);
        return;
      }

      if (user) {
        return;
      }

      db.run(
        `
          INSERT INTO users (name, email, password, role)
          VALUES (?, ?, ?, ?)
        `,
        ['Адміністратор', 'admin@ecotote.com', 'admin123', 'admin'],
        insertError => {
          if (insertError) {
            console.error('Помилка створення адміністратора:', insertError.message);
          }
        }
      );
    }
  );
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      phone TEXT DEFAULT '',
      city TEXT DEFAULT '',
      address TEXT DEFAULT ''
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      order_number TEXT NOT NULL UNIQUE,
      client_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      city TEXT,
      address TEXT,
      payment_method TEXT,
      order_status TEXT NOT NULL DEFAULT 'Нове',
      total REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS support_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      answer TEXT,
      status TEXT NOT NULL DEFAULT 'Нове',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      answered_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      admin_name TEXT,
      admin_email TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    )
  `);

  ensureColumn('users', 'phone', "TEXT DEFAULT ''");
  ensureColumn('users', 'city', "TEXT DEFAULT ''");
  ensureColumn('users', 'address', "TEXT DEFAULT ''");
  ensureColumn('support_requests', 'answer', 'TEXT');
  ensureColumn('support_requests', 'status', "TEXT NOT NULL DEFAULT 'Нове'");
  ensureColumn('support_requests', 'answered_at', 'TEXT');

  createDefaultAdmin();
});

module.exports = db;
