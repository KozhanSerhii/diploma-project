function isValidName(name) {
  const value = String(name || '').trim();

  return /^[А-Яа-яІіЇїЄєҐґA-Za-z\s'-]{2,60}$/.test(value);
}

function isValidEmail(email) {
  const value = String(email || '').trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(password) {
  return String(password || '').length >= 6;
}

function isValidPhone(phone) {
  const value = String(phone || '').trim();

  return /^\+380\d{9}$/.test(value);
}

function isValidCity(city) {
  const value = String(city || '').trim();

  return /^[А-Яа-яІіЇїЄєҐґA-Za-z\s'-]{2,60}$/.test(value);
}

function isValidAddress(address) {
  const value = String(address || '').trim();

  return value.length >= 5 && value.length <= 120;
}

function isValidPrice(price) {
  const value = Number(price);

  return Number.isFinite(value) && value > 0;
}

function isValidStock(stock) {
  const value = Number(stock);

  return Number.isInteger(value) && value >= 0;
}

window.EcoToteValidation = {
  isValidName,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidCity,
  isValidAddress,
  isValidPrice,
  isValidStock,
};