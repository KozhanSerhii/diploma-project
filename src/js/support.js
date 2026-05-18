document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000/api';
  const CURRENT_USER_KEY = 'ecotote-current-user';

  const supportForm = document.querySelector('#supportForm');
  const nameInput = document.querySelector('#supportName');
  const emailInput = document.querySelector('#supportEmail');
  const messageInput = document.querySelector('#supportMessage');
  const formMessage = document.querySelector('#supportFormMessage');

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  }

  function showMessage(text, type = 'success') {
    if (!formMessage) return;

    formMessage.textContent = text;
    formMessage.classList.remove('is-success', 'is-error');
    formMessage.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  async function fillSupportUserData() {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role === 'admin') {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${currentUser.id}`);
      const user = await response.json();

      if (!response.ok) {
        return;
      }

      if (nameInput) nameInput.value = user.name || '';
      if (emailInput) emailInput.value = user.email || '';
    } catch (error) {
      console.error('Помилка автозаповнення форми підтримки:', error);
    }
  }

  if (supportForm) {
    supportForm.addEventListener('submit', async event => {
      event.preventDefault();

      const currentUser = getCurrentUser();

      const requestData = {
        userId: currentUser?.role === 'client' ? currentUser.id : null,
        name: nameInput.value.trim(),
        email: emailInput.value.trim().toLowerCase(),
        message: messageInput.value.trim(),
      };

      try {
        const response = await fetch(`${API_URL}/support-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        const data = await response.json();

        if (!response.ok) {
          showMessage(data.message || 'Помилка надсилання звернення.', 'error');
          return;
        }

        showMessage(data.message, 'success');
        messageInput.value = '';
      } catch (error) {
        console.error('Помилка надсилання звернення:', error);
        showMessage('Не вдалося надіслати звернення.', 'error');
      }
    });
  }

  fillSupportUserData();
});