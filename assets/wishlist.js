const STORAGE_KEY = 'mk_wishlist';

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

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function setWishlist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  document.dispatchEvent(new CustomEvent('wishlist:change', { detail: { list } }));
}

class WishlistButton extends HTMLElement {
  connectedCallback() {
    this.handle = this.dataset.handle;
    this.button = this.querySelector('button');
    this.refresh();
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });
    document.addEventListener('wishlist:change', () => this.refresh());
  }

  refresh() {
    const saved = getWishlist().includes(this.handle);
    this.classList.toggle('is-saved', saved);
    this.button.setAttribute('aria-pressed', String(saved));
  }

  toggle() {
    const list = getWishlist();
    const index = list.indexOf(this.handle);
    if (index === -1) {
      list.push(this.handle);
    } else {
      list.splice(index, 1);
    }
    setWishlist(list);
  }
}

class WishlistCount extends HTMLElement {
  connectedCallback() {
    this.refresh();
    document.addEventListener('wishlist:change', () => this.refresh());
  }

  refresh() {
    const count = getWishlist().length;
    this.textContent = count;
    this.hidden = count === 0;
  }
}

class WishlistGrid extends HTMLElement {
  async connectedCallback() {
    const handles = getWishlist();
    if (handles.length === 0) {
      this.innerHTML = '<p class="wishlist-empty">Your wishlist is empty. Tap the heart on any product to save it here.</p>';
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
      this.innerHTML = '<p class="wishlist-empty">Your wishlist is empty. Tap the heart on any product to save it here.</p>';
      return;
    }

    this.innerHTML = `<div class="wishlist-grid">${valid.map((p) => this.renderCard(p)).join('')}</div>`;

    this.querySelectorAll('[data-remove-handle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const list = getWishlist().filter((h) => h !== btn.dataset.removeHandle);
        setWishlist(list);
        btn.closest('.wishlist-card').remove();
        if (getWishlist().length === 0) this.connectedCallback();
      });
    });
  }

  renderCard(product) {
    const image = escapeUrl(product.featured_image || (product.images && product.images[0]) || '');
    const url = escapeUrl(product.url);
    const title = escapeHtml(product.title);
    const handle = escapeHtml(product.handle);
    const price = escapeHtml(
      (product.price / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
    );
    return `
      <div class="wishlist-card">
        <a href="${url}" class="wishlist-card__link">
          <img src="${image}" alt="${title}" loading="lazy" class="wishlist-card__image">
          <p class="wishlist-card__title">${title}</p>
          <p class="wishlist-card__price">${price}</p>
        </a>
        <button type="button" class="wishlist-card__remove" data-remove-handle="${handle}">Remove</button>
      </div>
    `;
  }
}

if (!customElements.get('wishlist-button')) customElements.define('wishlist-button', WishlistButton);
if (!customElements.get('wishlist-count')) customElements.define('wishlist-count', WishlistCount);
if (!customElements.get('wishlist-grid')) customElements.define('wishlist-grid', WishlistGrid);
