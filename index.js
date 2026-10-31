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

  const closeMenu = () => {
    menuToggle.classList.remove('open');
    mainNav.classList.remove('mobile-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    mainNav.classList.toggle('mobile-open');
    menuToggle.setAttribute('aria-expanded', String(mainNav.classList.contains('mobile-open')));
    document.body.style.overflow = mainNav.classList.contains('mobile-open') ? 'hidden' : '';
  });

  // Close mobile menu on link or "Zamów teraz" click (not only .nav-link)
  mainNav.querySelectorAll('.nav-link, .nav-cta').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Never leave the page locked if the viewport grows past the mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1000 && mainNav.classList.contains('mobile-open')) closeMenu();
  }, { passive: true });

  // ─── Active Nav Link on Scroll ───
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');

  const updateActiveNav = () => {
    const scrollPos = window.scrollY + 130;
    let active = 'home';
    sections.forEach(section => { if (section.offsetTop <= scrollPos) active = section.id; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) active = 'kontakt';
    navLinks.forEach(link => {
      const selected = link.dataset.section === active;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

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
      const href = this.getAttribute('href');
      e.preventDefault();
      // A bare "#" (logo) means "back to top"; querySelector('#') would throw.
      if (href === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      let target = null;
      try { target = document.querySelector(href); } catch { target = null; }
      if (target) {
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ─── Order Form: KG Slider + Delivery Logic ───
  const slider = document.getElementById('iloscSlider');
  const sliderKg = document.querySelector('.slider-kg');
  const hiddenInput = document.getElementById('iloscHidden');
  const deliveryHint = document.getElementById('deliveryHint');
  const deliveryOptionDowoz = document.getElementById('deliveryOptionDowoz');
  const radioDowoz = document.getElementById('radioDowoz');
  const radioOdbior = document.getElementById('radioOdbior');
  const deliveryMinNote = document.getElementById('deliveryMinNote');
  const adresGroup = document.getElementById('adresGroup');

  function updateSlider() {
    if (!slider) return;
    const val = parseInt(slider.value);
    sliderKg.textContent = val;
    hiddenInput.value = val;

    // Update slider track fill
    const pct = ((val - 1) / 49) * 100;
    slider.style.background = `linear-gradient(to right, var(--cherry-500) ${pct}%, #e8e0d8 ${pct}%)`;

    if (val >= 5) {
      // Delivery available
      deliveryHint.textContent = 'Dowóz do około 20 km — termin i koszt do ustalenia';
      deliveryHint.classList.remove('inactive');
      deliveryOptionDowoz.classList.remove('delivery-option-disabled');
      deliveryMinNote.style.display = 'none';
      radioDowoz.disabled = false;
    } else {
      // Delivery NOT available
      deliveryHint.textContent = 'Dowóz od 5 kg';
      deliveryHint.classList.add('inactive');
      deliveryOptionDowoz.classList.add('delivery-option-disabled');
      radioDowoz.disabled = true;
      radioDowoz.checked = false;
      radioOdbior.checked = true;
      deliveryMinNote.style.display = 'block';
    }

    // Show/hide address field based on delivery selection
    updateAdresVisibility();
  }

  function updateAdresVisibility() {
    if (!adresGroup) return;
    const addressInput = document.getElementById('adres');
    if (radioDowoz && radioDowoz.checked) {
      adresGroup.style.display = '';
      addressInput.required = true;
      addressInput.disabled = false;
    } else {
      adresGroup.style.display = 'none';
      addressInput.required = false;
      addressInput.disabled = true;
    }
  }

  if (slider) {
    slider.addEventListener('input', updateSlider);
    // Also listen for delivery radio changes
    if (radioDowoz) radioDowoz.addEventListener('change', updateAdresVisibility);
    if (radioOdbior) radioOdbior.addEventListener('change', updateAdresVisibility);
    // Init
    updateSlider();
  }

});
