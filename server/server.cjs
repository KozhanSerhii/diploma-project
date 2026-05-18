const express = require('express');
const cors = require('cors');
const db = require('./database.cjs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[А-Яа-яІіЇїЄєҐґA-Za-z\s'-]{2,60}$/;
const PHONE_PATTERN = /^\+380\d{9}$/;
const CITY_PATTERN = /^[А-Яа-яІіЇїЄєҐґA-Za-z\s'-]{2,60}$/;
const ORDER_STATUSES = ['Нове', 'В обробці', 'Відправлено', 'Доставлено'];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function sendServerError(res, message) {
  return res.status(500).json({ message });
}

function isValidEmail(email) {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

function isValidName(name) {
  return NAME_PATTERN.test(String(name || '').trim());
}

function isValidPassword(password) {
  return String(password || '').length >= 6;
}

function isValidPhone(phone) {
  return PHONE_PATTERN.test(String(phone || '').trim());
}

function isValidCity(city) {
  return CITY_PATTERN.test(String(city || '').trim());
}

function isValidAddress(address) {
  const value = String(address || '').trim();

  return value.length >= 5 && value.length <= 120;
}

function isValidMessage(message) {
  const value = String(message || '').trim();

  return value.length >= 5 && value.length <= 500;
}

function getPriceNumber(price) {
  return Number(String(price).replace(/[^\d.]/g, '')) || 0;
}

function createOrderNumber(callback) {
  db.get('SELECT MAX(id) AS maxId FROM orders', [], (error, row) => {
    if (error) {
      callback(error);
      return;
    }

    const nextNumber = (row?.maxId || 1023) + 1;
    callback(null, `#${nextNumber}`);
  });
}

app.get('/', (req, res) => {
  res.send('EcoTote API працює');
});

app.get('/api/health', (req, res) => {
  res.json({ message: 'EcoTote backend працює' });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = String(name || '').trim();

  if (!trimmedName || !normalizedEmail || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Заповніть усі поля.' });
  }

  if (!isValidName(trimmedName)) {
    return res.status(400).json({
      message: 'Введіть коректне повне ім’я без цифр і спецсимволів.',
    });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({
      message: 'Введіть коректний email.',
    });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      message: 'Пароль має містити щонайменше 6 символів.',
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Паролі не збігаються.' });
  }

  db.get(
    'SELECT id FROM users WHERE email = ?',
    [normalizedEmail],
    (selectError, existingUser) => {
      if (selectError) {
        return sendServerError(res, 'Помилка сервера під час перевірки email.');
      }

      if (existingUser) {
        return res.status(409).json({
          message: 'Користувач з таким email вже існує.',
        });
      }

      db.run(
        `
          INSERT INTO users (name, email, password, role)
          VALUES (?, ?, ?, ?)
        `,
        [trimmedName, normalizedEmail, password, 'client'],
        function (insertError) {
          if (insertError) {
            return sendServerError(res, 'Помилка сервера під час реєстрації.');
          }

          return res.status(201).json({
            message: 'Реєстрація успішна.',
            user: {
              id: this.lastID,
              name: trimmedName,
              email: normalizedEmail,
              role: 'client',
            },
          });
        }
      );
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Введіть email і пароль.' });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: 'Введіть коректний email.' });
  }

  db.get(
    'SELECT id, name, email, password, role FROM users WHERE email = ?',
    [normalizedEmail],
    (selectError, user) => {
      if (selectError) {
        return sendServerError(res, 'Помилка сервера під час входу.');
      }

      if (!user) {
        return res.status(404).json({
          message: 'Користувача з таким email не знайдено.',
        });
      }

      if (user.password !== password) {
        return res.status(401).json({ message: 'Невірний пароль.' });
      }

      return res.json({
        message: 'Вхід виконано успішно.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
  );
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword, confirmNewPassword } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: 'Заповніть усі поля.' });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: 'Введіть коректний email.' });
  }

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      message: 'Новий пароль має містити щонайменше 6 символів.',
    });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'Паролі не збігаються.' });
  }

  db.get(
    'SELECT id FROM users WHERE email = ?',
    [normalizedEmail],
    (selectError, user) => {
      if (selectError) {
        return sendServerError(res, 'Помилка сервера під час перевірки користувача.');
      }

      if (!user) {
        return res.status(404).json({
          message: 'Користувача з таким email не знайдено.',
        });
      }

      db.run(
        'UPDATE users SET password = ? WHERE email = ?',
        [newPassword, normalizedEmail],
        updateError => {
          if (updateError) {
            return sendServerError(res, 'Помилка сервера під час зміни пароля.');
          }

          return res.json({ message: 'Пароль успішно змінено.' });
        }
      );
    }
  );
});

