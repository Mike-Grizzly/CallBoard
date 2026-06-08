# Proscene Studio

The content editor (Sanity Studio) for the marketing blog. It's a **standalone**
project — kept out of the Next app so the production app stays light. It's
deployed to Sanity's hosting (`https://dsciikio.sanity.studio`), not to Vercel.

Project ID `dsciikio` · dataset `production` (both already wired in
`sanity.config.ts`).

## First-time setup & deploy

```bash
cd studio
npm install
npx sanity login        # sign in with the Sanity account that owns the project
npx sanity deploy       # choose a studio hostname, e.g. "dsciikio" -> dsciikio.sanity.studio
```

Then open the studio URL it prints, create a few **Blog post** documents, and
hit **Publish**. They'll appear on the live site at `/blog` within ~60s
(the app falls back to placeholder content until at least one post exists).

## Editing locally

```bash
cd studio
npm run dev             # http://localhost:3333
```

## Notes

- The app reads published posts via `lib/sanity/*`. No token is needed for a
  public dataset; for a private dataset set `SANITY_API_READ_TOKEN` in the app's
  env (Vercel + local `.env.local`).
- Add `http://localhost:3000` and `https://proscene.app` under
  **sanity.io/manage → API → CORS origins** so the app can fetch.
- Changing the schema? Edit `schemaTypes/` and re-run `npx sanity deploy`.
