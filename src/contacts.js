import { CheerioCrawler } from 'crawlee';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/g;
const SOCIAL_PATTERNS = {
    facebooks: /facebook\.com\/[^"'\s)<]+/gi,
    instagrams: /instagram\.com\/[^"'\s)<]+/gi,
    linkedIns: /linkedin\.com\/[^"'\s)<]+/gi,
    twitters: /(?:twitter|x)\.com\/[^"'\s)<]+/gi,
    youtubes: /youtube\.com\/[^"'\s)<]+/gi,
    tiktoks: /tiktok\.com\/[^"'\s)<]+/gi,
};
const IGNORE_EMAIL = /\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i;

/** Crawls each domain's own website looking for emails, phones and socials. */
export async function scrapeContacts(domains, { maxPagesPerWebsite = 5, maxConcurrency = 20 }) {
    const byDomain = new Map();

    const crawler = new CheerioCrawler({
        maxRequestsPerCrawl: domains.length * maxPagesPerWebsite,
        maxConcurrency,
        maxRequestRetries: 1,
        requestHandlerTimeoutSecs: 15,
        async requestHandler({ request, body, enqueueLinks, log }) {
            const { domain } = request.userData;
            const text = typeof body === 'string' ? body : String(body);

            const record = byDomain.get(domain) || {
                emails: new Set(), phones: new Set(),
                facebooks: new Set(), instagrams: new Set(), linkedIns: new Set(),
                twitters: new Set(), youtubes: new Set(), tiktoks: new Set(),
                pages: 0,
            };

            (text.match(EMAIL_REGEX) || [])
                .filter((e) => !IGNORE_EMAIL.test(e))
                .forEach((e) => record.emails.add(e.toLowerCase()));

            (text.match(PHONE_REGEX) || []).forEach((p) => record.phones.add(p.trim()));

            for (const [key, pattern] of Object.entries(SOCIAL_PATTERNS)) {
                (text.match(pattern) || []).forEach((m) => record.facebooks !== undefined && record[key].add(`https://${m}`));
            }

            record.pages += 1;
            byDomain.set(domain, record);

            if (record.pages < maxPagesPerWebsite) {
                await enqueueLinks({
                    strategy: 'same-domain',
                    limit: maxPagesPerWebsite,
                    transformRequestFunction: (req) => { req.userData = { domain }; return req; },
                }).catch(() => null);
            }
        },
        failedRequestHandler({ request, log }) {
            log.warning(`Could not crawl ${request.url}`);
        },
    });

    const requests = domains.map((domain) => ({ url: `https://${domain}`, userData: { domain } }));
    await crawler.run(requests);

    const output = new Map();
    for (const [domain, r] of byDomain.entries()) {
        output.set(domain, {
            emails: [...r.emails],
            phones: [...r.phones],
            facebooks: [...r.facebooks],
            instagrams: [...r.instagrams],
            linkedIns: [...r.linkedIns],
            twitters: [...r.twitters],
            youtubes: [...r.youtubes],
            tiktoks: [...r.tiktoks],
        });
    }
    return output;
}
