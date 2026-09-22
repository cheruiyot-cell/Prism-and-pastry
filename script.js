/* =========================================================
   PRISM & PASTRY — v4
   Changes in this version (audit fixes):
   - Replaced AOS with IntersectionObserver (no CDN dependency)
   - Scoped builder inputs to #builder
   - Removed dead code (shareLocation, dataset.amount)
   - Preloader hides on `load` (no artificial delay)
   - openWhatsApp uses location.href (popup-blocker safe)
   - Removed fabricated scarcity toasts
   - M-Pesa success reveals a "Continue on WhatsApp" button
     instead of auto-navigating (avoids popup blocking)
   - Extracted describeSpec() to remove duplication
   - Gallery items are now <button class="gallery-item">
   - No external AOS dependency
========================================================= */

(function () {
  'use strict';

  const WHATSAPP_NUMBER = '254702555093';
  const WA_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;
  const CART_KEY = 'pp_cart_v1';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Utilities ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function kes(n) {
    return `KES ${Number(n).toLocaleString('en-KE')}`;
  }

  // location.href works both inside and outside user-gesture contexts
  // (unlike window.open, which popup blockers may reject after async delays).
  function openWhatsApp(message) {
    const url = message ? `${WA_BASE}?text=${encodeURIComponent(message)}` : WA_BASE;
    window.location.href = url;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  // Focus trap helper
  function makeFocusTrap(container) {
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let previouslyFocused = null;
    let active = false;

    const getFocusable = () =>
      $$(FOCUSABLE, container).filter((el) => el.offsetParent !== null && !el.hasAttribute('inert'));

    function onKeydown(e) {
      if (e.key !== 'Tab' || !active) return;
      const items = getFocusable();
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    return {
      activate() {
        if (active) return;
        active = true;
        previouslyFocused = document.activeElement;
        container.setAttribute('aria-hidden', 'false');
        document.addEventListener('keydown', onKeydown, true);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
          const items = getFocusable();
          (items[0] || container).focus({ preventScroll: true });
        });
      },
      deactivate() {
        if (!active) return;
        active = false;
        container.setAttribute('aria-hidden', 'true');
        document.removeEventListener('keydown', onKeydown, true);
        document.body.style.overflow = '';
        if (previouslyFocused && previouslyFocused.focus) {
          previouslyFocused.focus({ preventScroll: true });
        }
      }
    };
  }

  // ---------- Reveal-on-scroll (replaces AOS) ----------
  function initReveal() {
    const els = $$('[data-aos]');
    if (!els.length) return;

    // Respect `data-aos-delay`
    els.forEach((el) => {
      const delay = el.getAttribute('data-aos-delay');
      if (delay) el.style.transitionDelay = `${delay}ms`;
    });

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('aos-animate'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    els.forEach((el) => io.observe(el));
  }

  // ---------- Preloader ----------
  function hidePreloader() {
    const preloader = $('#preloader');
    if (!preloader || preloader.classList.contains('hidden')) return;
    preloader.classList.add('hidden');
    setTimeout(() => {
      if (preloader.parentNode) preloader.remove();
    }, 400);
  }

  if (document.readyState === 'complete') {
    hidePreloader();
  } else {
    window.addEventListener('load', hidePreloader, { once: true });
  }
  // Safety net if `load` never fires (blocked resource, slow 3G, etc.)
  setTimeout(hidePreloader, 2500);

  // ---------- Scroll progress ----------
  const scrollProgress = $('#scroll-progress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        scrollProgress.style.width = `${(window.scrollY / total) * 100}%`;
      }
    }, { passive: true });
  }

  // ---------- Mobile menu ----------
  const menuToggle = $('#menu-toggle');
  const navLinks = $('#nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = navLinks.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') &&
          !navLinks.contains(e.target) &&
          e.target !== menuToggle) {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
    $$('a', navLinks).forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- Header scroll shadow (class toggle, not inline style) ----------
  const siteHeader = $('#site-header');
  if (siteHeader) {
    window.addEventListener('scroll', () => {
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  // ---------- FAQ accordion ----------
  $$('.faq-item').forEach((item) => {
    const q = $('.faq-question', item);
    if (!q) return;
    q.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      $$('.faq-item').forEach((i) => {
        i.classList.remove('active');
        const qi = $('.faq-question', i);
        if (qi) qi.setAttribute('aria-expanded', 'false');
      });
      if (!wasActive) {
        item.classList.add('active');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ---------- WhatsApp link routing ----------
  $$('.wa-link').forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const msg = this.dataset.message;
      if (msg) openWhatsApp(msg);
    });
  });

  // =========================================================
  // CART
  // =========================================================
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(cart)) cart = [];
  } catch {
    cart = [];
  }

  const cartDrawer = $('#cart-drawer');
  const cartBackdrop = $('#cart-backdrop');
  const cartBody = $('#cart-body');
  const cartFooter = $('#cart-footer');
  const cartCount = $('#cart-count');
  const cartSubtotalEl = $('#cart-subtotal');
  const cartDiscountRow = $('#cart-discount-row');
  const cartDiscountEl = $('#cart-discount');
  const cartTotalEl = $('#cart-total');
  const cartCheckoutBtn = $('#cart-checkout-btn');
  const cartTrap = cartDrawer ? makeFocusTrap(cartDrawer) : null;

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch { /* quota exceeded — silently ignore */ }
  }

  function cartSubtotal() {
    return cart.reduce((s, i) => s + i.price * i.qty, 0);
  }

  function cartDiscountTotal() {
    return cart.reduce((s, i) => s + (i.discount || 0) * i.qty, 0);
  }

  function cartItemCount() {
    return cart.reduce((n, i) => n + i.qty, 0);
  }

  function renderCart() {
    const count = cartItemCount();

    if (cartCount) {
      cartCount.textContent = String(count);
      cartCount.classList.toggle('is-empty', count === 0);
    }
    const cartBtn = $('#cart-button');
    if (cartBtn) {
      cartBtn.setAttribute('aria-label', `Open cart, ${count} item${count === 1 ? '' : 's'}`);
    }

    if (!cartBody) return;

    if (!cart.length) {
      cartBody.innerHTML = `
        <div class="cart-empty">
          <p class="cart-empty-icon" aria-hidden="true">🛍️</p>
          <p class="cart-empty-title">Your cart is empty.</p>
          <p class="cart-empty-sub">Start with a cake — you can always add extras at checkout.</p>
          <a href="#builder" class="cta-btn secondary" id="cart-empty-cta">Build a cake</a>
        </div>`;
      if (cartFooter) cartFooter.hidden = true;
      return;
    }

    if (cartFooter) cartFooter.hidden = false;

    cartBody.innerHTML = cart.map((item, idx) => `
      <article class="cart-item" data-index="${idx}">
        <div class="cart-item-head">
          <h3 class="cart-item-title">${escapeHtml(item.title)}</h3>
          <button type="button" class="cart-item-remove" data-action="remove" data-index="${idx}" aria-label="Remove ${escapeHtml(item.title)}">×</button>
        </div>
        ${item.detail ? `<p class="cart-item-detail">${escapeHtml(item.detail)}</p>` : ''}
        <div class="cart-item-foot">
          <div class="qty-stepper" role="group" aria-label="Quantity for ${escapeHtml(item.title)}">
            <button type="button" data-action="dec" data-index="${idx}" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button type="button" data-action="inc" data-index="${idx}" aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-item-price">${kes(item.price * item.qty)}</span>
        </div>
        ${item.discount ? `<p class="cart-item-savings">Saved ${kes(item.discount * item.qty)} on this bundle</p>` : ''}
      </article>
    `).join('');

    const sub = cartSubtotal();
    const disc = cartDiscountTotal();
    if (cartSubtotalEl) cartSubtotalEl.textContent = kes(sub);
    if (cartTotalEl) cartTotalEl.textContent = kes(sub - disc);
    if (cartDiscountRow && cartDiscountEl) {
      if (disc > 0) {
        cartDiscountRow.hidden = false;
        cartDiscountEl.textContent = `− ${kes(disc)}`;
      } else {
        cartDiscountRow.hidden = true;
      }
    }
  }

  function addToCart(item) {
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      existing.qty += item.qty || 1;
    } else {
      cart.push({ ...item, qty: item.qty || 1 });
    }
    saveCart();
    renderCart();
    openCartDrawer();
  }

  function openCartDrawer() {
    if (!cartDrawer || !cartBackdrop || !cartTrap) return;
    cartBackdrop.hidden = false;
    requestAnimationFrame(() => {
      cartDrawer.classList.add('active');
      cartBackdrop.classList.add('active');
    });
    cartTrap.activate();
  }

  function closeCartDrawer() {
    if (!cartDrawer || !cartBackdrop || !cartTrap) return;
    cartDrawer.classList.remove('active');
    cartBackdrop.classList.remove('active');
    setTimeout(() => {
      cartBackdrop.hidden = true;
    }, 250);
    cartTrap.deactivate();
  }

  const cartBtn = $('#cart-button');
  if (cartBtn) cartBtn.addEventListener('click', openCartDrawer);
  if ($('#cart-close')) $('#cart-close').addEventListener('click', closeCartDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCartDrawer);

  if (cartBody) {
    cartBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) {
        if (e.target.closest('#cart-empty-cta')) closeCartDrawer();
        return;
      }
      const idx = parseInt(btn.dataset.index, 10);
      const action = btn.dataset.action;
      if (Number.isNaN(idx) || !cart[idx]) return;

      if (action === 'remove') cart.splice(idx, 1);
      else if (action === 'inc') cart[idx].qty += 1;
      else if (action === 'dec') {
        cart[idx].qty -= 1;
        if (cart[idx].qty < 1) cart.splice(idx, 1);
      }
      saveCart();
      renderCart();
    });
  }

  // =========================================================
  // ORDER FORM
  // =========================================================
  const orderOverlay = $('#order-overlay');
  const orderForm = $('#order-form');
  const orderTrap = orderOverlay ? makeFocusTrap(orderOverlay) : null;

  const nameInput = $('#order-name');
  const phoneInput = $('#order-phone');
  const estateInput = $('#order-estate');
  const estateField = $('#estate-field');
  const dateInput = $('#order-date');
  const notesInput = $('#order-notes');
  const rushWarning = $('#rush-warning');

  function setFieldError(inputEl, errorEl, message) {
    if (!inputEl || !errorEl) return;
    if (message) {
      inputEl.setAttribute('aria-invalid', 'true');
      errorEl.textContent = message;
    } else {
      inputEl.removeAttribute('aria-invalid');
      errorEl.textContent = '';
    }
  }

  function validateKenyanPhone(raw) {
    const cleaned = String(raw).replace(/[\s\-()]/g, '');
    return /^(\+?254|0)(7|1)\d{8}$/.test(cleaned);
  }

  function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  }

  function isWithin48Hours(dateStr) {
    if (!dateStr) return false;
    const chosen = new Date(dateStr + 'T23:59:59');
    return (chosen - Date.now()) < 48 * 60 * 60 * 1000;
  }

  function updateFulfilmentFields() {
    const checked = document.querySelector('input[name="fulfilment"]:checked');
    if (!checked || !estateField || !estateInput) return;
    const isDelivery = checked.value === 'delivery';
    estateField.hidden = !isDelivery;
    if (isDelivery) {
      estateInput.setAttribute('required', '');
    } else {
      estateInput.removeAttribute('required');
      const err = $('#estate-error');
      setFieldError(estateInput, err, '');
    }
  }

  function openOrderForm() {
    if (!cart.length || !orderOverlay || !orderTrap) return;
    if (dateInput) dateInput.min = todayISO();
    orderOverlay.classList.add('active');
    orderTrap.activate();
  }

  function closeOrderForm() {
    if (!orderOverlay || !orderTrap) return;
    orderOverlay.classList.remove('active');
    orderTrap.deactivate();
  }

  $$('input[name="fulfilment"]').forEach((r) => {
    r.addEventListener('change', updateFulfilmentFields);
  });

  if (dateInput) {
    dateInput.addEventListener('change', () => {
      if (rushWarning) {
        rushWarning.hidden = !(dateInput.value && isWithin48Hours(dateInput.value));
      }
      setFieldError(dateInput, $('#date-error'), '');
    });
  }

  if (phoneInput) phoneInput.addEventListener('input', () => setFieldError(phoneInput, $('#phone-error'), ''));
  if (nameInput) nameInput.addEventListener('input', () => setFieldError(nameInput, $('#name-error'), ''));
  if (estateInput) estateInput.addEventListener('input', () => setFieldError(estateInput, $('#estate-error'), ''));

  if ($('#order-close')) $('#order-close').addEventListener('click', closeOrderForm);
  if (orderOverlay) {
    orderOverlay.addEventListener('click', (e) => {
      if (e.target === orderOverlay) closeOrderForm();
    });
  }

  function composeOrderMessage(formData, items) {
    const lines = ["Hi Prism & Pastry! I'd like to place an order:", ''];

    items.forEach((i) => {
      lines.push(`• ${i.title} — ${kes(i.price)} ×${i.qty}`);
      if (i.detail) lines.push(`   ${i.detail}`);
    });

    const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
    const disc = items.reduce((s, i) => s + (i.discount || 0) * i.qty, 0);
    lines.push('');
    lines.push(`Subtotal: ${kes(sub)}`);
    if (disc > 0) lines.push(`Bundle discount: −${kes(disc)}`);
    lines.push(`Total: ${kes(sub - disc)}`);
    lines.push('');
    lines.push('--- Order details ---');
    lines.push(`Name: ${formData.name}`);
    lines.push(`Phone: ${formData.phone}`);
    lines.push(formData.fulfilment === 'delivery'
      ? `Fulfilment: Delivery to ${formData.estate}`
      : 'Fulfilment: Pickup in Imara Daima');
    lines.push(`Date needed: ${formData.date}`);
    if (formData.notes) lines.push(`Notes: ${formData.notes}`);
    lines.push('');
    lines.push('Please confirm the delivery fee and send payment details.');
    return lines.join('\n');
  }

  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      if (!nameInput.value.trim()) {
        setFieldError(nameInput, $('#name-error'), 'Please tell us your name.');
        valid = false;
      } else {
        setFieldError(nameInput, $('#name-error'), '');
      }

      if (!phoneInput.value.trim()) {
        setFieldError(phoneInput, $('#phone-error'), 'We need this to confirm your order.');
        valid = false;
      } else if (!validateKenyanPhone(phoneInput.value)) {
        setFieldError(phoneInput, $('#phone-error'), 'Use a Kenyan number, e.g. 0712 345 678 or +254 712 345 678.');
        valid = false;
      } else {
        setFieldError(phoneInput, $('#phone-error'), '');
      }

      const fulfilmentChecked = document.querySelector('input[name="fulfilment"]:checked');
      const fulfilment = fulfilmentChecked ? fulfilmentChecked.value : 'pickup';
      if (fulfilment === 'delivery' && !estateInput.value.trim()) {
        setFieldError(estateInput, $('#estate-error'), 'Which estate or area should we deliver to?');
        valid = false;
      }

      if (!dateInput.value) {
        setFieldError(dateInput, $('#date-error'), 'Pick the date you need the cake.');
        valid = false;
      } else if (dateInput.value < todayISO()) {
        setFieldError(dateInput, $('#date-error'), 'That date is in the past — pick a future date.');
        valid = false;
      } else {
        setFieldError(dateInput, $('#date-error'), '');
      }

      if (!valid) {
        const firstInvalid = orderForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const formData = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        fulfilment,
        estate: fulfilment === 'delivery' ? estateInput.value.trim() : '',
        date: dateInput.value,
        notes: notesInput.value.trim()
      };

      const message = composeOrderMessage(formData, cart);
      cart = [];
      saveCart();
      renderCart();
      closeOrderForm();
      orderForm.reset();
      updateFulfilmentFields();
      if (rushWarning) rushWarning.hidden = true;
      openWhatsApp(message);
    });
  }

  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', () => {
      closeCartDrawer();
      setTimeout(openOrderForm, 280);
    });
  }

  // =========================================================
  // M-PESA DEMO
  // =========================================================
  const mpesaOverlay = $('#mpesa-overlay');
  const mpesaLoader = $('#mpesa-loader');
  const mpesaSuccess = $('#mpesa-success');
  const mpesaError = $('#mpesa-error');
  const mpesaAmountEl = $('#mpesa-amount');
  const mpesaContinue = $('#mpesa-continue');
  const mpesaTrap = mpesaOverlay ? makeFocusTrap(mpesaOverlay) : null;
  let mpesaTimeout = null;
  let mpesaPendingMessage = '';

  // Kept for future wiring (e.g. a "Reserve with 50% deposit" button).
  // Not currently triggered from any visible UI element on this page.
  function triggerMpesaPayment(amount, pendingMessage) {
    if (!mpesaOverlay) return;
    mpesaPendingMessage = pendingMessage || '';
    if (mpesaAmountEl) mpesaAmountEl.textContent = `${kes(amount)}.00`;
    mpesaOverlay.classList.add('active');
    if (mpesaLoader) mpesaLoader.classList.remove('hidden');
    if (mpesaSuccess) mpesaSuccess.classList.add('hidden');
    if (mpesaError) mpesaError.classList.add('hidden');
    if (mpesaTrap) mpesaTrap.activate();

    mpesaTimeout = setTimeout(() => {
      if (mpesaLoader) mpesaLoader.classList.add('hidden');
      if (mpesaSuccess) mpesaSuccess.classList.remove('hidden');
      // No auto-navigation here: user clicks "Continue on WhatsApp"
      // below, which is synchronous and therefore not popup-blocked.
    }, 2200);
  }

  function closeMpesa() {
    clearTimeout(mpesaTimeout);
    if (!mpesaOverlay) return;
    mpesaOverlay.classList.remove('active');
    if (mpesaTrap) mpesaTrap.deactivate();
  }

  if ($('#mpesa-close')) $('#mpesa-close').addEventListener('click', closeMpesa);

  if (mpesaContinue) {
    mpesaContinue.addEventListener('click', () => {
      const msg = mpesaPendingMessage ||
        'Hi! I just completed a demo payment. Please confirm my order.';
      closeMpesa();
      openWhatsApp(msg);
    });
  }

  if ($('#mpesa-cancel')) {
    $('#mpesa-cancel').addEventListener('click', () => {
      clearTimeout(mpesaTimeout);
      if (mpesaLoader) mpesaLoader.classList.add('hidden');
      if (mpesaSuccess) mpesaSuccess.classList.add('hidden');
      if (mpesaError) mpesaError.classList.remove('hidden');
      setTimeout(closeMpesa, 1400);
    });
  }

  if (mpesaOverlay) {
    mpesaOverlay.addEventListener('click', (e) => {
      if (e.target === mpesaOverlay) closeMpesa();
    });
  }

  // Expose for future wiring (e.g. via DevTools or a real deposit CTA).
  window.__pp_triggerMpesaDemo = triggerMpesaPayment;

  // =========================================================
  // BUNDLE → CART
  // =========================================================
  const bundleItems = $$('.bundle-item');
  const bundleTotalEl = $('#bundle-total');
  const bundleOrderBtn = $('#bundle-order-btn');
  const bundleHint = $('#bundle-hint');

  function getSelectedBundle() {
    return bundleItems
      .filter((i) => i.classList.contains('selected'))
      .map((i) => ({
        id: i.dataset.id,
        title: ($('h3', i)?.textContent || '').trim(),
        price: parseInt(i.dataset.price, 10) || 0
      }));
  }

  function updateBundleTotal() {
    const selected = getSelectedBundle();
    const subtotal = selected.reduce((s, i) => s + i.price, 0);
    const applyDiscount = selected.length >= 2;
    const discount = applyDiscount ? Math.round(subtotal * 0.10) : 0;
    const total = subtotal - discount;

    if (bundleTotalEl) {
      if (applyDiscount) {
        bundleTotalEl.innerHTML = `${kes(total)} <span class="discount-note">(saved ${kes(discount)})</span>`;
      } else {
        bundleTotalEl.textContent = kes(total);
      }
    }
    if (bundleHint) {
      bundleHint.textContent = applyDiscount
        ? `Nice — you saved ${kes(discount)} on this bundle.`
        : 'Add one more item to unlock the 10% bundle discount.';
    }

    return { selected, subtotal, discount, total };
  }

  bundleItems.forEach((item) => {
    const toggle = () => {
      item.classList.toggle('selected');
      const cb = $('.bundle-checkbox', item);
      const isSel = item.classList.contains('selected');
      if (cb) cb.textContent = isSel ? '✓' : '+';
      item.setAttribute('aria-pressed', String(isSel));
      updateBundleTotal();
    };
    item.addEventListener('click', toggle);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  if (bundleOrderBtn) {
    bundleOrderBtn.addEventListener('click', () => {
      const { selected, subtotal, discount } = updateBundleTotal();
      if (selected.length < 1) return;

      const itemTitles = selected.map((i) => i.title).join(' + ');
      const detail = `${selected.length} item${selected.length === 1 ? '' : 's'} · ${kes(subtotal)} before discount`;

      addToCart({
        id: `bundle-${selected.map((i) => i.id).sort().join('-')}`,
        type: 'bundle',
        title: 'Bundle: ' + itemTitles,
        detail,
        price: subtotal,
        discount,
        qty: 1
      });
    });
  }

  updateBundleTotal();

  // =========================================================
  // CAKE BUILDER
  // =========================================================
  // Strictly scope to the builder — never select radios from the order form.
  const builderRoot = $('#builder');
  const builderInputs = builderRoot ? $$('input[type="radio"]', builderRoot) : [];
  const builderTotalEl = $('#builder-total');
  const builderCheckoutBtn = $('#builder-checkout-btn');
  const builderResetBtn = $('#builder-reset-btn');
  const summarySelections = $('#summary-selections');
  const quickPickBtns = $$('.quick-pick');
  const cakeLayer1 = $('.layer-1');
  const cakeLayer2 = $('.layer-2');
  const cakeLayer3 = $('.layer-3');
  const cakeFrosting = $('#cake-frosting');
  const cakeTopper = $('#cake-topper');

  const flavorColors = {
    '3000': '#f5c6c6',
    '3500': '#8b5a2b',
    '4000': '#c0392b',
    '4500': '#6f4e37',
    '4200': '#f0d9b5'
  };

  function cleanLabel(input) {
    const span = input.closest('.radio-card')?.querySelector('span');
    if (!span) return '';
    let text = '';
    span.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) text += n.textContent;
    });
    return text.trim().split(' (')[0].split(' (+')[0].trim();
  }

  function updateRadioCardClasses() {
    builderInputs.forEach((input) => {
      const card = input.closest('.radio-card');
      if (card) card.classList.toggle('selected', input.checked);
    });
  }

  function animatePrice() {
    if (prefersReducedMotion || !builderTotalEl) return;
    builderTotalEl.classList.remove('update');
    void builderTotalEl.offsetWidth;
    builderTotalEl.classList.add('update');
  }

  // Single source of truth for the human-readable spec line.
  function describeSpec(selected) {
    const parts = [];
    if (selected.flavor) parts.push(selected.flavor.label);
    if (selected.size) parts.push(selected.size.label);
    if (selected.theme) parts.push(selected.theme.label);
    if (selected.filling && selected.filling.value !== '0') parts.push(selected.filling.label);
    if (selected.topper && selected.topper.value !== '0') parts.push(selected.topper.label);
    if (selected.addon && selected.addon.value !== '0') parts.push(selected.addon.label);
    return parts.join(' · ');
  }

  function updateCakePreview(selected) {
    const color = (selected.flavor && flavorColors[selected.flavor.value]) || '#f5c6c6';
    [cakeLayer1, cakeLayer2, cakeLayer3].forEach((l) => {
      if (l) l.style.background = color;
    });

    const sizeVal = parseInt(selected.size?.value || 0, 10);
    const layers = sizeVal >= 3000 ? 3 : sizeVal >= 1500 ? 2 : 1;
    if (cakeLayer1) cakeLayer1.style.display = layers >= 1 ? 'block' : 'none';
    if (cakeLayer2) cakeLayer2.style.display = layers >= 2 ? 'block' : 'none';
    if (cakeLayer3) cakeLayer3.style.display = layers >= 3 ? 'block' : 'none';

    const topperVal = selected.topper?.value || '0';
    if (cakeTopper) {
      cakeTopper.textContent =
        topperVal === '200' ? '🖋️' :
        topperVal === '300' ? '🌼' :
        topperVal === '150' ? '🕯️' : '🎂';
    }

    const theme = selected.theme?.value || '0';
    if (cakeFrosting) {
      cakeFrosting.style.background =
        theme === '2500' ? '#ffd700' :
        theme === '2000' ? '#ff4d4d' :
        theme === '1500' ? '#f8b4d9' :
        theme === '1000' ? '#f0f0f0' : '#fff';
    }
  }

  function calculateBuilderTotal() {
    let total = 0;
    const selected = {};
    builderInputs.forEach((input) => {
      if (input.checked) {
        total += parseInt(input.value, 10) || 0;
        selected[input.name] = { value: input.value, label: cleanLabel(input) };
      }
    });

    if (builderTotalEl) builderTotalEl.textContent = kes(total);
    if (builderCheckoutBtn) {
      builderCheckoutBtn.textContent = `Add to Cart — ${kes(total)}`;
    }
    animatePrice();

    if (summarySelections) {
      summarySelections.innerHTML = `<p>${describeSpec(selected)}</p>`;
    }

    updateCakePreview(selected);
    return { selected, total };
  }

  builderInputs.forEach((input) => {
    input.addEventListener('change', () => {
      calculateBuilderTotal();
      updateRadioCardClasses();
      quickPickBtns.forEach((btn) => btn.classList.remove('active'));
    });
  });

  const presets = {
    classic:  { flavor: '3000', size: '0',    theme: '0',    filling: '500', topper: '200', addon: '150' },
    luxury:   { flavor: '3500', size: '1500', theme: '2500', filling: '500', topper: '300', addon: '150' },
    tropical: { flavor: '4500', size: '0',    theme: '1000', filling: '700', topper: '300', addon: '300' }
  };

  quickPickBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const values = presets[btn.dataset.preset];
      if (!values) return;
      builderInputs.forEach((input) => {
        if (values[input.name] === input.value) input.checked = true;
      });
      calculateBuilderTotal();
      updateRadioCardClasses();
      quickPickBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  if (builderResetBtn) {
    builderResetBtn.addEventListener('click', () => {
      builderInputs.forEach((input) => {
        const group = document.querySelectorAll(`input[name="${input.name}"]`);
        if (group[0]) group[0].checked = true;
      });
      calculateBuilderTotal();
      updateRadioCardClasses();
      quickPickBtns.forEach((b) => b.classList.remove('active'));
    });
  }

  function hashString(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
  }

  if (builderCheckoutBtn) {
    builderCheckoutBtn.addEventListener('click', () => {
      const { selected, total } = calculateBuilderTotal();

      const specKey = JSON.stringify(
        Object.fromEntries(Object.entries(selected).map(([k, v]) => [k, v.value]))
      );

      addToCart({
        id: `custom-${hashString(specKey)}`,
        type: 'custom',
        title: 'Custom Cake',
        detail: describeSpec(selected),
        price: total,
        qty: 1
      });
    });
  }

  calculateBuilderTotal();
  updateRadioCardClasses();

  // =========================================================
  // TASTING MODAL
  // =========================================================
  const tastingOverlay = $('#tasting-overlay');
  const openTastingBtn = $('#open-tasting-modal');
  const closeTastingBtn = $('#close-tasting-modal');
  const dateGrid = $('#date-grid');
  const timeGrid = $('#time-grid');
  const confirmTastingBtn = $('#confirm-tasting-btn');
  const tastingError = $('#tasting-error');
  const tastingTrap = tastingOverlay ? makeFocusTrap(tastingOverlay) : null;
  let selectedDate = '';
  let selectedTime = '';

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (dateGrid) {
    const now = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const label = `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'date-slot';
      btn.textContent = label;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        $$('.date-slot', dateGrid).forEach((b) => {
          b.classList.remove('selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        selectedDate = label;
        if (tastingError) tastingError.classList.remove('visible');
      });
      dateGrid.appendChild(btn);
    }
  }

  if (timeGrid) {
    $$('.time-slot', timeGrid).forEach((slot) => {
      slot.setAttribute('aria-pressed', 'false');
      slot.addEventListener('click', () => {
        $$('.time-slot', timeGrid).forEach((b) => {
          b.classList.remove('selected');
          b.setAttribute('aria-pressed', 'false');
        });
        slot.classList.add('selected');
        slot.setAttribute('aria-pressed', 'true');
        selectedTime = slot.dataset.time;
        if (tastingError) tastingError.classList.remove('visible');
      });
    });
  }

  function closeTasting() {
    if (!tastingOverlay || !tastingTrap) return;
    tastingOverlay.classList.remove('active');
    tastingTrap.deactivate();
  }

  if (openTastingBtn && tastingOverlay && tastingTrap) {
    openTastingBtn.addEventListener('click', () => {
      tastingOverlay.classList.add('active');
      tastingTrap.activate();
    });
  }
  if (closeTastingBtn) closeTastingBtn.addEventListener('click', closeTasting);
  if (tastingOverlay) {
    tastingOverlay.addEventListener('click', (e) => {
      if (e.target === tastingOverlay) closeTasting();
    });
  }
  if (confirmTastingBtn) {
    confirmTastingBtn.addEventListener('click', () => {
      if (!selectedDate || !selectedTime) {
        if (tastingError) tastingError.classList.add('visible');
        return;
      }
      const msg = `Hi Prism & Pastry! I'd like to book a FREE tasting session at your Imara Daima studio on ${selectedDate} at ${selectedTime}. Is this slot available?`;
      closeTasting();
      openWhatsApp(msg);
    });
  }

  // =========================================================
  // LIGHTBOX  (gallery items are now <button class="gallery-item">)
  // =========================================================
  const galleryItems = $$('.gallery-item');
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightbox-img');
  const lightboxCaption = $('#lightbox-caption');
  const lightboxClose = $('#lightbox-close');
  const lightboxPrev = $('#lightbox-prev');
  const lightboxNext = $('#lightbox-next');
  const lightboxTrap = lightbox ? makeFocusTrap(lightbox) : null;
  let currentIndex = 0;

  function updateLightbox() {
    const item = galleryItems[currentIndex];
    if (!item) return;
    const img = item.querySelector('img');
    if (lightboxImg && img) {
      lightboxImg.src = item.dataset.full || img.src;
      lightboxImg.alt = img.alt || '';
    }
    if (lightboxCaption) lightboxCaption.textContent = item.dataset.caption || '';
  }

  function openLightbox(index) {
    if (!lightbox || !lightboxTrap) return;
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    lightboxTrap.activate();
  }

  function closeLightbox() {
    if (!lightbox || !lightboxTrap) return;
    lightbox.classList.remove('active');
    lightboxTrap.deactivate();
  }

  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
      updateLightbox();
    });
  }
  if (lightboxNext) {
    lightboxNext.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % galleryItems.length;
      updateLightbox();
    });
  }

  // =========================================================
  // GLOBAL KEYBOARD
  // =========================================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (lightbox?.classList.contains('active')) closeLightbox();
      if (tastingOverlay?.classList.contains('active')) closeTasting();
      if (mpesaOverlay?.classList.contains('active')) closeMpesa();
      if (orderOverlay?.classList.contains('active')) closeOrderForm();
      if (cartDrawer?.classList.contains('active')) closeCartDrawer();
    }
    if (lightbox?.classList.contains('active')) {
      if (e.key === 'ArrowLeft' && lightboxPrev) lightboxPrev.click();
      if (e.key === 'ArrowRight' && lightboxNext) lightboxNext.click();
    }
  });

  // =========================================================
  // INIT
  // =========================================================
  initReveal();
  renderCart();
  updateFulfilmentFields();
})();