app.get('/api/users', (req, res) => {
  db.all(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC',
    [],
    (selectError, users) => {
      if (selectError) {
        return sendServerError(res, 'Помилка отримання користувачів.');
      }

      return res.json(users);
    }
  );
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    `
      SELECT id, name, email, role, phone, city, address, created_at
      FROM users
      WHERE id = ?
    `,
    [id],
    (selectError, user) => {
      if (selectError) {
        return sendServerError(res, 'Помилка сервера під час отримання профілю.');
      }

      if (!user) {
        return res.status(404).json({ message: 'Користувача не знайдено.' });
      }

      return res.json(user);
    }
  );
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, city, address } = req.body;

  const trimmedName = String(name || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const trimmedPhone = String(phone || '').trim();
  const trimmedCity = String(city || '').trim();
  const trimmedAddress = String(address || '').trim();

  if (!isValidName(trimmedName)) {
    return res.status(400).json({
      message: 'Введіть коректне повне ім’я без цифр і спецсимволів.',
    });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: 'Введіть коректний email.' });
  }

  if (trimmedPhone && !isValidPhone(trimmedPhone)) {
    return res.status(400).json({
      message: 'Введіть телефон у форматі +380501234567.',
    });
  }

  if (trimmedCity && !isValidCity(trimmedCity)) {
    return res.status(400).json({
      message: 'Введіть коректну назву міста.',
    });
  }

  if (!isValidAddress(trimmedAddress)) {
    return res.status(400).json({
      message: 'Введіть коректну адресу від 5 до 120 символів.',
    });
  }

  db.get(
    'SELECT id FROM users WHERE email = ? AND id != ?',
    [normalizedEmail, id],
    (selectError, existingUser) => {
      if (selectError) {
        return sendServerError(res, 'Помилка сервера під час перевірки email.');
      }

      if (existingUser) {
        return res.status(409).json({
          message: 'Користувач з таким email вже існує.',
        });
      }

      db.run(
        `
          UPDATE users
          SET name = ?, email = ?, phone = ?, city = ?, address = ?
          WHERE id = ?
        `,
        [trimmedName, normalizedEmail, trimmedPhone, trimmedCity, trimmedAddress, id],
        function (updateError) {
          if (updateError) {
            return sendServerError(res, 'Помилка сервера під час оновлення профілю.');
          }

          if (this.changes === 0) {
            return res.status(404).json({ message: 'Користувача не знайдено.' });
          }

          return res.json({
            message: 'Профіль успішно оновлено.',
            user: {
              id: Number(id),
              name: trimmedName,
              email: normalizedEmail,
              phone: trimmedPhone,
              city: trimmedCity,
              address: trimmedAddress,
            },
          });
        }
      );
    }
  );
});

