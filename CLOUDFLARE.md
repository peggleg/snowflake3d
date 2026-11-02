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

The production bundle needs no secrets, database, Worker bindings or SITE_URL. Never put a Cloudflare token in a Vite variable or in this repository.

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
