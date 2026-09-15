# Google Maps Contact Details Scraper

Find businesses on Google Maps and get their **email addresses, phone numbers and social media profiles** — pulled directly from each business's own website.

This Actor is fully standalone: it scrapes Google Maps and business websites using its own code, with no dependency on any other Actor.

## What you get

For every business, one row containing:

| Field | Description |
| --- | --- |
| `title` | Business name |
| `emails` | Email addresses found on the website |
| `phone` | Phone number from Google Maps |
| `phonesFromWebsite` | Phone numbers found on the website |
| `website`, `domain` | Business website |
| `address` | Address as shown on Google Maps |
| `linkedIns`, `facebooks`, `instagrams`, `twitters`, `youtubes`, `tiktoks` | Social profiles found on the website |
| `url` | Link back to the Google Maps listing |

Export as JSON, CSV, Excel, XML or HTML, or pull it through the API.

## How to use it

1. Enter one or more **search terms** (e.g. `dentist`, `plumber`).
2. Enter a **location** (e.g. `Chandigarh, India`).
3. Set **max places per search term**. Start small (5-10) while testing.
4. Click **Start**.

Tick **Only keep results that have an email** for a clean outreach list.

## How it works

1. Opens Google Maps in a real browser and searches your term + location.
2. Opens each business listing and reads its name, address, phone and website.
3. Visits each business website directly and scans a few pages for emails, phones and social links.
4. Merges everything into one row per business.

## A note on run time

This Actor uses real browser automation for the Google Maps step, which is slower than a lightweight scraper but more reliable long-term since it's not dependent on any other service. Expect a few minutes for small runs and proportionally longer for larger ones, since it visits every business website individually.

## Is this legal?

This Actor only collects information businesses publish publicly on their own websites and on Google Maps. How you *use* that data is your responsibility — email outreach rules differ by country (GDPR, CAN-SPAM, etc). Check what applies to you before running a campaign.

## Found a bug?

Open an issue on the Issues tab.
