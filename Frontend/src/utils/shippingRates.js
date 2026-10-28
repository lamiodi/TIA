// International delivery fees from Lagos, Nigeria (USD).
//
// Anchors set by the business: United States $89, United Kingdom $82.
// Other destinations are priced by courier zone relative to those anchors
// (DHL/UPS/FedEx Express from Nigeria bill by zone + chargeable weight; a
// typical TiaBrand parcel is 1–2 kg). Regional African lanes are cheapest,
// Middle East and Europe sit near the UK anchor, North America/Asia near
// the US anchor, Oceania and Latin America are the most expensive lanes.
//
// IMPORTANT: Backend/utils/shippingRates.js mirrors this table and is what
// the order API validates against. Change both files together.

export const NIGERIA = 'Nigeria';

// Explicit per-country rates (names must match utils/countries.js).
export const COUNTRY_SHIPPING_USD = {
  // North America
  'United States': 89,
  Canada: 95,
  Mexico: 105,

  // United Kingdom & Ireland
  'United Kingdom': 82,
  Ireland: 85,

  // Western & Northern Europe
  Germany: 85,
  France: 85,
  Netherlands: 85,
  Belgium: 85,
  Luxembourg: 88,
  Italy: 88,
  Spain: 88,
  Portugal: 88,
  Austria: 88,
  Switzerland: 92,
  Denmark: 90,
  Sweden: 92,
  Finland: 92,
  Norway: 95,
  Iceland: 98,
  Poland: 90,
  'Czech Republic': 90,
  Greece: 92,
  Malta: 92,
  Cyprus: 92,

  // Middle East
  'United Arab Emirates': 75,
  'Saudi Arabia': 78,
  Qatar: 78,
  Kuwait: 78,
  Bahrain: 78,
  Oman: 78,
  Israel: 85,
  Turkey: 85,

  // West Africa (ECOWAS lanes)
  Ghana: 45,
  Benin: 40,
  Togo: 42,
  Niger: 45,
  'Ivory Coast': 48,
  Cameroon: 50,
  Senegal: 52,
  'Sierra Leone': 52,
  Liberia: 52,
  Gambia: 52,
  Guinea: 52,
  Mali: 52,
  'Burkina Faso': 52,

  // Rest of Africa
  'South Africa': 60,
  Kenya: 60,
  Uganda: 62,
  Tanzania: 62,
  Rwanda: 62,
  Ethiopia: 62,
  Zambia: 62,
  Zimbabwe: 62,
  Botswana: 62,
  Namibia: 62,
  Egypt: 70,
  Morocco: 65,

  // Asia
  India: 90,
  Pakistan: 92,
  China: 95,
  Singapore: 95,
  Malaysia: 95,
  Philippines: 98,
  Indonesia: 98,
  Thailand: 98,
  Japan: 100,
  'South Korea': 100,

  // Oceania
  Australia: 110,
  'New Zealand': 115,

  // Caribbean & South America
  Jamaica: 105,
  'Trinidad and Tobago': 105,
  Brazil: 115,
  Argentina: 120,
};

// Zone fallbacks for countries not listed above.
const EUROPE = new Set([
  'Albania', 'Andorra', 'Belarus', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia',
  'Estonia', 'Hungary', 'Latvia', 'Liechtenstein', 'Lithuania', 'Moldova', 'Monaco',
  'Montenegro', 'North Macedonia', 'Romania', 'Russia', 'San Marino', 'Serbia',
  'Slovakia', 'Slovenia', 'Ukraine', 'Vatican City',
]);
const AFRICA = new Set([
  'Algeria', 'Angola', 'Burundi', 'Cabo Verde', 'Central African Republic', 'Chad',
  'Comoros', 'Congo', 'Democratic Republic of the Congo', 'Djibouti', 'Equatorial Guinea',
  'Eritrea', 'Eswatini', 'Gabon', 'Guinea-Bissau', 'Lesotho', 'Libya', 'Madagascar',
  'Malawi', 'Mauritania', 'Mauritius', 'Mozambique', 'Sao Tome and Principe',
  'Seychelles', 'Somalia', 'South Sudan', 'Sudan', 'Tunisia',
]);
const MIDDLE_EAST = new Set(['Iran', 'Iraq', 'Jordan', 'Lebanon', 'Palestine', 'Syria', 'Yemen']);

export const ZONE_SHIPPING_USD = {
  europe: 90,
  africa: 65,
  middleEast: 80,
  restOfWorld: 110,
};

export const isNigeria = (country) =>
  String(country || '').trim().toLowerCase() === NIGERIA.toLowerCase();

/** USD delivery fee for an international destination, or 0 for Nigeria. */
export const getInternationalShippingUSD = (country) => {
  const name = String(country || '').trim();
  if (!name || isNigeria(name)) return 0;
  if (COUNTRY_SHIPPING_USD[name] != null) return COUNTRY_SHIPPING_USD[name];
  if (EUROPE.has(name)) return ZONE_SHIPPING_USD.europe;
  if (AFRICA.has(name)) return ZONE_SHIPPING_USD.africa;
  if (MIDDLE_EAST.has(name)) return ZONE_SHIPPING_USD.middleEast;
  return ZONE_SHIPPING_USD.restOfWorld;
};

/** Delivery fee converted to NGN (whole naira) using NGN-per-USD rate. */
export const getInternationalShippingNGN = (country, ngnPerUsd) => {
  const usd = getInternationalShippingUSD(country);
  const rate = Number(ngnPerUsd);
  if (!usd || !Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round(usd * rate);
};

export const INTERNATIONAL_DELIVERY_ESTIMATE = '7–14 business days';
