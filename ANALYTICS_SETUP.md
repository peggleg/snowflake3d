# Google Analytics and Search Console

## Site configuration

GA4 web-stream measurement ID: `G-Q6WZ9GRKZ6`. This is a public identifier, not a secret. It is in `snowflake/src/analytics-config.js`; an optional `VITE_GA_MEASUREMENT_ID` build variable can override it. Never add the unconditional Google snippet as a second tag or activate a second tag through Cloudflare Zaraz.

The tag is enabled only on snowflake3d.com, www.snowflake3d.com and the preview branch alias. Per-deployment Pages hashes and arbitrary forks do not collect data. Preview events carry debug_mode for DebugView; production omits that parameter. A local test build can use `VITE_ANALYTICS_LOCAL_TEST=true` with a dummy ID and a mocked tag. That flag is not set for deployment.

## Consent and data minimisation

The Google tag is absent until an explicit Accept analytics choice. Rejection never loads the Google script and does not send denied-consent/cookieless pings. The generator remains usable. Accept and Reject have equal prominence. Closing the dialog is not acceptance.

The necessary first-party cookie `sf3d_privacy_v1` stores only the choice, version and expiry, for 180 days. Accepted Analytics cookies use the `sf3d_ga` prefix and a non-renewing 180-day configured expiry. Their values are pseudonymous Google identifiers, not snowflake seeds. Cookie settings can withdraw consent, remove accessible analytics cookies and reload without the tag. Same-origin tabs receive a consent-change signal; focus and expiry checks also stop tracking. Previously sent/in-flight information cannot be recalled by withdrawal.

Only the workshop page loads Analytics. `/contact` and `/analytics` offer Cookie settings without loading the Google tag or sending events, even if consent was previously granted.

Every explicit event uses a fixed workshop URL, empty page_referrer and a constant title. No entered text, seed, recipe, query string, fragment, filename, clipboard URL or enquiry payload is passed as an app event property. The HTTP no-referrer policy also applies to the Google script request. Google still processes its normal analytics identifiers, browser/device data and approximate location after consent. This is not a claim of zero personal-data processing.

## Confirmed web-stream settings

The operator supplied the measurement ID and confirmed saving these enhanced measurement settings:

- Page loads left as provided by the interface; code sets send_page_view:false and sends one explicit sanitized page_view.
- Browser-history page changes: off. The generator updates its history URL with design recipes, so do not enable this.
- Scrolls: optional on. Uses the configured clean page context; no entered text is added.
- Outbound clicks, site search, form interactions, video engagement and automatic file downloads: off.

Keep these settings in place. They are account settings, not something the repository can enforce. The tag configuration disables Google signals, advertising personalisation and URL passthrough. Review any connected Ads features or account-injected tags separately.

## Explicit events

| Event | Extra app parameters |
| --- | --- |
| page_view | None |
| generate | design_count, integer 1–24 |
| download_stl | None |
| download_3mf | None |
| download_zip | design_count; file_format = stl, 3mf or both |
| copy_design_link | None |

Download events are recorded after the file is prepared and before handing it to the browser; they indicate download initiation, not successful completion. The initial page_view waits for the Google script load event. Preview app events explicitly include debug_mode for DebugView.

Actions before consent are discarded, not queued for later collection. If Scrolls remains enabled, GA may additionally report its scroll event. Events do not establish that a file printed successfully.

## Check the deployed preview

1. Open the preview workshop in a fresh browser context, without tracking-blocker extensions for this deliberate test.
2. Reject Analytics and confirm the generator still works. No Google tag/collect request should occur.
3. Open Cookie settings and accept Analytics. Generate a design and download a file.
4. Open the matching property's Realtime or DebugView and look for page_view, generate and the relevant download event. Allow time for Google to process them. Do not treat local mocked-tag tests as proof of receipt in Google.
5. Inspect actual browser network payloads using a design with non-sensitive test text. Confirm no recipe query, entered text, filename or referrer appears in any Google request, including optional scroll events.
6. Withdraw consent. Confirm the page reloads, analytics cookies are removed and the Google tag does not reload. Check a second same-origin tab as well.
7. Open the enquiry page and verify it makes no Analytics request. Never capture enquiry values in event tracking, monitoring or logs.

The automated browser checks mock the Google script. They verify pre-consent blocking, rejection, safe queued commands/events, no referrer header, withdrawal/cookie deletion, cross-tab withdrawal, expiry, mobile layout and the untracked pages. Actual Google ingestion still needs the operator's check.

## Retention and privacy before public launch

In GA4 Admin → Data collection and modification → Data retention, review the event/user retention setting. Two months was proposed earlier but has not been verified in the account. Aggregate reports can have different retention. Do not state a configured duration in the public privacy notice until confirmed.

The analytics/cookie information page describes the implemented browser behaviour. The full launch privacy notice remains in docs/launch until operator identity/jurisdiction, provider agreements/transfers and actual retention details are settled. The separate enquiry-email policy is ninety days after resolution, with the agreed exceptions; website code does not delete emails automatically.

## Search Console

The operator confirmed that snowflake3d.com is already verified as a Domain property. No additional HTML verification tag or Analytics-based verification is needed. Keep the DNS verification record intact. Do not use the Analytics tag to bypass consent for verification.

Preview remains noindex with robots exclusion. When the approved release goes to the custom domain, separately configure production indexing, canonical URLs, sitemap, redirects and SEO content, then submit/inspect the production URL in Search Console. Existing account verification does not mean the currently unpublished domain is already indexed or production-ready.

References: [Google consent setup](https://support.google.com/analytics/answer/14009635), [GA4 configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), [page-view measurement](https://developers.google.com/analytics/devguides/collection/ga4/views), [Search Console properties](https://support.google.com/webmasters/answer/34592).
