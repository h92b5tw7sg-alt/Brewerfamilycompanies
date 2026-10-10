const buttons = [...document.querySelectorAll('[data-filter]')];
const stories = [...document.querySelectorAll('[data-category]')];
buttons.forEach(button => button.addEventListener('click', () => {
  buttons.forEach(item => {const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected));});
  let count = 0;
  stories.forEach(story => {story.hidden = button.dataset.filter !== 'all' && story.dataset.category !== button.dataset.filter; if (!story.hidden) count++;});
  document.getElementById('story-count').textContent = `${count} stories`;
}));
