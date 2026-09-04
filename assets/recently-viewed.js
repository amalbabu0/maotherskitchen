const STORAGE_KEY = 'mk_recently_viewed';
const MAX_ITEMS = 8;

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

function escapeUrl(value) {
  const str = String(value ?? '');
  return /^(https?:)?\//i.test(str) ? escapeHtml(str) : '#';
}

function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

class RecentlyViewedTracker extends HTMLElement {
  connectedCallback() {
    const handle = this.dataset.handle;
    if (!handle) return;
    const list = getRecentlyViewed().filter((h) => h !== handle);
    list.unshift(handle);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  }
}

class RecentlyViewedGrid extends HTMLElement {
  async connectedCallback() {
    const exclude = this.dataset.excludeHandle;
    const limit = Number(this.dataset.limit) || 4;
    const handles = getRecentlyViewed()
      .filter((h) => h !== exclude)
      .slice(0, limit);

    if (handles.length === 0) {
      this.hidden = true;
      return;
    }

    const products = await Promise.all(
      handles.map((handle) =>
        fetch(`/products/${handle}.js`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );

    const valid = products.filter(Boolean);
    if (valid.length === 0) {
      this.hidden = true;
      return;
    }

    this.innerHTML = `<h3 class="recently-viewed-heading">Recently Viewed</h3><div class="recently-viewed-grid">${valid.map((p) => this.renderCard(p)).join('')}</div>`;
  }

  renderCard(product) {
    const image = escapeUrl(product.featured_image || (product.images && product.images[0]) || '');
    const url = escapeUrl(product.url);
    const title = escapeHtml(product.title);
    const price = escapeHtml(
      (product.price / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
    );
    return `
      <a href="${url}" class="recently-viewed-card">
        <img src="${image}" alt="${title}" loading="lazy" class="recently-viewed-card__image">
        <p class="recently-viewed-card__title">${title}</p>
        <p class="recently-viewed-card__price">${price}</p>
      </a>
    `;
  }
}

if (!customElements.get('recently-viewed-tracker')) customElements.define('recently-viewed-tracker', RecentlyViewedTracker);
if (!customElements.get('recently-viewed-grid')) customElements.define('recently-viewed-grid', RecentlyViewedGrid);
