# 2N2T — portfolio site

Plain HTML, CSS and vanilla JS. No framework and no build step. Content is edited in **Pages CMS** (https://app.pagescms.org), which saves to the `data/` folder in this repository.

```
index.html              Homepage (showreel hero, selected work, Photography/Music tiles)
video-production/index.html  Video Production (Live In Session first, then other work)
film/index.html         Forwards old /film/ links to /video-production/
live-in-session/index.html  Live In Session: packages, prices, booking, audio engineer, recent sessions
photography/index.html  3D photo field (with gallery tags) + gallery cards
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
3. Edit, then **Save**. Each save is a change on GitHub, and it's published to 2n2t.com within a minute or two.

The sections in the CMS:

| CMS section | File | What it controls |
|---|---|---|
| **Video work** | `data/videos.json` | Homepage "Selected work" (in list order) and the Video Production page |
| **Live In Session page** | `data/session.json` | The Live In Session page (menu: Video Production → Live In Session): introduction; **Session videos** (the Recent sessions, with the same fields as Video work, kept separate from it); a packages intro line and small notes (e.g. "Based on a 3-track session"); packages (name, one price or prices by artist such as Solo artist / Duo / Full band, what's included, one can be highlighted with an optional label); extras (with their own heading); a note under the prices; how booking works; **The Team** (one entry per person: name, role, portrait, bio, a gallery of photos and a link; the portrait has a **Portrait shape**: Portrait (4:5), cropped to fit, or As uploaded, showing the whole photo, and a **Portrait focus**: which part a crop keeps, e.g. Left or Top); **Silk Mill Studios** (label, name, about text, a main photo shown to the right of the text, a gallery of photos underneath, the gear in groups, and a website link); the bottom text and the booking email's subject. Empty parts are hidden. Gallery photos open full size when clicked. In the bios and the studio text, a short line with no full stop, on its own or on the line above a paragraph, shows as a subheading |
| **Homepage** | `data/home.json` | Headline, small text, showreel video, Photography/Music tile images, bottom "Got a project" section |
| **SEO** | `data/seo.json` | Meta Title and Meta Description for Home, Video Production, Photography, Music, About and Contact |
| **Photography** | `data/photos.json` | Featured photos (main Photography page) and the six gallery pages |
| **Music** | `data/music.json` | Optional introduction line, Bandcamp releases and band Spotify players. The Music page is set in capitals and centred on desktop |
| **About page** | `data/about.json` | Intro line, portrait, bio, "What I do" |
| **Contact & social links** | `data/site.json` | Email (footer and contact form), location, social links, Site address, and the **page backgrounds** for Video Production, Photography and Music with a darkness setting |

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
- **Photography page (3D photo field):** the whole gallery floats in one 3D cluster, all visible at once. Picture every photo on the end of a stick, all anchored at the centre of an invisible sphere: it turns slowly on its own, and dragging spins it around that centre while every photo stays flat-on, facing the front (on phones: tap and hold, then drag; a sideways swipe also turns it). Visitors arrive to the title over a quick-fire full-screen slideshow, which ends by shrinking into your first Featured photo at the front of the cluster. Scrolling down zooms in until you're in the middle of the cloud, with photos all around; the page ends there (this page has no gallery cards or footer; the gallery pages are reached through the tags, and still exist at their own addresses). Hovering a photo lifts it, shows its caption and pauses the slow spin. Clicking a photo opens it full size. The tags along the bottom (**All** plus one per gallery) come from your galleries automatically; choosing one swaps in that gallery's photos. A gallery with no photos has no tag until photos are added. Pull-to-refresh is switched off on this page so swiping on a phone doesn't reload it.

You can also edit the `data/*.json` files directly on GitHub, or ask Claude. Everything uses the same files.

### Homepage layout

1. **Showreel:** on desktops and tablets the showreel plays full-screen, muted and looping, with no text over it. On phones it's a tap-to-play 16:9 tile instead.
   - **Intro section** (just below): the small line, headline and your **Introduction** on the left, with **All video work**. The **showreel tile** is on the right, in the same cinematic style as Selected work, with its own Showreel credits. Tablets stack the tile below the text. Phones skip it, because their showreel tile is already at the top.
   - **Phones with a phone video (Homepage → Showreel background video on phones):** a tall 9:16 video fills the screen behind the eyebrow, headline and a **Watch showreel** button (export 1080×1920, H.264 MP4, 10–20 s, no audio, under 25 MB; upload to assets/video/Original on GitHub). GitHub makes a 720×1280 phone version and a still frame. Reduced motion / data saver shows the still. To drop stray frames from the end of a video's web versions, add it to `TRIM_END_FRAMES` in `scripts/make_web_videos.py`.
   - **Phones without one:** the showreel tile is the same size as the Selected work tiles. No background video plays on phones. The tile shows the YouTube showreel's thumbnail, or the "Showreel background on phones" image if one is set in the CMS. Visitors with reduced motion or data saver on also see a still image. **Watch the showreel** opens the YouTube version with sound in a pop-up player.
   - **HD background (recommended):** upload a 20–40 second cut (1080p, H.264 MP4, about 6–8 Mbps, no audio, no black bars, under 25 MB) on GitHub at https://github.com/2n2t-code/site/upload/main/assets/video/Original. The CMS can't upload files this big. Then, in the CMS, pick it as **Showreel background video file** under Homepage. A few minutes later GitHub makes `name-1080.mp4` (desktops), `name-720.mp4` (phones) and `name-poster.jpg` in **Videos → Web**, and republishes the site (`scripts/make_web_videos.py`, run by `.github/workflows/web-videos.yml`). The originals are kept in the repository but left out of the published site.
   - Until the web versions exist, or if the field is empty or the file fails, the YouTube showreel plays in the background. YouTube lowers the quality of background videos and has to zoom in to crop black bars, so a video file looks much sharper.
2. **Selected work:** a tile for every video in Video work, in list order, in the same cinematic style as the Video Production page: number, label, big title, credits and a Watch button. The first tile runs full width, the rest two across. With an even number of videos the last one is full width too. Smaller tiles (phones, narrow screens) show just the number, label and title.
   - **On computers** (screens 900px+ with a mouse), Selected work is its own full-screen module (just the heading and the film strip, sized to the screen): a strip of 35 mm colour-negative film (real proportions: 36×24 frames, 8 sprocket holes per frame, glowing edge printing). When it scrolls into view, the **film strip intro video** (Homepage in the CMS; currently `Film Intro Website Video.mp4`, the film-start leader joined to the burn) plays over the dark film gate, blended so its black disappears; the strip appears under the burn already running and eases into a slow drift. Hovering a frame stops the strip and opens that frame into the full tile (number, label, title, song, credits, Watch); clicking plays the video. Pointing at the strip's right or left edge (the outer 16%) speeds it forwards or backwards, faster the closer you get to the edge, with an arrow shown, so visitors can browse all the videos. If the intro can't play, the strip just appears; with reduced motion there's no intro or drift. Phones and tablets keep the tiles below.
3. **Also by 2N2T:** Photography and Music tiles (images set under **Homepage** in the CMS).
4. **Got a project in mind?** with a link to the Contact page.

On every page the menu links sit across the top right on screens 900px and wider, with the page you're on, and any link you hover over, shown brighter. Smaller screens use the menu button.

### Menu

To add a page to the menu, add a `<li><a href="...">Name</a></li>` line inside `<nav class="site-nav">` on every page. Video Production has a dropdown (`<ul class="sub-nav">` inside its `<li class="has-sub">`) holding Live In Session; add more links there the same way. On desktop it opens when you hover or tab to Video Production; in the phone menu its links sit indented underneath.

### Look and feel

Change the variables at the top of `style.css` (`--color-accent`, `--font-display`, `--space-*` and so on).
The whole site uses **Rubik** (Google Fonts), loaded by a `<link>` in each page's `<head>`. To change font, update that link on every page and `--font-display` / `--font-body` at the top of `style.css`. Rubik is much wider than a condensed font, so the big headlines are scaled down with `zoom` in the "Rubik (site-wide font)" section of `style.css`.

### Image tips

- Export JPG or WebP at quality 70–80. Aim for under 300 KB for full-size images and under 120 KB for thumbnails.
- Replace `assets/img/og-image.jpg` (1200×630). It's the preview image shown when the site is shared on social media.

## SEO checklist when you go live

- Every page has a title, description, canonical URL, Open Graph and Twitter tags. Update the wording in each page's `<head>` if you like.
- Page addresses, preview images, `sitemap.xml` and `robots.txt` use the **Site address** under **Contact & social links** in the CMS (currently `https://2n2t.com`). If the domain ever changes, change it there. The next publish updates every page (`scripts/apply_seo.py`).
- The homepage includes schema.org `ProfessionalService` data. Update the email and `sameAs` social links there too.

## Hosting and publishing

**https://2n2t.com** is hosted on a friend's cPanel server (`gordons.hostns.io`, Thunderhat), in the `public_html` folder.

- **Domain:** registered with Spaceship. Its nameservers are `ns1.thunderhat.com` and `ns2.thunderhat.com`, so the DNS records (including Google's `google-site-verification` TXT record) are managed on the Thunderhat side.
- **Publishing:** every change on GitHub, including CMS saves, runs `.github/workflows/pages.yml` ("Publish site"). It writes the SEO text into the pages (`scripts/apply_seo.py`), then uploads the site over SSH (SFTP):
  - only changed photos and videos are sent; the pages, styles, scripts and content files are re-sent every time
  - the upload never deletes anything on the server; to remove a file from the server, add its path (inside `public_html`) to `.github/remove-from-server.txt` and it's deleted on the next publish
  - never uploaded: the repository's history, `.github/`, `scripts/`, notes, and the full-size originals
  - afterwards it checks the files arrived, where 2n2t.com points, and that the main pages load
- **Login:** the SSH key is stored in GitHub's secrets as `SSH_PRIVATE_KEY`, and its passphrase as `FTP_PASSWORD` (Settings → Secrets and variables → Actions). The server's identity is pinned in `.github/known_hosts` (fingerprints confirmed with the server's owner), so the upload refuses to connect to any other server. If the server's SSH keys are ever changed, those lines need updating.
- **`.htaccess`:** shows `404.html` for missing pages, forces https:// and 2n2t.com (without www), permanently redirects `/film/` to `/video-production/`, and blocks the full-size originals folders.

All links between pages are relative, so the site also works from any folder on any web server.
