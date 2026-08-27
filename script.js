/* =========================================
   PRISM & PASTRY - PREMIUM LOGIC
========================================= */

// 1. Initialize AOS
AOS.init({ duration: 800, easing: 'ease-in-out', once: true });

// 2. Preloader Logic
window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
            setTimeout(() => { preloader.remove(); AOS.refresh(); }, 500);
        }
    }, 1200);
});

// Extra safety: also remove preloader after 5 seconds if load event hasn't fired
setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hidden');
}, 5000);

// 3. Mobile Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');
const header = document.querySelector('.site-header');

menuToggle.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent immediate close
    navLinks.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && e.target !== menuToggle) {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    }
});

// Close menu when a nav link is clicked (so user can navigate)
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    });
});

// 4. Header Shadow
const siteHeader = document.getElementById('site-header');
window.addEventListener('scroll', () => {
    siteHeader.style.boxShadow = window.scrollY > 50 ? '0 4px 12px rgba(0,0,0,0.1)' : 'none';
});

// 5. FAQ Accordion
document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question').addEventListener('click', () => {
        document.querySelectorAll('.faq-item').forEach(i => {
            i.classList.remove('active');
            i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
        item.classList.add('active');
        item.querySelector('.faq-question').setAttribute('aria-expanded', 'true');
    });
});

// 6. Smart WhatsApp Routing
document.querySelectorAll('.wa-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const message = this.dataset.message;
        window.open(`https://wa.me/254702555093?text=${encodeURIComponent(message)}`, '_blank');
    });
});

// 7. M-Pesa STK Push Simulation
const mpesaOverlay = document.getElementById('mpesa-overlay');
const mpesaLoader = document.getElementById('mpesa-loader');
const mpesaSuccess = document.getElementById('mpesa-success');
const mpesaError = document.getElementById('mpesa-error');
const mpesaAmount = document.querySelector('.mpesa-amount');
const mpesaClose = document.getElementById('mpesa-close');
const mpesaCancel = document.getElementById('mpesa-cancel');

let mpesaTimeout;

function triggerMpesaPayment(amount) {
    mpesaOverlay.classList.add('active');
    mpesaLoader.classList.remove('hidden');
    mpesaSuccess.classList.add('hidden');
    mpesaError.classList.add('hidden');
    if (mpesaAmount) mpesaAmount.textContent = `KES ${amount.toLocaleString()}.00`;

    mpesaTimeout = setTimeout(() => {
        mpesaLoader.classList.add('hidden');
        mpesaSuccess.classList.remove('hidden');
        setTimeout(() => {
            mpesaOverlay.classList.remove('active');
            window.open(`https://wa.me/254702555093?text=Hi!%20I%20just%20completed%20a%20KES%20${amount}%20demo%20payment.%20Please%20confirm%20my%20order.`, '_blank');
        }, 2000);
    }, 2500);
}

// Hero M-Pesa Trigger
document.getElementById('mpesa-trigger').addEventListener('click', (e) => { e.preventDefault(); triggerMpesaPayment(4500); });

// Final CTA WhatsApp Trigger
document.getElementById('final-whatsapp-btn').addEventListener('click', () => {
    window.open('https://wa.me/254702555093?text=Hi!%20I%20want%20to%20order%20a%20cake.', '_blank');
});

if (mpesaClose) mpesaClose.addEventListener('click', () => {
    mpesaOverlay.classList.remove('active');
    clearTimeout(mpesaTimeout);
});
if (mpesaCancel) mpesaCancel.addEventListener('click', () => {
    clearTimeout(mpesaTimeout);
    mpesaLoader.classList.add('hidden');
    mpesaSuccess.classList.add('hidden');
    mpesaError.classList.remove('hidden');
    setTimeout(() => { mpesaOverlay.classList.remove('active'); mpesaError.classList.add('hidden'); }, 1500);
});

// 8. Upsell Logic
const bundleItems = document.querySelectorAll('.bundle-item');
const bundleTotalEl = document.getElementById('bundle-total');
const bundleOrderBtn = document.getElementById('bundle-order-btn');
let currentBundlePrice = 4500;

function updateBundleTotal() {
    let total = 0;
    bundleItems.forEach(item => {
        if (item.classList.contains('selected')) { total += parseInt(item.dataset.price); }
    });
    if (total === 0) {
        bundleItems[0].classList.add('selected');
        total = parseInt(bundleItems[0].dataset.price);
    }
    currentBundlePrice = total;
    bundleTotalEl.textContent = `KES ${total.toLocaleString()}`;
}

bundleItems.forEach(item => {
    item.addEventListener('click', () => {
        item.classList.toggle('selected');
        updateBundleTotal();
        item.setAttribute('aria-pressed', item.classList.contains('selected'));
    });
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
        }
    });
});

if (bundleOrderBtn) bundleOrderBtn.addEventListener('click', () => triggerMpesaPayment(currentBundlePrice));
updateBundleTotal();

