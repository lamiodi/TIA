# THE TIABRAND — PREMIUM STOREFRONT REFINEMENT & MOTION UPGRADE

You are working on an **existing production e-commerce application**, not a greenfield project.

Your task is to **audit, refine, and elevate the existing storefront into a premium luxury comfort wear, activewear, and loungewear editorial shopping experience** while preserving the existing business logic, APIs, database, checkout, payment, inventory, authentication, currency, bundle, and admin functionality.

The current system blueprint is the source of truth.

---

# 1. PRIMARY OBJECTIVE

Transform the current TiaBrand storefront from a conventional e-commerce interface into a:

> **Luxury editorial commerce experience with restrained, sophisticated motion and excellent conversion UX.**

The experience should feel:

* Premium
* Editorial
* Sophisticated
* Minimal
* Fashion-forward
* Calm
* Expensive
* Highly intentional
* Fast
* Responsive
* Conversion-focused

The inspiration should be the **principles** behind world-class luxury apparel & loungewear websites:

* Strong art direction
* Generous whitespace
* Large editorial imagery & video presentation
* Refined typography
* Slow, subtle motion
* Strong visual hierarchy
* Immersive brand storytelling
* Minimal UI chrome

Do NOT clone another brand's website, assets, copy, or exact layout.

Create an original TiaBrand experience tailored specifically for luxury underwear, lounge sets, and activewear.

---

# 2. IMPORTANT: PRESERVE THE EXISTING APPLICATION

This is an enhancement project.

DO NOT rebuild the application from scratch.

DO NOT replace the current architecture unless absolutely necessary.

DO NOT break existing functionality.

Preserve:

* React 19
* Vite
* Tailwind CSS v4
* React Router 7
* Express.js ESM backend
* PostgreSQL
* Postgres.js / Neon
* Paystack
* Cloudinary
* Resend
* Existing REST APIs
* Existing authentication
* Existing admin authentication
* Existing currency system
* Existing cart architecture
* Existing guest checkout
* Existing inventory logic
* Existing order creation
* Existing product variants
* Existing product sizes
* Existing 3 IN 1 bundles
* Existing 5 IN 1 bundles
* Existing gift cards
* Existing preorder logic
* Existing admin portal

Before modifying anything:

1. Inspect the repository.
2. Understand the current component structure.
3. Identify existing reusable components.
4. Identify existing design tokens.
5. Identify existing animation libraries.
6. Identify existing image/video handling.
7. Identify existing routing.
8. Identify existing cart and checkout state management.
9. Identify existing API contracts.
10. Identify existing business rules.

Do not make assumptions about how existing functionality works.

---

# 3. PRODUCT TAXONOMY MUST REMAIN INTACT

Do not rename or remove the existing categories unless explicitly instructed.

Preserve:

* ALL
* BRIEFS
* LOUNGE SETS
* 3 IN 1
* 5 IN 1
* NEW ARRIVALS
* GIFT CARDS

Preserve the business rule:

BRIEFS require a minimum quantity of 3 units for guest checkout validation.

Preserve all existing bundle customization logic.

For 5 IN 1 products, preserve individual component color/size customization.

Do not alter inventory semantics.

---

# 4. STOREFRONT EXPERIENCE

Prioritize these public pages:

* LandingPage.jsx
* ShopAllPage.jsx
* ProductDetails.jsx
* Cart.jsx
* CheckoutPage.jsx
* GiftCardPage.jsx

The admin dashboard is NOT the primary target of this visual redesign.

Admin should remain functional, clean, responsive, and professional but should not receive excessive editorial animation.

---

# 5. MOTION SYSTEM

Use the appropriate animation tool for each task.

Preferred architecture:

### Lenis

Use Lenis for smooth scrolling.

### GSAP + ScrollTrigger

Use GSAP for:

* Scroll-driven animation
* Editorial reveals
* Parallax
* Image scaling
* Typography reveals
* Section transitions
* Scroll progress

### Framer Motion

Use Framer Motion for React UI state transitions such as:

