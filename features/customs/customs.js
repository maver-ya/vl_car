const form = document.querySelector('#customs-form');
const preview = document.querySelector('#customs-request');
const copy = document.querySelector('#copy-customs');
const status = document.querySelector('#form-status');
const note = document.querySelector('#calculation-note');
const amounts = [...document.querySelectorAll('[data-amount]')];
const total = document.querySelector('#total');
const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const money = (value) => formatter.format(value) + ' ₽';
const rates = customsRates;
document.querySelector('#rates-note').textContent =
  'Курсы ЦБ на ' + rates.date + ' · 1 EUR = ' + formatter.format(rates.rates.EUR) +
  ' ₽. Используется снимок, автоматическое обновление пока не подключено.';
const now = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
if (/^2026-/.test(now)) form.elements.clearance.value = now;

function clearResult() {
  amounts.forEach((amount) => { amount.textContent = '—'; });
  total.textContent = '—';
  note.textContent = '';
  preview.value = '';
  copy.disabled = true;
  status.textContent = '';
}

form.addEventListener('input', clearResult);
for (const field of [form.elements.price, form.elements.capacity]) field.addEventListener('input', (event) => {
  const input = event.target;
  const raw = input.value.replace(/\s/g, '');
  if (/^\d+$/.test(raw) && raw.length <= 12) {
    const digitCount = input.value.slice(0, input.selectionStart).replace(/\D/g, '').length;
    input.value = formatter.format(Number(raw));
    let caret = 0;
    let digits = 0;
    while (caret < input.value.length && digits < digitCount) {
      if (/\d/.test(input.value[caret])) digits++;
      caret++;
    }
    input.setSelectionRange(caret, caret);
  }
});

function ageGroup(date, clearance) {
  const anniversary = (years) => String(Number(date.slice(0, 4)) + years) + date.slice(4);
  if (clearance <= anniversary(3)) return 0;
  if (clearance <= anniversary(5)) return 1;
  return 2;
}

function dutyEuro(group, capacity, euroValue) {
  if (group === 0) {
    const bands = [[8500, .54, 2.5], [16700, .48, 3.5], [42300, .48, 5.5],
      [84500, .48, 7.5], [169000, .48, 15], [Infinity, .48, 20]];
    const [, percent, minimum] = bands.find(([limit]) => euroValue <= limit);
    return Math.max(euroValue * percent, capacity * minimum);
  }
  const limits = [1000, 1500, 1800, 2300, 3000, Infinity];
  const perCC = group === 1 ? [1.5, 1.7, 2.5, 2.7, 3, 3.6] : [3, 3.2, 3.5, 4.8, 5, 5.7];
  return capacity * perCC[limits.findIndex((limit) => capacity <= limit)];
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearResult();
  const data = new FormData(form);
  try {
    if (!rates) throw new Error('Дождитесь загрузки курсов.');
    const priceText = data.get('price').replace(/\s/g, '').replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(priceText) || Number(priceText) <= 0 || Number(priceText) > 1e12) {
      throw new Error('Укажите положительную стоимость, до двух знаков после запятой.');
    }
    const clearance = data.get('clearance');
    if (!clearance.startsWith('2026-')) throw new Error('Поддерживается расчёт по ставкам 2026 года.');
    const year = Number(data.get('year'));
    let date = data.get('manufactured');
    if (date && Number(date.slice(0, 4)) !== year) throw new Error('Год и точная дата выпуска должны совпадать.');
    if (!date) {
      const earliest = year + '-01-01';
      const latest = year + '-12-31';
      if (latest > clearance || ageGroup(earliest, clearance) !== ageGroup(latest, clearance)) {
        throw new Error('Для этого года нужна точная дата выпуска: она влияет на возрастную категорию.');
      }
      date = earliest;
    }
    if (date > clearance) throw new Error('Дата выпуска должна предшествовать оформлению.');
    const capacity = Number(data.get('capacity').replace(/\s/g, ''));
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20000) throw new Error('Укажите объём от 1 до 20 000 см³.');
    const power = Number(data.get('power'));
    if (data.get('eaeu') !== 'Нет') throw new Error('Оформление в другой стране ЕАЭС требует отдельного расчёта специалистом.');
    const rubValue = Number(priceText) * rates.rates[data.get('currency')];
    const group = ageGroup(date, clearance);
    const duty = Math.round(dutyEuro(group, capacity, rubValue / rates.rates.EUR) * rates.rates.EUR * 100) / 100;
    const fees = [[200000, 1231], [450000, 2462], [1200000, 4924], [2700000, 13541],
      [4200000, 18465], [5500000, 21344], [10000000, 49240], [Infinity, 73860]];
    const fee = fees.find(([limit]) => rubValue <= limit)[1];
    const eligible = capacity <= 3000 && power <= 117.68 &&
      data.get('previous') === 'Нет' && data.get('resale') === 'Не планируется' && data.has('registered');
    const recycling = eligible ? (group === 0 ? 3400 : 5200) : null;
    amounts[0].textContent = money(duty);
    amounts[1].textContent = money(fee);
    amounts[2].textContent = recycling === null ? 'Нужен расчёт специалиста' : money(recycling);
    total.textContent = recycling === null ? 'Полный итог пока не определён' : money(duty + fee + recycling);
    note.textContent = 'Возрастная группа: ' + ['не более 3 лет', 'более 3, не более 5 лет', 'более 5 лет'][group] +
      '. Стоимость для расчёта: ' + money(rubValue) + '. Пошлина: ' + formatter.format(dutyEuro(group, capacity, rubValue / rates.rates.EUR)) +
      ' EUR × ' + formatter.format(rates.rates.EUR) + ' ₽/EUR. Утильсбор при подтверждённых условиях: 20 000 ₽ × ' +
      (group === 0 ? '0,17' : '0,26') + '. Окончательные суммы проверяются по документам.';
    preview.value = ['Запрос на проверку таможенного расчёта.', 'Страна: ' + data.get('country'),
      'Выпуск: ' + year + (data.get('manufactured') ? ' / ' + date : ' (известен год)'),
      'Оформление: ' + clearance, data.get('engine') + ', ' + capacity + ' см³, ' + power + ' кВт',
      'Стоимость: ' + formatter.format(Number(priceText)) + ' ' + data.get('currency'),
      'Курс ЦБ: ' + rates.date, 'Пошлина: ' + money(duty), 'Таможенный сбор: ' + money(fee),
      'Утильсбор: ' + amounts[2].textContent, 'Итого: ' + total.textContent].join('\n');
    copy.disabled = false;
    status.textContent = recycling === null ? 'Пошлина и сбор рассчитаны. Утильсбор и полный итог требуют проверки специалистом.' : 'Предварительный расчёт готов. Разбивка ниже.';
  } catch (error) {
    status.textContent = error.message;
  }
});

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(preview.value);
    status.textContent = 'Расчёт скопирован.';
  } catch {
    preview.focus();
    preview.select();
    status.textContent = 'Текст выделен для копирования.';
  }
});


