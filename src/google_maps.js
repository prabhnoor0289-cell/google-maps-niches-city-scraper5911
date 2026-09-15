import { PlaywrightCrawler } from 'crawlee';

/**
 * Scrapes Google Maps directly using a real browser.
 * No external Actor calls — this is our own code end to end.
 */
export async function scrapeGoogleMaps({ searchStringsArray, locationQuery, maxCrawledPlacesPerSearch, language }) {
    const places = [];
    const seen = new Set();

    const crawler = new PlaywrightCrawler({
        requestHandlerTimeoutSecs: 180,
        maxRequestsPerCrawl: searchStringsArray.length,
        launchContext: { launchOptions: { headless: true } },
        async requestHandler({ page, request, log }) {
            const { searchTerm } = request.userData;
            log.info(`Searching Google Maps for "${searchTerm}"`);

            const feed = page.locator('div[role="feed"]');
            const feedFound = await feed.count().catch(() => 0);
            if (!feedFound) {
                log.warning(`No results panel found for "${searchTerm}". Google may have changed its layout.`);
                return;
            }

            // Scroll the results list to load more cards, up to what we need.
            let stableRounds = 0;
            let lastCount = 0;
            for (let i = 0; i < 15; i++) {
                const count = await feed.locator('a[href*="/maps/place/"]').count();
                if (count >= maxCrawledPlacesPerSearch || stableRounds >= 3) break;
                stableRounds = count === lastCount ? stableRounds + 1 : 0;
                lastCount = count;
                await feed.evaluate((el) => el.scrollBy(0, 1200)).catch(() => null);
                await page.waitForTimeout(1000);
            }

            const cards = await feed.locator('a[href*="/maps/place/"]').all();
            const hrefs = [];
            for (const card of cards.slice(0, maxCrawledPlacesPerSearch)) {
                const href = await card.getAttribute('href').catch(() => null);
                if (href) hrefs.push(href);
            }

            for (const href of hrefs) {
                if (seen.has(href)) continue;
                seen.add(href);
                try {
                    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
                    await page.waitForSelector('h1', { timeout: 15000 }).catch(() => null);
                    await page.waitForTimeout(600);

                    const title = await page.locator('h1').first().innerText().catch(() => null);
                    const address = await page.locator('button[data-item-id="address"]').first().innerText().catch(() => null);
                    const phone = await page.locator('button[data-item-id^="phone:tel:"]').first().innerText().catch(() => null);
                    const website = await page.locator('a[data-item-id="authority"]').first().getAttribute('href').catch(() => null);

                    if (title) {
                        places.push({
                            title,
                            address: address || null,
                            phone: phone || null,
                            website: website || null,
                            url: href,
                            searchTerm,
                        });
                    }
                } catch (err) {
                    log.warning(`Could not read a listing: ${err.message}`);
                }
            }
        },
        failedRequestHandler({ request, log }) {
            log.warning(`Failed search request: ${request.url}`);
        },
    });

    const requests = searchStringsArray.map((searchTerm) => ({
        url: `https://www.google.com/maps/search/${encodeURIComponent(`${searchTerm} ${locationQuery}`)}/?hl=${language}`,
        userData: { searchTerm },
    }));

    await crawler.run(requests);
    return places;
}
