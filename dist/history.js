const buttons = [...document.querySelectorAll('[data-filter]')];
const stories = [...document.querySelectorAll('[data-category]')];
buttons.forEach(button => button.addEventListener('click', () => {
  buttons.forEach(item => {const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected));});
  let count = 0;
  stories.forEach(story => {story.hidden = button.dataset.filter !== 'all' && story.dataset.category !== button.dataset.filter; if (!story.hidden) count++;});
  document.getElementById('story-count').textContent = `${count} stories`;
}));

const archiveCards = [...document.querySelectorAll('.press-card')];
const archiveButtons = [...document.querySelectorAll('[data-archive-filter]')];
const archiveSearch = document.getElementById('archive-search');
const archiveSort = document.getElementById('archive-sort');
const archiveMore = document.getElementById('archive-more');
const normalize = value => value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'");
const archiveText = new Map(archiveCards.map(card => [card, normalize(card.textContent)]));
let archiveFilter = 'all';
let archiveLimit = 12;
function renderArchive() {
  const terms = normalize(archiveSearch.value.trim()).split(/\s+/).filter(Boolean);
  const matches = archiveCards.filter(card =>
    (archiveFilter === 'all' || card.dataset.archiveTags.split(' ').includes(archiveFilter)) &&
    terms.every(term => archiveText.get(card).includes(term))
  ).sort((a, b) => {
    if (!a.dataset.date) return b.dataset.date ? 1 : 0;
    if (!b.dataset.date) return -1;
    return archiveSort.value === 'newest' ? b.dataset.date.localeCompare(a.dataset.date) : a.dataset.date.localeCompare(b.dataset.date);
  });
  archiveCards.forEach(card => { card.hidden = true; });
  matches.forEach((card, index) => {
    document.getElementById('press-grid').append(card);
    card.hidden = index >= archiveLimit;
  });
  document.getElementById('archive-count').textContent = 'Showing ' + Math.min(archiveLimit, matches.length) + ' of ' + matches.length + ' sources';
  document.getElementById('archive-empty').hidden = matches.length > 0;
  archiveMore.hidden = matches.length <= archiveLimit;
}
archiveButtons.forEach(button => button.addEventListener('click', () => {
  archiveFilter = button.dataset.archiveFilter;
  archiveLimit = 12;
  archiveButtons.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  renderArchive();
}));
archiveSearch.addEventListener('input', () => { archiveLimit = 12; renderArchive(); });
archiveSort.addEventListener('change', () => { archiveLimit = 12; renderArchive(); });
archiveMore.addEventListener('click', () => {
  const previousLimit = archiveLimit;
  archiveLimit += 12;
  renderArchive();
  const next = [...document.querySelectorAll('.press-card:not([hidden])')][previousLimit];
  if (next) next.querySelector('a').focus({ preventScroll: false });
});
renderArchive();