* Modals
* Drawers
* Menus
* Dropdowns
* Product-card interactions
* Cart interactions
* UI micro-interactions

### CSS

Use CSS transitions for simple:

* Hover
* Focus
* Color
* Scale
* Opacity
* Transform

Do NOT introduce multiple animation libraries for the same responsibility.

Avoid animation duplication.

Create reusable animation utilities/hooks where appropriate.

---

# 6. LENIS IMPLEMENTATION

Implement Lenis at the application level so the storefront has consistent smooth scrolling.

Requirements:

* Smooth but responsive scrolling
* No excessive inertia
* No scroll locking problems
* No broken anchor navigation
* No broken mobile scrolling
* No conflict with modals/drawers
* No conflict with touch scrolling
* Correct cleanup on unmount
* Correct integration with GSAP ScrollTrigger

Ensure ScrollTrigger updates correctly with Lenis.

Do not make scrolling feel sluggish.

---

# 7. REDUCED MOTION

Accessibility is mandatory.

Respect:

`prefers-reduced-motion`

When reduced motion is enabled:

* Disable parallax
* Reduce or remove large transforms
* Remove unnecessary smooth scrolling
* Reduce stagger
* Remove decorative motion
* Preserve usability and content visibility

Motion must enhance the experience, never become a requirement for using the website.

---

# 8. HOMEPAGE TRANSFORMATION

Redesign LandingPage.jsx into an editorial storytelling experience tailored to luxury comfort wear.

Preferred structure:

HERO (Cloudinary Optimized Video / Editorial Visual)

↓

NEW ARRIVALS

↓

BRIEFS & BOXERS EDIT (Highlighting 3-Pack Minimum Guidance)

↓

LOUNGE SETS SPOTLIGHT

↓

3 IN 1 & 5 IN 1 BUNDLE CUSTOMIZATION EXPERIENCE

↓

BEST SELLERS

↓

BRAND STORY & CRAFTSMANSHIP ETHOS

↓

GIFT CARDS SPOTLIGHT

↓

NEWSLETTER

↓

FOOTER

Do not force sections that do not correspond to available products/content.

Use existing product data dynamically.

Do not invent fake products or unrelated product categories (such as beauty or fragrance).

---

# 9. HERO SECTION

Create a premium editorial hero.

Priorities:

* Strong visual hierarchy
* Large imagery & video presentation
* Minimal, impactful copy
* Strong CTA
* Excellent mobile composition
* Immediate visual feedback

If existing video is retained:

* Use Cloudinary optimization (`f_auto,q_auto:eco`)
* Use low-res poster images (`poster="..."`)
* Use responsive media
* Avoid blocking page rendering
* Provide graceful fallback imagery
* Avoid synchronous heavy video loading

If an editorial image provides a better experience, prefer the image.

The hero must not damage LCP.

Do NOT display ugly error states such as raw red video error banners.

Use graceful visual fallbacks.

---

# 10. STAGGERED SECTION REVEALS

Every major homepage section should have subtle entrance animation.

Preferred baseline:

```text
opacity: 0 → 1
y: 30–40px → 0
```

Use:

* Duration: approximately 0.7–1.1 seconds
* Ease: refined / smooth
* Stagger: approximately 0.08–0.12 seconds

Do not animate everything simultaneously.

The page should feel choreographed.

Avoid:

* Bouncy animations
* Excessive rotation
* Large elastic movement
* Cartoon-like effects
* Constant motion

---

# 11. EDITORIAL TYPOGRAPHY REVEALS

Important headings should reveal using masks.

Example:

```text
Heading container
overflow: hidden

Text
translateY(100%) → 0
```

Use this for major campaign titles and editorial headings.

Do not apply dramatic text animation to every small label.

Use typography animation selectively.

---

# 12. PARALLAX IMAGERY

Introduce subtle parallax to large editorial images.

Use GSAP ScrollTrigger.

Recommended behavior:

* Background/image moves slower than scroll
* Foreground content moves normally
* Keep movement subtle

