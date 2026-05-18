document.addEventListener('DOMContentLoaded', () => {
  const PRODUCTS_KEY = 'ecotote-admin-products';
  const CATEGORIES_KEY = 'ecotote-admin-categories';
  const ORDERS_KEY = 'ecotote-admin-orders';
  const CURRENT_USER_KEY = 'ecotote-current-user';
  const API_URL = 'http://localhost:3000/api';

  const menuButtons = document.querySelectorAll('.admin-menu-btn');
  const sections = document.querySelectorAll('.admin-section');

  const productsTable = document.querySelector('#productsTable');
  const categoriesTable = document.querySelector('#categoriesTable');
  const ordersTable = document.querySelector('#ordersTable');
  const adminLogsTable = document.querySelector('#adminLogsTable');

  const productSearch = document.querySelector('#productSearch');
  const productCategoryFilter = document.querySelector('#productCategoryFilter');
  const productStatusFilter = document.querySelector('#productStatusFilter');

  const categorySearch = document.querySelector('#categorySearch');

  const orderSearch = document.querySelector('#orderSearch');
  const orderStatusFilter = document.querySelector('#orderStatusFilter');

  const productModal = document.querySelector('#productModal');
  const categoryModal = document.querySelector('#categoryModal');

  const openProductModalBtn = document.querySelector('#openProductModal');
  const openCategoryModalBtn = document.querySelector('#openCategoryModal');

  const productForm = document.querySelector('#productForm');
  const categoryForm = document.querySelector('#categoryForm');

  const exportOrdersBtn = document.querySelector('#exportOrdersBtn');
  const supportRequestsTable = document.querySelector('#supportRequestsTable');

  const defaultCategories = [
    {
      id: crypto.randomUUID(),
      name: 'Сумки-шопери',
      description: 'Екологічні сумки-шопери для щоденного використання.',
      status: 'Активна',
    },
    {
      id: crypto.randomUUID(),
      name: 'Рюкзаки',
      description: 'Зручні та міцні рюкзаки для міста та подорожей.',
      status: 'Активна',
    },
    {
      id: crypto.randomUUID(),
      name: 'Сумки через плече',
      description: 'Компактні сумки через плече для активного способу життя.',
      status: 'Активна',
    },
    {
      id: crypto.randomUUID(),
      name: 'Дорожні сумки',
      description: 'Місткі та практичні сумки для подорожей.',
      status: 'Активна',
    },
  ];

  const defaultProducts = [
    {
      id: crypto.randomUUID(),
      name: 'EcoBag Classic',
      description: 'Елегантна та містка сумка для щоденного використання.',
      category: 'Сумки-шопери',
      price: 1000,
      stock: 45,
      status: 'Активний',
      image: '/img/assortment-img/assortement-bag1-mob.webp',
    },
    {
      id: crypto.randomUUID(),
      name: 'EcoTote Shopper',
      description: 'Ідеальна для покупок, з посиленими ручками.',
      category: 'Сумки-шопери',
      price: 1200,
      stock: 30,
      status: 'Активний',
      image: '/img/assortment-img/assortement-bag2-mob.webp',
    },
    {
      id: crypto.randomUUID(),
      name: 'EcoBackpack Urban',
      description: 'Зручний рюкзак для міста з відділенням для ноутбука.',
      category: 'Рюкзаки',
      price: 1700,
      stock: 22,
      status: 'Активний',
      image: '/img/assortment-img/assortement-bag3-mob.webp',
    },
  ];

  const defaultOrders = [
    {
      id: '#1024',
      client: 'Олена Ковальчук',
      phone: '+380 67 123 45 67',
      date: '24.05.2024 10:15',
      total: 1200,
      status: 'Нове',
      payment: 'Післяплата',
    },
    {
      id: '#1025',
      client: 'Максим Шевченко',
      phone: '+380 50 987 65 43',
      date: '24.05.2024 12:42',
      total: 2450,
      status: 'В обробці',
      payment: 'Оплачено',
    },
    {
      id: '#1026',
      client: 'Ірина Петренко',
      phone: '+380 93 456 78 90',
      date: '23.05.2024 16:30',
      total: 870,
      status: 'Відправлено',
      payment: 'Оплачено',
    },
  ];


const currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));

if (!currentUser) {
  window.location.href = './auth.html';
  return;
}

