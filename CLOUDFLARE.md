# Cloudflare Pages setup for peggleg/snowflake3d

## Allow GitHub access

ChatGPT GitHub access has been granted for the repository. Cloudflare uses a separate GitHub App installation:

1. Open GitHub **Settings → Applications → Installed GitHub Apps**: https://github.com/settings/installations
2. Find **Cloudflare Workers and Pages** (the display name may be Cloudflare Pages) and choose **Configure** for the `peggleg` account.
3. Under repository access, keep **Only select repositories**, add **snowflake3d**, and save. Retain lithophane-site if its own Pages project still uses that installation.
4. If no Cloudflare installation exists, start Connect to Git in Cloudflare and install/authorize its app when prompted. Select `peggleg/snowflake3d`.

Do not grant collaborators access to the repository just to let them use the generator. Repository permissions, Cloudflare Git integration and visitor access are separate controls.

## Create the independent Pages project

1. In Cloudflare choose **Workers & Pages → Create application → Pages → Connect to Git** (some dashboards label this **Import an existing Git repository**).
2. Select **peggleg/snowflake3d**, then begin setup.
3. Use these settings:

| Setting | Value |
| --- | --- |
| Project name | `snowflake3d` (or another available name) |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | Leave blank (repository root) |
| Build command | `npm run build` |
| Build output directory | `dist-snowflake` |
| Environment variable | `NODE_VERSION` = `24` |

4. Save and deploy. Use the hostname returned by Cloudflare; the expected URL, if that project name is available, is `https://snowflake3d.pages.dev/snowflake`. This expected URL is not evidence of a completed deployment.
5. Test `/snowflake`, `/` redirect, 24-design generation, downloads and a copied design link. Unrelated paths should return 404.
6. Future pushes to `main` deploy automatically. Other branches can produce preview deployments according to this project's settings.

The browser generator needs no database or browser-side secrets. The privacy form needs the server-side Production variables described in CONTACT_SETUP.md. Configure those separately from Preview and allow snowflake3d.com in the Turnstile widget. Never put a Cloudflare token or contact/email secret in a Vite variable or this repository.

## Preview deployment

The `preview` branch is the staging source. Production remains on `main`.

For a Git-integrated Pages project:

1. Open **Workers & Pages → snowflake3d → Settings → Builds & deployments → Branch control** (the exact section name varies by dashboard).
2. Keep **Production branch** set to `main`.
3. Enable **Preview deployments** for `preview`, either by selecting **All non-production branches** or a custom include rule of `preview`. Ensure it is not excluded and automatic builds are enabled.
4. Use build command `npm run build`, output `dist-snowflake`, repository root blank, and set **NODE_VERSION=24** for the **Preview** environment as well as Production.
5. A push to `preview` starts a preview build. If the branch was pushed before Git integration or branch controls were configured, create a deployment for that branch from the dashboard when offered, or push another commit to `preview` after enabling it.
6. Open the successful preview deployment's **Visit site** link and append `/snowflake`. For a project whose assigned Pages hostname is `snowflake3d.pages.dev`, the stable branch alias is expected to be `https://preview.snowflake3d.pages.dev/snowflake`. Cloudflare also assigns an immutable deployment URL. Use the URLs Cloudflare actually returns; this document does not confirm that either URL is live.

The preview builds the same standalone generator and includes noindex headers. SEO output is selected using Cloudflare’s `CF_PAGES_BRANCH`: only `main` enables production indexing. Local builds without that variable remain excluded from search. It has no production custom domain. Preview and production access rules are separate; noindex does not restrict visitors. If a shared link is copied while on preview, its hostname points the recipient to preview.

For an authenticated manual upload to the existing Pages project:

```sh
npm ci
npm run pages:deploy:preview
```

This command explicitly uploads with `--branch preview`, without promoting `main`. The project must already exist. It defaults to the project name `snowflake3d`; update the script if your actual Pages project name differs. Do not use `pages:deploy` when you intend to deploy a preview, because that command targets production `main`.

Verify the preview's `/snowflake`, root redirect, 24-design generation, seed/link reload, STL and 3MF downloads, and a 404 for unrelated routes before promoting changes. To promote reviewed code, merge `preview` into `main`; a Git-integrated project then deploys production.

## Troubleshooting redirect loops

The build emits `snowflake.html`, which Pages serves directly at `/snowflake`. The root redirects there with 302. Do not rewrite `/snowflake` to `/index.html`: Pages can canonicalize that index back to `/`, creating a loop with the root redirect. The build check enforces the direct HTML route and absence of a root index.