Do not create motion sickness.

Ideal use cases:

* Hero imagery
* Campaign banners
* Lounge & Bundle editorial sections
* Brand story

Do not apply expensive parallax to every product card.

---

# 13. IMAGE SCALE ON SCROLL

For major editorial campaign images:

```text
scale: 0.95 → 1.00
```

or, where appropriate:

```text
scale: 1.00 → 1.05
```

The effect should feel cinematic and restrained.

Do not crop important garment/product details.

---

# 14. IMAGE LOADING EXPERIENCE

Replace harsh loading states where appropriate with elegant image transitions.

Preferred:

```text
blur
→
sharp
→
opacity 1
```

Use:

* Low-quality placeholder where useful
* Cloudinary optimized images (`f_auto,q_auto`)
* Responsive image dimensions
* Proper width/height
* Lazy loading below the fold

Avoid CLS.

Do not delay important content unnecessarily just to create an animation.

---

# 15. PRODUCT CARD EXPERIENCE

Upgrade product cards without damaging shopping speed.

On viewport entry:

```text
opacity: 0 → 1
y: 20–30px → 0
slight scale → 1
```

Use subtle stagger for product grids.

Hover:

```text
card:
translateY(-4px to -8px)

image:
scale(1.02–1.05)

CTA:
fade/slide into view
```

Keep the movement subtle.

Do not make cards jump around the grid.

---

# 16. PRODUCT IMAGE HOVER

Where multiple product images exist:

Use:

* Crossfade
* Very subtle zoom
* Optional slight movement

Avoid aggressive rotation.

If there is only one image, do not fake a second image.

Maintain accessibility on keyboard interaction.

---

# 17. COLLECTION CARD INTERACTION

Collection/editorial cards should feel tactile.

Hover:

```text
translateY(-4px to -8px)
scale(1.01–1.02)
image scale(1.03–1.05)
```

Use soft shadows only where compatible with the existing visual language.

Avoid excessive glassmorphism.

---

# 18. PRODUCT FLOATING EFFECTS

For selected editorial featured products only:

```text
0px
↓
-6px / -8px
↓
0px
```

Very slow.

Do not apply this to every product card.

Use it primarily for:

* Signature Bundles (3 in 1 / 5 in 1)
* Featured Lounge Sets
* Hero product compositions

The effect should be almost imperceptible.

---

# 19. NAVIGATION TRANSFORMATION

If the current navigation (`Navbar.jsx` / `Navbar2.jsx`) is transparent:

Initial state:

```text
transparent
```

After scrolling:

```text
semi-transparent
+
backdrop blur
+
subtle background
+
border
```

The transition should be smooth.

Do not make the navigation suddenly change height unless necessary.

Preserve:

* Logo
* Navigation links
* Cart drawer / counter
* Currency Selector (NGN / USD)
* Mobile menu
* Existing routes

Ensure excellent mobile behavior.

---

# 20. SCROLL PROGRESS

Add a very thin scroll progress indicator at the top of the storefront.

Requirements:

* Extremely subtle
* Brand-appropriate color
* Fixed to viewport
* GPU-friendly
* Does not affect layout
* Does not interfere with navigation

Do not make it visually dominant.

---

# 21. MAGNETIC BUTTONS

Implement magnetic interaction selectively.

Good candidates:

* Hero CTA
* Primary Shop CTA
* Editorial CTA

Movement should be approximately 4–8px.

The button should return smoothly when the pointer leaves.

Do not apply magnetic behavior to:

* Every button
* Navigation links
* Form controls
* Checkout controls
* Small icon buttons

Do not use magnetic effects on touch devices.

---

# 22. CURSOR EFFECTS

Use extremely subtle cursor enhancement only on desktop.

When hovering selected interactive/editorial elements:

* Slight cursor enlargement
* Optional subtle contextual state
* Optional button/image response

Do not create a giant custom cursor.

Do not interfere with:

* Text selection
* Accessibility
* Links
* Inputs
* Checkout
* Mobile