if (currentUser.role !== 'admin') {
  alert('Доступ до адміністративної панелі дозволено лише адміністратору.');
  window.location.href = './index.html';
  return;
}

  function getData(key, defaultValue) {
    const data = localStorage.getItem(key);

    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }

    return JSON.parse(data);
  }

  function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function getProducts() {
    return getData(PRODUCTS_KEY, defaultProducts);
  }

  function getCategories() {
    return getData(CATEGORIES_KEY, defaultCategories);
  }

  function getOrders() {
    return getData(ORDERS_KEY, defaultOrders);
  }

  function saveProducts(products) {
    saveData(PRODUCTS_KEY, products);
  }

  function saveCategories(categories) {
    saveData(CATEGORIES_KEY, categories);
  }

  function saveOrders(orders) {
    saveData(ORDERS_KEY, orders);
  }

  function formatPrice(value) {
    return `₴${Number(value).toFixed(2)}`;
  }

  function getStatusClass(status) {
    if (status === 'Активний' || status === 'Активна') {
      return 'status-active';
    }

    if (status === 'Неактивний' || status === 'Неактивна') {
      return 'status-inactive';
    }

    return '';
  }

  function formatAdminDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function getSupportRequests() {
  const response = await fetch(`${API_URL}/support-requests`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Не вдалося отримати звернення.');
  }

  return data;
}

function createSupportRequestMarkup(request) {
  return `
    <tr>
      <td>
        <strong>${request.name}</strong>
      </td>

      <td>${request.email}</td>

      <td>
        <span>${request.message}</span>
      </td>

      <td>
        <textarea
          class="admin-support-answer"
          data-id="${request.id}"
          placeholder="Введіть відповідь"
        >${request.answer || ''}</textarea>
      </td>

      <td>
        <span class="status-badge">
          ${request.status}
        </span>
      </td>

      <td>${formatAdminDate(request.created_at)}</td>

      <td>
        <button
          class="admin-action-btn"
          type="button"
          data-action="reply-support"
          data-id="${request.id}"
        >
          Відповісти
        </button>
      </td>
    </tr>
  `;
}

