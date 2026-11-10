const form = document.querySelector('#request');
const preview = document.querySelector('#request-text');
const copy = document.querySelector('#copy-request');
const send = document.querySelector('#send-request');
const status = document.querySelector('#request-status');
const username = form.dataset.telegram.trim();
const hasContact = /^[A-Za-z0-9_]{5,32}$/.test(username);

if (hasContact) {
  document.querySelector('#contact-note').hidden = true;
}

function updateMessage() {
  const fields = new FormData(form);
  const car = fields.get('car').trim();
  const budget = fields.get('budget').trim();
  const city = fields.get('city').trim();
  const ready = Boolean(car && budget && city);

  preview.value = ready
    ? `Здравствуйте! Хочу узнать стоимость привоза авто. Ищу: ${car}. Бюджет: ${budget}. Город доставки: ${city}.`
    : '';
  copy.disabled = !ready;
  send.hidden = !(ready && hasContact);
  status.textContent = '';

  if (!send.hidden) {
    const url = new URL('https://t.me/' + username);
    url.searchParams.set('text', preview.value);
    send.href = url.href;
  }
}

form.addEventListener('input', updateMessage);
form.addEventListener('submit', (event) => event.preventDefault());
copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(preview.value);
    status.textContent = 'Текст заявки скопирован.';
  } catch {
    preview.focus();
    preview.select();
    status.textContent = 'Текст выделен. Нажмите Ctrl+C или скопируйте его через меню.';
  }
});
updateMessage();
