const form = document.querySelector('#customs-form');
const preview = document.querySelector('#customs-request');
const copy = document.querySelector('#copy-customs');
const status = document.querySelector('#form-status');

form.addEventListener('input', () => {
  preview.value = '';
  copy.disabled = true;
  status.textContent = '';
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const price = data.get('price').replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) <= 0 || Number(price) > 1e12) {
    status.textContent = 'Укажите положительную цену с точностью до двух знаков после запятой.';
    return;
  }
  if (data.get('manufactured') > data.get('clearance')) {
    status.textContent = 'Дата выпуска должна предшествовать оформлению.';
    return;
  }
  const formattedPrice = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(Number(price));
  const rows = [
    'Прошу рассчитать таможенные платежи при ввозе для личного пользования через Владивосток.',
    'Страна покупки: ' + data.get('country'),
    'Дата выпуска: ' + data.get('manufactured'),
    'Предполагаемое оформление: ' + data.get('clearance'),
    'Двигатель: ' + data.get('engine'),
    'Объём: ' + data.get('capacity') + ' см³; мощность: ' + data.get('power') + ' кВт',
    'Цена: ' + formattedPrice + ' ' + data.get('currency'),
    'Предыдущий ввоз за 12 месяцев: ' + data.get('previous'),
    'Оформление в другой стране ЕАЭС: ' + data.get('eaeu'),
    'Передача другому владельцу в течение 12 месяцев: ' + data.get('resale'),
  ];
  preview.value = rows.join('\n');
  copy.disabled = false;
  status.textContent = 'Запрос готов. Суммы платежей определит специалист по указанным сведениям.';
});

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(preview.value);
    status.textContent = 'Запрос скопирован.';
  } catch {
    preview.focus();
    preview.select();
    status.textContent = 'Текст выделен для копирования.';
  }
});