async function renderSupportRequests() {
  if (!supportRequestsTable) return;

  try {
    const requests = await getSupportRequests();

    if (requests.length === 0) {
      supportRequestsTable.innerHTML = `
        <tr>
          <td colspan="7">Звернень поки немає.</td>
        </tr>
      `;
      return;
    }

    supportRequestsTable.innerHTML = requests
      .map(createSupportRequestMarkup)
      .join('');
  } catch (error) {
    supportRequestsTable.innerHTML = `
      <tr>
        <td colspan="7">${error.message}</td>
      </tr>
    `;
  }
}

  function renderCategoryOptions() {
    const categories = getCategories();

    productCategoryFilter.innerHTML = `<option value="all">Категорія: Усі</option>`;

    document.querySelector('#productCategory').innerHTML = '';

    categories.forEach(category => {
      productCategoryFilter.insertAdjacentHTML(
        'beforeend',
        `<option value="${category.name}">${category.name}</option>`
      );

      document.querySelector('#productCategory').insertAdjacentHTML(
        'beforeend',
        `<option value="${category.name}">${category.name}</option>`
      );
    });
  }

  function renderProducts() {
    const products = getProducts();

    const searchValue = productSearch.value.toLowerCase().trim();
    const categoryValue = productCategoryFilter.value;
    const statusValue = productStatusFilter.value;

    const filteredProducts = products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchValue) ||
        product.description.toLowerCase().includes(searchValue);

      const matchesCategory =
        categoryValue === 'all' || product.category === categoryValue;

      const matchesStatus = statusValue === 'all' || product.status === statusValue;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    productsTable.innerHTML = filteredProducts
      .map(product => {
        return `
          <tr>
            <td>
              <img
                class="admin-product-img"
                src="${product.image}"
                alt="${product.name}"
              />
            </td>
            <td>
              <strong>${product.name}</strong>
              <span>${product.description}</span>
            </td>
            <td>${product.category}</td>
            <td>${formatPrice(product.price)}</td>
            <td>${product.stock}</td>
            <td>
              <span class="status-badge ${getStatusClass(product.status)}">
                ${product.status}
              </span>
            </td>
            <td>
              <div class="admin-actions">
                <button
                  class="admin-action-btn"
                  type="button"
                  data-action="edit-product"
                  data-id="${product.id}"
                >
                  ✎
                </button>

                <button
                  class="admin-action-btn"
                  type="button"
                  data-action="delete-product"
                  data-id="${product.id}"
                >
                  🗑
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

 function renderCategories() {
  const categories = getCategories();
  const products = getProducts();

  const searchValue = categorySearch.value.toLowerCase().trim();

  const filteredCategories = categories.filter(category => {
    return (
      category.name.toLowerCase().includes(searchValue) ||
      category.description.toLowerCase().includes(searchValue)
    );
  });

  categoriesTable.innerHTML = filteredCategories
    .map(category => {
      const productsCount = products.filter(
        product => product.category === category.name
      ).length;

      return `
        <tr>
          <td><strong>${category.name}</strong></td>
          <td>${category.description}</td>
          <td>${productsCount}</td>
          <td>
            <div class="admin-actions">
              <button
                class="admin-action-btn"
                type="button"
                data-action="edit-category"
                data-id="${category.id}"
              >
                ✎
              </button>

              <button
                class="admin-action-btn"
                type="button"
                data-action="delete-category"
                data-id="${category.id}"
              >
                🗑
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

  function renderOrders() {
    const orders = getOrders();

    const searchValue = orderSearch.value.toLowerCase().trim();
    const statusValue = orderStatusFilter.value;

    const filteredOrders = orders.filter(order => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchValue) ||
        order.client.toLowerCase().includes(searchValue) ||
        order.phone.toLowerCase().includes(searchValue);

      const matchesStatus = statusValue === 'all' || order.status === statusValue;

      return matchesSearch && matchesStatus;
    });

    ordersTable.innerHTML = filteredOrders
      .map(order => {
        return `
          <tr>
            <td>${order.id}</td>
            <td>
              <strong>${order.client}</strong>
              <span>${order.phone}</span>
            </td>
            <td>${order.date}</td>
            <td>${formatPrice(order.total)}</td>
            <td>
              <select
                class="order-status-select"
                data-order-id="${order.id}"
              >
                <option value="Нове" ${order.status === 'Нове' ? 'selected' : ''}>
                  Нове
                </option>
                <option value="В обробці" ${order.status === 'В обробці' ? 'selected' : ''}>
                  В обробці
                </option>
                <option value="Відправлено" ${order.status === 'Відправлено' ? 'selected' : ''}>
                  Відправлено
                </option>
                <option value="Доставлено" ${order.status === 'Доставлено' ? 'selected' : ''}>
                  Доставлено
                </option>
              </select>
            </td>
            <td>
              <span class="status-badge">${order.payment}</span>
            </td>
            <td>
              <div class="admin-actions">
                <button
                  class="admin-action-btn"
                  type="button"
                  data-action="view-order"
                  data-id="${order.id}"
                  title="Переглянути замовлення"
                >
                  👁
                </button>

                <button
                  class="admin-action-btn"
                  type="button"
                  data-action="delete-order"
                  data-id="${order.id}"
                  title="Видалити замовлення"
                >
                  🗑
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    renderOrderStats();
  }

  function renderOrderStats() {
    const orders = getOrders();

    document.querySelector('#newOrdersCount').textContent = orders.filter(
      order => order.status === 'Нове'
    ).length;

    document.querySelector('#processingOrdersCount').textContent = orders.filter(
      order => order.status === 'В обробці'
    ).length;

    document.querySelector('#completedOrdersCount').textContent = orders.filter(
      order => order.status === 'Доставлено'
    ).length;
  }

 function renderAll() {
  renderCategoryOptions();
  renderProducts();
  renderCategories();
  renderOrders();
  renderSupportRequests();
  renderAdminLogs();
}

  function openProductModal(product = null) {
    productModal.classList.remove('is-hidden');

    document.querySelector('#productModalTitle').textContent = product
      ? 'Редагувати товар'
      : 'Додати товар';

    document.querySelector('#productId').value = product?.id || '';
    document.querySelector('#productName').value = product?.name || '';
    document.querySelector('#productDescription').value = product?.description || '';
    document.querySelector('#productCategory').value =
      product?.category || getCategories()[0]?.name || '';
    document.querySelector('#productPrice').value = product?.price || '';
    document.querySelector('#productStock').value = product?.stock || '';
    document.querySelector('#productImage').value = product?.image || '';
    document.querySelector('#productStatus').value = product?.status || 'Активний';
  }

  function closeProductModal() {
    productModal.classList.add('is-hidden');
    productForm.reset();
  }

  function openCategoryModal(category = null) {
    categoryModal.classList.remove('is-hidden');

    document.querySelector('#categoryModalTitle').textContent = category
      ? 'Редагувати категорію'
      : 'Додати категорію';

    document.querySelector('#categoryId').value = category?.id || '';
    document.querySelector('#categoryName').value = category?.name || '';
    document.querySelector('#categoryDescription').value =
      category?.description || '';
      }

  function closeCategoryModal() {
    categoryModal.classList.add('is-hidden');
    categoryForm.reset();
  }

  menuButtons.forEach(button => {
    button.addEventListener('click', () => {
      const page = button.dataset.page;

      menuButtons.forEach(item => item.classList.remove('is-active'));
      button.classList.add('is-active');

      sections.forEach(section => {
        section.classList.toggle('is-active', section.dataset.section === page);
      });
    });
  });

  openProductModalBtn.addEventListener('click', () => {
    openProductModal();
  });

  openCategoryModalBtn.addEventListener('click', () => {
    openCategoryModal();
  });

  document
    .querySelector('[data-close-product]')
    .addEventListener('click', closeProductModal);

  document
    .querySelector('[data-close-category]')
    .addEventListener('click', closeCategoryModal);

  productForm.addEventListener('submit', event => {
    event.preventDefault();

    const products = getProducts();
    const productId = document.querySelector('#productId').value;

    const V = window.EcoToteValidation;

const productNameValue = document.querySelector('#productName').value.trim();
const productDescriptionValue = document.querySelector('#productDescription').value.trim();
const productPriceValue = document.querySelector('#productPrice').value.trim();
const productStockValue = document.querySelector('#productStock').value.trim();
const productImageValue = document.querySelector('#productImage').value.trim();

if (!productNameValue) {
  alert('Введіть назву товару.');
  return;
}

if (productNameValue.length < 2 || productNameValue.length > 80) {
  alert('Назва товару має містити від 2 до 80 символів.');
  return;
}

if (!productDescriptionValue || productDescriptionValue.length < 5) {
  alert('Введіть коректний опис товару. Мінімум 5 символів.');
  return;
}

if (!V.isValidPrice(productPriceValue)) {
  alert('Ціна товару має бути додатним числом. Наприклад: 1200.');
  return;
}

if (!V.isValidStock(Number(productStockValue))) {
  alert('Залишок товару має бути цілим числом 0 або більше.');
  return;
}

if (!productImageValue) {
  alert('Вкажіть шлях або URL зображення товару.');
  return;
}

    const productData = {
  id: productId || crypto.randomUUID(),
  name: productNameValue,
  description: productDescriptionValue,
  category: document.querySelector('#productCategory').value,
  price: Number(productPriceValue),
  stock: Number(productStockValue),
  image: productImageValue,
  status: document.querySelector('#productStatus').value,
};

    if (productId) {
  const index = products.findIndex(product => product.id === productId);
  products[index] = productData;

  logAdminAction(
    'Редагування товару',
    `Оновлено товар "${productData.name}"`
  );
} else {
  products.push(productData);

  logAdminAction(
    'Додавання товару',
    `Додано товар "${productData.name}"`
  );
}

saveProducts(products);
closeProductModal();
renderAll();
  });

  categoryForm.addEventListener('submit', event => {
    event.preventDefault();

    const categories = getCategories();
    const categoryId = document.querySelector('#categoryId').value;

    const categoryNameValue = document.querySelector('#categoryName').value.trim();
const categoryDescriptionValue = document.querySelector('#categoryDescription').value.trim();

if (!categoryNameValue || categoryNameValue.length < 2) {
  alert('Введіть коректну назву категорії. Мінімум 2 символи.');
  return;
}

if (!categoryDescriptionValue || categoryDescriptionValue.length < 5) {
  alert('Введіть коректний опис категорії. Мінімум 5 символів.');
  return;
}

    const categoryData = {
  id: categoryId || crypto.randomUUID(),
  name: categoryNameValue,
  description: categoryDescriptionValue,
};

    if (categoryId) {
  const index = categories.findIndex(category => category.id === categoryId);
  categories[index] = categoryData;

  logAdminAction(
    'Редагування категорії',
    `Оновлено категорію "${categoryData.name}"`
  );
} else {
  categories.push(categoryData);

  logAdminAction(
    'Додавання категорії',
    `Додано категорію "${categoryData.name}"`
  );
}

saveCategories(categories);
closeCategoryModal();
renderAll();
  });

  productsTable.addEventListener('click', event => {
    const button = event.target.closest('button');

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    const products = getProducts();

    if (action === 'edit-product') {
      const product = products.find(item => item.id === id);
      openProductModal(product);
    }

    if (action === 'delete-product') {
      const confirmed = confirm('Видалити товар?');

      if (!confirmed) return;

      const deletedProduct = products.find(product => product.id === id);

const updatedProducts = products.filter(product => product.id !== id);
saveProducts(updatedProducts);

logAdminAction(
  'Видалення товару',
  `Видалено товар "${deletedProduct?.name || id}"`
);

renderAll();
    }
  });

  categoriesTable.addEventListener('click', event => {
    const button = event.target.closest('button');

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    const categories = getCategories();
    const products = getProducts();

    if (action === 'edit-category') {
      const category = categories.find(item => item.id === id);
      openCategoryModal(category);
    }

    if (action === 'delete-category') {
      const category = categories.find(item => item.id === id);

      const hasProducts = products.some(product => product.category === category.name);

      if (hasProducts) {
        alert('Неможливо видалити категорію, бо в ній є товари.');
        return;
      }

      const confirmed = confirm('Видалити категорію?');

      if (!confirmed) return;

      const updatedCategories = categories.filter(item => item.id !== id);
saveCategories(updatedCategories);

logAdminAction(
  'Видалення категорії',
  `Видалено категорію "${category?.name || id}"`
);

renderAll();
    }
  });

 ordersTable.addEventListener('change', async event => {
  const select = event.target.closest('.order-status-select');

  if (!select) return;

  const orders = getOrders();
  const orderId = select.dataset.orderId;
  const newStatus = select.value;

  const order = orders.find(item => String(item.id) === String(orderId));

  if (!order) return;

  order.status = newStatus;
  saveOrders(orders);
  renderOrders();

  logAdminAction(
  'Зміна статусу замовлення',
  `Замовлення ${order.id}: статус змінено на "${select.value}"`
);

  try {
    const response = await fetch(
      `${API_URL}/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data.message || 'Не вдалося оновити статус у базі даних.');
      return;
    }

    console.log('Статус замовлення оновлено в SQLite:', data);
  } catch (error) {
    console.error('Помилка оновлення статусу замовлення в SQLite:', error);
  }
});

  function formatOrderPrice(value) {
  return `₴${Number(value).toFixed(2)}`;
}

