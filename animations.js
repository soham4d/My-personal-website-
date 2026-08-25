// ================= ANIMATIONS.JS =================
// Uses GSAP + ScrollTrigger, Lenis (smooth scroll), and Anime.js
// Make sure gsap.min.js, ScrollTrigger.min.js, lenis.min.js, anime.min.js are loaded BEFORE this file.

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     1. LENIS SMOOTH SCROLL
  --------------------------------------------------------- */
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync Lenis with GSAP ScrollTrigger
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------------------------------------------------------
     2. GSAP + SCROLLTRIGGER SETUP
  --------------------------------------------------------- */
  if (window.gsap) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    // Hero entrance timeline
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from('.eyebrow', { y: -20, opacity: 0, duration: 0.6 })
      .from('h1', { y: 40, opacity: 0, duration: 0.9 }, '-=0.3')
      .from('.intro', { y: 30, opacity: 0, duration: 0.8 }, '-=0.5')
      .from('.hero-actions .button', { y: 20, opacity: 0, duration: 0.6, stagger: 0.12 }, '-=0.4')
      .from('.profile-card', { scale: 0.9, opacity: 0, duration: 0.8 }, '-=0.6');

    // Scroll-triggered reveals for every .reveal element
    document.querySelectorAll('.reveal').forEach((el) => {
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });

    // Staggered groups
    document.querySelectorAll('.reveal-stagger').forEach((group) => {
      gsap.fromTo(group.children,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.15,
          scrollTrigger: { trigger: group, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });

    // Parallax hero blobs
    gsap.utils.toArray('.hero').forEach((hero) => {
      gsap.to(hero, {
        backgroundPosition: '50% 30%',
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------------------------------------------------------
     3. ANIME.JS MICRO-INTERACTIONS
  --------------------------------------------------------- */
  if (window.anime) {
    // Animated underline sweep on nav links (re-triggerable on hover)
    document.querySelectorAll('nav a').forEach((link) => {
      link.addEventListener('mouseenter', () => {
        anime({
          targets: link,
          scale: [1, 1.08],
          duration: 250,
          easing: 'easeOutQuad'
        });
      });
      link.addEventListener('mouseleave', () => {
        anime({
          targets: link,
          scale: [1.08, 1],
          duration: 250,
          easing: 'easeOutQuad'
        });
      });
    });

    // Avatar pulse using anime.js loop
    const avatar = document.querySelector('.avatar');
    if (avatar) {
      anime({
        targets: avatar,
        scale: [1, 1.05, 1],
        duration: 2600,
        easing: 'easeInOutSine',
        loop: true
      });
    }

    // Tag cloud pop-in with elastic easing
    const tags = document.querySelectorAll('.tag-cloud span');
    if (tags.length) {
      const tagObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: entry.target,
              scale: [0.6, 1],
              opacity: [0, 1],
              duration: 600,
              easing: 'easeOutElastic(1, 0.6)',
              delay: anime.stagger(60)
            });
            tagObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      tags.forEach((t) => tagObserver.observe(t));
    }
  }

  /* ---------------------------------------------------------
     4. STICKY HEADER STATE + SCROLL PROGRESS
  --------------------------------------------------------- */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);

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

  if (lenis) {
    lenis.on('scroll', updateOnScroll);
  } else {
    window.addEventListener('scroll', updateOnScroll, { passive: true });
  }
  updateOnScroll();

  /* ---------------------------------------------------------
     5. CURSOR GLOW (desktop only)
  --------------------------------------------------------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    window.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
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
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
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
