// ================= ANIMATIONS.JS =================
// "Field Notes" theme — GSAP + ScrollTrigger for orchestration,
// Lenis for smooth scroll, and a hand-authored ink-draw system
// (SVG stroke-dashoffset) for the site's signature motion.
// Load gsap.min.js, ScrollTrigger.min.js, lenis.min.js BEFORE this file.

document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     0. SHARED SVG FILTER — turns straight lines into ink strokes.
        Injected once; every .ink-stroke element references it.
  --------------------------------------------------------- */
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('class', 'ink-defs');
  defs.innerHTML = `
    <filter id="ink-rough" x="-20%" y="-200%" width="140%" height="500%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018 0.9" numOctaves="2" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
  document.body.prepend(defs);
  document.querySelectorAll('.ink-stroke').forEach((el) => el.setAttribute('filter', 'url(#ink-rough)'));

  /* ---------------------------------------------------------
     1. LENIS SMOOTH SCROLL
  --------------------------------------------------------- */
  let lenis;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------------------------------------------------------
     2. INK-DRAW HELPERS
  --------------------------------------------------------- */
  function prepStroke(el) {
    const len = el.getTotalLength ? el.getTotalLength() : 100;
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    return len;
  }

  // Draw once, on load or when scrolled into view.
  function drawOnReveal(el, { delay = 0, duration = 0.9, trigger = null } = {}) {
    const len = prepStroke(el);
    if (reduceMotion) { el.style.strokeDashoffset = 0; return; }
    if (!window.gsap) { el.style.strokeDashoffset = 0; return; }
    const vars = { strokeDashoffset: 0, duration, delay, ease: 'power2.out' };
    if (trigger) {
      vars.scrollTrigger = { trigger, start: 'top 82%', toggleActions: 'play none none none' };
      gsap.to(el, vars);
    } else {
      gsap.to(el, vars);
    }
  }

  // Draw scrubbed to scroll position (used for the timeline ink line).
  function drawOnScrub(el, container) {
    prepStroke(el);
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) { el.style.strokeDashoffset = 0; return; }
    gsap.to(el, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: container, start: 'top 75%', end: 'bottom 65%', scrub: 0.6 }
    });
  }

  // Draw on hover, stays drawn.
  function drawOnHover(el, card) {
    const len = prepStroke(el);
    let drawn = false;
    card.addEventListener('mouseenter', () => {
      if (drawn || reduceMotion) { el.style.strokeDashoffset = 0; return; }
      drawn = true;
      if (window.gsap) gsap.to(el, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out' });
      else el.style.strokeDashoffset = 0;
    });
  }

  /* ---------------------------------------------------------
     3. GSAP + SCROLLTRIGGER SETUP
  --------------------------------------------------------- */
  if (window.gsap) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    // Hero entrance timeline
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (!reduceMotion) {
      heroTl
        .from('.eyebrow', { y: -16, opacity: 0, duration: 0.5 })
        .from('h1', { y: 34, opacity: 0, duration: 0.8 }, '-=0.25')
        .from('.intro', { y: 24, opacity: 0, duration: 0.7 }, '-=0.45')
        .from('.hero-actions .button', { y: 18, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.35')
        .from('.profile-card', { scale: 0.94, opacity: 0, duration: 0.7 }, '-=0.5');
    } else {
      gsap.set(['.eyebrow', 'h1', '.intro', '.hero-actions .button', '.profile-card'], { opacity: 1, y: 0, scale: 1 });
    }

    // Hero underline + seal ring draw in right after headline lands
    document.querySelectorAll('.ink-underline-wrap .ink-stroke').forEach((el) => {
      drawOnReveal(el, { delay: reduceMotion ? 0 : 0.9, duration: 1.1 });
    });
    document.querySelectorAll('.seal-ring .ink-stroke').forEach((el) => {
      drawOnReveal(el, { delay: reduceMotion ? 0 : 0.5, duration: 1.0 });
    });

    // Heading underlines — draw once the heading scrolls into view
    document.querySelectorAll('.heading-underline .ink-stroke').forEach((el) => {
      drawOnReveal(el, { duration: 0.8, trigger: el.closest('.heading-underline') });
    });

    // Timeline ink line — scrubbed to scroll
    document.querySelectorAll('.timeline-line .ink-stroke').forEach((el) => {
      drawOnScrub(el, el.closest('.timeline'));
    });

    // Pen swatch ink stroke — draws on hover
    document.querySelectorAll('.pen-swatch').forEach((card) => {
      const stroke = card.querySelector('.ink-stroke');
      if (stroke) drawOnHover(stroke, card);
    });

    // Scroll-triggered reveals for every .reveal element
    document.querySelectorAll('.reveal').forEach((el) => {
      gsap.fromTo(el,
        { y: 28, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.75, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });

    // Staggered groups
    document.querySelectorAll('.reveal-stagger').forEach((group) => {
      gsap.fromTo(group.children,
        { y: 22, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.13,
          scrollTrigger: { trigger: group, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });

    // Tag cloud — elastic "ink stamp" pop-in with slight rotation
    const tags = document.querySelectorAll('.tag-cloud span');
    if (tags.length && !reduceMotion) {
      tags.forEach((t) => { t.style.setProperty('--r', `${(Math.random() * 6 - 3).toFixed(1)}deg`); });
      gsap.fromTo(tags,
        { scale: 0.5, opacity: 0, rotate: 0 },
        {
          scale: 1, opacity: 1, rotate: (i, el) => parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 0,
          duration: 0.6, ease: 'elastic.out(1, 0.55)', stagger: 0.06,
          scrollTrigger: { trigger: '.tag-cloud', start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    }
  } else {
    // No GSAP fallback
    document.querySelectorAll('.ink-stroke').forEach((el) => { prepStroke(el); el.style.strokeDashoffset = 0; });
  }

  /* ---------------------------------------------------------
     4. STICKY HEADER STATE + SCROLL PROGRESS
  --------------------------------------------------------- */
  const track = document.createElement('div');
  track.className = 'scroll-progress-track';
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  track.appendChild(progressBar);
  document.body.appendChild(track);

  const header = document.querySelector('.site-header');

  function updateOnScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
    if (header) {
      if (scrollTop > 12) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
  }
  if (lenis) lenis.on('scroll', updateOnScroll);
  else window.addEventListener('scroll', updateOnScroll, { passive: true });
  updateOnScroll();

  /* ---------------------------------------------------------
     5. INK CURSOR + CLICK BLOT (desktop, motion-safe only)
  --------------------------------------------------------- */
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    const cursor = document.createElement('div');
    cursor.className = 'ink-cursor';
    document.body.appendChild(cursor);

    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.add('visible');
    });

    function follow() {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
      requestAnimationFrame(follow);
    }
    requestAnimationFrame(follow);

    window.addEventListener('mousedown', (e) => {
      const blot = document.createElement('div');
      blot.className = 'ink-blot';
      const size = 6;
      blot.style.width = size + 'px';
      blot.style.height = size + 'px';
      blot.style.left = e.clientX + 'px';
      blot.style.top = e.clientY + 'px';
      document.body.appendChild(blot);
      if (window.gsap) {
        gsap.to(blot, {
          width: 46, height: 46, opacity: 0, duration: 0.55, ease: 'power2.out',
          onComplete: () => blot.remove()
        });
      } else {
        blot.remove();
      }
    });
  }

  /* ---------------------------------------------------------
     6. FALLBACK SCROLL REVEAL (in case GSAP isn't loaded)
  --------------------------------------------------------- */
  if (!window.gsap) {
    const revealTargets = document.querySelectorAll('.reveal, .reveal-stagger');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------
     7. BACK TO TOP BUTTON
  --------------------------------------------------------- */
  const topBtn = document.createElement('div');
  topBtn.className = 'back-to-top';
  topBtn.innerHTML = '&uarr;';
  topBtn.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(topBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) topBtn.classList.add('visible');
    else topBtn.classList.remove('visible');
  }, { passive: true });

  topBtn.addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.1 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------------------------------------------------------
     8. DARK MODE TOGGLE
  --------------------------------------------------------- */
  const STORAGE_KEY = 'site-theme';
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialDark = saved ? saved === 'dark' : prefersDark;
  if (initialDark) document.body.classList.add('dark-mode');

  const nav = document.querySelector('.site-header nav');
  if (nav) {
    const wrapper = document.createElement('div');
    wrapper.className = 'header-right';

    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle dark mode');
    toggle.innerHTML = '<span class="toggle-knob">' + (document.body.classList.contains('dark-mode') ? '🌙' : '☀️') + '</span>';

    toggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
      toggle.querySelector('.toggle-knob').textContent = isDark ? '🌙' : '☀️';
    });

    nav.parentNode.insertBefore(wrapper, nav.nextSibling);
    wrapper.appendChild(nav);
    wrapper.appendChild(toggle);
  }
});