If the existing browser cursor is more usable, keep it.

---

# 23. SECTION TRANSITIONS

Sections should feel visually connected.

Use:

* Overlapping imagery where appropriate
* Shared background tones
* Subtle scroll transitions
* Image movement
* Typography reveals

Avoid:

* Hard visual jumps
* Excessive wipe transitions
* Full-screen transition animations between every section

The experience should feel like one continuous editorial story.

---

# 24. SHOP PAGE

Improve ShopAllPage.jsx.

Focus on:

* Product hierarchy
* Category discovery (`ALL`, `BRIEFS`, `LOUNGE SETS`, `3 IN 1`, `5 IN 1`, `NEW ARRIVALS`, `GIFT CARDS`)
* Filter UX
* Sorting
* Product grid rhythm
* Image consistency
* Responsive spacing

Preserve existing category logic.

Improve filter interactions without causing layout shifts.

Use:

* Sticky filter controls where appropriate
* Smooth active-state transitions
* Clear active state
* Mobile-friendly controls

Do not hide important filters behind unnecessary interactions.

---

# 25. PDP — PRODUCT DETAIL PAGE

Improve ProductDetails.jsx.

Focus on:

* Image gallery
* Product information hierarchy
* Variant selection
* Size selection
* Bundle customization (3 in 1 & 5 in 1 individual item options)
* Stock visibility
* Add-to-cart experience

Product gallery:

* Smooth image transitions
* Subtle zoom
* Clean thumbnail interaction
* Responsive behavior

Size selection:

Show clear stock states where data exists.

Examples:

```text
S — In Stock
M — Low Stock
L — Out of Stock / Preorder
```

Do not invent stock values.

For bundle products:

Make each selection step visually obvious.

Do not remove existing bundle validation.

---

# 26. CART EXPERIENCE

Improve Cart.jsx visually without changing cart business logic.

Use subtle animation for:

* Item addition
* Quantity changes
* Item removal
* Cart drawer/page opening
* Total updates

Preserve:

* Guest cart
* Authenticated cart
* localStorage synchronization
* Minimum quantity rules (Briefs min 3 units)
* Variant/size information

Never allow animation to delay cart interaction.

---

# 27. CHECKOUT — HIGHEST CAUTION

Checkout is a conversion-critical area.

Do NOT add unnecessary animation.

Prioritize:

* Speed
* Clarity
* Trust
* Form usability
* Validation
* Payment reliability

Preserve:

* Guest checkout
* Temporary-user creation (`/api/auth/create-temp-user`)
* Shipping information
* Currency (NGN/USD)
* Paystack inline payment integration
* Order creation (`/api/orders`)
* Inventory deduction
* Confirmation flow

If the existing guest modal creates friction, evaluate whether it can be transformed into an inline step/accordion without changing backend behavior.

Do not break the existing checkout workflow.

Do not remove validation.

Do not introduce unnecessary page transitions before payment.

---

# 28. PAYSTACK SAFETY

Never modify payment verification logic simply for visual redesign.

The payment flow must remain:

Customer
→ Paystack
→ verification
→ order creation
→ inventory update
→ confirmation

Never trust only client-side payment success.

Never expose secret payment keys.

Do not change backend payment verification unless explicitly required.

---

# 29. CURRENCY SYSTEM

Preserve:

* Nigeria → NGN
* International → USD
* Existing exchange-rate behavior
* CurrencyProvider (IP detection & dynamic exchange rates)

Do not hardcode displayed prices.

Do not replace the existing currency logic with frontend-only calculations.

---

# 30. CLOUDINARY MEDIA OPTIMIZATION

Audit all storefront media.

Where appropriate use:

```text
f_auto
q_auto
responsive dimensions
```

For images:

* WebP/AVIF through automatic format selection
* Responsive widths
* Lazy loading
* Correct aspect ratios

For hero/campaign video:

* Poster image (`poster="..."`)
* Optimized codec/quality (`f_auto,q_auto:eco`)
* Responsive resolution
* Avoid blocking initial render

