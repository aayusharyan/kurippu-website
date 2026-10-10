// One-time arrival animations. Adds .is-in to each [data-arrive] element the first time it scrolls
// into view; the CSS for each lives with its section and only hides anything once <html> has
// .has-arrivals, so the page is complete if this script never runs.

const DURATION = 1100; // matches the sync meter's fill

/**
 * Count a [data-count] figure up from 0 to the number in its markup.
 * Progress uses ease-out cubic so the last digits linger.
 */
function countUp(el: HTMLElement) {
  const target = Number(el.textContent);
  if (!Number.isFinite(target)) return;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION);
    el.textContent = String(Math.round(target * (1 - (1 - t) ** 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * Watch [data-arrive] nodes and fire each once they enter view.
 * Skips entirely when IntersectionObserver is missing or reduced motion is on.
 */
export function mountArrivals() {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('has-arrivals');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        e.target.classList.add('is-in');
        e.target.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
      }
    },
    { threshold: 0.25, rootMargin: '0px 0px -10% 0px' },
  );
  document.querySelectorAll('[data-arrive]').forEach((el) => io.observe(el));
}
