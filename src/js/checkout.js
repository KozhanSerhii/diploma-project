document.addEventListener('DOMContentLoaded', () => {
  const CART_KEY = 'ecotote-cart';
  const ORDERS_KEY = 'ecotote-admin-orders';
  const API_URL = 'http://localhost:3000/api';
  const CURRENT_USER_KEY = 'ecotote-current-user';
  const DELIVERY_PRICE = 100;

  const checkoutForm = document.querySelector('#checkoutForm');

  const orderList = document.querySelector('.checkout-order-list');
  const subtotalEl = document.querySelector('.checkout-subtotal');
  const deliveryEl = document.querySelector('.checkout-delivery');
  const totalEl = document.querySelector('.checkout-total');

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  }

  function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  }

  function getOrders() {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  }

  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function getPriceNumber(price) {
    return Number(String(price).replace(/[^\d]/g, '')) || 0;
  }

  function formatPrice(value) {
    return `₴${Number(value).toFixed(2)}`;
  }

  function calculateSubtotal(cart) {
    return cart.reduce((sum, item) => {
      return sum + getPriceNumber(item.price) * Number(item.quantity);
    }, 0);
  }

  function calculateTotal(cart) {
    if (cart.length === 0) {
      return 0;
    }

    return calculateSubtotal(cart) + DELIVERY_PRICE;
  }

  function validateCart(cart) {
    const invalidItem = cart.find(item => {
      return !item.name || !item.price || Number(item.quantity) <= 0;
    });

    if (invalidItem) {
      alert('У кошику є некоректний товар. Оновіть кошик.');
      return false;
    }

    const unavailableItem = cart.find(item => {
      const stock = Number(item.stock);

      return (
        (!Number.isNaN(stock) && stock <= 0) ||
        item.status === 'Неактивний'
      );
    });

    if (unavailableItem) {
      alert(`Товар "${unavailableItem.name}" відсутній у наявності. Видаліть його з кошика.`);
      return false;
    }

    const overStockItem = cart.find(item => {
      const stock = Number(item.stock);

      return !Number.isNaN(stock) && Number(item.quantity) > stock;
    });

    if (overStockItem) {
      alert(
        `Кількість товару "${overStockItem.name}" перевищує залишок на складі. Доступно: ${overStockItem.stock} шт.`
      );
      return false;
    }

    return true;
  }

  async function fillCheckoutUserData() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      return;
    }

    if (currentUser.role === 'admin') {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${currentUser.id}`);
      const user = await response.json();

      if (!response.ok) {
        console.error(user.message || 'Не вдалося завантажити дані профілю.');
        return;
      }

      const nameInput = document.querySelector('[name="name"]');
      const emailInput = document.querySelector('[name="email"]');
      const phoneInput = document.querySelector('[name="phone"]');
      const cityInput = document.querySelector('[name="city"]');
      const addressInput = document.querySelector('[name="address"]');

      if (nameInput) nameInput.value = user.name || '';
      if (emailInput) emailInput.value = user.email || '';
      if (phoneInput) phoneInput.value = user.phone || '';
      if (cityInput) cityInput.value = user.city || '';
      if (addressInput) addressInput.value = user.address || '';
    } catch (error) {
      console.error('Помилка автозаповнення даних користувача:', error);
    }
  }

  function createOrderId() {
    const orders = getOrders();

    if (orders.length === 0) {
      return '#1024';
    }

    const maxOrderNumber = Math.max(
      ...orders.map(order => {
        return Number(String(order.id).replace(/[^\d]/g, '')) || 1023;
      })
    );

    return `#${maxOrderNumber + 1}`;
  }

  function getCurrentDateTime() {
    const now = new Date();

    const date = now.toLocaleDateString('uk-UA');
    const time = now.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${date} ${time}`;
  }

  function createOrderItemMarkup(item) {
    return `
      <div class="checkout-order-item">
        <img
          class="checkout-order-img"
          src="${item.image}"
          alt="${item.name}"
        />

        <div class="checkout-order-info">
          <h3 class="checkout-order-name">${item.name}</h3>
          <p class="checkout-order-quantity">Кількість: ${item.quantity}</p>
          <p class="checkout-order-price">
            ${formatPrice(getPriceNumber(item.price) * item.quantity)}
          </p>
        </div>
      </div>
    `;
  }

  function renderCheckoutCart() {
    const cart = getCart();

    console.log('Кошик на checkout:', cart);

    if (!orderList) {
      console.error('Не знайдено .checkout-order-list у checkout.html');
      return;
    }

    if (cart.length === 0) {
      orderList.innerHTML = `
        <p class="checkout-empty-text">
          Кошик порожній. Додайте товари перед оформленням замовлення.
        </p>
      `;

      if (subtotalEl) subtotalEl.textContent = '₴0.00';
      if (deliveryEl) deliveryEl.textContent = '₴0.00';
      if (totalEl) totalEl.textContent = '₴0.00';

      return;
    }

    if (!validateCart(cart)) {
      return;
    }

    orderList.innerHTML = cart.map(createOrderItemMarkup).join('');

    const subtotal = calculateSubtotal(cart);
    const total = calculateTotal(cart);

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (deliveryEl) deliveryEl.textContent = formatPrice(DELIVERY_PRICE);
    if (totalEl) totalEl.textContent = formatPrice(total);
  }

  async function createOrderFromForm() {
    const cart = getCart();

    if (cart.length === 0) {
      alert('Кошик порожній. Додайте товар перед оформленням замовлення.');
      return;
    }

    if (!validateCart(cart)) {
      return;
    }

    const currentUser = getCurrentUser();

    const nameInput = checkoutForm.querySelector('[name="name"]');
    const emailInput = checkoutForm.querySelector('[name="email"]');
    const phoneInput = checkoutForm.querySelector('[name="phone"]');
    const cityInput = checkoutForm.querySelector('[name="city"]');
    const addressInput = checkoutForm.querySelector('[name="address"]');
    const paymentInput = checkoutForm.querySelector('input[name="payment"]:checked');

    const V = window.EcoToteValidation;

const name = nameInput?.value.trim() || '';
const email = emailInput?.value.trim() || '';
const phone = phoneInput?.value.trim() || '';
const city = cityInput?.value.trim() || '';
const address = addressInput?.value.trim() || '';

if (!V.isValidName(name)) {
  alert('Введіть коректне ім’я. Наприклад: Сергій Кожан.');
  return;
}

if (!V.isValidEmail(email)) {
  alert('Введіть коректний email. Наприклад: client@test.com.');
  return;
}

if (!V.isValidPhone(phone)) {
  alert('Введіть телефон у форматі +380501234567.');
  return;
}

if (!V.isValidCity(city)) {
  alert('Введіть коректну назву міста.');
  return;
}

if (!V.isValidAddress(address)) {
  alert('Введіть коректну адресу доставки. Мінімум 5 символів.');
  return;
}

    const orderForServer = {
      userId: currentUser?.id || null,
      clientName: name,
      email,
      phone,
      city,
      address,
      paymentMethod: paymentInput?.value || 'Оплата при отриманні',
      total: calculateTotal(cart),
      items: cart,
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderForServer),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Помилка оформлення замовлення.');
        return;
      }

      const adminOrders = getOrders();

      adminOrders.push({
        id: data.order?.orderNumber || createOrderId(),
        client: orderForServer.clientName,
        email: orderForServer.email,
        phone: orderForServer.phone,
        city: orderForServer.city,
        address: orderForServer.address,
        date: getCurrentDateTime(),
        total: orderForServer.total,
        status: 'Нове',
        payment: orderForServer.paymentMethod,
        items: cart,
      });

      saveOrders(adminOrders);

      localStorage.removeItem(CART_KEY);

      alert('Замовлення успішно оформлено!');

      window.location.href = './profile.html?tab=orders';
    } catch (error) {
      console.error('Помилка створення замовлення:', error);
      alert('Не вдалося оформити замовлення.');
    }
  }

  if (!checkoutForm) {
    console.error('Не знайдено форму #checkoutForm у checkout.html');
    return;
  }

  checkoutForm.addEventListener('submit', event => {
    event.preventDefault();
    console.log('Форма оформлення відправлена');
    createOrderFromForm();
  });

  const checkoutSubmitBtn = document.querySelector('.checkout-submit-btn');

  if (checkoutSubmitBtn) {
    checkoutSubmitBtn.addEventListener('click', event => {
      event.preventDefault();
      console.log('Клік по кнопці оформлення');
      createOrderFromForm();
    });
  }

  renderCheckoutCart();
  fillCheckoutUserData();
});