Do not download unnecessarily large assets.

---

# 31. PERFORMANCE REQUIREMENTS

The redesign must improve perceived quality WITHOUT degrading performance.

Monitor:

* LCP
* CLS
* INP
* TTFB
* JS bundle size
* image weight
* video weight

Avoid:

* Massive animation libraries loaded globally if unnecessary
* Huge images
* Unoptimized video
* Excessive DOM nodes
* Scroll handlers that run expensively
* Layout-triggering animation
* unnecessary re-renders

Prefer:

```text
transform
opacity
scale
translate
```

over layout-changing properties.

---

# 32. ACCESSIBILITY

Maintain WCAG-conscious behavior.

Ensure:

* Keyboard navigation
* Visible focus states
* Accessible buttons
* aria-label for icon-only controls
* aria-expanded for expandable controls
* Proper semantic HTML
* Good contrast
* Focus trapping in dialogs
* Keyboard-accessible menus
* Reduced-motion support

Never make interaction dependent on hover.

Everything important must work on keyboard and touch.

---

# 33. RESPONSIVE MOTION

Desktop and mobile should NOT receive identical animation.

Desktop:

* Full editorial motion
* Hover effects
* Magnetic buttons
* Subtle cursor effects
* More parallax

Mobile:

* Reduced parallax
* No magnetic cursor effects
* No custom cursor
* Reduced stagger
* Faster/simple transitions
* Touch-first interactions

The mobile experience must remain fast.

---

# 34. DESIGN SYSTEM CONSISTENCY

Before creating new styles:

Inspect existing:

* Colors
* Typography
* Spacing
* Border radius
* Shadows
* Buttons
* Cards
* Inputs
* Navigation

Reuse existing design tokens.

Do not randomly introduce:

* New colors
* Excessive gradients
* Excessive shadows
* Random border radii
* Multiple typography systems

Everything should feel like one brand.

---

# 35. COMPONENT ARCHITECTURE

If animation logic is duplicated, extract reusable components/hooks.

Potential utilities:

```text
useLenis()
useScrollReveal()
useParallax()
useMagnetic()
useReducedMotion()
useImageReveal()
```

Potential components:

```text
AnimatedSection
RevealText
ParallaxImage
MagneticButton
ScrollProgress
AnimatedProductCard
EditorialImage
SmoothImage
```

Only create abstractions where they genuinely reduce duplication.

Do not over-engineer.

---

# 36. CODE QUALITY

During implementation:

* Remove dead animation code
* Remove unused imports
* Remove duplicated utilities
* Avoid unnecessary dependencies
* Keep components maintainable
* Preserve existing API contracts
* Avoid giant components where practical
* Extract reusable UI logic
* Keep business logic separate from presentation

Do not perform a massive unrelated refactor.

---

# 37. SECURITY

Do not expose:

* DATABASE_URL
* JWT_SECRET
* PAYSTACK_SECRET_KEY
* CLOUDINARY credentials
* RESEND_API_KEY

Do not move backend secrets into Vite environment variables.

Do not weaken authentication.

Do not modify authorization logic for visual purposes.

---

# 38. IMPLEMENTATION ORDER

Work in this order.

## Phase 1 — Inspect

First inspect the entire project.

Identify:

* Existing frontend architecture
* Existing animation dependencies
* Existing CSS
* Existing Tailwind setup
* Existing components
* Existing image handling
* Existing video handling
* Existing routing
* Existing contexts
* Existing checkout flow

Do not edit yet.

---

## Phase 2 — Motion Foundation

Implement:

1. Lenis
2. GSAP
3. ScrollTrigger integration
4. Reduced-motion handling
5. Animation utilities
6. Global motion configuration

Verify the app still works.

---

## Phase 3 — Navigation + Global UX

Implement:

1. Scroll-aware navigation (`Navbar.jsx` / `Navbar2.jsx`)
2. Scroll progress
3. Page transition foundation if appropriate
4. Mobile navigation transitions
5. Global image loading behavior