After deploying a routing fix, use the new deployment URL or the `preview` branch alias. A hash-based URL such as `8bd716c1.snowflake3d.pages.dev` remains tied to its old deployment and will not acquire later fixes. Deleting cookies is not a fix for an application redirect loop.

## If a snowflake Pages project already exists

If it is connected to the old repository, create the new project above rather than changing the lithophane project's source or deployment settings. If it uses Direct Upload, choose whether to keep manual uploads or create the new Git-integrated project for automatic deployments; Cloudflare does not support switching a Direct Upload project to Git integration in place.

After the new project is verified, an existing snowflake-only custom domain can be detached from its old Pages project and added to this one. Use the new project's **Custom domains → Set up a custom domain** flow and follow the DNS instructions it supplies. This can cause a brief interruption while validation completes. Do not move the lithophane site's hostname. Leave the old project available until the replacement is working.

## Optional manual deployment

For a separate Direct Upload project instead of Git integration, authenticate Wrangler on your own machine or configure a scoped CI token:

```sh
npx --yes wrangler@4.151.1 login
npm ci
npm run pages:create
npm run pages:deploy
```

Create only once. Both scripts target `snowflake3d`; adjust the project name in package.json if you choose a different one. CI credentials, when used, are `CLOUDFLARE_ACCOUNT_ID` and a scoped `CLOUDFLARE_API_TOKEN` with Account / Cloudflare Pages / Edit, supplied through the CI secret store.

## Access protection and migration status

Main-site access protection is separate. These instructions do not alter lithophane Access policies, DNS or Pages configuration. The snowflake app has no application login; its robots/noindex settings are indexing controls, not protection. For visitor restrictions, configure Cloudflare Access for the snowflake hostname separately.

The standalone app is published from this repository. No Cloudflare credentials or management connector are configured in the development session; complete the Cloudflare setup above in your dashboard before a live deployment can be verified.

## Production SEO and domain launch

Only `CF_PAGES_BRANCH=main` generates indexable workshop/help/privacy/usage/independence pages, an allow-list robots file and `sitemap.xml`. Contact and analytics-information pages remain noindex. Every page has a fixed canonical URL on `https://snowflake3d.com`, without design query parameters, plus Open Graph and social-card metadata. `/` and `/snowflake/` redirect to `/snowflake` with 301 in production (302 on preview). All Pages hostnames retain noindex response headers, including hash deployment URLs. The generated security headers retain CSP and no-referrer.

Local verification: `npm run build:production && npm run check:production`. A normal local `npm run build && npm run check` verifies the preview exclusion. The checked-in social preview artwork is 1200 × 630 pixels; `scripts/create-social-preview.mjs` reproduces its SVG source from an actual snowflake.

Cloudflare dashboard actions (not available to this session’s GitHub connector):

1. In Workers & Pages → snowflake3d → Custom domains, add **snowflake3d.com** and wait for Active / certificate validation. Use this flow rather than creating a CNAME alone.
2. Keep Production branch `main`. Copy the working contact variables into **Production**, retaining secret types; allow the domain in the Turnstile widget. See CONTACT_SETUP.md for the exact variable names. Never expose those values in browser build variables.
3. After the reviewed commit is promoted to main and Pages reports success, check `https://snowflake3d.com/snowflake`, `/robots.txt`, `/sitemap.xml`, `/social-preview.png`, `/help` and the privacy form’s availability. Confirm an actual form submission yourself if needed; automated checks must not send enquiries.
4. In Search Console’s already verified Domain property, submit `https://snowflake3d.com/sitemap.xml` and inspect/request indexing of `https://snowflake3d.com/snowflake`. Indexing is not instant or guaranteed.
5. Point the existing Better Stack availability monitor at the live public domain and confirm its alerts. Do not add visitor monitoring scripts as part of uptime checks.
6. Optional redirects: Cloudflare Bulk Redirects can send only `snowflake3d.pages.dev` to `snowflake3d.com`, preserving path and query, after the domain works. Do not redirect the `preview` alias. To serve or redirect `www`, explicitly configure its custom-domain/DNS/redirect rule too; canonical tags do not configure DNS.

Before promotion, main is at `d77afc4f23fd96b94cdd5068fdbd1502abc78850`. Keep deployment history and the successful launch commit for recovery. For a later code problem, use Cloudflare’s previous successful production deployment rollback, then fix and test on preview; do not force-push away history. Private launch-review documents under docs/ are intentionally not deployed or committed with this release.

Primary references: [Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), [Headers](https://developers.cloudflare.com/pages/configuration/headers/), [Pages-domain redirects](https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/).
