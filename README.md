# La Ville Hotel, Alderney

Website for La Ville Hotel — a warm, family-run hotel, bar and restaurant in the heart of Alderney.

Static site (HTML/CSS/JS, no build step). Just open `index.html`, or serve the folder:

```bash
python -m http.server 5183
# then open http://127.0.0.1:5183/index.html
```

## Pages
`index.html` · `rooms.html` · `restaurant.html` · `chez-bar.html` · `food-dude.html` · `alderney.html` · `contact.html`

## Stack
- Hand-written CSS design system — `assets/css/styles.css` (OKLCH tokens; cream + sea-teal + terracotta)
- Type: Cormorant Garamond + Plus Jakarta Sans (Google Fonts)
- Motion: `assets/js/main.js` + GSAP/ScrollTrigger (CDN); hero reveal is CSS, scroll reveals via IntersectionObserver

## Before launch
- Replace placeholder testimonials with real Google/TripAdvisor reviews
- Confirm the draft FAQ answers
- Wire the enquiry form to email/Formspree (currently a demo)
- Swap placeholder photography for hi-res originals
- Confirm the Caterbook booking embed/link on the Rooms page

_Built by Saturn Results._
