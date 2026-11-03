# 2N2T — portfolio site

Plain HTML, CSS and vanilla JS. No framework, no build step, nothing to install.

```
index.html              Homepage (Film / Photography / Music panels)
about/index.html        About (bio, services)
contact/index.html      Contact details + form (Netlify Forms)
film/index.html         Film & productions
photography/index.html  Highlights gallery + category cards
photography/*/          Category pages (weddings, landscape, portraits, music, street, film)
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

The `photos` list is the **Highlights** slideshow at the top of `/photography/`.
- It moves to the next photo every 5 seconds. To change that, edit `SLIDE_SECONDS` near the slideshow code in `main.js`.
- Each photo is shown whole, with a blurred copy filling the frame behind it, so portrait-shaped photos aren't cropped.
- Captions appear on the photo.
- It pauses when it's scrolled out of view or the full-size viewer is open. Visitors who've turned on reduced motion get no autoplay or zoom.

**Category galleries:** the `photoCategories` list in `content.js` holds six categories: Weddings, Landscape, Portraits, Music, Street and Film. Each has its own page at `/photography/<slug>/`, and the Photography page lists them as cards under Highlights. To add photos to a category, add entries to that category's `photos` list. They use the same format as above.

To add a brand-new category:
1. Copy one of the folders (for example `photography/street/`) and rename it, say to `photography/events/`.
2. In the copy's `index.html`, change `data-category="street"` to `data-category="events"`. Also change the page title, description, `canonical`/`og:url` and the `<h1>`.
3. Add a matching entry to `photoCategories` in `content.js` with `slug: "events"`.
4. Add the new page's address to `sitemap.xml`.

Lightbox controls: click to open, ← / → to move, Esc to close, swipe on phones.

### Music

**Bandcamp:** open your track or album on Bandcamp and click **Share / Embed → Embed this album**. Pick any style, copy the code, and paste it between backticks:

```js
{ bandcamp: `<iframe ... src="https://bandcamp.com/EmbeddedPlayer/album=123.../" ...></iframe>`,
  title: "My EP", artist: "2N2T", year: "2026", notes: "Out now." }
```

The site picks out the album/track number and shows Bandcamp's large player with full artwork, recoloured to match the site. It keeps the player height Bandcamp gave you so the artwork fits. Albums show their track list. Add `tracklist: false` to hide it.

**Your own audio file:**

```js
{ src: "assets/audio/track.mp3", title: "Track", artist: "2N2T",
  year: "2026", duration: "3:41", notes: "A sentence about it." }
```

Releases are split into two rows automatically: Bandcamp albums and EPs go under **Albums & EPs**, and everything else under **Singles**. Add `type: "album"` or `type: "single"` to a release to override this.

**Bands:** the `bands` list in `content.js` sets the Spotify players under **Bands**. On Spotify, open the band and click **… → Share → Copy link to artist**, then paste the link:

```js
{ name: "Vordermann", spotify: "https://open.spotify.com/artist/...", notes: "" }
```

Album, track and playlist links work too, and so does Spotify's embed code.

Only one track plays at a time. Audio downloads only when someone presses play.

### Homepage panels

Edit the three `<a class="panel">` blocks in `index.html`.

- **Video Production** has a muted, looping YouTube video as its background (currently the Silk Mill showreel, `a8pjf4iHd9c`). To change it, replace that video ID in the `<img>` and `data-youtube-bg` lines. The video's thumbnail shows first. The video fades in after the page has loaded, and it's skipped for visitors with reduced motion or data saver on.
- **Photography** and **Music** use images in `assets/img/home/`. Replace those files, or change the `src`.

The Video Production page still lives at `/film/`, so existing links keep working.

### About and Contact pages

- **About** (`about/index.html`): the bio and the "What I do" list are plain HTML, marked with an `EDIT ME` comment. Replace the placeholder text. The portrait is `assets/img/about/alex-portrait.jpg`, a web-sized copy of your upload `alex2n2t-contact.jpg`.
- **Contact** (`contact/index.html`): your email, location and links, plus a contact form.
  The form uses **Netlify Forms**, which is free and needs no setup beyond deploying to Netlify. Messages appear in Netlify under **Forms**. To get them by email, go to **Site configuration → Notifications → Form submission notifications**.
  After someone sends a message, they return to the Contact page and see a thank-you note.
  On GitHub Pages the form won't work. Delete the `<form>…</form>` block and keep the email link.

### Header, footer, email and socials

These are plain HTML in each page: `index.html`, `film/`, `photography/`, `music/`, `about/`, `contact/` and `404.html`.
To change the email or social links, find and replace them across those seven files.
The Instagram link is different on each page on purpose.

The menu is the three-line button at the top right. To add a page to it, add a `<li><a href="...">Name</a></li>` line inside `<nav class="site-nav">` on every page.

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