function getPriceNumber(price) {
  return Number(String(price).replace(/[^\d]/g, '')) || 0;
}

function createOrderDetailsItemMarkup(item) {
  const itemTotal = getPriceNumber(item.price) * Number(item.quantity || 1);

  return `
    <li class="order-details-item">
      <img
        class="order-details-img"
        src="${item.image}"
        alt="${item.name}"
      />

      <div>
        <p class="order-details-name">${item.name}</p>
        <p class="order-details-meta">Категорія: ${item.category || 'Екосумка'}</p>
        <p class="order-details-meta">Кількість: ${item.quantity || 1}</p>
        <p class="order-details-meta">Сума: ${formatOrderPrice(itemTotal)}</p>
      </div>
    </li>
  `;
}

function openOrderModal(order) {
  const orderModal = document.querySelector('#orderModal');

  document.querySelector('#orderDetailsId').textContent = order.id || '-';
  document.querySelector('#orderDetailsClient').textContent = order.client || '-';
  document.querySelector('#orderDetailsEmail').textContent = order.email || '-';
  document.querySelector('#orderDetailsPhone').textContent = order.phone || '-';
  document.querySelector('#orderDetailsCity').textContent = order.city || '-';
  document.querySelector('#orderDetailsAddress').textContent = order.address || '-';
  document.querySelector('#orderDetailsDate').textContent = order.date || '-';
  document.querySelector('#orderDetailsPayment').textContent = order.payment || '-';
  document.querySelector('#orderDetailsStatus').textContent = order.status || '-';
  document.querySelector('#orderDetailsTotal').textContent = formatOrderPrice(
    order.total || 0
  );

  const itemsList = document.querySelector('#orderDetailsItems');
  const items = order.items || [];

  if (items.length === 0) {
    itemsList.innerHTML = '<li>Товари не вказані</li>';
  } else {
    itemsList.innerHTML = items.map(createOrderDetailsItemMarkup).join('');
  }

  orderModal.classList.remove('is-hidden');
}

 ordersTable.addEventListener('click', event => {
  const button = event.target.closest('button');

  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === 'view-order') {
    const order = getOrders().find(item => item.id === id);

    if (!order) {
      alert('Замовлення не знайдено');
      return;
    }

    openOrderModal(order);
  }

  if (action === 'delete-order') {
    const confirmed = confirm('Видалити замовлення?');

    if (!confirmed) return;

    const deletedOrder = getOrders().find(order => order.id === id);

const orders = getOrders().filter(order => order.id !== id);
saveOrders(orders);

logAdminAction(
  'Видалення замовлення',
  `Видалено замовлення ${deletedOrder?.id || id}`
);

renderOrders();
  }
});

  productSearch.addEventListener('input', renderProducts);
  productCategoryFilter.addEventListener('change', renderProducts);
  productStatusFilter.addEventListener('change', renderProducts);

  categorySearch.addEventListener('input', renderCategories);
  
  orderSearch.addEventListener('input', renderOrders);
  orderStatusFilter.addEventListener('change', renderOrders);

  exportOrdersBtn.addEventListener('click', () => {
    const orders = getOrders();

    const csvRows = [
      ['Номер', 'Клієнт', 'Телефон', 'Дата', 'Сума', 'Статус', 'Оплата'],
      ...orders.map(order => [
        order.id,
        order.client,
        order.phone,
        order.date,
        order.total,
        order.status,
        order.payment,
      ]),
    ];

    const csv = csvRows.map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ecotote-orders.csv';
    link.click();

    URL.revokeObjectURL(link.href);

    logAdminAction(
  'Експорт замовлень',
  'Адміністратор експортував список замовлень у CSV'
);
  });

  const orderModal = document.querySelector('#orderModal');
