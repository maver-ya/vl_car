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
