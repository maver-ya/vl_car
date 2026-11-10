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
const amounts = [...calculator.querySelectorAll('input')];
const rubles = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

function updateTotal() {
  total.value = amounts.every((input) => input.validity.valid)
    ? rubles.format(amounts.reduce((sum, input) => sum + input.valueAsNumber, 0))
    : 'Введите суммы целыми рублями';
}

calculator.addEventListener('input', updateTotal);
calculator.addEventListener('submit', (event) => event.preventDefault());
updateTotal();
