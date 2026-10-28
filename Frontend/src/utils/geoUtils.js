import { Country, State } from 'country-state-city';

// Custom alias map to guarantee 100% match with countries.js
const COUNTRY_ALIASES = {
  'cabo verde': 'CV',
  'cape verde': 'CV',
  'ivory coast': 'CI',
  "cote d'ivoire": 'CI',
  'united states': 'US',
  'usa': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'great britain': 'GB',
  'south korea': 'KR',
  'korea, south': 'KR',
  'north korea': 'KP',
  'russia': 'RU',
  'russian federation': 'RU',
  'vietnam': 'VN',
  'viet nam': 'VN',
  'syria': 'SY',
  'syrian arab republic': 'SY',
  'laos': 'LA',
  'lao people\'s democratic republic': 'LA',
  'iran': 'IR',
  'bolivia': 'BO',
  'venezuela': 'VE',
  'tanzania': 'TZ',
  'moldova': 'MD',
  'brunei': 'BN',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'eswatini': 'SZ',
  'swaziland': 'SZ',
  'palestine': 'PS',
  'state of palestine': 'PS',
  'micronesia': 'FM',
};

// Cached lookup
let countryLookupMap = null;

function getCountryLookup() {
  if (!countryLookupMap) {
    countryLookupMap = new Map();
    const all = Country.getAllCountries();
    for (const c of all) {
      countryLookupMap.set(c.name.toLowerCase().trim(), c.isoCode);
      countryLookupMap.set(c.isoCode.toLowerCase().trim(), c.isoCode);
    }
  }
  return countryLookupMap;
}

/**
 * Resolve country name or code to ISO-2 country code
 */
export function getCountryIsoCode(countryNameOrCode) {
  if (!countryNameOrCode) return null;
  const clean = String(countryNameOrCode).trim().toLowerCase();
  if (COUNTRY_ALIASES[clean]) {
    return COUNTRY_ALIASES[clean];
  }
  const lookup = getCountryLookup();
  if (lookup.has(clean)) {
    return lookup.get(clean);
  }
  // Fallback search
  const all = Country.getAllCountries();
  const match = all.find(c => 
    c.name.toLowerCase().includes(clean) || clean.includes(c.name.toLowerCase())
  );
  return match ? match.isoCode : null;
}

/**
 * Returns sorted list of states/provinces for a given country name or ISO code.
 * Returns empty array if none found.
 */
export function getStatesForCountry(countryNameOrCode) {
  const isoCode = getCountryIsoCode(countryNameOrCode);
  if (!isoCode) return [];
  try {
    const states = State.getStatesOfCountry(isoCode);
    if (!Array.isArray(states)) return [];
    return states
      .map(s => ({
        name: s.name,
        isoCode: s.isoCode
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Error fetching states for country:', countryNameOrCode, err);
    return [];
  }
}

/**
 * Checks if country is Nigeria (case-insensitive)
 */
export function isNigeria(countryName) {
  if (!countryName) return false;
  const c = String(countryName).trim().toLowerCase();
  return c === 'nigeria' || c === 'ng';
}

/**
 * Requirement: ZIP code is optional for Nigeria ONLY, required for all other countries.
 */
export function isZipCodeRequired(countryName) {
  return !isNigeria(countryName);
}
