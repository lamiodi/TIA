# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Discerning, style-conscious individuals shopping for luxury underwear, premium loungewear, lounge sets, and activewear. Shoppers span local Nigerian clientele (paying in NGN with local card/bank transfer options) and global international clientele in the US, UK, Canada, Europe, Middle East, and beyond (viewing USD prices, paying securely with international cards, and expecting fast, transparent international express courier delivery).

## Product Purpose

The TiaBrand storefront exists to deliver a calm, prestigious, and seamless luxury editorial commerce experience. It allows customers to discover signature comfort collections, customize 3-in-1 and 5-in-1 multi-piece bundles with individual color/size choices, shop gift cards, and check out with zero friction—either as an authenticated user or instantly as a guest. Success is measured by high conversion velocity, zero cart abandonment friction, trusted transparent international delivery, and an elevated fashion-house aesthetic.

## Positioning

Luxury comfort wear born in West Africa and tailored for the world. Unlike conventional drop-shipped or mass-market apparel storefronts, TiaBrand merges high-craft editorial art direction with proprietary multi-item bundle configuration (3-in-1 and 5-in-1 sets with individual component customization), flexible dual-currency capability (NGN & USD), and transparent worldwide express logistics directly from Lagos to doorstep.

## Operating Context

- **Devices**: Mobile-first luxury shopping (over 70% of traffic), accompanied by high-resolution desktop and tablet editorial viewports.
- **Payment & Security**: Secure Paystack payments (inline card, bank transfer, and crypto/Bitcoin concierge), token-protected sessions, idempotency-keyed order processing.
- **Fulfillment & Logistics**: Lagos Island, Lagos Mainland, Rest of Nigeria, and express courier (DHL/FedEx) to US, UK, Canada, Europe, Middle East, and 190+ countries worldwide with upfront delivery fees.

## Capabilities and Constraints

- **Product Taxonomy**: ALL, BRIEFS, LOUNGE SETS, 3 IN 1, 5 IN 1, NEW ARRIVALS, GIFT CARDS. Must be preserved without inventing unsupported categories.
- **Briefs Minimum Policy**: Briefs require a minimum quantity of 3 units for guest checkout validation.
- **Bundle Customization**: 3 IN 1 and 5 IN 1 bundles require individual color and size selection per component garment.
- **Currency & Pricing**: Base prices stored and processed in NGN; real-time USD conversion for international audiences.
- **Logistics Pricing**:
  - Nigeria: Lagos Island (₦4,000), Lagos Mainland (₦6,000), Outside Lagos (₦7,000).
  - International: United States ($89), United Kingdom ($82), Canada ($95), Germany/France/EU ($85-$92), UAE/Middle East ($75-$78), West Africa ($40-$52), Rest of World ($60-$120), all verified upfront.
- **Address Structure**:
  - Country-specific State/Province dropdown populated for all countries.
  - ZIP/Postal code required for all international destinations, optional only for Nigeria.

## Brand Commitments

- **Tone & Identity**: Luxury editorial, understated prestige, calm, expensive, minimal UI chrome, generous whitespace, refined typography (Manrope headings, Jost body text).
- **Colors**: Deep brand primary (`#1A1A1A` / Primarycolor), muted accent slate (`#666666`), crisp clean white, subtle warm neutral borders, selective emerald/sapphire status accents.
- **Motion & Rhythm**: Smooth, choregraphed, restrained reveals (Lenis smooth scroll, Framer Motion UI transitions, GSAP scroll triggers). Absolutely no cartoonish bouncing, aggressive spinning, or loud popups.

## Evidence on Hand

- `tiabrand_storefront_refinement_prompt.md`: The definitive luxury aesthetic and architectural brief.
- `Frontend/src/utils/shippingRates.js` & `Backend/utils/shippingRates.js`: Ground-truth international shipping rate card.
- `Frontend/src/utils/geoUtils.js`: ISO-standard country-state-city mapping and postal rules.
- Real production catalog assets hosted on Cloudinary (`res.cloudinary.com`).

## Product Principles

1. **Editorial Calm Over Commerce Clutter**: Every screen feels like an art-directed lookbook. Whitespace, typography, and photography lead; user interface chrome recedes.
2. **Frictionless Trust at Checkout**: Absolute clarity on costs. No surprise international fees after ordering; delivery rates are transparently itemized upfront.
3. **Respect Local & Global Reality**: Fluid dual-currency experience with adaptive address inputs—state dropdowns for any country on earth, and sensible postal validation honoring local infrastructure.
4. **Resilient Performance**: Zero layout shifts (CLS), lazy-loaded responsive media, lightweight DOM, and smooth accessibility across all viewports.

## Accessibility & Inclusion

- Compliance with WCAG 2.1 AA standards.
- Full respect for `prefers-reduced-motion` across Lenis and Framer Motion / GSAP animations.
- Accessible form labeling, high-contrast text ratios on form elements, and full keyboard focus rings.
