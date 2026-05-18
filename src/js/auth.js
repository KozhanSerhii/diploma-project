console.log('auth.js підключився');

document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000/api';
  const CURRENT_USER_KEY = 'ecotote-current-user';

  const loginPanel = document.querySelector('#loginPanel');
  const registerPanel = document.querySelector('#registerPanel');
  const resetPanel = document.querySelector('#resetPanel');

  const showRegisterBtn = document.querySelector('#showRegister');
  const showLoginBtn = document.querySelector('#showLogin');
  const showResetBtn = document.querySelector('#showReset');
  const backToLoginBtn = document.querySelector('#backToLogin');

  const loginForm = document.querySelector('#loginForm');
  const registerForm = document.querySelector('#registerForm');
  const resetForm = document.querySelector('#resetForm');

  const loginMessage = document.querySelector('#loginMessage');
  const registerMessage = document.querySelector('#registerMessage');
  const resetMessage = document.querySelector('#resetMessage');

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function saveCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  function showMessage(element, text, type = 'error') {
    if (!element) return;

    element.textContent = text;
    element.classList.remove('is-error', 'is-success');

    if (type === 'success') {
      element.classList.add('is-success');
    } else {
      element.classList.add('is-error');
    }
  }

  function clearMessages() {
    [loginMessage, registerMessage, resetMessage].forEach(message => {
      if (!message) return;

      message.textContent = '';
      message.classList.remove('is-error', 'is-success');
    });
  }

  function showPanel(panelName) {
    loginPanel?.classList.remove('is-active');
    registerPanel?.classList.remove('is-active');
    resetPanel?.classList.remove('is-active');

    if (panelName === 'login') {
      loginPanel?.classList.add('is-active');
    }

    if (panelName === 'register') {
      registerPanel?.classList.add('is-active');
    }

    if (panelName === 'reset') {
      resetPanel?.classList.add('is-active');
    }

    clearMessages();
  }

  async function request(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Сталася помилка');
    }

    return data;
  }

  showRegisterBtn?.addEventListener('click', () => {
    showPanel('register');
  });

  showLoginBtn?.addEventListener('click', () => {
    showPanel('login');
  });

  showResetBtn?.addEventListener('click', () => {
    showPanel('reset');
  });

  backToLoginBtn?.addEventListener('click', () => {
    showPanel('login');
  });

  if (loginForm) {
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();

      console.log('Натиснуто логін');

      const formData = new FormData(loginForm);

      const email = normalizeEmail(formData.get('email'));
      const password = formData.get('password');

      const V = window.EcoToteValidation;

if (!V.isValidEmail(email)) {
  showMessage(loginMessage, 'Введіть коректний email. Наприклад: client@test.com.', 'error');
  return;
}

if (!V.isValidPassword(password)) {
  showMessage(loginMessage, 'Пароль має містити мінімум 6 символів.', 'error');
  return;
}

      console.log('Дані логіну:', email, password);

      try {
        const data = await request(`${API_URL}/auth/login`, {
          email,
          password,
        });

        console.log('Відповідь сервера:', data);

        saveCurrentUser(data.user);

        showMessage(loginMessage, data.message, 'success');

        if (data.user.role === 'admin') {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/index.html';
        }
      } catch (error) {
        console.error('Помилка логіну:', error);
        showMessage(loginMessage, error.message, 'error');
      }
    });
  } else {
    console.error('Не знайдено форму #loginForm');
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async event => {
      event.preventDefault();

      const formData = new FormData(registerForm);

      const name = formData.get('name')?.trim();
      const email = normalizeEmail(formData.get('email'));
      const password = formData.get('password');
      const confirmPassword = formData.get('confirmPassword');

      const V = window.EcoToteValidation;

if (!V.isValidName(name)) {
  showMessage(registerMessage, 'Введіть коректне повне ім’я. Ім’я має містити мінімум 2 літери.', 'error');
  return;
}

if (!V.isValidEmail(email)) {
  showMessage(registerMessage, 'Введіть коректний email. Наприклад: client@test.com.', 'error');
  return;
}

if (!V.isValidPassword(password)) {
  showMessage(registerMessage, 'Пароль має містити мінімум 6 символів.', 'error');
  return;
}

if (password !== confirmPassword) {
  showMessage(registerMessage, 'Паролі не збігаються.', 'error');
  return;
}

      try {
        const data = await request(`${API_URL}/auth/register`, {
          name,
          email,
          password,
          confirmPassword,
        });

        showMessage(registerMessage, data.message, 'success');
        registerForm.reset();

        setTimeout(() => {
          showPanel('login');
        }, 1000);
      } catch (error) {
        showMessage(registerMessage, error.message, 'error');
      }
    });
  }

  if (resetForm) {
    resetForm.addEventListener('submit', async event => {
      event.preventDefault();

      const formData = new FormData(resetForm);

      const email = normalizeEmail(formData.get('email'));
      const newPassword = formData.get('newPassword');
      const confirmNewPassword = formData.get('confirmNewPassword');

      const V = window.EcoToteValidation;

if (!V.isValidEmail(email)) {
  showMessage(resetMessage, 'Введіть коректний email. Наприклад: client@test.com.', 'error');
  return;
}

if (!V.isValidPassword(newPassword)) {
  showMessage(resetMessage, 'Новий пароль має містити мінімум 6 символів.', 'error');
  return;
}

if (newPassword !== confirmNewPassword) {
  showMessage(resetMessage, 'Паролі не збігаються.', 'error');
  return;
}

      try {
        const data = await request(`${API_URL}/auth/reset-password`, {
          email,
          newPassword,
          confirmNewPassword,
        });

        showMessage(resetMessage, data.message, 'success');
        resetForm.reset();

        setTimeout(() => {
          showPanel('login');
        }, 1000);
      } catch (error) {
        showMessage(resetMessage, error.message, 'error');
      }
    });
  }
});