const closeOrderModalBtn = document.querySelector('[data-close-order]');

if (closeOrderModalBtn) {
  closeOrderModalBtn.addEventListener('click', () => {
    orderModal.classList.add('is-hidden');
  });
}

if (orderModal) {
  orderModal.addEventListener('click', event => {
    if (event.target === orderModal) {
      orderModal.classList.add('is-hidden');
    }
  });
}

const logoutBtn = document.querySelector('#logoutBtn');

if (logoutBtn) {
  logoutBtn.addEventListener('click', event => {
    event.preventDefault();

    localStorage.removeItem('ecotote-current-user');

    window.location.href = './index.html';
  });
}
if (supportRequestsTable) {
  supportRequestsTable.addEventListener('click', async event => {
    const button = event.target.closest('button');

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action !== 'reply-support') return;

    const answerInput = supportRequestsTable.querySelector(
      `.admin-support-answer[data-id="${id}"]`
    );

    const answer = answerInput?.value.trim();

    if (!answer) {
      alert('Введіть відповідь на звернення.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/support-requests/${id}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Не вдалося зберегти відповідь.');
        return;
      }

      alert(data.message);
      renderSupportRequests();
    } catch (error) {
      console.error('Помилка відповіді на звернення:', error);
      alert('Помилка відповіді на звернення.');
    }
  });
}

