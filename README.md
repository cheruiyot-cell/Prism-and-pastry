Prism & Pastry – Bakery Website

A premium, conversion-focused website for Prism & Pastry, a Nairobi-based bakery specialising in bold geometric cakes. The site is designed to drive orders via WhatsApp, showcase the brand’s quality and reliability, and provide an interactive cake builder and payment simulation.

---

Features

· Hero section with clear value proposition, trust indicators, and CTAs
· Interactive Cake Builder – real-time pricing based on flavour, size, and decoration
· Bundle upsell – frequently bought together items with discount logic
· Expanded FAQ – addressing common customer pain points (delivery, payment, custom orders, etc.)
· Live purchase notifications (FOMO toasts) to build social proof
· M-Pesa payment simulation – mimics the STK push flow for a realistic checkout
· Tasting session booking – date & time selection with WhatsApp confirmation
· Gallery lightbox – full-screen viewing of cake masterpieces
· Mobile‑first responsive design – hamburger menu, self-closing on outside click
· SEO optimised – meta tags, Open Graph, and Local Business Schema
· Accessibility – keyboard navigation, focus outlines, ARIA attributes

---

Tech Stack

· HTML5 – semantic structure
· CSS3 – custom properties, grid, flexbox, responsive breakpoints
· JavaScript (Vanilla) – no dependencies, all interactions handled natively
· AOS (Animate On Scroll) – used for subtle scroll animations
· Google Fonts – Clash Display and Inter
· Unsplash – free stock imagery for cake visuals
· WhatsApp Business API – deep links for direct ordering and support

---

File Structure

```
prism-and-pastry/
├── index.html          # Main HTML document
├── style.css           # All styles (global, components, responsive)
├── script.js           # All client-side logic (interactions, modals, simulation)
└── README.md           # Project documentation
```

---

Setup & Installation

1. Clone or download the repository.
2. Open index.html in any modern web browser – no server required.
3. Optional: If you want to use the payment/tasting modals fully, ensure the script.js and style.css are in the same folder as index.html.

No build tools or package managers are needed. The site runs entirely on static assets.

---

Usage

Ordering via WhatsApp

All order CTAs link to a pre-filled WhatsApp message. The number is hard-coded to +254702555093. You can change this by updating the wa.me links in the HTML (search for wa.me) or by editing the data-message attributes on the .wa-link elements.

Cake Builder

Users select a base flavour, size, and decoration theme. The price updates instantly. Clicking “Add to Cart & Pay” opens the M-Pesa simulation modal. (In a production environment, replace this with an actual payment gateway or a direct WhatsApp confirmation.)

FOMO Toasts

The site shows random purchase notifications every 15 seconds. You can customise the livePurchases array in script.js to add real customer names and products.

Tasting Bookings

Users pick a date (next 7 days) and a time slot. The confirmation button opens a WhatsApp chat with the selected date/time pre-filled.

---

Customisation

Branding & Colours

All colours are defined as CSS custom properties in the :root of style.css:

· --charcoal, --ivory, --yellow, --coral, --plum – adjust to match your brand.

Fonts

Google Fonts are imported in the <head>. Replace the font families in the CSS if needed.

Images

All images are from Unsplash. Replace the src and data-full attributes in the gallery section with your own photography for a personalised feel.

Contact Number

Update every wa.me/254702555093 link with your WhatsApp number.

---

Deployment

Because the site is static, you can host it on any web server:

· GitHub Pages: Push the files to a repo and enable Pages.
· Netlify / Vercel: Drag‑and‑drop the folder.
· Shared Hosting: Upload via FTP to your server's public directory.

After deployment, update the og:url meta tag and the schema url field to your live domain.

---

Browser Support

The site targets modern browsers (Chrome, Firefox, Edge, Safari). It uses CSS Grid and Flexbox, so legacy browsers (IE11) are not supported.

---

License

This project is proprietary and intended for the sole use of Prism & Pastry. No redistribution is permitted without written consent.

---

Credits

· Design & Development: [Your Name / Studio]
· Images: Unsplash (free license)
· Fonts: Google Fonts

---

For any technical issues or feature requests, please contact the development team.
