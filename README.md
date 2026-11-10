# 2N2T — portfolio site

Plain HTML, CSS and vanilla JS. No framework and no build step. Content is edited in **Pages CMS** (https://app.pagescms.org), which saves to the `data/` folder in this repository.

```
index.html              Homepage (showreel hero, selected work, Photography/Music tiles)
film/index.html         Video Production (Live In Session first, then other work)
photography/index.html  Featured photo grid + gallery cards
photography/*/          Gallery pages (weddings, landscape, portraits, music, street, film)
music/index.html        Bandcamp releases (albums, singles) + bands on Spotify
about/index.html        About (portrait, bio, services)
contact/index.html      Contact details + form (opens the visitor's email app)
404.html                Not-found page
data/*.json             ← ALL content (edited in Pages CMS)
.pages.yml              Tells Pages CMS which fields to show
main.js                 Loads data/*.json and builds the pages (no need to edit)
style.css               ← All colours, fonts and spacing (CSS variables at the top)
assets/img/             Images (CMS uploads go here too)
favicon.svg / .ico      Favicons
scripts/apply_seo.py    Writes the CMS's SEO text into the pages when publishing
scripts/make_web_images.py  Makes web-sized copies of photos added to photos/Original
scripts/make_web_videos.py  Makes web versions of videos added to assets/video/Original
assets/video/           Showreel video files (Original uploads + Web versions)
.github/workflows/      GitHub's publishing steps
robots.txt, sitemap.xml, .nojekyll
```

## Preview locally

The pages load their content from `data/`, which browsers block when you open a file directly. Run a tiny local server instead:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Editing content (Pages CMS)

1. Go to https://app.pagescms.org and sign in with GitHub.
2. Open the **2n2t-code/site** repository. On the first visit, Pages CMS asks you to install its GitHub app on this repository.
3. Edit, then **Save**. Each save is a change on GitHub, and GitHub Pages publishes it within a minute or two.

The sections in the CMS:

| CMS section | File | What it controls |
|---|---|---|
| **Video work** | `data/videos.json` | Homepage "Selected work" (in list order) and the Video Production page |
| **Homepage** | `data/home.json` | Headline, small text, showreel video, Photography/Music tile images, bottom "Got a project" section |
| **SEO** | `data/seo.json` | Meta Title and Meta Description for Home, Video Production, Photography, Music, About and Contact |
| **Photography** | `data/photos.json` | Featured photos (main Photography page) and the six gallery pages |
| **Music** | `data/music.json` | Bandcamp releases and band Spotify players |
| **About page** | `data/about.json` | Intro line, portrait, bio, "What I do" |
| **Contact & social links** | `data/site.json` | Email (footer and contact form), location, Instagram/YouTube/Bandcamp/LinkedIn |

Notes:
- **Videos:** paste the YouTube or Vimeo link as it appears in your browser. Playlist parts on the end of the link are fine. Anything whose label includes "Live In Session" is featured at the top of the Video Production page. Vimeo videos need a custom thumbnail.
- **Upload limits:** the hosted Pages CMS can only upload files up to about **3 MB**. For larger photos, big batches and videos, upload on GitHub instead (25 MB per file, up to 100 files at once): photos at https://github.com/2n2t-code/site/upload/main/assets/img/photos/Original, videos at https://github.com/2n2t-code/site/upload/main/assets/video/Original. Then pick them in the CMS as normal.
- **Photos:** upload full-size photos to **photos/Original** in the CMS's Media section. Within a minute or two, GitHub automatically makes web versions in **photos/Web**: `name.jpg` (2000px on the long edge) and `name-sm.jpg` (800px wide). It turns phone photos the right way up, removes camera data such as GPS location, and handles JPG, PNG, WebP, TIFF and iPhone HEIC. Reload the media library, then pick `name.jpg` as the Photo and `name-sm.jpg` as the Smaller version. Re-uploading a changed photo with the same name remakes its web versions. The originals are kept in the repository but left out of the published site. (`scripts/make_web_images.py`, run by `.github/workflows/web-images.yml`.)
- **Bandcamp:** paste the **embed code** from Bandcamp's Share / Embed button, not the page link. The site reads the release number from it and restyles the player to match. Albums and EPs go on their own row automatically.
- **SEO:** each main page has a Meta Title (aim for 50–60 characters) and Meta Description (120–155) under **SEO**. Each gallery page has its own under **Photography → Galleries**. When the site publishes, GitHub writes them into the page files (`scripts/apply_seo.py`, run by `.github/workflows/pages.yml`), so Google and link previews in WhatsApp, Facebook and LinkedIn see them.
- **Phone images:** most images have an optional "on phones" or "Phone version" field: video thumbnails, the showreel background, the homepage tiles, featured and gallery photos, gallery card images and the About portrait. On screens under 640px wide it's used instead of the normal image. Use it when the normal crop doesn't work on a small screen, for example a tighter crop.
- **Bio:** leave a blank line between paragraphs. The first paragraph is shown larger.
- **New gallery pages:** a brand-new photography category needs its own page folder. Ask Claude, or copy `photography/street/`, change `data-category` and the page titles, add a matching entry under Galleries with that page address, and add it to `sitemap.xml`.
- **Choosing and ordering Featured photos:** in the CMS, **Photography → Featured photos** is a grid of thumbnails. Drag to reorder, **+** to add (pick `name.jpg` from photos/Web; the site finds `name-sm.jpg` itself), **×** to remove. Each photo's description and caption come from **Featured photo details** if it's listed there, otherwise from the gallery it's in, otherwise from its file name.
- **Featured photos:** the main Photography page uses a justified grid. Every photo shows uncropped at its real shape, in your CMS order, in rows that exactly fill the page width. The page picks how many photos fit per row, fewer on phones, and re-flows when the window size changes. Captions appear over the lower third of a photo on hover, and in the full-size viewer.

You can also edit the `data/*.json` files directly on GitHub, or ask Claude. Everything uses the same files.

### Homepage layout

1. **Showreel:** on desktops and tablets the showreel plays full-screen, muted and looping, with no text over it. On phones it's a tap-to-play 16:9 tile instead.
   - **Intro section** (just below): the small line and headline, your **Introduction** (Homepage → Introduction in the CMS; hidden while empty), plus **Watch the showreel** (YouTube, with sound) and **All video work**.
   - **Phones:** the showreel tile is the same size as the Selected work tiles. No background video plays on phones. The tile shows the YouTube showreel's thumbnail, or the "Showreel background on phones" image if one is set in the CMS. Visitors with reduced motion or data saver on also see a still image. **Watch the showreel** opens the YouTube version with sound in a pop-up player.
   - **HD background (recommended):** upload a 20–40 second cut (1080p, H.264 MP4, about 6–8 Mbps, no audio, no black bars, under 25 MB) on GitHub at https://github.com/2n2t-code/site/upload/main/assets/video/Original. The CMS can't upload files this big. Then, in the CMS, pick it as **Showreel background video file** under Homepage. A few minutes later GitHub makes `name-1080.mp4` (desktops), `name-720.mp4` (phones) and `name-poster.jpg` in **Videos → Web**, and republishes the site (`scripts/make_web_videos.py`, run by `.github/workflows/web-videos.yml`). The originals are kept in the repository but left out of the published site.
   - Until the web versions exist, or if the field is empty or the file fails, the YouTube showreel plays in the background. YouTube lowers the quality of background videos and has to zoom in to crop black bars, so a video file looks much sharper.
2. **Selected work:** a tile for every video in Video work, in list order. The first tile runs full width. With an even number of videos the last one is full width too, and an odd number keeps the rest in pairs.
3. **Also by 2N2T:** Photography and Music tiles (images set under **Homepage** in the CMS).
4. **Got a project in mind?** with a link to the Contact page.

On the homepage the menu links sit across the top right on screens 900px and wider. Smaller screens and the other pages use the menu button.

### Menu

To add a page to the menu, add a `<li><a href="...">Name</a></li>` line inside `<nav class="site-nav">` on every page.

### Look and feel

Change the variables at the top of `style.css` (`--color-accent`, `--font-display`, `--space-*` and so on).
The fonts are system fonts, so nothing downloads. To use a web font, add its `<link>` to each page's `<head>` and update `--font-display` or `--font-body`.

### Image tips

- Export JPG or WebP at quality 70–80. Aim for under 300 KB for full-size images and under 120 KB for thumbnails.
- Replace `assets/img/og-image.jpg` (1200×630). It's the preview image shown when the site is shared on social media.

## SEO checklist when you go live

- Every page has a title, description, canonical URL, Open Graph and Twitter tags. Update the wording in each page's `<head>` if you like.
- Page addresses, preview images, `sitemap.xml` and `robots.txt` use the **Site address** under **Contact & social links** in the CMS (currently `https://2n2t-code.github.io/site`). When you get a domain, change it there. The next publish updates every page (`scripts/apply_seo.py`).
- The homepage includes schema.org `ProfessionalService` data. Update the email and `sameAs` social links there too.

## Deploy

### Netlify

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

2. On a free GitHub account, Pages only works for **public** repositories. To make yours public, open **Settings → General → Danger Zone → Change visibility**.
3. In the repo, open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` then publishes the site on every change, after writing the CMS's SEO text into the pages.
4. The site is then live at `https://2n2t-code.github.io/site/`.
5. **Adding a custom domain later (for example 2n2t.com):** in **Settings → Pages → Custom domain**, enter the domain and save. GitHub adds a `CNAME` file to the repository. At your domain provider, add GitHub's four `A` records for the domain (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and a `CNAME` record for `www` pointing to `2n2t-code.github.io`. Then tick **Enforce HTTPS**.

All links between pages are relative, so the site works both at `2n2t-code.github.io/site/` and on a custom domain. `404.html` works out where the site's root is when it loads.

When you add a custom domain, also change **Site address** in the CMS (Contact & social links) so page addresses, link previews and the sitemap use it.
