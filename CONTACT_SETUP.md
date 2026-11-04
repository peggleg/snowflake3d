# Privacy enquiry form setup

The form lives at `/contact`, linked from the generator footer. `/api/contact` is a Cloudflare Pages Function. There is no database, queue, saved submission archive or application logging of message bodies. Cloudflare and the receiving email service still process mail and may retain it under their policies.

The source is prepared locally. A verified destination address alone does not activate sending. Account access is not configured in this development session; enter the settings below in Cloudflare rather than in chat or source files. No real email was sent during the automated tests.

## 1. Create Turnstile

In Cloudflare, open Turnstile and add a widget named Snowflake3D privacy enquiries. Choose Managed mode. Allow `preview.snowflake3d.pages.dev` for initial testing and `snowflake3d.com` for launch. Add `www.snowflake3d.com` only if you plan to serve the form there. Do not use an unrestricted wildcard or production test keys. A deployment-specific Pages hostname also needs an allowed hostname if you test the form there.

Keep the secret key private. The site key is public by design; it identifies the widget, not the destination inbox. The handler verifies success, hostname and the fixed `privacy-contact` action on the server. Tokens are single-use; users must complete the check again after a failed submission.

## 2. Prepare email sending

Keep the destination address you already verified in Cloudflare Email Routing. The handler sends only to this configured recipient, never to a visitor-supplied destination, so this is the verified-destination workflow rather than arbitrary-recipient email.

Confirm that Cloudflare Email Service accepts a sender on your domain, for example `privacy-form@snowflake3d.com`. This is the message's From address; the private receiving inbox is a different setting. Follow the domain/email setup shown in your account and preserve existing mail DNS records. Do not purchase a plan or replace working MX/SPF/DMARC records merely to test the form. If the dashboard requires a paid upgrade, pause and check the verified-destination route first.

Create an API token restricted to the correct account with Email Sending: Edit permission, following Cloudflare's current token interface. Do not use a global API key. The Pages Function uses the Email Service REST endpoint, so no unsupported Pages email binding or separate third-party mail provider is required.

## 3. Configure the Pages preview environment

Under Workers & Pages → snowflake3d → Settings → Variables and Secrets, select Preview. Add these server-side settings:

| Name | Value | Storage |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | The widget's public site key | Variable |
| `TURNSTILE_SECRET_KEY` | Widget secret | Secret |
| `CONTACT_ACCOUNT_ID` | Your Cloudflare account ID | Variable or secret |
| `CONTACT_EMAIL_TOKEN` | Scoped Email Sending API token | Secret |
| `CONTACT_TO_EMAIL` | Your verified private destination inbox | Secret |
| `CONTACT_FROM_EMAIL` | The domain sender accepted by Cloudflare | Secret |

These are runtime settings. Do not prefix them with `VITE_`, put them in the HTML, or paste them into committed configuration. `/api/contact` returns only availability and the public site key. Missing settings leave the form disabled and submissions return an unavailable response; there is no unprotected fallback.

The build root should remain the repository root, with `npm run build` and output `dist-snowflake`. Pages Git integration must compile the repository's root `functions/` directory. The public `_routes.json` invokes a Function only for `/api/contact`, keeping the generator and static assets outside the Functions quota. No D1, KV, R2, Durable Object or mail database binding is needed.

## 4. Deploy and test preview

Redeploy preview after adding the settings; runtime changes may require a new deployment. Open the preview branch alias at `/contact`, complete Turnstile and send one deliberate test enquiry. Confirm it reaches the private inbox, including spam folders, before treating the form as operational.

Check rejection of invalid/expired challenges and that a failed delivery retains the unsent form values. The handler reports success only when Cloudflare says the fixed recipient is delivered or queued. Queued does not guarantee eventual inbox delivery. It does not expose provider errors, email credentials, recipient addresses or message bodies in its HTTP response. The visitor's reply address appears in the email's plain-text body; reply to that address from your inbox. There is no automatic visitor confirmation email.

At higher abuse levels, add a Cloudflare rate rule for POST `/api/contact` using the facilities available on your plan. Turnstile and the honeypot are not a guarantee against all spam. Do not enable request-body capture or forward enquiry payloads to analytics, monitoring or logs.

## 5. Privacy and production

Finish the privacy notice before public launch: identify the operator appropriately, describe correspondence handling, choose a retention/deletion rule for the inbox, and describe Turnstile/email providers. The form is a contact route, not a replacement for the operator's identity or a completed privacy notice. The user has not yet supplied these final details.

The current page includes a short handling explanation and a Cloudflare privacy link; it does not publish the unfinished policy drafts. Analytics remains absent from this form. The no-referrer policy prevents passing generator recipe URLs as navigation referrers; form requests use POST JSON rather than putting correspondence into URLs.

Configure Production settings separately only when the tested release is approved for `main`. Keep preview noindex. No DNS changes, production deployment or actual test email are automated by this setup document.

## References

- [Email Service REST API](https://developers.cloudflare.com/email-service/api/send-emails/rest-api/).
- [Verified destination addresses](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/).
- [Server-side Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
- [Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/).
