document.addEventListener('DOMContentLoaded', () => {
  const cartList = document.querySelector('.cart-list');
  const cartEmpty = document.querySelector('.cart-empty');
  const cartSummary = document.querySelector('.summary-card');
  const clearCartBtn = document.querySelector('.cart-clear-btn');

  const subtotalEl = document.querySelector('.cart-subtotal');
  const deliveryEl = document.querySelector('.cart-delivery');
  const totalEl = document.querySelector('.cart-total');

  const CART_KEY = 'ecotote-cart';
  const DELIVERY_PRICE = 100;

  function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function getPriceNumber(price) {
    return Number(String(price).replace(/[^\d]/g, '')) || 0;
  }

  function formatPrice(value) {
    return `₴${value}.00`;
  }

  function createCartItemMarkup(item, index) {
    const itemTotal = getPriceNumber(item.price) * item.quantity;

    const stock = Number(item.stock);
    const hasStockInfo = !Number.isNaN(stock) && stock >= 0;
    const isOutOfStock = hasStockInfo && stock <= 0;

    return `
      <li class="cart-item">
        <img
          class="cart-item-img"
          src="${item.image}"
          alt="${item.name}"
        />

        <div class="cart-item-info">
          <h3 class="cart-item-name">${item.name}</h3>
          <p class="cart-item-category">${item.category || 'Екосумка'}</p>
          <p class="cart-item-price">${formatPrice(itemTotal)}</p>

          ${
            hasStockInfo
              ? `<p class="cart-item-stock ${isOutOfStock ? 'is-out' : ''}">
                  ${isOutOfStock ? 'Немає в наявності' : `В наявності: ${stock} шт.`}
                </p>`
              : ''
          }
        </div>

        <div class="cart-item-actions">
          <div class="cart-quantity">
            <button
              class="cart-quantity-btn"
              type="button"
              data-action="decrease"
              data-index="${index}"
              aria-label="Зменшити кількість"
            >
              −
            </button>

            <span class="cart-quantity-value">${item.quantity}</span>

            <button
              class="cart-quantity-btn"
              type="button"
              data-action="increase"
              data-index="${index}"
              aria-label="Збільшити кількість"
              ${hasStockInfo && item.quantity >= stock ? 'disabled' : ''}
            >
              +
            </button>
          </div>

          <button
            class="cart-remove-btn"
            type="button"
            data-action="remove"
            data-index="${index}"
          >
            Видалити
          </button>
        </div>
      </li>
    `;
  }

  function calculateSubtotal(cart) {
    return cart.reduce((sum, item) => {
      return sum + getPriceNumber(item.price) * item.quantity;
    }, 0);
  }

  function renderCart() {
    const cart = getCart();

    if (!cartList) {
      console.error('Не знайдено .cart-list у cart.html');
      return;
    }

    if (cart.length === 0) {
      cartList.innerHTML = '';

      if (cartEmpty) {
        cartEmpty.classList.add('is-visible');
      }

      if (cartSummary) {
        cartSummary.classList.add('is-disabled');
      }

      if (clearCartBtn) {
        clearCartBtn.style.display = 'none';
      }

      if (subtotalEl) subtotalEl.textContent = '₴0.00';
      if (deliveryEl) deliveryEl.textContent = '₴0.00';
      if (totalEl) totalEl.textContent = '₴0.00';

      return;
    }

    if (cartEmpty) {
      cartEmpty.classList.remove('is-visible');
    }

    if (cartSummary) {
      cartSummary.classList.remove('is-disabled');
    }

    if (clearCartBtn) {
      clearCartBtn.style.display = 'inline-block';
    }

    cartList.innerHTML = cart.map(createCartItemMarkup).join('');

    const subtotal = calculateSubtotal(cart);
    const total = subtotal + DELIVERY_PRICE;

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (deliveryEl) deliveryEl.textContent = formatPrice(DELIVERY_PRICE);
    if (totalEl) totalEl.textContent = formatPrice(total);
  }

  function updateQuantity(index, action) {
    const cart = getCart();

    if (!cart[index]) return;

    const stock = Number(cart[index].stock);
    const hasStockInfo = !Number.isNaN(stock) && stock >= 0;

    if (action === 'increase') {
      if (hasStockInfo && cart[index].quantity >= stock) {
        alert(`На складі доступно лише ${stock} шт. товару "${cart[index].name}".`);
        return;
      }

      cart[index].quantity += 1;
    }

    if (action === 'decrease') {
      cart[index].quantity -= 1;

      if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
      }
    }

    saveCart(cart);
    renderCart();
  }

  function removeItem(index) {
    const cart = getCart();

    cart.splice(index, 1);

    saveCart(cart);
    renderCart();
  }

  if (cartList) {
    cartList.addEventListener('click', event => {
      const button = event.target.closest('button');

      if (!button) return;

      const action = button.dataset.action;
      const index = Number(button.dataset.index);

      if (action === 'increase' || action === 'decrease') {
        updateQuantity(index, action);
      }

      if (action === 'remove') {
        removeItem(index);
      }
    });
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      localStorage.removeItem(CART_KEY);
      renderCart();
    });
  }

  renderCart();
});