app.get('/api/users/:id/orders', (req, res) => {
  const { id } = req.params;

  db.all(
    `
      SELECT
        id,
        order_number,
        client_name,
        email,
        phone,
        city,
        address,
        payment_method,
        order_status,
        total,
        created_at
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    [id],
    (ordersError, orders) => {
      if (ordersError) {
        return sendServerError(res, 'Помилка отримання історії замовлень.');
      }

      if (orders.length === 0) {
        return res.json([]);
      }

      const orderIds = orders.map(order => order.id);
      const placeholders = orderIds.map(() => '?').join(',');

      db.all(
        `
          SELECT id, order_id, product_name, category, quantity, price, image
          FROM order_items
          WHERE order_id IN (${placeholders})
        `,
        orderIds,
        (itemsError, items) => {
          if (itemsError) {
            return sendServerError(res, 'Помилка отримання товарів замовлення.');
          }

          const result = orders.map(order => ({
            ...order,
            items: items.filter(item => item.order_id === order.id),
          }));

          return res.json(result);
        }
      );
    }
  );
});

app.post('/api/orders', (req, res) => {
  const {
    userId,
    clientName,
    email,
    phone,
    city,
    address,
    paymentMethod,
    total,
    items,
  } = req.body;

  const trimmedClientName = String(clientName || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const trimmedPhone = String(phone || '').trim();
  const trimmedCity = String(city || '').trim();
  const trimmedAddress = String(address || '').trim();

  if (
    !isValidName(trimmedClientName) ||
    !isValidEmail(normalizedEmail) ||
    !isValidPhone(trimmedPhone) ||
    !isValidCity(trimmedCity) ||
    !isValidAddress(trimmedAddress) ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      message: 'Перевірте контактні дані та товари в кошику.',
    });
  }

  const invalidItem = items.find(item => {
    return !item.name || !item.price || Number(item.quantity) <= 0;
  });

  if (invalidItem) {
    return res.status(400).json({
      message: 'У замовленні є некоректний товар.',
    });
  }

  createOrderNumber((numberError, orderNumber) => {
    if (numberError) {
      return sendServerError(res, 'Помилка створення номера замовлення.');
    }

    db.run(
      `
        INSERT INTO orders (
          user_id,
          order_number,
          client_name,
          email,
          phone,
          city,
          address,
          payment_method,
          order_status,
          total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId || null,
        orderNumber,
        trimmedClientName,
        normalizedEmail,
        trimmedPhone,
        trimmedCity,
        trimmedAddress,
        paymentMethod || 'Оплата при отриманні',
        'Нове',
        Number(total) || 0,
      ],
      function (orderError) {
        if (orderError) {
          return sendServerError(res, 'Помилка створення замовлення.');
        }

        const orderId = this.lastID;
        const insertItemStatement = db.prepare(`
          INSERT INTO order_items (
            order_id,
            product_name,
            category,
            quantity,
            price,
            image
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        items.forEach(item => {
          insertItemStatement.run([
            orderId,
            String(item.name || '').trim(),
            item.category || '',
            Number(item.quantity) || 1,
            getPriceNumber(item.price),
            item.image || '',
          ]);
        });

        insertItemStatement.finalize(finalizeError => {
          if (finalizeError) {
            return sendServerError(res, 'Помилка збереження товарів замовлення.');
          }

          return res.status(201).json({
            message: 'Замовлення успішно створено.',
            order: {
              id: orderId,
              orderNumber,
              status: 'Нове',
            },
          });
        });
      }
    );
  });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      message: 'Некоректний статус замовлення.',
    });
  }

  const isOrderNumber = String(id).startsWith('#');

  const query = isOrderNumber
    ? 'UPDATE orders SET order_status = ? WHERE order_number = ?'
    : 'UPDATE orders SET order_status = ? WHERE id = ?';

  db.run(query, [status, id], function (updateError) {
    if (updateError) {
      return sendServerError(res, 'Помилка сервера під час оновлення статусу замовлення.');
    }

    if (this.changes === 0) {
      return res.status(404).json({
        message: 'Замовлення не знайдено в базі даних.',
      });
    }

    return res.json({
      message: 'Статус замовлення оновлено.',
      orderId: id,
      status,
    });
  });
});

app.post('/api/support-requests', (req, res) => {
  const { userId, name, email, message } = req.body;

  const trimmedName = String(name || '').trim();
  const normalizedEmail = normalizeEmail(email);
  const trimmedMessage = String(message || '').trim();

  if (!isValidName(trimmedName)) {
    return res.status(400).json({ message: 'Введіть коректне ім’я.' });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: 'Введіть коректний email.' });
  }

  if (!isValidMessage(trimmedMessage)) {
    return res.status(400).json({
      message: 'Повідомлення має містити від 5 до 500 символів.',
    });
  }

  db.run(
    `
      INSERT INTO support_requests (user_id, name, email, message, status)
      VALUES (?, ?, ?, ?, ?)
    `,
    [userId || null, trimmedName, normalizedEmail, trimmedMessage, 'Нове'],
    function (insertError) {
      if (insertError) {
        return sendServerError(res, 'Помилка сервера під час надсилання звернення.');
      }

      return res.status(201).json({
        message: 'Звернення успішно надіслано.',
        request: {
          id: this.lastID,
          status: 'Нове',
        },
      });
    }
  );
});

app.get('/api/support-requests', (req, res) => {
  db.all(
    `
      SELECT
        id,
        user_id,
        name,
        email,
        message,
        answer,
        status,
        created_at,
        answered_at
      FROM support_requests
      ORDER BY created_at DESC
    `,
    [],
    (selectError, requests) => {
      if (selectError) {
        return sendServerError(res, 'Помилка отримання звернень.');
      }

      return res.json(requests);
    }
  );
});

app.get('/api/users/:id/support-requests', (req, res) => {
  const { id } = req.params;

  db.all(
    `
      SELECT
        id,
        user_id,
        name,
        email,
        message,
        answer,
        status,
        created_at,
        answered_at
      FROM support_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    [id],
    (selectError, requests) => {
      if (selectError) {
        return sendServerError(res, 'Помилка отримання звернень користувача.');
      }

      return res.json(requests);
    }
  );
});

app.put('/api/support-requests/:id/reply', (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;
  const trimmedAnswer = String(answer || '').trim();

  if (!trimmedAnswer) {
    return res.status(400).json({
      message: 'Введіть відповідь на звернення.',
    });
  }

  db.run(
    `
      UPDATE support_requests
      SET answer = ?, status = ?, answered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [trimmedAnswer, 'Опрацьовано', id],
    function (updateError) {
      if (updateError) {
        return sendServerError(res, 'Помилка сервера під час збереження відповіді.');
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Звернення не знайдено.' });
      }

      return res.json({
        message: 'Відповідь успішно збережено.',
        id,
        status: 'Опрацьовано',
      });
    }
  );
});

app.post('/api/admin-logs', (req, res) => {
  const { adminId, adminName, adminEmail, action, details } = req.body;
  const trimmedAction = String(action || '').trim();

  if (!trimmedAction) {
    return res.status(400).json({
      message: 'Дію адміністратора не вказано.',
    });
  }

  db.run(
    `
      INSERT INTO admin_logs (
        admin_id,
        admin_name,
        admin_email,
        action,
        details
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      adminId || null,
      adminName || 'Адміністратор',
      normalizeEmail(adminEmail),
      trimmedAction,
      details || '',
    ],
    function (insertError) {
      if (insertError) {
        return sendServerError(res, 'Помилка збереження журналу дій.');
      }

      return res.status(201).json({
        message: 'Дію адміністратора записано.',
        logId: this.lastID,
      });
    }
  );
});

app.get('/api/admin-logs', (req, res) => {
  db.all(
    `
      SELECT
        id,
        admin_id,
        admin_name,
        admin_email,
        action,
        details,
        created_at
      FROM admin_logs
      ORDER BY created_at DESC
    `,
    [],
    (selectError, logs) => {
      if (selectError) {
        return sendServerError(res, 'Помилка отримання журналу дій.');
      }

      return res.json(logs);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});