const loginBtn = document.querySelector('#loginBtn');

if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    console.log('Клік по кнопці loginBtn');

    const emailInput = document.querySelector('#loginEmail');
    const passwordInput = document.querySelector('#loginPassword');

    if (!emailInput || !passwordInput) {
      console.error('Не знайдено поля #loginEmail або #loginPassword');
      alert('Помилка: не знайдено поля email або пароля в HTML.');
      return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    console.log('Email:', email);
    console.log('Password:', password);

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      console.log('Відповідь логіну:', data);

      if (!response.ok) {
        alert(data.message || 'Помилка входу');
        return;
      }

      localStorage.setItem('ecotote-current-user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        window.location.href = 'http://localhost:5173/admin.html';
      } else {
        window.location.href = 'http://localhost:5173/index.html';
      }
    } catch (error) {
      console.error('Помилка:', error);
      alert('Не вдалося виконати вхід');
    }
  });
} else {
  console.error('Не знайдено #loginBtn');
}

const registerBtn = document.querySelector('#registerBtn');

if (registerBtn) {
  registerBtn.addEventListener('click', async () => {
    console.log('Клік по кнопці registerBtn');

    const nameInput = document.querySelector('#registerName');
    const emailInput = document.querySelector('#registerEmail');
    const passwordInput = document.querySelector('#registerPassword');
    const confirmPasswordInput = document.querySelector('#registerConfirmPassword');

    if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
      alert('Помилка: не знайдено поля форми реєстрації.');
      return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    const V = window.EcoToteValidation;

if (!V.isValidName(name)) {
  alert('Введіть коректне повне ім’я. Ім’я має містити мінімум 2 літери і не може містити цифри.');
  return;
}

if (!V.isValidEmail(email)) {
  alert('Введіть коректний email. Наприклад: client@test.com.');
  return;
}

if (!V.isValidPassword(password)) {
  alert('Пароль має містити мінімум 6 символів.');
  return;
}

if (password !== confirmPassword) {
  alert('Паролі не збігаються.');
  return;
}

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      console.log('Відповідь реєстрації:', data);

      if (!response.ok) {
        alert(data.message || 'Помилка реєстрації');
        return;
      }

      alert(data.message);

      nameInput.value = '';
      emailInput.value = '';
      passwordInput.value = '';
      confirmPasswordInput.value = '';

      document.querySelector('#registerPanel')?.classList.remove('is-active');
      document.querySelector('#loginPanel')?.classList.add('is-active');
    } catch (error) {
      console.error('Помилка реєстрації:', error);
      alert('Не вдалося виконати реєстрацію');
    }
  });
} else {
  console.error('Не знайдено #registerBtn');
}

const resetBtn = document.querySelector('#resetBtn');

if (resetBtn) {
  resetBtn.addEventListener('click', async () => {
    console.log('Клік по кнопці resetBtn');

    const emailInput = document.querySelector('#resetEmail');
    const newPasswordInput = document.querySelector('#resetNewPassword');
    const confirmNewPasswordInput = document.querySelector(
      '#resetConfirmNewPassword'
    );

    if (!emailInput || !newPasswordInput || !confirmNewPasswordInput) {
      alert('Помилка: не знайдено поля форми відновлення пароля.');
      return;
    }

    const email = emailInput.value.trim().toLowerCase();
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;

    try {
      const response = await fetch(
        'http://localhost:3000/api/auth/reset-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            newPassword,
            confirmNewPassword,
          }),
        }
      );

      const data = await response.json();

      console.log('Відповідь відновлення пароля:', data);

      if (!response.ok) {
        alert(data.message || 'Помилка відновлення пароля');
        return;
      }

      alert(data.message);

      emailInput.value = '';
      newPasswordInput.value = '';
      confirmNewPasswordInput.value = '';

      document.querySelector('#resetPanel')?.classList.remove('is-active');
      document.querySelector('#loginPanel')?.classList.add('is-active');
    } catch (error) {
      console.error('Помилка відновлення пароля:', error);
      alert('Не вдалося змінити пароль');
    }
  });
}