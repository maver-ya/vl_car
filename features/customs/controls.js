const controlsForm = document.querySelector('#customs-form');
let openedControl;

function enhanceField(input) {
  const oldLabel = input.parentElement;
  const field = document.createElement('div');
  field.className = 'custom-field';
  const caption = document.createElement('span');
  caption.id = 'caption-' + input.name;
  caption.className = 'field-caption';
  caption.textContent = oldLabel.firstChild.textContent.trim();
  const help = oldLabel.querySelector('small');
  oldLabel.replaceWith(field);
  field.append(caption, input);
  input.classList.add('control-source');
  input.tabIndex = -1;
  input.setAttribute('aria-labelledby', caption.id);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'control-trigger';
  button.setAttribute('aria-labelledby', caption.id + ' value-' + input.name);
  button.setAttribute('aria-expanded', 'false');
  const value = document.createElement('span');
  value.id = 'value-' + input.name;
  const icon = document.createElement('span');
  icon.textContent = input.tagName === 'SELECT' ? '⌄' : '▦';
  icon.setAttribute('aria-hidden', 'true');
  button.append(value, icon);
  const panel = document.createElement('div');
  panel.className = 'control-panel';
  panel.id = 'panel-' + input.name;
  panel.hidden = true;
  button.setAttribute('aria-controls', panel.id);
  field.append(button, panel);
  if (help) field.append(help);

  function close() {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (openedControl?.field === field) openedControl = undefined;
  }
  function open() {
    openedControl?.close();
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    openedControl = { field, close, button };
    const selected = panel.querySelector('[aria-selected="true"], [aria-current="date"], button:not(:disabled)');
    selected?.focus();
  }
  button.addEventListener('click', () => panel.hidden ? open() : close());
  input.addEventListener('invalid', (event) => {
    event.preventDefault();
    button.focus();
    button.setAttribute('aria-invalid', 'true');
  });
  input.addEventListener('input', () => button.removeAttribute('aria-invalid'));
  field.addEventListener('focusout', (event) => {
    if (!field.contains(event.relatedTarget)) close();
  });
  return { field, button, value, panel, close, open };
}

for (const select of controlsForm.querySelectorAll('select')) {
  const ui = enhanceField(select);
  ui.button.setAttribute('aria-haspopup', 'listbox');
  ui.panel.setAttribute('role', 'listbox');
  ui.panel.setAttribute('aria-labelledby', 'caption-' + select.name);
  const options = [...select.options].map((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'select-option';
    button.setAttribute('role', 'option');
    button.textContent = option.text;
    button.addEventListener('click', () => {
      select.value = option.value;
      sync();
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      ui.close();
      ui.button.focus();
    });
    ui.panel.append(button);
    return button;
  });
  function sync() {
    ui.value.textContent = select.selectedOptions[0]?.text || 'Выберите';
    options.forEach((button, index) => button.setAttribute('aria-selected', String(index === select.selectedIndex)));
  }
  ui.panel.addEventListener('keydown', (event) => {
    const index = options.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = Math.min(options.length - 1, index + 1);
    if (event.key === 'ArrowUp') next = Math.max(0, index - 1);
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      options[next].focus();
    }
  });
  ui.button.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      ui.open();
    }
  });
  select.addEventListener('change', sync);
  sync();
}

const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
function isoDate(year, month, day) {
  return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

for (const input of controlsForm.querySelectorAll('input[type="date"]')) {
  const ui = enhanceField(input);
  ui.button.setAttribute('aria-haspopup', 'dialog');
  ui.panel.setAttribute('role', 'dialog');
  ui.panel.setAttribute('aria-label', 'Выбор даты');
  ui.panel.classList.add('calendar');
  let view = input.value ? new Date(input.value + 'T12:00:00') : new Date();
  const top = document.createElement('div');
  top.className = 'calendar-heading';
  const heading = document.createElement('span');
  heading.setAttribute('aria-live', 'polite');
  const year = document.createElement('input');
  year.type = 'number';
  year.min = '1950';
  year.max = '2100';
  year.setAttribute('aria-label', 'Год календаря');
  year.className = 'calendar-year';
  function moveMonth(offset) {
    view = new Date(view.getFullYear(), view.getMonth() + offset, 1);
    render();
  }
  for (const [symbol, offset, label] of [['‹', -1, 'Предыдущий месяц'], ['›', 1, 'Следующий месяц']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = symbol;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', () => moveMonth(offset));
    top.append(button);
  }
  top.insertBefore(heading, top.lastChild);
  top.insertBefore(year, top.lastChild);
  year.addEventListener('change', () => {
    if (!year.checkValidity()) return;
    view = new Date(Number(year.value), view.getMonth(), 1);
    render();
  });
  const weekdays = document.createElement('div');
  weekdays.className = 'calendar-weekdays';
  for (const day of ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']) {
    const span = document.createElement('span');
    span.textContent = day;
    weekdays.append(span);
  }
  const days = document.createElement('div');
  days.className = 'calendar-days';
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'calendar-clear';
  clear.textContent = 'Очистить дату';
  clear.addEventListener('click', () => choose(''));
  ui.panel.append(top, weekdays, days, clear);

  function choose(value) {
    input.value = value;
    sync();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    ui.close();
    ui.button.focus();
  }
  function sync() {
    ui.value.textContent = input.value ? input.value.split('-').reverse().join('.') : 'Выбрать дату';
    render();
  }
  function render() {
    heading.textContent = monthNames[view.getMonth()];
    year.value = view.getFullYear();
    days.replaceChildren();
    const start = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;
    const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let i = 0; i < start; i++) days.append(document.createElement('span'));
    for (let day = 1; day <= count; day++) {
      const value = isoDate(view.getFullYear(), view.getMonth(), day);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = day;
      button.setAttribute('aria-label', day + ' ' + monthNames[view.getMonth()] + ' ' + view.getFullYear());
      button.disabled = Boolean((input.min && value < input.min) || (input.max && value > input.max));
      if (value === input.value) button.setAttribute('aria-current', 'date');
      button.addEventListener('click', () => choose(value));
      days.append(button);
    }
  }
  ui.button.addEventListener('click', () => {
    if (ui.panel.hidden) return;
    const requestedYear = Number(controlsForm.elements.year.value);
    if (!input.value && input.name === 'manufactured' && requestedYear >= 1950 && requestedYear <= 2026) {
      view = new Date(requestedYear, 0, 1);
      render();
    }
  });
  input.addEventListener('change', sync);
  sync();
}

document.addEventListener('pointerdown', (event) => {
  if (openedControl && !openedControl.field.contains(event.target)) openedControl.close();
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !openedControl) return;
  const button = openedControl.button;
  openedControl.close();
  button.focus();
});
