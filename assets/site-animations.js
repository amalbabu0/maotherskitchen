// Scroll-triggered reveals for selected homepage sections
const revealTargets = document.querySelectorAll(
  '.trust-bar, [id*="why_choose_us"] .section, [id*="featured_blog"] .feat-card, .blog-post-item'
);

if (revealTargets.length && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealTargets.forEach((el, i) => {
    el.classList.add('reveal-on-scroll');
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 80}ms`;
    revealObserver.observe(el);
  });
}

// Soft shimmer placeholder for product/blog images while they load
const shimmerImages = document.querySelectorAll(
  '.card-gallery img, .blog-post-item img, .product-card__content img'
);

shimmerImages.forEach((img) => {
  if (img.complete && img.naturalWidth > 0) return;
  img.classList.add('img-loading');
  img.addEventListener(
    'load',
    () => img.classList.remove('img-loading'),
    { once: true }
  );
  img.addEventListener(
    'error',
    () => img.classList.remove('img-loading'),
    { once: true }
  );
});

// Resume any autoplaying video (e.g. the hero) that the browser paused
// while the tab was backgrounded — mobile browsers don't resume this on
// their own when the visitor switches back.
function resumeAutoplayVideos() {
  document.querySelectorAll('video[autoplay]').forEach((video) => {
    if (video.paused && !video.ended) {
      video.play().catch(() => {});
    }
  });
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') resumeAutoplayVideos();
});

// iOS Safari blocks .play() calls that aren't triggered by a direct user
// gesture, so the visibilitychange resume above can get silently blocked
// there — a real tap on the page always counts as a gesture, so use the
// visitor's first tap/click as a backstop to resume anything still paused.
document.addEventListener('click', resumeAutoplayVideos, { once: true, capture: true });
document.addEventListener('touchend', resumeAutoplayVideos, { once: true, capture: true });

// Shopify Inbox chat bubble: hide the "Chat" text label, icon only.
// The button_text theme setting has no icon-only option, and the label span
// lives inside an open shadow root without its own `part` attribute, so
// ::part() can't reach it — direct DOM access is the only way in.
(function hideChatButtonLabel() {
  function apply(root) {
    const label = root.querySelector('.activator__label');
    if (label) label.style.setProperty('display', 'none', 'important');
  }
  function watch(chat) {
    if (!chat.shadowRoot) return false;
    apply(chat.shadowRoot);
    new MutationObserver(() => apply(chat.shadowRoot)).observe(chat.shadowRoot, {
      childList: true,
      subtree: true,
    });
    return true;
  }
  const existing = document.querySelector('shopify-chat');
  if (existing && watch(existing)) return;
  const bodyObserver = new MutationObserver(() => {
    const chat = document.querySelector('shopify-chat');
    if (chat && watch(chat)) bodyObserver.disconnect();
  });
  bodyObserver.observe(document.documentElement, { childList: true, subtree: true });
})();

// Quick pulse on Add to Cart buttons when clicked
document.addEventListener('click', (event) => {
  const button = event.target.closest('button[name="add"]');
  if (!button) return;
  button.classList.remove('btn-pulse');
  // Force reflow so the animation restarts on rapid re-clicks
  void button.offsetWidth;
  button.classList.add('btn-pulse');
  setTimeout(() => button.classList.remove('btn-pulse'), 450);
});
