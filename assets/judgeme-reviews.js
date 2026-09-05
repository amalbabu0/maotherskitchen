function parseRealReviews(root) {
  const reviews = [];
  const sources = root.querySelectorAll('[data-jdgm-source]');
  sources.forEach((source) => {
    source.querySelectorAll('.jdgm-rev').forEach((rev) => {
      const ratingEl = rev.querySelector('.jdgm-rev__rating');
      const bodyEl = rev.querySelector('.jdgm-rev__body');
      const authorEl = rev.querySelector('.jdgm-rev__author');
      const timeEl = rev.querySelector('.jdgm-rev__timestamp');
      const rating = ratingEl ? parseInt(ratingEl.dataset.score, 10) : 5;
      const quote = bodyEl ? bodyEl.textContent.trim() : '';
      const author = authorEl ? authorEl.textContent.trim() : 'Verified Buyer';
      const product = rev.dataset.productTitle || '';
      const id = rev.dataset.reviewId || `${author}-${quote}`;
      const datetime = timeEl ? timeEl.getAttribute('datetime') : '';
      if (quote) reviews.push({ id, rating, quote, author, product, datetime });
    });
  });

  const seen = new Set();
  const deduped = reviews.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  deduped.sort((a, b) => (b.datetime || '').localeCompare(a.datetime || ''));
  return deduped.slice(0, 12);
}

function parseFallbackReviews(root) {
  const template = root.querySelector('[data-testimonial-fallback]');
  if (!template) return [];
  return Array.from(template.content.querySelectorAll('li')).map((li) => ({
    id: li.dataset.author + li.dataset.quote,
    rating: parseInt(li.dataset.rating, 10) || 5,
    quote: li.dataset.quote || '',
    author: li.dataset.author || 'Happy Customer',
    product: li.dataset.product || '',
  }));
}

function starsSvg(filled) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M10 1.5l2.6 5.6 6.1.6-4.6 4.2 1.3 6-5.4-3.1-5.4 3.1 1.3-6L1.3 7.7l6.1-.6L10 1.5Z');
  if (filled) {
    svg.setAttribute('fill', 'currentColor');
  } else {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.2');
  }
  svg.appendChild(path);
  return svg;
}

function buildCard(review) {
  const li = document.createElement('li');
  li.className = 'judgeme-reviews__card';

  const quoteIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  quoteIcon.setAttribute('class', 'judgeme-reviews__quote-icon');
  quoteIcon.setAttribute('viewBox', '0 0 32 24');
  quoteIcon.setAttribute('fill', 'currentColor');
  quoteIcon.setAttribute('aria-hidden', 'true');
  const qPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  qPath.setAttribute('d', 'M0 24V14.4C0 6.4 4.8 1.2 12.8 0l1.6 3.2C9.2 4.4 6.8 7.2 6.4 11.2H12.8V24H0ZM17.6 24V14.4C17.6 6.4 22.4 1.2 30.4 0L32 3.2C26.8 4.4 24.4 7.2 24 11.2H30.4V24H17.6Z');
  quoteIcon.appendChild(qPath);
  li.appendChild(quoteIcon);

  const stars = document.createElement('div');
  stars.className = 'judgeme-reviews__stars';
  stars.setAttribute('aria-label', `${review.rating} out of 5 stars`);
  for (let i = 1; i <= 5; i++) stars.appendChild(starsSvg(i <= review.rating));
  li.appendChild(stars);

  const quote = document.createElement('p');
  quote.className = 'judgeme-reviews__quote';
  quote.textContent = `“${review.quote}”`;
  li.appendChild(quote);

  const person = document.createElement('div');
  person.className = 'judgeme-reviews__person';

  const avatar = document.createElement('div');
  avatar.className = 'judgeme-reviews__avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = review.author
    .split(' ')
    .map((w) => w.slice(0, 1))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  person.appendChild(avatar);

  const personText = document.createElement('div');
  personText.className = 'judgeme-reviews__person-text';

  const author = document.createElement('p');
  author.className = 'judgeme-reviews__author';
  author.textContent = review.author;
  personText.appendChild(author);

  if (review.product) {
    const product = document.createElement('p');
    product.className = 'judgeme-reviews__product';
    product.textContent = review.product;
    personText.appendChild(product);
  }

  person.appendChild(personText);
  li.appendChild(person);

  return li;
}

function initDots(section, track, count) {
  const dotsWrap = section.querySelector('[data-testimonial-dots]');
  if (!dotsWrap || count < 2) return;
  dotsWrap.hidden = false;
  const cards = Array.from(track.children);

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'judgeme-reviews__dot' + (i === 0 ? ' is-active' : '');
    dot.dataset.dotIndex = String(i);
    dot.setAttribute('aria-label', `Show review ${i + 1}`);
    dot.addEventListener('click', () => {
      cards[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
    dotsWrap.appendChild(dot);
  }

  const dots = Array.from(dotsWrap.children);
  let ticking = false;
  const setActive = () => {
    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;
    let closest = 0;
    let closestDist = Infinity;
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const dist = Math.abs(rect.left + rect.width / 2 - center);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    });
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === closest));
  };
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { setActive(); ticking = false; });
  });
}

document.querySelectorAll('[data-judgeme-reviews-section]').forEach((section) => {
  const track = section.querySelector('[data-testimonial-track]');
  const emptyMsg = section.querySelector('[data-testimonial-empty]');
  if (!track) return;

  let reviews = parseRealReviews(section);
  if (reviews.length === 0) reviews = parseFallbackReviews(section);

  if (reviews.length === 0) {
    if (emptyMsg) emptyMsg.hidden = false;
    return;
  }

  reviews.forEach((review) => track.appendChild(buildCard(review)));
  track.hidden = false;
  initDots(section, track, reviews.length);
});
