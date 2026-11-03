# 2N2T — portfolio site

Plain HTML, CSS and vanilla JS. No framework, no build step, nothing to install.

```
index.html              Homepage (Film / Photography / Music panels)
film/index.html         Film & productions
photography/index.html  Gallery + lightbox
music/index.html        Track list
404.html                Not-found page
content.js              ← ALL videos, photos and tracks live here
main.js                 Renders content.js into the pages (no need to edit)
style.css               ← All colours, fonts and spacing (CSS variables at the top)
assets/                 Images, audio, video, OG image, icons
favicon.svg / .ico      Favicons
robots.txt, sitemap.xml, CNAME, .nojekyll
```

## Preview locally

Open `index.html` in a browser, or run a tiny local server (recommended, so the folder URLs work):

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Adding content

Everything is in **`content.js`**. Copy an existing entry, paste it, and change the values.
Mind the commas between entries.

### Film

Put feature videos in `film.liveInSession` (these show first, larger) and everything else in `film.work`.

```js
{ type: "youtube", id: "dQw4w9WgXcQ", title: "Artist — Song (Live In Session)",
  client: "Live In Session", role: "Directed & edited", year: "2026" }
```

- **YouTube**: `id` is the part after `watch?v=`. The thumbnail is fetched automatically.
- **Vimeo**: `id` is the number in the URL (`vimeo.com/76979871` → `"76979871"`). Add a `thumb` image, because Vimeo thumbnails aren't automatic.
- **Self-hosted MP4**: `type: "mp4"`, `src: "assets/video/my-film.mp4"`, plus a `thumb`.

Videos show a thumbnail and play button. The player or embed loads only when someone clicks, so the page stays fast.
Keep self-hosted MP4s small (H.264, `-movflags +faststart`). Big files are better on YouTube or Vimeo.

### Photography

```js
{ src: "assets/img/photos/gig.jpg", thumb: "assets/img/photos/gig-sm.jpg",
  alt: "Singer on stage at Band on the Wall", caption: "Band on the Wall, 2026" }
```

- `src` is the large image shown in the lightbox (about 1600–2000px on the long edge).
- `thumb` is the grid image (about 800px wide). It's optional, but much faster.
- Always write a real `alt` description.

Lightbox controls: click to open, ← / → to move, Esc to close, swipe on phones.

### Music

**Bandcamp:** open your track or album on Bandcamp and click **Share / Embed → Embed this album**. Pick any style, copy the code, and paste it between backticks:

```js
{ bandcamp: `<iframe ... src="https://bandcamp.com/EmbeddedPlayer/album=123.../" ...></iframe>`,
  title: "My EP", artist: "2N2T", year: "2026", notes: "Out now." }
```

The site picks out the album/track number and restyles the player to match the site's colours. Add `tracklist: true` to show an album's full track list.

**Your own audio file:**

```js
{ src: "assets/audio/track.mp3", title: "Track", artist: "2N2T",
  year: "2026", duration: "3:41", notes: "A sentence about it." }
```

Only one track plays at a time. Audio downloads only when someone presses play.

### Homepage panels

Edit the three `<a class="panel">` blocks in `index.html` and swap the image `src`.
The Film panel also has a muted, looping background `<video>`. Change its `data-bg-src`, or delete the `<video>` line to use only the image.
The video never plays sound, and it's skipped for visitors who use reduced motion or data saver.

### Header, footer, email and socials

These are plain HTML in each page: `index.html`, `film/`, `photography/`, `music/` and `404.html`.
To change the email or social links, find and replace them across those five files.

### Look and feel

Change the variables at the top of `style.css` (`--color-accent`, `--font-display`, `--space-*` and so on).
The fonts are system fonts, so nothing downloads. To use a web font, add its `<link>` to each page's `<head>` and update `--font-display` or `--font-body`.

### Image tips

- Export JPG or WebP at quality 70–80. Aim for under 300 KB for full-size images and under 120 KB for thumbnails.
- Replace `assets/img/og-image.jpg` (1200×630). It's the preview image shown when the site is shared on social media.

## SEO checklist when you go live

- Every page has a title, description, canonical URL, Open Graph and Twitter tags. Update the wording in each page's `<head>` if you like.
- These tags and `sitemap.xml` use `https://2n2t.com`. If the domain changes, find and replace it.
- The homepage includes schema.org `ProfessionalService` data. Update the email and `sameAs` social links there too.

## Deploy

### Netlify (easiest)

1. Go to https://app.netlify.com/drop and drag this whole folder onto the page. It's live within seconds.
   Alternatively, push the folder to GitHub, then in Netlify choose **Add new site → Import from Git**. Leave the build command empty and set the publish directory to `/`.
2. Go to **Domain settings → Add custom domain → `2n2t.com`**, then follow the DNS instructions. HTTPS is set up automatically.
3. Netlify uses `404.html` automatically.

### GitHub Pages

1. Create a repo, then commit and push this folder to the `main` branch:

   ```bash
   git init
   ```

   ```bash
   git add . && git commit -m "2N2T site"
   ```

   ```bash
   git remote add origin https://github.com/YOUR-USER/2n2t.git
   ```

   ```bash
   git push -u origin main
   ```

2. In the repo, open **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, then **main**, then **/ (root)**.
3. The `CNAME` file already contains `2n2t.com`. At your DNS provider, add the four GitHub Pages `A` records for the apex domain (or a `CNAME` for `www`) as shown in GitHub's docs. Then tick **Enforce HTTPS**.
   If you're not using the custom domain, delete `CNAME`.

All links between pages are relative, so the site also works at `username.github.io/repo/`.
The only exception is `404.html`, which uses root paths and works best on a custom domain.
