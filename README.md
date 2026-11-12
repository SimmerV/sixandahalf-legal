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

## When a game goes live on Google Play

Delete the `data-soon` attribute from its store links: one in `index.html` and two in `glimmerline/index.html`. The buttons then read "Get it on Google Play" and link to the listing.

No game code lives here.