// 9. Cake Builder Logic
const builderInputs = document.querySelectorAll('input[type="radio"]');
const builderTotalEl = document.getElementById('builder-total');
const builderCheckoutBtn = document.getElementById('builder-checkout-btn');

function updateRadioCardClasses() {
    builderInputs.forEach(input => {
        const card = input.closest('.radio-card');
        if (input.checked) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

function calculateBuilderTotal() {
    let total = 0;
    builderInputs.forEach(input => { if (input.checked) total += parseInt(input.value); });
    builderTotalEl.textContent = `KES ${total.toLocaleString()}`;
    builderCheckoutBtn.dataset.amount = total;
}

builderInputs.forEach(input => {
    input.addEventListener('change', () => {
        calculateBuilderTotal();
        updateRadioCardClasses();
    });
});

calculateBuilderTotal();
updateRadioCardClasses();

if (builderCheckoutBtn) {
    builderCheckoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        triggerMpesaPayment(parseInt(builderCheckoutBtn.dataset.amount));
    });
}

// 10. FOMO Toasts
const purchaseToastContainer = document.getElementById('purchase-toast-container');
const livePurchases = [
    { name: "Wanjiku", location: "Westlands", product: "Plum Prism Cake", price: "KES 4,500" },
    { name: "Brian", location: "Kiambu", product: "6 Gourmet Cupcakes", price: "KES 800" },
    { name: "Amina", location: "Machakos", product: "Mango Geometric Cake", price: "KES 6,200" },
    { name: "Otieno", location: "Imara Daima", product: "Bundle Cake + Topper", price: "KES 5,150" },
    { name: "Faith", location: "Karen", product: "Chocolate Prism Cake", price: "KES 3,800" }
];
function showPurchaseToast() {
    const random = livePurchases[Math.floor(Math.random() * livePurchases.length)];
    const toast = document.createElement('div');
    toast.className = 'purchase-toast';
    const mins = Math.floor(Math.random() * 10) + 1;
    const time = mins === 1 ? "Just now" : `${mins} mins ago`;
    toast.innerHTML = `<div class="toast-icon">✓</div><div class="toast-content"><p><strong>${random.name}</strong> from ${random.location} just ordered <strong>${random.product}</strong></p><span class="toast-time">${time} • Verified M-Pesa</span></div><button type="button" class="toast-close">×</button>`;
    purchaseToastContainer.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 6000);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
}
setTimeout(showPurchaseToast, 4000);
setInterval(showPurchaseToast, 15000);

// 11. Tasting Calendar
const tastingOverlay = document.getElementById('tasting-overlay');
const openTastingBtn = document.getElementById('open-tasting-modal');
const closeTastingBtn = document.getElementById('close-tasting-modal');
const dateGrid = document.getElementById('date-grid');
const timeGrid = document.getElementById('time-grid');
const confirmTastingBtn = document.getElementById('confirm-tasting-btn');
const tastingError = document.getElementById('tasting-error');
let selectedDate = ''; let selectedTime = '';

const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const today = new Date();
for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    const dateStr = `${days[nextDate.getDay()]} ${nextDate.getDate()} ${months[nextDate.getMonth()]}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'date-slot';
    btn.innerText = dateStr;
    btn.addEventListener('click', () => {
        document.querySelectorAll('.date-slot').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedDate = dateStr;
        tastingError.classList.remove('visible');
    });
    dateGrid.appendChild(btn);
}

timeGrid.querySelectorAll('.time-slot').forEach(slot => {
    slot.addEventListener('click', () => {
        timeGrid.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
        slot.classList.add('selected');
        selectedTime = slot.dataset.time;
        tastingError.classList.remove('visible');
    });
});

openTastingBtn.addEventListener('click', () => tastingOverlay.classList.add('active'));
closeTastingBtn.addEventListener('click', () => tastingOverlay.classList.remove('active'));
tastingOverlay.addEventListener('click', (e) => {
    if (e.target === tastingOverlay) tastingOverlay.classList.remove('active');
});
confirmTastingBtn.addEventListener('click', () => {
    if (!selectedDate || !selectedTime) {
        tastingError.classList.add('visible');
        return;
    }
    const message = `Hi Prism & Pastry! I'd like to book a FREE tasting session at your Imara Daima studio on ${selectedDate} at ${selectedTime}. Is this slot available?`;
    window.open(`https://wa.me/254702555093?text=${encodeURIComponent(message)}`, '_blank');
    tastingOverlay.classList.remove('active');
});

// 12. Lightbox Logic
const galleryItems = document.querySelectorAll('.gallery-item');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
let currentIndex = 0;
const imageArray = Array.from(galleryItems);

function updateLightbox() {
    const item = imageArray[currentIndex];
    lightboxImg.src = item.dataset.full;
    lightboxCaption.textContent = item.dataset.caption;
}

galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        currentIndex = index;
        updateLightbox();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
        }
    });
});

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
lightboxPrev.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + imageArray.length) % imageArray.length;
    updateLightbox();
});
lightboxNext.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % imageArray.length;
    updateLightbox();
});
document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxPrev.click();
    if (e.key === 'ArrowRight') lightboxNext.click();
});