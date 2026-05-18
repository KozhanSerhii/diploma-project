document.addEventListener('DOMContentLoaded', () => {
  const CURRENT_USER_KEY = 'ecotote-current-user';

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  }

  function updateAuthLink() {
    const authLinks = document.querySelectorAll('#authLink, .header-auth-link');

    if (authLinks.length === 0) {
      return;
    }

    const currentUser = getCurrentUser();

    authLinks.forEach(link => {
      if (!currentUser) {
        link.textContent = 'Увійти';
        link.href = './auth.html';
        return;
      }

      if (currentUser.role === 'admin') {
        link.textContent = 'Профіль';
        link.href = './admin.html';
        return;
      }

      link.textContent = 'Профіль';
      link.href = './profile.html';
    });
  }

  updateAuthLink();

  setTimeout(updateAuthLink, 100);
  setTimeout(updateAuthLink, 300);
  setTimeout(updateAuthLink, 700);

  window.addEventListener('storage', updateAuthLink);
});