function getCurrentAdmin() {
  return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
}

async function logAdminAction(action, details = '') {
  const admin = getCurrentAdmin();

  if (!admin || admin.role !== 'admin') {
    return;
  }

  try {
    await fetch(`${API_URL}/admin-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminId: admin.id,
        adminName: admin.name,
        adminEmail: admin.email,
        action,
        details,
      }),
    });
  } catch (error) {
    console.error('Помилка запису журналу дій:', error);
  }
}

function formatLogDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createAdminLogMarkup(log) {
  return `
    <tr>
      <td>${log.admin_name || 'Адміністратор'}</td>
      <td>${log.admin_email || '-'}</td>
      <td>
        <span class="status-badge">
          ${log.action}
        </span>
      </td>
      <td>${log.details || '-'}</td>
      <td>${formatLogDate(log.created_at)}</td>
    </tr>
  `;
}

async function renderAdminLogs() {
  if (!adminLogsTable) return;

  try {
    const response = await fetch(`${API_URL}/admin-logs`);
    const logs = await response.json();

    if (!response.ok) {
      throw new Error(logs.message || 'Не вдалося завантажити журнал дій.');
    }

    if (logs.length === 0) {
      adminLogsTable.innerHTML = `
        <tr>
          <td colspan="5">Журнал дій поки порожній.</td>
        </tr>
      `;
      return;
    }

    adminLogsTable.innerHTML = logs.map(createAdminLogMarkup).join('');
  } catch (error) {
    adminLogsTable.innerHTML = `
      <tr>
        <td colspan="5">${error.message}</td>
      </tr>
    `;
  }
}

  renderAll();
});

