const carField = document.querySelector('#request input[name="car"]');

document.querySelectorAll('[data-car]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    carField.value = link.dataset.car;
    carField.dispatchEvent(new Event('input', { bubbles: true }));
    carField.focus({ preventScroll: true });
  });
});

const backToTop = document.querySelector('.floating-top');
function updateBackToTop() {
  backToTop.hidden = window.scrollY < 320;
}
window.addEventListener('scroll', updateBackToTop, { passive: true });
updateBackToTop();

const calculator = document.querySelector('#calculator');
const total = calculator.querySelector('output');
const amounts = [...calculator.querySelectorAll('input[data-step]')];
const numbers = new Intl.NumberFormat('ru-RU');
const maxAmount = 999999999;

function readAmount(input) {
  const value = input.value.replace(/\s/g, '');
  return /^\d{1,9}$/.test(value) ? Number(value) : NaN;
}

function updateTotal() {
  const values = amounts.map(readAmount);
  total.value = values.every(Number.isFinite)
    ? numbers.format(values.reduce((sum, value) => sum + value, 0)) + '\u00a0₽'
    : 'Введите суммы целыми рублями';
}

for (const input of amounts) {
  const label = input.parentElement;
  const title = label.textContent.trim();
  const step = Number(input.dataset.step);
  const controls = document.createElement('div');
  controls.className = 'amount-controls';
  label.insertAdjacentElement('afterend', controls);

  function stepButton(direction, symbol, verb) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = symbol;
    button.setAttribute('aria-label', verb + ' на ' + numbers.format(step) + ' ₽ — ' + title);
    button.addEventListener('click', () => {
      const current = readAmount(input) || 0;
      input.value = numbers.format(Math.min(maxAmount, Math.max(0, current + direction * step)));
      updateTotal();
    });
    return button;
  }

  controls.append(stepButton(-1, '−', 'Уменьшить'), label, stepButton(1, '+', 'Увеличить'));

  input.addEventListener('input', () => {
    const beforeCaret = input.value.slice(0, input.selectionStart).replace(/\D/g, '').length;
    const value = readAmount(input);
    if (Number.isFinite(value)) {
      input.value = numbers.format(value);
      let caret = 0;
      let digits = 0;
      while (caret < input.value.length && digits < beforeCaret) {
        if (/\d/.test(input.value[caret])) digits++;
        caret++;
      }
      input.setSelectionRange(caret, caret);
    }
    updateTotal();
  });
}

calculator.addEventListener('submit', (event) => event.preventDefault());
updateTotal();