---

## Phase 4 — Homepage

Implement:

1. Hero refinement (Cloudinary poster & fallbacks)
2. Editorial sections
3. Stagger reveals
4. Parallax
5. Image scaling
6. Typography masks
7. Campaign storytelling
8. Product reveals
9. Editorial CTA interactions

---

## Phase 5 — Shop

Implement:

1. Product grid reveal
2. Filter transitions (`ALL`, `BRIEFS`, `LOUNGE SETS`, `3 IN 1`, `5 IN 1`, `NEW ARRIVALS`, `GIFT CARDS`)
3. Product hover
4. Image transitions
5. Responsive grid improvements
6. Mobile filter UX

---

## Phase 6 — PDP

Implement:

1. Gallery animation
2. Product image zoom
3. Variant transitions
4. Size interaction (Stock visibility: In Stock / Low Stock / Preorder)
5. Bundle selection UX
6. Add-to-cart feedback

---

## Phase 7 — Cart

Implement:

1. Cart transitions
2. Item animation
3. Quantity feedback
4. Drawer/page transitions
5. Preserve cart synchronization (localStorage & Briefs min 3 units)

---

## Phase 8 — Checkout

Perform a UX refinement only.

Prioritize:

* clarity
* trust
* speed
* validation
* accessibility
* payment reliability

Do not over-animate checkout.

---

## Phase 9 — Performance

Run a performance audit.

Optimize:

* images
* videos
* bundles
* lazy loading
* code splitting
* animation workload

Verify no regression.

---

## Phase 10 — QA

Test:

### Desktop

* Chrome
* Firefox
* Safari if available

### Mobile

* iOS Safari
* Android Chrome

Test:

* Homepage
* Shop
* Filters
* PDP
* Variants
* Bundles
* Cart
* Guest checkout
* Paystack
* Currency switching (NGN/USD)
* Gift cards
* Admin login
* Admin dashboard

Test:

* Keyboard navigation
* Reduced motion
* Slow network
* Empty states
* Error states
* Out-of-stock products
* Preorders

---

# 39. VISUAL QUALITY BAR

The finished result should NOT look like:

* A generic SaaS dashboard
* A template
* A motion demo
* A portfolio animation experiment
* A flashy fashion clone

It should feel like:

> **A real luxury commerce brand with sophisticated art direction and restrained motion.**

The user should notice:

* Better spacing
* Better typography
* Better imagery
* Better hierarchy
* Better transitions
* Better product presentation

before they notice the animations themselves.

---

# 40. FINAL ACCEPTANCE CRITERIA

Do not consider the task complete until:

* The storefront feels substantially more premium.
* Animations feel intentional and restrained.
* Scrolling feels smooth.
* Homepage storytelling feels cohesive.
* Product cards feel polished.
* PDP feels refined.
* Navigation feels premium.
* Images load elegantly.
* Mobile remains fast.
* Reduced-motion works.
* Accessibility is preserved/improved.
* Existing categories (`ALL`, `BRIEFS`, `LOUNGE SETS`, `3 IN 1`, `5 IN 1`, `NEW ARRIVALS`, `GIFT CARDS`) remain functional.
* Existing bundle logic remains functional.
* Guest cart remains functional (Briefs min 3 units).
* Guest checkout remains functional.
* Paystack remains functional.
* Inventory remains functional.
* Currency (NGN/USD) remains functional.
* Gift cards remain functional.
* Admin remains functional.
* No critical console errors remain.
* No broken routes remain.
* No business logic has been silently removed.

---

# MOST IMPORTANT INSTRUCTION

**Do not optimize for "more animation."**

Optimize for:

> **better visual storytelling + better interaction quality + better perceived performance + better conversion UX.**

Every animation must justify its existence.

If an animation makes the site slower, distracting, inaccessible, or harder to shop, remove it.

If the current implementation already does something correctly, preserve it.

**Inspect first → plan → implement incrementally → test → refine.**

Do not blindly rewrite working code.
