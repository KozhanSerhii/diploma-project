document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000/api';
  const CURRENT_USER_KEY = 'ecotote-current-user';

  const currentUserCheck = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));

  if (!currentUserCheck) {
    window.location.href = './auth.html';
    return;
  }

  if (currentUserCheck.role === 'admin') {
    window.location.href = './admin.html';
    return;
  }

  const menuButtons = document.querySelectorAll('.profile-menu-btn');
  const sections = document.querySelectorAll('.profile-section');

  const profileForm = document.querySelector('#profileForm');
  const profileMessage = document.querySelector('#profileMessage');

  const profileUserName = document.querySelector('#profileUserName');

  const nameInput = document.querySelector('#profileName');
  const emailInput = document.querySelector('#profileEmail');
  const phoneInput = document.querySelector('#profilePhone');
  const cityInput = document.querySelector('#profileCity');
  const addressInput = document.querySelector('#profileAddress');

  const ordersList = document.querySelector('#profileOrdersList');
  const supportList = document.querySelector('#profileSupportList');
  const logoutBtn = document.querySelector('#logoutBtn');

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  }

  function saveCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  function showMessage(text, type = 'error') {
    if (!profileMessage) return;

    profileMessage.textContent = text;
    profileMessage.classList.remove('is-error', 'is-success');

    if (type === 'success') {
      profileMessage.classList.add('is-success');
    } else {
      profileMessage.classList.add('is-error');
    }
  }

  function getValidation() {
    if (!window.EcoToteValidation) {
      alert('Файл validation.js не підключено перед profile.js.');
      return null;
    }

    return window.EcoToteValidation;
  }

  function formatPrice(value) {
    return `₴${Number(value).toFixed(2)}`;
  }

  function formatDate(value) {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function setActiveSection(page) {
    menuButtons.forEach(button => {
      button.classList.toggle('is-active', button.dataset.page === page);
    });

    sections.forEach(section => {
      section.classList.toggle('is-active', section.dataset.section === page);
    });

    if (page === 'orders') {
      loadOrders();
    }

    if (page === 'support') {
      loadSupportRequests();
    }
  }

  menuButtons.forEach(button => {
    button.addEventListener('click', () => {
      setActiveSection(button.dataset.page);
    });
  });

  async function loadProfile() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      window.location.href = './auth.html';
      return;
    }

    if (currentUser.role === 'admin') {
      window.location.href = './admin.html';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${currentUser.id}`);
      const user = await response.json();

      if (!response.ok) {
        throw new Error(user.message || 'Не вдалося завантажити профіль.');
      }

      nameInput.value = user.name || '';
      emailInput.value = user.email || '';
      phoneInput.value = user.phone || '';
      cityInput.value = user.city || '';
      addressInput.value = user.address || '';

      if (profileUserName) {
        profileUserName.textContent = user.name || 'Клієнт';
      }
    } catch (error) {
      showMessage(error.message, 'error');
    }
  }

  if (profileForm) {
    profileForm.addEventListener('submit', async event => {
      event.preventDefault();

      const currentUser = getCurrentUser();

      if (!currentUser) {
        window.location.href = './auth.html';
        return;
      }

      if (currentUser.role === 'admin') {
        window.location.href = './admin.html';
        return;
      }

      const V = getValidation();

      if (!V) return;

      const name = nameInput.value.trim();
      const email = emailInput.value.trim().toLowerCase();
      const phone = phoneInput.value.trim();
      const city = cityInput.value.trim();
      const address = addressInput.value.trim();

      if (!V.isValidName(name)) {
        showMessage(
          'Введіть коректне повне ім’я. Ім’я має містити мінімум 2 літери і не може містити цифри або спецсимволи.',
          'error'
        );
        return;
      }

      if (!V.isValidEmail(email)) {
        showMessage(
          'Введіть коректний email. Наприклад: client@test.com.',
          'error'
        );
        return;
      }

      if (phone && !V.isValidPhone(phone)) {
        showMessage(
          'Введіть телефон у форматі +380501234567.',
          'error'
        );
        return;
      }

      if (city && !V.isValidCity(city)) {
        showMessage(
          'Введіть коректну назву міста. Місто не може містити цифри або спецсимволи.',
          'error'
        );
        return;
      }

      if (!V.isValidAddress(address)) {
        showMessage(
          'Введіть коректну адресу. Адреса має містити від 5 до 120 символів.',
          'error'
        );
        return;
      }

      const updatedProfile = {
        name,
        email,
        phone,
        city,
        address,
      };

      try {
        const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedProfile),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Не вдалося оновити профіль.');
        }

        saveCurrentUser({
          ...currentUser,
          name: data.user.name,
          email: data.user.email,
        });

        if (profileUserName) {
          profileUserName.textContent = data.user.name;
        }

        showMessage(data.message, 'success');
      } catch (error) {
        showMessage(error.message, 'error');
      }
    });
  }

  function createOrderItemMarkup(item) {
    return `
      <div class="profile-order-item">
        <img
          class="profile-order-img"
          src="${item.image || '/img/placeholder.png'}"
          alt="${item.product_name}"
        />

        <div>
          <p class="profile-order-item-name">${item.product_name}</p>
          <p class="profile-order-item-meta">Категорія: ${item.category || 'Екосумка'}</p>
          <p class="profile-order-item-meta">Кількість: ${item.quantity}</p>
          <p class="profile-order-item-meta">Ціна: ${formatPrice(item.price)}</p>
        </div>
      </div>
    `;
  }

  function createOrderMarkup(order) {
    return `
      <article class="profile-order-card">
        <div class="profile-order-head">
          <div>
            <h2 class="profile-order-number">Замовлення ${order.order_number}</h2>
            <p class="profile-order-date">${formatDate(order.created_at)}</p>
          </div>

          <span class="profile-order-status">${order.order_status}</span>
        </div>

        <div class="profile-order-info">
          <p><strong>Отримувач:</strong> ${order.client_name}</p>
          <p><strong>Email:</strong> ${order.email}</p>
          <p><strong>Телефон:</strong> ${order.phone || '-'}</p>
          <p><strong>Місто:</strong> ${order.city || '-'}</p>
          <p><strong>Адреса:</strong> ${order.address || '-'}</p>
          <p><strong>Оплата:</strong> ${order.payment_method || '-'}</p>
        </div>

        <div class="profile-order-items">
          ${order.items.map(createOrderItemMarkup).join('')}
        </div>

        <div class="profile-order-total">
          <span>Усього</span>
          <span>${formatPrice(order.total)}</span>
        </div>
      </article>
    `;
  }

  async function loadOrders() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      window.location.href = './auth.html';
      return;
    }

    if (currentUser.role === 'admin') {
      window.location.href = './admin.html';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${currentUser.id}/orders`);
      const orders = await response.json();

      if (!response.ok) {
        throw new Error(orders.message || 'Не вдалося завантажити замовлення.');
      }

      if (orders.length === 0) {
        ordersList.innerHTML = `
          <div class="profile-empty">
            У вас ще немає замовлень.
          </div>
        `;
        return;
      }

      ordersList.innerHTML = orders.map(createOrderMarkup).join('');
    } catch (error) {
      ordersList.innerHTML = `
        <div class="profile-empty">
          ${error.message}
        </div>
      `;
    }
  }

  function createSupportRequestProfileMarkup(request) {
    return `
      <article class="profile-order-card">
        <div class="profile-order-head">
          <div>
            <h2 class="profile-order-number">Звернення №${request.id}</h2>
            <p class="profile-order-date">${formatDate(request.created_at)}</p>
          </div>

          <span class="profile-order-status">${request.status}</span>
        </div>

        <div class="profile-order-info">
          <p><strong>Ваше повідомлення:</strong></p>
          <p>${request.message}</p>
        </div>

        <div class="profile-order-info">
          <p><strong>Відповідь адміністратора:</strong></p>
          <p>${request.answer || 'Відповідь ще не надано.'}</p>
        </div>
      </article>
    `;
  }

  async function loadSupportRequests() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      window.location.href = './auth.html';
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/users/${currentUser.id}/support-requests`
      );

      const requests = await response.json();

      if (!response.ok) {
        throw new Error(requests.message || 'Не вдалося завантажити звернення.');
      }

      if (requests.length === 0) {
        supportList.innerHTML = `
          <div class="profile-empty">
            У вас ще немає звернень до служби підтримки.
          </div>
        `;
        return;
      }

      supportList.innerHTML = requests
        .map(createSupportRequestProfileMarkup)
        .join('');
    } catch (error) {
      supportList.innerHTML = `
        <div class="profile-empty">
          ${error.message}
        </div>
      `;
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(CURRENT_USER_KEY);
      window.location.href = './index.html';
    });
  }

  loadProfile();

  const params = new URLSearchParams(window.location.search);

  if (params.get('tab') === 'orders') {
    setActiveSection('orders');
  }

  if (params.get('tab') === 'support') {
    setActiveSection('support');
  }
});