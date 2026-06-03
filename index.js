/* ============================================
   🍒 SAD OWOCOWY — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Header Scroll Effect ───
  const header = document.getElementById('header');

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ─── Mobile Menu Toggle ───
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    mainNav.classList.toggle('mobile-open');
    document.body.style.overflow = mainNav.classList.contains('mobile-open') ? 'hidden' : '';
  });

  // Close mobile menu on link click
  mainNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('open');
      mainNav.classList.remove('mobile-open');
      document.body.style.overflow = '';
    });
  });

  // ─── Active Nav Link on Scroll ───
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');

  const updateActiveNav = () => {
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('data-section') === id) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // ─── Tab Switching ───
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  window.switchTab = function(tabId) {
    tabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });

    tabPanels.forEach(panel => {
      panel.classList.remove('active');
      // Force reflow for animation
      void panel.offsetWidth;
    });

    const targetPanel = document.getElementById(`panel-${tabId}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    // Reveal elements inside newly active tab
    setTimeout(() => {
      revealElements();
    }, 100);
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // ─── Scroll Reveal Animation ───
  const revealElements = () => {
    const reveals = document.querySelectorAll('.reveal');
    const windowHeight = window.innerHeight;

    reveals.forEach(el => {
      const top = el.getBoundingClientRect().top;
      const revealPoint = 120;

      if (top < windowHeight - revealPoint) {
        el.classList.add('visible');
      }
    });
  };

  window.addEventListener('scroll', revealElements, { passive: true });
  revealElements();

  // ─── Smooth Scroll for Anchor Links ───
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ─── Stat Counter Animation ───
  const animateCounters = () => {
    const statValues = document.querySelectorAll('.stat-value');

    statValues.forEach(el => {
      if (el.dataset.animated) return;

      const rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;

      el.dataset.animated = 'true';
      const text = el.textContent;
      const numMatch = text.match(/(\d+)/);

      if (numMatch) {
        const target = parseInt(numMatch[1]);
        const prefix = text.substring(0, text.indexOf(numMatch[1]));
        const suffix = text.substring(text.indexOf(numMatch[1]) + numMatch[1].length);
        const duration = 1800;
        const startTime = performance.now();

        const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

        const tick = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeOutExpo(progress);
          const current = Math.floor(target * easedProgress);

          el.textContent = prefix + current + suffix;

          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            el.textContent = text;
          }
        };

        requestAnimationFrame(tick);
      }
    });
  };

  window.addEventListener('scroll', animateCounters, { passive: true });
  setTimeout(animateCounters, 500);

  // ─── Parallax Effect on Hero ───
  const heroBg = document.querySelector('.hero-bg img');

  if (heroBg) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBg.style.transform = `scale(${1.05 + scrolled * 0.0002}) translateY(${scrolled * 0.3}px)`;
      }
    }, { passive: true });
  }

});
