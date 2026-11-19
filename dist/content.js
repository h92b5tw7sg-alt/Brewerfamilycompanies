/* Read-only public history. This file never uses a secret or service-role key. */
(() => {
  const config = window.BFC_DATABASE;
  if (!config?.url || !config?.publishableKey) return;
  const node = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const safeUrl = value => {
    const url = new URL(value, location.href);
    if (url.protocol !== 'https:' && !String(value).startsWith('#source-')) throw new Error('Invalid source URL');
    return url.href;
  };
  function link(text, href, className) {
    const a = node('a', text, className);
    a.href = safeUrl(href);
    if (!String(href).startsWith('#')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  }
  function paragraph(text, references = [], className) {
    const p = node('p', undefined, className);
    for (const part of text.split(/(\[\d+\])/)) {
      const ref = references.find(item => item.label === part);
      p.append(ref ? link(part, ref.href, 'citation') : document.createTextNode(part));
    }
    return p;
  }
  function company(row) {
    const card = node('article', undefined, 'story');
    card.dataset.category = row.categories.join(' ');
    card.append(node('span', row.phase_label, 'eyebrow'), node('h3', row.title));
    row.paragraphs.forEach((text, i) => card.append(paragraph(text, row.reference_links, i === 0 ? 'story-sub' : undefined)));
    return card;
  }
  function timeline(rows) {
    const fragment = document.createDocumentFragment();
    let era;
    rows.forEach(row => {
      if (row.era !== era) {
        era = row.era;
        fragment.append(node('div', era, 'timeline-era'));
        if (era === 'BEFORE BRICKTOWN') fragment.append(node('p', 'These early chapters follow the family-supplied chronology of Steve Lackmeyer’s June 2008 profile. Approximate dates are marked.', 'timeline-early-note'));
      }
      const card = node('article', undefined, row.full_width ? 'timeline-wide' : undefined);
      const year = node('div', row.date_label, /^\d{4}$/.test(row.date_label) ? 'year' : 'year year-range');
      const body = node('div'); body.append(node('h3', row.title));
      row.paragraphs.forEach(text => body.append(paragraph(text, row.reference_links)));
      card.append(year, body); fragment.append(card);
    });
    return fragment;
  }
  function article(row) {
    const card = node('article', undefined, 'press-card');
    card.id = row.id; card.dataset.archiveTags = row.categories.join(' '); card.dataset.date = row.date_sort;
    const meta = node('div', undefined, 'press-meta');
    const date = node('time', row.date_label);
    if (/^\d{4}-\d{2}-\d{2}$/.test(row.date_label)) {
      date.dateTime = row.date_label;
      date.textContent = new Date(row.date_label + 'T12:00:00Z').toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
    }
    meta.append(node('span', row.article_type), date);
    card.append(meta, node('p', [row.publisher, row.author].filter(Boolean).join(' · '), 'press-publisher'), node('h3', row.title), node('p', row.summary));
    if (row.source_note) {
      const context = node('div', undefined, 'press-context');
      context.append(node('strong', 'Context'), node('p', row.source_note)); card.append(context);
    }
    card.append(link(row.metadata?.video_id ? 'Watch original video ↗' : 'Read original source ↗', row.source_url, 'press-link'));
    return card;
  }
  function source(row) {
    const a = link('', row.url, 'source'); a.id = row.id;
    const number = row.id.replace('source-', '').padStart(2, '0');
    const body = node('div'); body.append(node('span', row.publisher_label), node('strong', row.title), node('small', 'Read the source'));
    a.append(node('span', number, 'source-number'), body); return a;
  }
  async function read(table, order, signal) {
    const url = new URL(`/rest/v1/bfc_${table}`, config.url);
    url.searchParams.set('select', '*'); url.searchParams.set('order', order);
    const response = await fetch(url, {headers:{apikey:config.publishableKey}, signal});
    if (!response.ok) throw new Error(`History request failed: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('Invalid history response');
    return rows;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  Promise.all([
    read('companies', 'sort_order.asc,id.asc', controller.signal),
    read('timeline', 'sort_order.asc,id.asc', controller.signal),
    read('articles', 'date_sort.desc,id.asc', controller.signal),
    read('sources', 'id.asc', controller.signal),
    read('media', 'sort_order.asc,id.asc', controller.signal)
  ]).then(([companies, events, articles, sources, media]) => {
    // Build every section before changing the page; malformed data leaves the saved history intact.
    const companyNodes = companies.map(company);
    const timelineNodes = timeline(events);
    const articleNodes = articles.map(article);
    const sourceNodes = sources.sort((a,b) => Number(a.id.slice(7)) - Number(b.id.slice(7))).map(source);
    const photoUpdates = media.filter(row => row.kind === 'image').flatMap(row => {
      const file = row.metadata?.file;
      if (!file) return [];
      const image = [...document.querySelectorAll('#memories img')].find(img => img.getAttribute('src') === 'photos/' + file);
      return image ? [{image, url:safeUrl(row.url)}] : [];
    });
    document.querySelector('.story-grid').replaceChildren(...companyNodes);
    document.querySelector('#timeline .timeline').replaceChildren(timelineNodes);
    document.getElementById('press-grid').replaceChildren(...articleNodes);
    document.querySelector('.source-grid').replaceChildren(...sourceNodes);
    photoUpdates.forEach(({image, url}) => { image.src = url; image.closest('a').href = url; });
    document.documentElement.dataset.contentSource = 'supabase';
    document.dispatchEvent(new Event('bfc:content'));
  }).catch(() => { document.documentElement.dataset.contentSource = 'snapshot'; })
    .finally(() => clearTimeout(timeout));
})();
