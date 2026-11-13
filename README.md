# Six and a Half Studios — sixandahalf.studio

Public studio site + legal pages, served via GitHub Pages at [sixandahalf.studio](https://sixandahalf.studio).
Plain HTML, CSS and a little JavaScript. No build step, no analytics, no third-party requests: fonts and images are served from this repo.

- `index.html` — studio landing page
- [`glimmerline/`](glimmerline/) — the Glimmerline page: a playable board (four real Journey levels), the nine themes, screenshots
  - `glimmerline/remote_config.json` — the game's hosted remote config. **The app reads this file**; changing it changes the live game.
- [`privacy/`](privacy/) — studio-wide Privacy Policy covering every app we publish (one row per app in its final table)
- `404.html` — the floor that is not there
- `assets/studio.css` — shared styles for the studio pages (home, privacy, 404); `glimmerline/glimmerline.css` and `glimmerline/glimmerline.js` belong to the game page
- `assets/fonts/` — Anybody, Newsreader, Fredoka and Nunito (SIL Open Font License; licence texts alongside)
- `app-ads.txt`, `robots.txt`, `sitemap.xml`

## Store links

Glimmerline has been on Google Play since 12 November 2026. Its store links are in `index.html` (one) and `glimmerline/index.html` (two).

A game that is not out yet gets a parked button on the home page, `<span class="btn quiet soon">Coming soon to Google Play</span>`. When its listing is live, replace the span with a link to the listing, as Glimmerline's card does.

No game code lives here.
