const theme = document.querySelector('#theme');
const menu = document.querySelector('#menu');
const nav = document.querySelector('#site-nav');
const narrow = matchMedia('(max-width: 760px)');

function setTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  theme.setAttribute('aria-pressed', String(dark));
}

let savedTheme;
try {
  savedTheme = localStorage.getItem('avtoburo-theme');
} catch {
  // The theme still works when storage is unavailable.
}
setTheme(savedTheme ? savedTheme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
theme.hidden = false;
theme.addEventListener('click', () => {
  const dark = theme.getAttribute('aria-pressed') !== 'true';
  setTheme(dark);
  try {
    localStorage.setItem('avtoburo-theme', dark ? 'dark' : 'light');
  } catch {
    // Keep the selection for the current page.
  }
});

function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  nav.toggleAttribute('data-collapsed', narrow.matches && !open);
}

function syncMenu() {
  menu.hidden = !narrow.matches;
  setMenu(false);
}

narrow.addEventListener('change', syncMenu);
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (event) => {
  if (!narrow.matches || !event.target.closest('a')) return;
  const target = document.querySelector(event.target.closest('a').hash);
  setMenu(false);
  target?.setAttribute('tabindex', '-1');
  target?.focus({ preventScroll: true });
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || menu.getAttribute('aria-expanded') !== 'true') return;
  setMenu(false);
  menu.focus();
});
syncMenu();

const backToTop = document.querySelector('.floating-top');
if (backToTop) {
  function updateBackToTop() {
    backToTop.hidden = window.scrollY < 320;
  }
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();
}
