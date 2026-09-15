/**
 * Google Maps Contact Details Scraper — fully standalone version.
 * No calls to other Apify Actors. All scraping logic is our own code.
 */

import { Actor, log } from 'apify';
import { scrapeGoogleMaps } from './google_maps.js';
import { scrapeContacts } from './contacts.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};

const {
    searchStringsArray = [],
    locationQuery = '',
    maxCrawledPlacesPerSearch = 20,
    language = 'en',
    skipPlacesWithoutWebsite = true,
    onlyPlacesWithEmail = false,
    maxPagesPerWebsite = 5,
} = input;

if (!searchStringsArray.length || !locationQuery) {
    throw new Error('Please provide at least one search term and a location.');
}

log.info('Searching Google Maps (built-in scraper, no external Actors)...');
const places = await scrapeGoogleMaps({ searchStringsArray, locationQuery, maxCrawledPlacesPerSearch, language });
log.info(`Found ${places.length} places.`);

if (!places.length) {
    await Actor.pushData({ '#error': 'No places found. Try a broader search term or a different location spelling.' });
    await Actor.exit();
}

const toDomain = (url) => {
    if (!url) return null;
    try { return new URL(url).hostname.replace(/^www\./i, '').toLowerCase(); }
    catch { return null; }
};

const domains = [...new Set(places.map((p) => toDomain(p.website)).filter(Boolean))];
log.info(`Found ${domains.length} unique websites to scan for contacts.`);

const contactsByDomain = domains.length
    ? await scrapeContacts(domains, { maxPagesPerWebsite, maxConcurrency: 20 })
    : new Map();

const results = [];
for (const place of places) {
    const domain = toDomain(place.website);
    if (!domain && skipPlacesWithoutWebsite) continue;

    const c = (domain && contactsByDomain.get(domain)) || {};
    const merged = {
        ...place,
        domain,
        emails: c.emails || [],
        phonesFromWebsite: c.phones || [],
        facebooks: c.facebooks || [],
        instagrams: c.instagrams || [],
        linkedIns: c.linkedIns || [],
        twitters: c.twitters || [],
        youtubes: c.youtubes || [],
        tiktoks: c.tiktoks || [],
    };

    if (onlyPlacesWithEmail && merged.emails.length === 0) continue;
    results.push(merged);
}

log.info(`Saving ${results.length} rows.`);
await Actor.pushData(results.length ? results : [{ '#error': 'No results matched your filters.' }]);

await Actor.exit();
