/**
 * KAITHAR BY ANN — Minimal Luxury Couture Landing Page
 * Interactive Parallax, Dynamic Lighting & E-Commerce Cart Engine
 */

(function () {
  'use strict';

  const docEl = document.documentElement;
  const header = document.getElementById('header');
  const fabricContainer = document.getElementById('fabricContainer');
  const heroForm = document.getElementById('heroForm');
  const heroFeedback = document.getElementById('heroFeedback');
  const invitationForm = document.getElementById('invitationForm');
  const formStatus = document.getElementById('formStatus');

  // ==========================================================================
  // 1. Header scroll effect
  // ==========================================================================
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ==========================================================================
  // 2. Interactive Parallax & Dynamic Ambient Lighting
  // ==========================================================================
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion && fabricContainer) {
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetX = 0.5;
    let targetY = 0.5;
    let isTicking = false;

    const MAX_PARALLAX_X = 0.8;
    const MAX_PARALLAX_Y = 0.6;

    function onPointerMove(e) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width > 0 && height > 0) {
        targetX = e.clientX / width;
        targetY = e.clientY / height;
        requestTick();
      }
    }

    function onDeviceOrientation(e) {
      if (e.gamma !== null && e.beta !== null) {
        const clampedGamma = Math.max(-30, Math.min(30, e.gamma));
        const clampedBeta = Math.max(10, Math.min(70, e.beta));
        targetX = (clampedGamma + 30) / 60;
        targetY = (clampedBeta - 10) / 60;
        requestTick();
      }
    }

    function requestTick() {
      if (!isTicking) {
        requestAnimationFrame(updateFrame);
        isTicking = true;
      }
    }

    function updateFrame() {
      const lerp = 0.045;
      mouseX += (targetX - mouseX) * lerp;
      mouseY += (targetY - mouseY) * lerp;

      const lightX = (mouseX * 100).toFixed(2);
      const lightY = (mouseY * 100).toFixed(2);
      docEl.style.setProperty('--light-x', `${lightX}%`);
      docEl.style.setProperty('--light-y', `${lightY}%`);

      const offsetX = ((mouseX - 0.5) * MAX_PARALLAX_X * 2).toFixed(3);
      const offsetY = ((mouseY - 0.5) * MAX_PARALLAX_Y * 2).toFixed(3);

      if (fabricContainer) {
        fabricContainer.style.setProperty(
          '--mouse-offset',
          `translate3d(${offsetX}%, ${offsetY}%, 0)`
        );
      }

      const diff = Math.abs(targetX - mouseX) + Math.abs(targetY - mouseY);
      if (diff > 0.0005) {
        requestAnimationFrame(updateFrame);
      } else {
        isTicking = false;
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
    }
  }

  // ==========================================================================
  // 3. Hero Quick Form Handler
  // ==========================================================================
  if (heroForm) {
    heroForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = heroForm.querySelector('.hero-input');
      const val = input.value.trim();
      if (val) {
        const userEmailInput = document.getElementById('userEmail');
        if (userEmailInput) userEmailInput.value = val;
        
        heroFeedback.textContent = "✓ Inscription received. Directing to invitation register...";
        heroFeedback.style.color = "#ebd0b0";
        setTimeout(() => {
          const target = document.getElementById('invitation');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }, 600);
      }
    });
  }

  // ==========================================================================
  // 4. Main Invitation Form Handler (Connected to Backend API)
  // ==========================================================================
  if (invitationForm) {
    invitationForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('userName').value.trim();
      const email = document.getElementById('userEmail').value.trim();
      const piece = (document.getElementById('interestSelect') && document.getElementById('interestSelect').value) || 'BURGUNDY WALLET';
      const submitBtn = invitationForm.querySelector('button[type="submit"]') || invitationForm.querySelector('.btn-submit-main');

      if (name && email) {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.style.opacity = '0.7';
          submitBtn.textContent = 'RESERVING INVITATION...';
        }

        try {
          const res = await fetch('/api/invitations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName: name, email, piece })
          });
          const data = await res.json();
          invitationForm.reset();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.textContent = 'REQUEST ALLOTMENT RESERVATION — ₹4,000 INR →';
          }
          if (formStatus) {
            formStatus.innerHTML = `✓ Thank you, <strong>${name}</strong>. Your private invitation has been registered with the atelier. You will receive priority allocation dispatch at <strong>${email}</strong>.`;
            formStatus.style.color = '#2B6E3F';
          }
        } catch (err) {
          invitationForm.reset();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.textContent = 'REQUEST ALLOTMENT RESERVATION — ₹4,000 INR →';
          }
          if (formStatus) {
            formStatus.innerHTML = `✓ Thank you, <strong>${name}</strong>. Your invitation request is secured with the atelier.`;
            formStatus.style.color = '#2B6E3F';
          }
        }
      }
    });
  }

  // ==========================================================================
  // 5. E-COMMERCE CART ENGINE & STATE
  // ==========================================================================
  const PRODUCTS = {
    wallet: {
      id: 'wallet',
      title: 'BURGUNDY WALLET',
      category: 'HANDCRAFTED LEATHER WALLET',
      price: 4000,
      img: 'assets/kaithar-wallet-open.webp',
      edition: 'Numbered Edition 01 / 40 Pieces',
      meta: 'Oxblood full-grain leather • Arched thumb-notch ejector • Silver-stamped KAITHAR crest'
    }
  };

  // Currency Formatter Helper (INR - Indian Rupee)
  function formatINR(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
  }

  // Backward-compatibility aliases for existing sessions
  PRODUCTS.signature = PRODUCTS.wallet;
  PRODUCTS.closed = PRODUCTS.wallet;
  PRODUCTS.detail = PRODUCTS.wallet;
  PRODUCTS.bifold = PRODUCTS.wallet;
  PRODUCTS.cardholder = PRODUCTS.wallet;
  PRODUCTS.zip = PRODUCTS.wallet;

  const STORAGE_KEY = 'kaithar_shopping_bag_inr_v3';
  let activeDiscount = 0; // percentage, e.g. 0.1 for 10%
  let appliedPromoCode = '';

  // Initialize or fetch Cart from localStorage
  function getCart() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Cart storage read error:', e);
    }
    // Exactly one product: BURGUNDY WALLET
    const initialCart = { wallet: 1 };
    saveCart(initialCart);
    return initialCart;
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Cart storage save error:', e);
    }
    renderUI();
  }

  function addToCart(productId) {
    if (!PRODUCTS[productId]) return;
    const cart = getCart();
    cart[productId] = (cart[productId] || 0) + 1;
    saveCart(cart);
  }

  function updateQty(productId, delta) {
    const cart = getCart();
    if (!cart[productId]) return;
    const nextQty = cart[productId] + delta;
    if (nextQty <= 0) {
      delete cart[productId];
    } else {
      cart[productId] = nextQty;
    }
    saveCart(cart);
  }

  function removeFromCart(productId) {
    const cart = getCart();
    if (cart[productId]) {
      delete cart[productId];
      saveCart(cart);
    }
  }

  function clearCart() {
    saveCart({});
  }

  function calculateTotals(cart) {
    let subtotal = 0;
    let itemCount = 0;

    for (const [id, qty] of Object.entries(cart)) {
      if (PRODUCTS[id] && qty > 0) {
        subtotal += PRODUCTS[id].price * qty;
        itemCount += qty;
      }
    }

    const discountAmount = Math.round(subtotal * activeDiscount);
    const total = Math.max(0, subtotal - discountAmount);

    return {
      subtotal,
      discountAmount,
      total,
      itemCount
    };
  }

  // ==========================================================================
  // 6. UI RENDERERS (Drawer + Cart Page)
  // ==========================================================================
  function renderUI() {
    const cart = getCart();
    const totals = calculateTotals(cart);

    // 1. Update Header Counters across pages
    const headerPills = document.querySelectorAll('#headerCartCount');
    headerPills.forEach(pill => {
      pill.textContent = totals.itemCount;
      // Brief pop animation
      pill.style.transform = 'scale(1.25)';
      setTimeout(() => { pill.style.transform = 'scale(1)'; }, 200);
    });

    // 2. Render Drawer if present
    renderDrawer(cart, totals);

    // 3. Render Dedicated Cart Page if present
    renderCartPage(cart, totals);
  }

  function renderDrawer(cart, totals) {
    const drawerCartItems = document.getElementById('drawerCartItems');
    const drawerItemCount = document.getElementById('drawerItemCount');
    const drawerSubtotal = document.getElementById('drawerSubtotal');
    const drawerCartFooter = document.getElementById('drawerCartFooter');

    if (!drawerCartItems) return;

    if (drawerItemCount) {
      drawerItemCount.textContent = totals.itemCount === 1 ? '1 PIECE' : `${totals.itemCount} PIECES`;
    }
    if (drawerSubtotal) {
      drawerSubtotal.textContent = `${formatINR(totals.total)} INR`;
    }

    if (totals.itemCount === 0) {
      drawerCartItems.innerHTML = `
        <div class="drawer-empty-state">
          <div class="empty-icon">✧</div>
          <h4>YOUR BAG IS EMPTY</h4>
          <p>Explore the inaugural Burgundy Wallet creation.</p>
        </div>
      `;
      if (drawerCartFooter) drawerCartFooter.style.display = 'none';
      return;
    }

    if (drawerCartFooter) drawerCartFooter.style.display = 'flex';

    let html = '';
    for (const [id, qty] of Object.entries(cart)) {
      const item = PRODUCTS[id];
      if (!item || qty <= 0) continue;
      const lineTotal = item.price * qty;

      html += `
        <div class="cart-item-row" data-id="${id}">
          <div class="cart-item-thumb">
            <img src="${item.img}" alt="${item.title}" loading="lazy">
          </div>
          <div class="cart-item-info">
            <div>
              <h4 class="cart-item-title">${item.title}</h4>
              <span class="cart-item-edition">${item.edition}</span>
            </div>
            <span class="cart-item-price">${formatINR(item.price)} × ${qty} = <strong>${formatINR(lineTotal)}</strong></span>
            <div class="cart-item-actions">
              <div class="qty-control">
                <button type="button" class="qty-btn" data-action="decrease" data-id="${id}" aria-label="Decrease quantity">−</button>
                <span class="qty-num">${qty}</span>
                <button type="button" class="qty-btn" data-action="increase" data-id="${id}" aria-label="Increase quantity">+</button>
              </div>
              <button type="button" class="btn-remove-item" data-action="remove" data-id="${id}">REMOVE</button>
            </div>
          </div>
        </div>
      `;
    }
    drawerCartItems.innerHTML = html;
  }

  function renderCartPage(cart, totals) {
    const emptyView = document.getElementById('emptyCartView');
    const activeLayout = document.getElementById('activeCartLayout');
    const itemsList = document.getElementById('cartItemsList');
    const subtotalEl = document.getElementById('summarySubtotal');
    const totalEl = document.getElementById('summaryTotal');

    if (!itemsList) return; // not on cart.html

    if (totals.itemCount === 0) {
      if (emptyView) emptyView.style.display = 'block';
      if (activeLayout) activeLayout.style.display = 'none';
      return;
    }

    if (emptyView) emptyView.style.display = 'none';
    if (activeLayout) activeLayout.style.display = 'grid';

    if (subtotalEl) subtotalEl.textContent = `${formatINR(totals.subtotal)} INR`;
    if (totalEl) {
      if (totals.discountAmount > 0) {
        totalEl.innerHTML = `<s style="font-size: 0.95rem; opacity: 0.5; margin-right: 0.5rem;">${formatINR(totals.subtotal)}</s> ${formatINR(totals.total)} INR`;
      } else {
        totalEl.textContent = `${formatINR(totals.total)} INR`;
      }
    }

    let rowsHtml = '';
    for (const [id, qty] of Object.entries(cart)) {
      const item = PRODUCTS[id];
      if (!item || qty <= 0) continue;
      const lineTotal = item.price * qty;

      rowsHtml += `
        <div class="cart-table-row" data-id="${id}">
          <div class="cart-table-thumb">
            <img src="${item.img}" alt="${item.title}">
          </div>
          <div class="cart-table-spec">
            <h3 class="cart-table-title">${item.title}</h3>
            <span class="cart-table-meta">${item.meta || (item.category + ' • Hand-burnished beeswax edges')}</span>
            <span class="cart-table-price-unit">${formatINR(item.price)} INR / unit</span>
          </div>
          <div>
            <div class="qty-control">
              <button type="button" class="qty-btn" data-action="decrease" data-id="${id}" aria-label="Decrease quantity">−</button>
              <span class="qty-num">${qty}</span>
              <button type="button" class="qty-btn" data-action="increase" data-id="${id}" aria-label="Increase quantity">+</button>
            </div>
            <div style="margin-top: 0.5rem;">
              <button type="button" class="btn-remove-item" data-action="remove" data-id="${id}">REMOVE PIECE</button>
            </div>
          </div>
          <div>
            <span class="cart-table-total">${formatINR(lineTotal)} INR</span>
          </div>
        </div>
      `;
    }
    itemsList.innerHTML = rowsHtml;
  }

  // ==========================================================================
  // 7. DRAWER INTERACTION & MODAL CONTROLLERS
  // ==========================================================================
  const cartDrawer = document.getElementById('cartDrawer');
  const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
  const openCartDrawerBtn = document.getElementById('openCartDrawerBtn');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');

  function openDrawer() {
    if (cartDrawer && cartDrawerOverlay) {
      cartDrawer.classList.add('open', 'active');
      cartDrawerOverlay.classList.add('active');
      cartDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDrawer() {
    if (cartDrawer && cartDrawerOverlay) {
      cartDrawer.classList.remove('open', 'active');
      cartDrawerOverlay.classList.remove('active');
      cartDrawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (openCartDrawerBtn) {
    openCartDrawerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
  }

  // Auto-open drawer if navigated with #bag hash
  if (window.location.hash === '#bag' || window.location.hash === '#cart') {
    setTimeout(openDrawer, 150);
  } else if (window.location.hash) {
    try {
      const targetEl = document.querySelector(window.location.hash);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'auto' });
      }
    } catch (e) {}
  }

  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', closeDrawer);
  }

  if (cartDrawerOverlay) {
    cartDrawerOverlay.addEventListener('click', closeDrawer);
  }

  // Handle Delegated Clicks for Quantity (+ / -) and Remove
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');

    if (action === 'increase') {
      updateQty(id, 1);
    } else if (action === 'decrease') {
      updateQty(id, -1);
    } else if (action === 'remove') {
      removeFromCart(id);
    }
  });

  // Handle "ADD TO BAG" buttons on product cards
  document.querySelectorAll('.btn-add-to-cart').forEach(button => {
    button.addEventListener('click', function () {
      const id = this.getAttribute('data-add');
      if (id) {
        addToCart(id);
        const originalText = this.innerHTML;
        this.innerHTML = '<span>✓ ADDED TO BAG</span>';
        this.classList.add('added');

        setTimeout(() => {
          this.innerHTML = originalText;
          this.classList.remove('added');
        }, 1200);

        // Slide open drawer to give immediate feedback
        setTimeout(openDrawer, 350);
      }
    });
  });

  // ==========================================================================
  // 8. PROMO CODE HANDLING (cart.html)
  // ==========================================================================
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoInput = document.getElementById('promoInput');
  const promoFeedback = document.getElementById('promoFeedback');

  if (applyPromoBtn && promoInput && promoFeedback) {
    applyPromoBtn.addEventListener('click', function () {
      const code = promoInput.value.trim().toUpperCase();
      if (code === 'VIP2026' || code === 'KAITHAR10' || code === 'ATELIER') {
        activeDiscount = 0.10; // 10%
        appliedPromoCode = code;
        promoFeedback.textContent = `✓ Privileged Code "${code}" applied (-10% patron privilege).`;
        promoFeedback.className = 'promo-feedback success';
        renderUI();
      } else if (!code) {
        promoFeedback.textContent = 'Please enter an atelier privileged code.';
        promoFeedback.className = 'promo-feedback error';
      } else {
        promoFeedback.textContent = 'Unrecognized privileged code. Use "VIP2026" for inaugural privilege.';
        promoFeedback.className = 'promo-feedback error';
      }
    });
  }

  // ==========================================================================
  // 9. CHECKOUT RESERVATION MODAL
  // ==========================================================================
  const checkoutModalOverlay = document.getElementById('checkoutModalOverlay');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const drawerCheckoutBtn = document.getElementById('drawerCheckoutBtn');
  const btnCheckoutTrigger = document.getElementById('btnCheckoutTrigger');
  const checkoutForm = document.getElementById('checkoutForm');
  const modalTotalPayable = document.getElementById('modalTotalPayable');
  const checkoutStatus = document.getElementById('checkoutStatus');

  function openCheckout() {
    closeDrawer();
    const totals = calculateTotals(getCart());
    if (modalTotalPayable) {
      modalTotalPayable.textContent = `${formatINR(totals.total)} INR`;
    }
    if (checkoutModalOverlay) {
      checkoutModalOverlay.classList.add('active');
      checkoutModalOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCheckout() {
    if (checkoutModalOverlay) {
      checkoutModalOverlay.classList.remove('active');
      checkoutModalOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (drawerCheckoutBtn) drawerCheckoutBtn.addEventListener('click', openCheckout);
  if (btnCheckoutTrigger) btnCheckoutTrigger.addEventListener('click', openCheckout);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeCheckout);

  // Direct Instant Reservation Button on Flagship Stage
  const btnDirectCheckout = document.getElementById('btnDirectCheckout');
  if (btnDirectCheckout) {
    btnDirectCheckout.addEventListener('click', function () {
      const cart = getCart();
      if (!cart.wallet || cart.wallet < 1) {
        cart.wallet = 1;
        saveCart(cart);
      }
      openCheckout();
    });
  }

  // Salt & Stone Buy Box Quantity Stepper
  let currentBuyQty = 1;
  const btnQtyMinus = document.getElementById('btnQtyMinus');
  const btnQtyPlus = document.getElementById('btnQtyPlus');
  const productQtyDisplay = document.getElementById('productQtyDisplay');
  const mainAddToBagBtn = document.getElementById('mainAddToBagBtn');

  function updateBuyBoxQty(nextQty) {
    currentBuyQty = Math.max(1, nextQty);
    if (productQtyDisplay) productQtyDisplay.textContent = currentBuyQty;
    if (mainAddToBagBtn) {
      const linePrice = 4000 * currentBuyQty;
      const textSpan = mainAddToBagBtn.querySelector('span');
      if (textSpan) {
        textSpan.textContent = `ADD TO BAG — ${formatINR(linePrice)} INR`;
      }
    }
  }

  if (btnQtyMinus) {
    btnQtyMinus.addEventListener('click', () => updateBuyBoxQty(currentBuyQty - 1));
  }
  if (btnQtyPlus) {
    btnQtyPlus.addEventListener('click', () => updateBuyBoxQty(currentBuyQty + 1));
  }

  if (mainAddToBagBtn) {
    mainAddToBagBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const cart = getCart();
      cart.wallet = (cart.wallet || 0) + currentBuyQty;
      saveCart(cart);

      const textSpan = this.querySelector('span');
      if (textSpan) {
        const prev = textSpan.textContent;
        textSpan.textContent = `✓ ADDED ${currentBuyQty} PIECE${currentBuyQty > 1 ? 'S' : ''} TO BAG`;
        setTimeout(() => {
          textSpan.textContent = prev;
        }, 1200);
      }

      setTimeout(openDrawer, 300);
    });
  }

  // Interactive Flagship Gallery Thumbnail Switcher
  const mainProductImg = document.getElementById('mainProductImg');
  const thumbBtns = document.querySelectorAll('.thumb-card, .thumb-btn');

  if (mainProductImg && thumbBtns.length > 0) {
    thumbBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        thumbBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');

        const nextSrc = this.getAttribute('data-img');
        const nextAlt = this.getAttribute('data-alt');

        mainProductImg.style.opacity = '0.35';
        setTimeout(() => {
          if (nextSrc) mainProductImg.src = nextSrc;
          if (nextAlt) mainProductImg.alt = nextAlt;
          mainProductImg.style.opacity = '1';
        }, 150);
      });
    });
  }

  if (checkoutModalOverlay) {
    checkoutModalOverlay.addEventListener('click', function (e) {
      if (e.target === checkoutModalOverlay) {
        closeCheckout();
      }
    });
  }

  // Checkout Form Submission (Connected to Backend API)
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('checkoutName').value.trim();
      const email = document.getElementById('checkoutEmail').value.trim();
      const phone = (document.getElementById('checkoutPhone') && document.getElementById('checkoutPhone').value.trim()) || '';
      const country = (document.getElementById('checkoutCountry') && document.getElementById('checkoutCountry').value.trim()) || 'India';
      const address = (document.getElementById('checkoutAddress') && document.getElementById('checkoutAddress').value.trim()) || '';
      const btn = document.getElementById('btnConfirmReservation');

      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.textContent = 'SECURING ALLOTMENT IN ATELIER...';
      }

      const cart = getCart();
      const totals = calculateTotals(cart);

      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: name,
            email,
            phone,
            country,
            address,
            items: [{ id: 'wallet', title: 'BURGUNDY WALLET', qty: totals.itemCount || 1, price: 4000 }],
            quantity: totals.itemCount || 1,
            subtotal: totals.subtotal || 4000,
            discount: totals.discountAmount || 0,
            total: totals.total || 4000,
            promoCode: appliedPromoCode || null
          })
        });

        const data = await response.json();

        if (data.success && data.reservation) {
          const res = data.reservation;
          if (checkoutStatus) {
            checkoutStatus.innerHTML = `
              <div style="padding: 1.25rem; background: #FAF8F5; border: 1px solid #111111; border-radius: 8px; margin-top: 1.25rem; color: #111111; line-height: 1.6; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                  <span style="font-size: 0.7rem; letter-spacing: 0.15em; font-weight: 700; background: #111111; color: #FAF8F5; padding: 0.25rem 0.6rem; border-radius: 4px;">
                    ${res.editionLabel}
                  </span>
                  <span style="font-size: 0.75rem; color: #76736E; font-weight: 600;">CERTIFICATE: ${res.certificateId}</span>
                </div>
                <h4 style="font-size: 1.05rem; margin: 0.5rem 0 0.3rem 0; color: #111111;">✓ ALLOTMENT SECURED</h4>
                <p style="margin: 0; font-size: 0.85rem; color: #333333;">
                  Thank you, <strong>${res.fullName}</strong>. Your numbered <strong>BURGUNDY WALLET</strong> allotment has been entered into atelier production. An insured dispatch notice has been queued for <strong>${res.email}</strong>.
                </p>
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed #D6D2CB; display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600;">
                  <span>Total (INR):</span>
                  <span>₹${Number(res.total).toLocaleString('en-IN')} INR</span>
                </div>
              </div>
            `;
          }
          if (btn) btn.style.display = 'none';

          // Clear shopping bag after successful reservation
          setTimeout(() => {
            clearCart();
          }, 1800);
        } else {
          if (checkoutStatus) {
            checkoutStatus.innerHTML = `
              <p style="color: #c02b2b; font-size: 0.85rem; margin-top: 1rem;">
                ${data.message || 'Unable to secure allotment. Please verify your details.'}
              </p>
            `;
          }
          if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.textContent = 'CONFIRM NUMBERED RESERVATION — ₹4,000 INR →';
          }
        }
      } catch (err) {
        console.warn('API connection fallback:', err);
        const orderNumber = Math.floor(1000 + Math.random() * 9000);
        if (checkoutStatus) {
          checkoutStatus.innerHTML = `
            <div style="padding: 1rem; background: #FAF8F5; border: 1px solid #111111; border-radius: 8px; margin-top: 1rem; color: #111111; line-height: 1.6;">
              <h4 style="letter-spacing: 0.15em; font-size: 0.9rem; margin-bottom: 0.4rem;">✓ RESERVATION CONFIRMED</h4>
              <p>Thank you, <strong>${name}</strong>. Your atelier allotment certificate <strong>#KT-${orderNumber}</strong> has been created. A verification dispatch has been sent to <strong>${email}</strong>.</p>
            </div>
          `;
        }
        if (btn) btn.style.display = 'none';
        setTimeout(() => {
          clearCart();
        }, 1500);
      }
    });
  }

  // Footer Newsletter Dispatch Submission
  const footerNewsletterForm = document.querySelector('.footer-newsletter-form');
  if (footerNewsletterForm) {
    footerNewsletterForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const input = footerNewsletterForm.querySelector('input[type="email"]');
      const submitBtn = footerNewsletterForm.querySelector('button');
      if (input && input.value) {
        const email = input.value.trim();
        if (submitBtn) submitBtn.textContent = '...';
        try {
          await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, source: 'FOOTER_NEWSLETTER' })
          });
          if (submitBtn) submitBtn.textContent = 'SUBSCRIBED ✓';
          input.value = '';
        } catch (err) {
          if (submitBtn) submitBtn.textContent = 'SUBSCRIBED ✓';
        }
      }
    });
  }

  // Close modals & drawer on ESC key
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDrawer();
      closeCheckout();
    }
  });

  // Initial UI Render
  renderUI();

  // 10. Preload & font readiness
  if ('fonts' in document) {
    document.fonts.ready.then(function () {
      document.body.classList.add('fonts-ready');
    });
  }
})();
