/* ==========================================================================
   2N2T — loads the content files in data/ (edited in Pages CMS) and builds
   the pages from them. You shouldn't need to edit this file to add content.
   ========================================================================== */
(function () {
  "use strict";

  var content = {}; // filled from data/*.json before the pages are built
  var ROOT = document.body.getAttribute("data-root") || "";

  /* ---------- helpers ---------- */
  function url(path) {
    if (!path) return "";
    return /^(https?:)?\/\//.test(path) || path.charAt(0) === "/" ? path : ROOT + path;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === undefined || v === null || v === false) return;
        if (k === "text") node.textContent = v;
        else if (k === "class") node.className = v;
        else node.setAttribute(k, v === true ? "" : v);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function metaLine(item, keys) {
    return keys.map(function (k) { return item[k]; }).filter(Boolean).join(" · ");
  }

  /* ---------- Content loading ---------- */
  // Which data files each page needs (site.json is loaded on every page).
  var PAGE_DATA = {
    home: ["videos", "home"],
    film: ["videos", "home"],
    photography: ["photos"],
    "photo-category": ["photos"],
    music: ["music"],
    about: ["about"],
    contact: [],
    "404": []
  };

  // Which entry in data/seo.json belongs to each page.
  var SEO_KEY = { home: "home", film: "film", photography: "photography", music: "music", about: "about", contact: "contact" };

  function loadJSON(name) {
    return fetch(ROOT + "data/" + name + ".json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(name + ".json: " + r.status); return r.json(); })
      .catch(function (err) { console.error("Couldn't load content:", err); return {}; });
  }

  // Turn a pasted YouTube / Vimeo link (or a bare ID) into { type, id }.
  function parseVideoLink(link) {
    var s = String(link || "").trim();
    var m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return { type: "youtube", id: m[1] };
    m = s.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { type: "vimeo", id: m[1] };
    if (/\.mp4(\?|$)/i.test(s)) return { type: "mp4", src: s };
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return { type: "youtube", id: s };
    if (/^\d+$/.test(s)) return { type: "vimeo", id: s };
    return null;
  }

  // Featured photos: the order comes from the "Featured photos" thumbnail grid
  // in the CMS (photos.featured). Each photo's description and caption come
  // from "Featured photo details" if it's there, otherwise from the gallery the
  // photo is in, otherwise from its file name.
  function featuredPhotos(ph) {
    var details = {};
    (ph.categories || []).forEach(function (c) {
      (c.photos || []).forEach(function (x) { if (x && x.src && !details[x.src]) details[x.src] = x; });
    });
    (ph.highlights || []).forEach(function (x) { if (x && x.src) details[x.src] = Object.assign({}, details[x.src], x); });
    if (!Array.isArray(ph.featured) || !ph.featured.length) return ph.highlights || [];
    return ph.featured.filter(Boolean).map(function (src) {
      var d = details[src] || {};
      var name = String(src).split("/").pop().replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      var autoThumb = /\/photos\/Web\/[^/]+\.jpe?g$/i.test(src) && !/-sm\.jpe?g$/i.test(src)
        ? src.replace(/(\.jpe?g)$/i, "-sm$1") : "";
      return {
        src: src,
        thumb: d.thumb || autoThumb,
        mobile: d.mobile || "",
        alt: d.alt || name,
        caption: d.caption || ""
      };
    });
  }

  function loadContent(page) {
    var names = ["site"].concat(PAGE_DATA[page] || []);
    if (SEO_KEY[page]) names.push("seo");
    return Promise.all(names.map(loadJSON)).then(function (files) {
      var d = {};
      names.forEach(function (n, i) { d[n] = files[i] || {}; });
      var videos = ((d.videos || {}).videos || []).map(function (v) {
        var parsed = parseVideoLink(v.link || v.id);
        return parsed ? Object.assign({}, v, parsed) : null;
      }).filter(Boolean);
      return {
        site: d.site || {},
        seo: d.seo || {},
        home: d.home || {},
        about: d.about || {},
        film: { videos: videos },
        photos: featuredPhotos(d.photos || {}),
        photoCategories: (d.photos || {}).categories || [],
        tracks: (d.music || {}).releases || [],
        bands: (d.music || {}).bands || [],
        musicIntro: (d.music || {}).intro || ""
      };
    });
  }

  /* ---------- Phone images ---------- */
  // Any image can have an optional phone version (set in the CMS). On screens
  // narrower than 640px it's used instead of the normal one.
  var PHONE = window.matchMedia("(max-width: 639px)");
  function pick(normal, phone) { return PHONE.matches && phone ? phone : normal; }

  /* ---------- SEO (data/seo.json, and per gallery in data/photos.json) ---------- */
  // GitHub also writes these into the page files when the site is published
  // (scripts/apply_seo.py), so link previews in WhatsApp etc. pick them up.
  function applySeo(title, description) {
    var set = function (sel, attr, val) { var n = document.querySelector(sel); if (n && val) n.setAttribute(attr, val); };
    if (title) document.title = title;
    set('meta[name="description"]', "content", description);
    set('meta[property="og:title"]', "content", title);
    set('meta[property="og:description"]', "content", description);
    set('meta[name="twitter:title"]', "content", title);
    set('meta[name="twitter:description"]', "content", description);
  }

  /* ---------- Film ---------- */
  function videoThumb(v) {
    if (v.thumb) return url(v.thumb);
    if (v.type === "youtube") return "https://i.ytimg.com/vi/" + encodeURIComponent(v.id) + "/maxresdefault.jpg";
    return "";
  }

  // Thumbnail <img>. YouTube's high-res thumbnail doesn't exist for every
  // video; if it's missing, fall back to the standard one, which has black
  // bars top and bottom, and zoom it slightly so the bars are cropped off.
  function thumbImg(v, attrs) {
    var phone = PHONE.matches && v.mobileThumb;
    var src = phone ? url(v.mobileThumb) : videoThumb(v);
    if (!src) return null;
    var img = el("img", Object.assign({ src: src, alt: "", loading: "lazy", decoding: "async" }, attrs || {}));
    if (v.type === "youtube" && !v.thumb && !phone) {
      var fallback = function () {
        if (img.getAttribute("data-fallback")) return;
        img.setAttribute("data-fallback", "1");
        img.classList.add("thumb-letterboxed");
        img.src = "https://i.ytimg.com/vi/" + encodeURIComponent(v.id) + "/hqdefault.jpg";
      };
      img.addEventListener("error", fallback);
      // A missing high-res thumbnail comes back as a tiny 120px placeholder, not an error.
      img.addEventListener("load", function () { if (img.naturalWidth > 0 && img.naturalWidth <= 120) fallback(); });
    }
    return img;
  }

  function isLiveInSession(v) { return /live in session/i.test(v.category || ""); }

  function embedSrc(v) {
    if (v.type === "youtube") {
      return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(v.id) + "?autoplay=1&rel=0";
    }
    if (v.type === "vimeo") {
      return "https://player.vimeo.com/video/" + encodeURIComponent(v.id) + "?autoplay=1&dnt=1";
    }
    return "";
  }

  function renderList(target, items, render, emptyText) {
    if (!target) return;
    if (!items || !items.length) {
      target.appendChild(el("p", { class: "empty", text: emptyText }));
      return;
    }
    items.forEach(function (item, i) { target.appendChild(render(item, i)); });
  }

  // Credits block used on the cinematic panels and homepage tiles. Type and Venue
  // come from the CMS fields, or from the label ("Live In Session at Silk Mill
  // Studios") when those are empty; then Client, Year, Role and any extra
  // rows. Empty ones are left out. Song has its own line under the title (songLine).
  function videoCredits(v, max) {
    var cat = String(v.isShowreel ? "" : (v.category || "")).split(/\s+at\s+/i);
    var rows = [
      ["Type", v.videoType || cat[0]],
      ["Venue", v.venue || cat[1]],
      ["Client", v.client],
      ["Year", v.year],
      ["Role", v.role]
    ];
    (v.credits || []).forEach(function (c) { if (c) rows.push([c.label, c.value]); });
    rows = rows.filter(function (r) { return r[0] && r[1] && String(r[1]).trim(); });
    if (max) rows = rows.slice(0, max); // homepage tiles are smaller, so they show the first few
    if (!rows.length) return null;
    var dl = el("dl", { class: "cine-credits" });
    rows.forEach(function (r) { dl.appendChild(el("dt", { text: r[0] })); dl.appendChild(el("dd", { text: r[1] })); });
    return dl;
  }

  // Smaller heading under the artist, shown exactly as typed in the CMS.
  function songLine(v) {
    var song = String(v.song || "").trim();
    return song ? el("span", { class: "cine-song", text: song }) : null;
  }

  function watchButton() {
    var arrow = el("span", { "aria-hidden": "true" });
    arrow.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12h15M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return el("span", { class: "cine-watch", "aria-hidden": "true" }, [el("span", { text: "Watch" }), arrow]);
  }

  function cineIndex(i, total) {
    return el("span", { class: "cine-index", "aria-hidden": "true" }, [el("b", { text: String(i + 1).padStart(2, "0") }), document.createTextNode("/ " + total)]);
  }

  // Video Production page: one cinematic panel per video — the showreel first,
  // then Live In Session, then everything else, in the CMS order.
  function renderFilm() {
    var list = document.getElementById("cine-list");
    if (!list) return;
    var home = content.home || {};
    var items = [];
    var reel = parseVideoLink(home.showreel);
    if (reel) {
      // "The Silk Mill Recording Studios — Showreel 2026" → small label + big title
      var parts = String(home.showreelTitle || "Showreel").split(/\s+[—–-]\s+/);
      items.push(Object.assign({}, reel, {
        category: parts.length > 1 ? parts[0] : "Showreel",
        title: parts.length > 1 ? parts.slice(1).join(" — ") : parts[0],
        isShowreel: true,
        credits: home.showreelCredits || [],
        thumb: home.showreelThumb || "", mobileThumb: home.showreelMobileImage || ""
      }));
    }
    var videos = (content.film || {}).videos || [];
    items = items.concat(videos.filter(isLiveInSession), videos.filter(function (v) { return !isLiveInSession(v); }));
    if (!items.length) { list.appendChild(el("li", null, [el("p", { class: "empty", text: "Videos coming soon." })])); return; }

    var total = String(items.length).padStart(2, "0");
    items.forEach(function (v, i) {
      var title = v.title || "Untitled";
      var fullTitle = (v.category ? v.category + " — " : "") + title;
      var btn = el("button", { class: "cine", type: "button", "aria-label": "Play video: " + fullTitle }, [
        thumbImg(v, { loading: i < 2 ? "eager" : "lazy" }),
        cineIndex(i, total),
        el("span", { class: "cine-body" }, [
          v.category ? el("span", { class: "cine-kicker", text: v.category }) : null,
          el("span", { class: "cine-title" + (title.length > 22 ? " long" : ""), text: title }),
          songLine(v),
          videoCredits(v)
        ]),
        watchButton()
      ]);
      btn.addEventListener("click", function () { openVideo(Object.assign({}, v, { title: fullTitle }), btn); });
      var li = el("li", null, [btn]);
      li.style.setProperty("--i", i);
      list.appendChild(li);
    });
    stackOnScroll(list);
  }

  // Stacked panels: as each panel is covered by the next, it shrinks back and
  // dims a little (CSS uses --covered, 0 → 1). Off for reduced motion.
  function stackOnScroll(list) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var items = [].slice.call(list.children);
    var ticking = false;
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      items.forEach(function (li, i) {
        var next = items[i + 1];
        var covered = 0;
        if (next) {
          var top = li.getBoundingClientRect().top;
          var nextTop = next.getBoundingClientRect().top;
          var h = li.offsetHeight || vh;
          // 0 when the next panel is a full panel-height below, 1 when it lands on top.
          covered = Math.min(1, Math.max(0, 1 - (nextTop - top) / h));
        }
        li.style.setProperty("--covered", covered.toFixed(3));
      });
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------- Homepage ---------- */
  // Pop-up video player. Loads the video only when opened (with sound,
  // because the visitor asked for it), and removes it on close so it stops.
  var videoModal = document.getElementById("video-modal");
  var modalLastFocus = null;
  function openVideo(v, trigger) {
    if (!videoModal) return;
    var frame = videoModal.querySelector(".video-modal-frame");
    var player = v.type === "mp4"
      ? el("video", { controls: true, autoplay: true, playsinline: true, src: url(v.src) })
      : el("iframe", { src: embedSrc(v), title: v.title || "Video", allow: "autoplay; fullscreen; picture-in-picture; encrypted-media", allowfullscreen: true });
    frame.replaceChildren(player);
    modalLastFocus = trigger || null;
    videoModal.hidden = false;
    document.body.classList.add("no-scroll");
    videoModal.querySelector(".video-modal-close").focus();
    document.dispatchEvent(new CustomEvent("videomodal", { detail: true }));
  }
  function closeVideo() {
    if (!videoModal || videoModal.hidden) return;
    videoModal.querySelector(".video-modal-frame").replaceChildren();
    videoModal.hidden = true;
    document.body.classList.remove("no-scroll");
    if (modalLastFocus) modalLastFocus.focus();
    document.dispatchEvent(new CustomEvent("videomodal", { detail: false }));
  }
  if (videoModal) {
    videoModal.querySelector(".video-modal-close").addEventListener("click", closeVideo);
    videoModal.addEventListener("click", function (e) { if (e.target === videoModal) closeVideo(); });
    document.addEventListener("keydown", function (e) {
      if (videoModal.hidden) return;
      if (e.key === "Escape") closeVideo();
      if (e.key === "Tab") { e.preventDefault(); videoModal.querySelector(".video-modal-close").focus(); }
    });
  }

  // Same naming rule as scripts/make_web_videos.py: "My Reel (Final).mov" -> "my-reel-final".
  function webVideoName(path) {
    var stem = String(path).split("/").pop().replace(/\.[^.]+$/, "");
    return stem.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "video";
  }

  // Plays the HD web version of the showreel file (data/home.json → showreelFile)
  // as the hero background. GitHub makes the web versions a few minutes after
  // the file is uploaded; until they exist, or if anything fails, the YouTube
  // showreel is used as before.
  function setupHeroVideo(home, showPoster, showYouTubeThumb) {
    var media = document.querySelector(".hero-media");
    var ytBox = document.querySelector(".hero-yt[data-youtube-bg]");
    if (!home.showreelFile || !media) return;
    var base = "assets/video/Web/" + webVideoName(home.showreelFile);
    var ytId = ytBox && ytBox.getAttribute("data-youtube-bg");
    if (ytBox) ytBox.removeAttribute("data-youtube-bg"); // YouTube is only the fallback here
    var fellBack = false;
    var useYouTube = function () {
      if (fellBack) return;
      fellBack = true;
      showYouTubeThumb();
      if (!ytBox || !ytId) return;
      ytBox.setAttribute("data-youtube-bg", ytId);
      if (startYouTubeBackgrounds && document.readyState === "complete") startYouTubeBackgrounds();
    };
    var posterSrc = url(base + "-poster.jpg");
    if (calm) {
      // Reduced motion / data saver: a still from the video instead of playing it.
      // If it's missing, the web versions haven't been made yet: use YouTube for now.
      showPoster(posterSrc, true, useYouTube);
      return;
    }
    // Playing: stay black until the video itself is playing, then fade it in.
    // (No still in front of it, so nothing flashes up before the first frame.)
    var slow = navigator.connection && /(^|-)2g|3g/.test(navigator.connection.effectiveType || "");
    var video = el("video", { class: "hero-video", muted: true, loop: true, playsinline: true, autoplay: true,
      preload: "auto", "aria-hidden": "true", tabindex: "-1" });
    video.muted = true; video.defaultMuted = true;
    video.src = url(base + (slow ? "-720.mp4" : "-1080.mp4"));
    video.addEventListener("playing", function () { video.classList.add("is-playing"); });
    video.addEventListener("error", function () { video.remove(); useYouTube(); });
    media.appendChild(video);
    var play = function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
    play();
    // Pause while scrolled away or while the pop-up player is open.
    var visible = true, modalOpen = false;
    var update = function () { if (visible && !modalOpen) play(); else video.pause(); };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; update(); }).observe(media);
    }
    document.addEventListener("videomodal", function (e) { modalOpen = e.detail; update(); });
  }

  function renderHome() {
    // Editable homepage text and showreel (data/home.json).
    var home = content.home || {};
    var setText = function (sel, val) { var n = document.querySelector(sel); if (n && val) n.textContent = val; };
    setText(".hero-eyebrow", home.eyebrow);
    setText(".hero-title", home.headline);
    setText("#cta-title", home.ctaHeading);
    setText(".home-cta p", home.ctaText);
    setText(".hero-tile-title", home.showreelTitle);
    // Introduction (Homepage → Introduction in the CMS). Blank lines start new paragraphs.
    var intro = document.getElementById("home-intro-text");
    if (intro) {
      var paras = String(home.intro || "").split(/\n\s*\n/).map(function (t) { return t.trim(); }).filter(Boolean);
      intro.replaceChildren.apply(intro, paras.map(function (t) { return el("p", { text: t }); }));
      intro.hidden = !paras.length;
    }
    var reel = parseVideoLink(home.showreel);
    var ytId = reel && reel.type === "youtube" ? reel.id : null;
    if (ytId) {
      document.querySelectorAll("[data-youtube-bg]").forEach(function (b) { b.setAttribute("data-youtube-bg", ytId); });
      document.querySelectorAll("[data-play-youtube]").forEach(function (b) { b.setAttribute("data-play-youtube", ytId); });
    }

    // The hero's still image starts empty (dark) and fades in once the right
    // image has loaded, so the wrong one never flashes up first.
    var poster = document.querySelector(".hero-poster");
    var showPoster = function (src, custom, onFail) {
      if (!poster || !src) return;
      poster.classList.remove("is-loaded");
      poster.classList.toggle("is-custom", !!custom); // custom images have no black bars to crop
      poster.onload = function () { poster.classList.add("is-loaded"); };
      poster.onerror = onFail || null;
      poster.src = src;
    };
    var youTubeThumb = function () {
      if (!ytId) return;
      showPoster("https://i.ytimg.com/vi/" + ytId + "/maxresdefault.jpg", false, function () {
        showPoster("https://i.ytimg.com/vi/" + ytId + "/hqdefault.jpg", false);
      });
    };
    // Your own showreel thumbnail (CMS) if set, otherwise YouTube's.
    var showYouTubeThumb = function () {
      if (home.showreelThumb) showPoster(url(home.showreelThumb), true, youTubeThumb);
      else youTubeThumb();
    };
    document.querySelectorAll("[data-play-youtube]").forEach(function (b) {
      if (home.showreelTitle) b.setAttribute("data-play-title", home.showreelTitle);
    });
    var tile = function (id, normal, phone) {
      var img = document.getElementById(id);
      var src = pick(normal, phone);
      if (img && src) img.src = url(src);
    };
    tile("tile-photography", home.photographyTile, home.photographyTileMobile);
    tile("tile-music", home.musicTile, home.musicTileMobile);

    // Showreel tile beside the intro (tablets and desktops), in the same
    // cinematic style as the Selected work tiles.
    var reelBox = document.getElementById("home-reel");
    if (reelBox && reel) {
      var parts = String(home.showreelTitle || "Showreel").split(/\s+[—–-]\s+/);
      var rv = Object.assign({}, reel, {
        category: parts.length > 1 ? parts[0] : "Showreel",
        title: parts.length > 1 ? parts.slice(1).join(" — ") : parts[0],
        isShowreel: true, credits: home.showreelCredits || [],
        thumb: home.showreelThumb || "", mobileThumb: home.showreelMobileImage || ""
      });
      var reelTile = el("button", { class: "work-tile", type: "button", "aria-label": "Play the showreel" }, [
        thumbImg(rv),
        el("span", { class: "work-info" }, [
          el("span", { class: "cine-kicker", text: rv.category }),
          el("span", { class: "cine-title", text: rv.title }),
          videoCredits(rv, 3)
        ]),
        watchButton()
      ]);
      reelTile.addEventListener("click", function () { openVideo(Object.assign({}, rv, { title: home.showreelTitle || "Showreel" }), reelTile); });
      reelBox.replaceChildren(reelTile);
    }

    // Phones: no background video at all (saves data and battery). They keep
    // the still image: the "Showreel background on phones" image if set in the
    // CMS, otherwise the YouTube showreel's thumbnail.
    if (PHONE.matches) {
      document.querySelectorAll(".hero-yt[data-youtube-bg]").forEach(function (b) { b.removeAttribute("data-youtube-bg"); });
      if (home.showreelMobileImage) showPoster(url(home.showreelMobileImage), true, showYouTubeThumb);
      else showYouTubeThumb();
    } else if (home.showreelFile) {
      // HD background: your own showreel file, if one is set in the CMS.
      setupHeroVideo(home, showPoster, showYouTubeThumb);
    } else {
      showYouTubeThumb();
    }

    // Showreel button in the hero.
    document.querySelectorAll("[data-play-youtube]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openVideo({ type: "youtube", id: btn.getAttribute("data-play-youtube"), title: btn.getAttribute("data-play-title") }, btn);
      });
    });

    // Selected work: every video in data/videos.json, in the order listed there.
    var videos = (content.film || {}).videos || [];
    var totalWork = String(videos.length).padStart(2, "0");
    renderList(document.getElementById("home-work"), videos, function (v, i) {
      var title = v.title || "Untitled";
      var fullTitle = (v.category ? v.category + " — " : "") + title;
      var btn = el("button", { class: "work-tile", type: "button", "aria-label": "Play video: " + fullTitle }, [
        thumbImg(v),
        cineIndex(i, totalWork),
        el("span", { class: "work-info" }, [
          v.category ? el("span", { class: "cine-kicker", text: v.category }) : null,
          el("span", { class: "cine-title" + (title.length > 26 ? " long" : ""), text: title }),
          songLine(v),
          videoCredits(v, i === 0 ? 4 : 3)
        ]),
        watchButton()
      ]);
      btn.addEventListener("click", function () { openVideo(Object.assign({}, v, { title: fullTitle }), btn); });
      return el("li", { class: "reveal" }, [btn]);
    }, "Video work coming soon.");

    // Header goes from see-through to solid once you scroll past the top.
    var header = document.querySelector(".site-header--overlay");
    if (header) {
      var onScroll = function () { header.classList.toggle("is-solid", window.scrollY > 40); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    // Pause the background showreel while the pop-up player is open.
    document.addEventListener("videomodal", function (e) {
      document.querySelectorAll(".hero-yt iframe").forEach(function (f) {
        try { f.contentWindow.postMessage(JSON.stringify({ event: "command", func: e.detail ? "pauseVideo" : "playVideo", args: [] }), "*"); } catch (err) {}
      });
    });
  }

  // Fade sections in as they scroll into view.
  function revealOnScroll() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (n) { n.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (n) { io.observe(n); });
  }

  /* ---------- About ---------- */
  function renderAbout() {
    var a = content.about || {};
    var intro = document.getElementById("about-intro");
    if (intro && a.intro) intro.textContent = a.intro;
    var img = document.getElementById("about-photo");
    if (img && a.photo) { img.src = url(pick(a.photo, a.photoMobile)); img.alt = a.photoAlt || ""; }
    var bio = document.getElementById("about-bio");
    if (bio && a.bio) {
      bio.replaceChildren();
      String(a.bio).split(/\n\s*\n/).map(function (t) { return t.trim(); }).filter(Boolean).forEach(function (t, i) {
        bio.appendChild(el("p", { class: i === 0 ? "lede" : null, text: t }));
      });
    }
    var list = document.getElementById("about-services");
    if (list && a.services && a.services.length) {
      list.replaceChildren();
      a.services.forEach(function (sv) {
        list.appendChild(el("li", null, [el("strong", { text: sv.name }), el("span", { text: sv.description || "" })]));
      });
    }
  }

  /* ---------- Footer, contact details (data/site.json) ---------- */
  function applySite(page) {
    var site = content.site || {};
    var email = site.email;
    if (email) {
      document.querySelectorAll(".footer-email, .contact-email").forEach(function (a) { a.href = "mailto:" + email; a.textContent = email; });
      document.querySelectorAll(".form-success a[href^='mailto:']").forEach(function (a) { a.href = "mailto:" + email; a.textContent = email; });
      var form = document.getElementById("contact-form");
      if (form) { form.setAttribute("data-email", email); form.setAttribute("action", "mailto:" + email); }
    }
    // Page background images (set under Contact & social links in the CMS).
    var bg = { film: site.backgroundVideo, photography: site.backgroundPhotography,
      "photo-category": site.backgroundPhotography, music: site.backgroundMusic }[page];
    if (bg) {
      var dark = Number(site.backgroundDarkness);
      if (!isFinite(dark)) dark = 70;
      dark = Math.min(95, Math.max(0, dark)) / 100;
      // Use the full address: a relative one inside a CSS variable is resolved from
      // style.css's folder, not this page's, which breaks under /site/ on GitHub Pages.
      var full = new URL(url(bg), document.baseURI).href;
      var pre = new Image();
      pre.onload = function () {
        document.body.style.setProperty("--wallpaper", "url('" + full.replace(/'/g, "%27") + "')");
        document.body.style.setProperty("--wallpaper-dim", dark);
        document.body.classList.add("has-wallpaper");
      };
      pre.src = full;
    }

    var loc = document.getElementById("contact-location");
    if (loc && site.location) loc.textContent = site.location;

    // Footer links: the Instagram account matches the section you're in.
    var insta = { film: site.instagramVideo, photography: site.instagramPhotography, "photo-category": site.instagramPhotography, music: site.instagramMusic }[page] || site.instagramMain;
    var links = [["Instagram", insta], ["YouTube", site.youtube]];
    if (page === "music") links.push(["Bandcamp", site.bandcamp]);
    links.push(["LinkedIn", site.linkedin]);
    var social = document.querySelector(".site-footer .social");
    if (social && (insta || site.youtube || site.linkedin)) {
      social.replaceChildren();
      links.forEach(function (l) {
        if (l[1]) social.appendChild(el("li", null, [el("a", { href: l[1], rel: "me noopener", target: "_blank", text: l[0] })]));
      });
    }

    // Contact page: every account, with its handle.
    var all = document.getElementById("contact-social");
    if (all) {
      var handle = function (u) { var m = String(u || "").replace(/\/+$/, "").match(/([^\/]+)$/); return m ? m[1].replace(/^@?/, "@") : ""; };
      var items = [
        ["Instagram", site.instagramMain], ["Instagram", site.instagramVideo], ["Instagram", site.instagramPhotography],
        ["Instagram", site.instagramMusic], ["YouTube", site.youtube], ["Bandcamp", site.bandcamp], ["LinkedIn", site.linkedin]
      ].filter(function (i) { return i[1]; });
      if (items.length) {
        all.replaceChildren();
        items.forEach(function (i) {
          var label = i[0] === "Bandcamp" ? "Bandcamp · " + String(i[1]).replace(/^https?:\/\//, "").replace(/\.bandcamp\.com.*$/, "")
            : i[0] === "LinkedIn" ? "LinkedIn" : i[0] + " · " + handle(i[1]);
          all.appendChild(el("li", null, [el("a", { href: i[1], rel: "noopener", target: "_blank", text: label })]));
        });
      }
    }
  }

  /* ---------- Photography + lightbox ---------- */
  // Sets up the full-screen photo viewer for a list of photos and returns
  // open(index, triggerElement). Optional hooks run when it opens/closes.
  function setupLightbox(photos, hooks) {
    hooks = hooks || {};
    var lb = document.getElementById("lightbox");
    if (!lb || !photos.length) return function () {};
    var img = lb.querySelector("img");
    var cap = lb.querySelector("figcaption");
    var current = 0, lastFocus = null, touchX = null;

    function show(i) {
      current = (i + photos.length) % photos.length;
      var p = photos[current];
      img.src = url(pick(p.src, p.mobile));
      img.alt = p.alt || "";
      cap.textContent = (p.caption ? p.caption + " — " : "") + (current + 1) + " / " + photos.length;
      // Preload neighbours so arrow navigation feels instant.
      [current + 1, current - 1].forEach(function (n) {
        var q = photos[(n + photos.length) % photos.length];
        if (q) new Image().src = url(pick(q.src, q.mobile));
      });
    }
    function open(i, trigger) {
      lastFocus = trigger;
      show(i);
      lb.hidden = false;
      document.body.classList.add("no-scroll");
      lb.querySelector(".lb-close").focus();
      document.addEventListener("keydown", onKey);
      if (hooks.onOpen) hooks.onOpen();
    }
    function close() {
      lb.hidden = true;
      img.removeAttribute("src");
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
      if (lastFocus) lastFocus.focus();
      if (hooks.onClose) hooks.onClose(current);
    }
    function onKey(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") show(current + 1);
      else if (e.key === "ArrowLeft") show(current - 1);
      else if (e.key === "Tab") {
        // Keep focus inside the lightbox.
        var f = lb.querySelectorAll("button");
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    }
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    lb.addEventListener("touchstart", function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });
    return open;
  }

  /* ---------- 3D photo field (Photography) ---------- */
  // Every photo floats at its own depth in a 3D space. Scrolling down pulls
  // the camera back through the field: the photos recede into the distance
  // and more emerge from behind you. Dragging (or a sideways swipe / trackpad
  // scroll) turns the whole field around its centre. Once you reach the back
  // of the field, the page carries on to the gallery cards. The tags along the
  // bottom (one per gallery) change which photos are in the field. On arrival,
  // a quick-fire full-screen slideshow plays under the title and its last
  // photo shrinks into its place in the field.
  function renderField(root) {
    if (!root) return;
    var stage = root.querySelector(".field-stage");
    var world = root.querySelector(".field-world");
    var tagBar = root.querySelector(".field-tags");
    var calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // All photos: Featured first (in CMS order), then the rest of each gallery.
    // Each one is tagged with the galleries it's in.
    var cats = (content.photoCategories || []).filter(function (c) { return (c.photos || []).length; });
    var bySrc = {}, pool = [];
    var add = function (p, slug) {
      if (!p || !p.src) return;
      var item = bySrc[p.src];
      if (!item) {
        var autoThumb = /\/photos\/Web\/[^/]+\.jpe?g$/i.test(p.src) && !/-sm\.jpe?g$/i.test(p.src)
          ? p.src.replace(/(\.jpe?g)$/i, "-sm$1") : "";
        item = bySrc[p.src] = { src: p.src, thumb: p.thumb || autoThumb, mobile: p.mobile || "", alt: p.alt || "", caption: p.caption || "", tags: [] };
        pool.push(item);
      }
      if (slug && item.tags.indexOf(slug) < 0) item.tags.push(slug);
    };
    (content.photos || []).forEach(function (p) { add(p); });
    cats.forEach(function (c) { (c.photos || []).forEach(function (p) { add(p, c.slug); }); });
    if (!pool.length) { stage.appendChild(el("p", { class: "empty", text: "Photos coming soon." })); return; }

    // Seeded random numbers, so each photo keeps its place between visits.
    var rand = function (n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

    var lbList = pool.slice();
    var openLightbox = setupLightbox(lbList, {
      onOpen: function () { running = false; },
      onClose: function () { wake(); }
    });

    var dragged = false; // a drag shouldn't count as a click on a photo
    pool.forEach(function (p, i) {
      p.ratio = 1.5;
      p.seed = i;
      var img = el("img", { src: url(p.thumb || p.src), alt: p.alt, decoding: "async", draggable: "false" });
      img.addEventListener("error", function once() { img.removeEventListener("error", once); img.src = url(p.src); });
      img.addEventListener("load", function () {
        if (img.naturalWidth && img.naturalHeight) { p.ratio = img.naturalWidth / img.naturalHeight; size(p); }
      });
      p.node = el("button", { class: "field-item", type: "button", "aria-label": "Enlarge: " + (p.alt || "photo " + (i + 1)) }, [img]);
      p.node.addEventListener("click", function (e) {
        if (dragged) { e.preventDefault(); return; }
        var at = lbList.indexOf(p);
        if (at > -1) openLightbox(at, p.node);
      });
      world.appendChild(p.node);
    });

    // The whole gallery is one 3D cluster, all of it visible at once. Picture
    // every photo on the end of a stick, all anchored at the centre of an
    // invisible sphere: the sphere turns slowly on its own, and dragging spins
    // it around that centre. Scrolling down zooms in: the camera flies into
    // and through the sphere, then the page moves on to the gallery cards.
    var NEAR = 760;       // photos fade out as they pass the camera...
    var NEAR_FADE = 420;  // ...over this distance
    var Z_PER_PX = 0.6;   // camera movement per pixel scrolled (lower = slower zoom)
    var SPIN = 1.6;       // degrees per second the sphere turns on its own
    var R = 600;          // sphere radius (set from the screen size in layout)

    var visible = [];
    var W = 0, H = 0, base = 0;
    var cam = 0, camTarget = 0;
    var yaw = 0, pitch = 0, yawT = 0, pitchT = 0, spin = 0, lastT = 0;
    var YAW_MAX = Infinity, PITCH_MAX = 55, DEG_PER_PX = 0.06;
    var tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0;
    var running = false, onScreen = true, introDone = false;

    function fieldTop() { return root.getBoundingClientRect().top + window.scrollY; }

    function size(p) {
      var w = p.w;
      var h = w / p.ratio;
      // Keep tall photos from towering over everything else.
      var maxH = base * 1.3;
      if (h > maxH) { h = maxH; w = h * p.ratio; }
      p.node.style.width = Math.round(w) + "px";
      p.node.style.height = Math.round(h) + "px";
      p.node.style.marginLeft = Math.round(-w / 2) + "px";
      p.node.style.marginTop = Math.round(-h / 2) + "px";
    }

    // Stick directions are spread evenly over the sphere (a Fibonacci sphere);
    // stick lengths vary, so the photos fill the ball rather than just its
    // surface. Featured #1's stick points straight at you: it's at the front,
    // where the intro slideshow lands.
    function layout() {
      W = stage.clientWidth; H = stage.clientHeight;
      var phone = W < 640;
      R = phone ? W * 0.62 : Math.min(720, Math.max(420, Math.min(W, H * 1.7) * 0.48));
      base = phone ? W * 0.21 : Math.min(210, Math.max(120, W * 0.1));
      // The ball is stretched to suit the screen: wider than tall on computers,
      // taller than wide on phones.
      var sx = phone ? 1.0 : 1.45, sy = phone ? 1.55 : 0.95;
      // Smaller galleries (a tag) gather into a smaller sphere, so they're as
      // close-knit as the full gallery; "All" keeps the full size.
      var n0 = visible.length;
      var gather = Math.max(0.42, Math.min(1, Math.sqrt(n0 / pool.length)));
      R *= gather;
      base *= 1 + (1 - gather) * 0.7; // ...with slightly bigger photos, so they still fill the view
      var n = visible.length;
      var others = Math.max(1, n - 1);
      visible.forEach(function (p, i) {
        if (i === 0) {
          p.x = 0; p.y = 0; p.z = R;
        } else {
          var k = i - 1;
          var y = 1 - (k + 0.5) / others * 2;        // -1..1, top to bottom
          var ring = Math.sqrt(Math.max(0, 1 - y * y));
          var a = k * 2.39996 + rand(p.seed) * 0.3;
          var len = R * (0.5 + rand(p.seed + 7) * 0.5); // stick length
          p.x = Math.cos(a) * ring * len * sx;
          p.y = y * len * sy;
          p.z = Math.sin(a) * ring * len;
        }
        p.w = base * (0.75 + rand(p.seed + 3) * 0.55);
        size(p);
      });
      // Scroll far enough to fly right through the sphere.
      var travel = (2 * R + NEAR) / Z_PER_PX;
      root.style.height = Math.round(H + travel) + "px";
    }

    function readScroll() {
      camTarget = Math.max(0, window.scrollY - fieldTop()) * Z_PER_PX;
    }
    function startY() { return 0; }

    function draw(t) {
      var floatAmt = calmMotion ? 0 : 6;
      var ry = yaw + spin + tiltX, rx = pitch + tiltY;
      // The photos move round with the sphere but never turn themselves:
      // each one stays flat-on, facing the front.
      var face = " rotateY(" + (-ry).toFixed(3) + "deg) rotateX(" + (-rx).toFixed(3) + "deg)";
      world.style.transform = "translateZ(" + (cam - R).toFixed(1) + "px) rotateX(" + rx.toFixed(3) + "deg) rotateY(" + ry.toFixed(3) + "deg)";
      var cy = Math.cos(ry * Math.PI / 180), sy = Math.sin(ry * Math.PI / 180);
      var cx = Math.cos(rx * Math.PI / 180), sx = Math.sin(rx * Math.PI / 180);
      for (var k = 0; k < visible.length; k++) {
        var p = visible[k];
        // Where the photo is now, along the line of sight (after the turn).
        var z1 = -p.x * sy + p.z * cy;
        var z = cam - R + (p.y * sx + z1 * cx);
        var o = 1;
        if (z > NEAR) o = 0;
        else if (z > NEAR - NEAR_FADE) o = (NEAR - z) / NEAR_FADE;
        if (!introDone) o *= p.reveal || 0;
        var fx = Math.sin(t / 2600 + p.seed * 1.7) * floatAmt;
        var fy = Math.cos(t / 3100 + p.seed * 2.3) * floatAmt;
        p.node.style.transform = "translate3d(" + (p.x + fx).toFixed(1) + "px," + (p.y + fy).toFixed(1) + "px," + p.z.toFixed(1) + "px)" + face;
        if (o <= 0.001) {
          if (p.shown) { p.node.style.visibility = "hidden"; p.shown = false; }
          continue;
        }
        if (!p.shown) { p.node.style.visibility = "visible"; p.shown = true; }
        p.node.style.opacity = o.toFixed(3);
        p.node.style.pointerEvents = o > 0.35 ? "" : "none";
      }
    }

    function frame(t) {
      if (!running) return;
      var ease = calmMotion ? 1 : 0.09;
      cam += (camTarget - cam) * ease;
      var dt = lastT ? Math.min(100, t - lastT) : 0;
      lastT = t;
      if (introDone && !calmMotion && !dragging) spin += SPIN * dt / 1000;
      if (!dragging) {
        // Glide on a little after a drag or swipe.
        yawT = clamp(yawT + velX * DEG_PER_PX, -YAW_MAX, YAW_MAX);
        pitchT = clamp(pitchT - velY * DEG_PER_PX, -PITCH_MAX, PITCH_MAX);
        velX *= 0.92; velY *= 0.92;
        if (Math.abs(velX) < 0.05) velX = 0;
        if (Math.abs(velY) < 0.05) velY = 0;
      }
      yaw += (yawT - yaw) * (calmMotion ? 1 : 0.12);
      pitch += (pitchT - pitch) * (calmMotion ? 1 : 0.12);
      tiltX += (tiltTX - tiltX) * 0.06;
      tiltY += (tiltTY - tiltY) * 0.06;
      draw(t);
      var still = Math.abs(camTarget - cam) < 0.3 && !velX && !velY && Math.abs(yawT - yaw) < 0.01 && Math.abs(pitchT - pitch) < 0.01 &&
        Math.abs(tiltTX - tiltX) < 0.01 && Math.abs(tiltTY - tiltY) < 0.01;
      // The slow spin keeps it moving; it only rests when off screen (or for reduced motion).
      if ((calmMotion && still) || !onScreen) { running = false; lastT = 0; return; }
      requestAnimationFrame(frame);
    }

    function wake() {
      if (running || !onScreen || !document.getElementById("lightbox").hidden) return;
      running = true;
      requestAnimationFrame(frame);
    }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    // ---- Moving around: drag to turn the field around its centre ----
    var dragging = false, velX = 0, velY = 0, lastX = 0, lastY = 0, downX = 0, downY = 0, pid = null;
    stage.addEventListener("pointerdown", function (e) {
      // Touch screens use tap-and-hold instead (below).
      if (e.pointerType === "touch" || e.button !== 0 || e.target.closest(".field-tags")) return;
      dragging = true; dragged = false; pid = e.pointerId;
      downX = lastX = e.clientX; downY = lastY = e.clientY;
      velX = velY = 0;
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging || e.pointerId !== pid) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (!dragged && Math.hypot(e.clientX - downX, e.clientY - downY) > 6) {
        dragged = true;
        root.classList.add("is-dragging");
        try { stage.setPointerCapture(pid); } catch (err) {}
      }
      if (!dragged) return;
      turn(dx, dy);
    });
    function turn(dx, dy) {
      yawT = clamp(yawT + dx * DEG_PER_PX, -YAW_MAX, YAW_MAX);
      pitchT = clamp(pitchT - dy * DEG_PER_PX, -PITCH_MAX, PITCH_MAX);
      velX = dx; velY = dy;
      wake();
    }
    var endDrag = function (e) {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false;
      root.classList.remove("is-dragging");
      // Let the click that ends a drag pass without opening a photo.
      setTimeout(function () { dragged = false; }, 0);
      wake();
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", function (e) {
      if (!dragging || e.pointerId !== pid) return;
      dragging = false; dragged = false; velX = velY = 0;
      root.classList.remove("is-dragging");
    });
    // Touch screens: a normal swipe up/down moves through the field (it's the
    // page scrolling). Tap and hold, then drag, turns the field in any
    // direction. A sideways swipe turns it left and right.
    var holdTimer = null, holding = false, sideways = false, lastTouch = 0;
    var tStartX = 0, tStartY = 0, tLastX = 0, tLastY = 0;
    var endTouch = function () {
      clearTimeout(holdTimer);
      if (holding || sideways) setTimeout(function () { dragged = false; }, 400); // no photo opens on release
      holding = sideways = dragging = false;
      root.classList.remove("is-holding");
      lastTouch = Date.now();
      wake();
    };
    stage.addEventListener("touchstart", function (e) {
      clearTimeout(holdTimer);
      if (e.touches.length !== 1 || e.target.closest(".field-tags")) { holding = sideways = false; return; }
      var t = e.touches[0];
      tStartX = tLastX = t.clientX; tStartY = tLastY = t.clientY;
      holding = sideways = false; dragged = false; velX = velY = 0;
      holdTimer = setTimeout(function () {
        holding = dragging = dragged = true;
        root.classList.add("is-holding");
        if (navigator.vibrate) navigator.vibrate(10);
      }, 280);
    }, { passive: true });
    stage.addEventListener("touchmove", function (e) {
      var t = e.touches[0];
      if (!t) return;
      var dx = t.clientX - tLastX, dy = t.clientY - tLastY;
      tLastX = t.clientX; tLastY = t.clientY;
      if (holding) { e.preventDefault(); turn(dx, dy); return; } // holding: the page doesn't scroll
      var mx = t.clientX - tStartX, my = t.clientY - tStartY;
      if (Math.abs(mx) > 8 || Math.abs(my) > 8) clearTimeout(holdTimer); // moved first: it's a swipe
      if (!sideways && Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my) * 1.5) { sideways = dragging = dragged = true; }
      if (sideways) turn(dx, 0);
    }, { passive: false });
    stage.addEventListener("touchend", endTouch);
    stage.addEventListener("touchcancel", endTouch);
    // No "save image" menu when holding on a photo.
    stage.addEventListener("contextmenu", function (e) { if (holding || Date.now() - lastTouch < 800) e.preventDefault(); });

    // Trackpads and sideways mouse wheels: horizontal scrolling turns the field.
    stage.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // up/down scrolls the page as normal
      e.preventDefault();
      yawT = clamp(yawT - e.deltaX * DEG_PER_PX, -YAW_MAX, YAW_MAX);
      wake();
    }, { passive: false });
    // Keyboard: left and right arrows turn the field.
    window.addEventListener("keydown", function (e) {
      if (!onScreen || !document.getElementById("lightbox").hidden) return;
      var step = 8;
      if (e.key === "ArrowLeft") yawT = clamp(yawT + step, -YAW_MAX, YAW_MAX);
      else if (e.key === "ArrowRight") yawT = clamp(yawT - step, -YAW_MAX, YAW_MAX);
      else return;
      wake();
    });

    // Which photos are in the field.
    var activeTag = "";
    function setTag(slug, animate) {
      activeTag = slug;
      pool.forEach(function (p) {
        var on = !slug || p.tags.indexOf(slug) > -1;
        p.node.hidden = !on;
        if (!on) p.shown = false;
      });
      visible = pool.filter(function (p) { return !p.node.hidden; });
      lbList.length = 0;
      Array.prototype.push.apply(lbList, visible);
      tagBar.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-tag") === slug));
      });
      layout();
      if (animate) {
        // Back to the start.
        window.scrollTo(0, startY());
        readScroll();
        cam = calmMotion ? camTarget : camTarget - 900; // the new sphere zooms in from further away
        spin = 0;
        yawT = pitchT = velX = velY = 0;
      }
      wake();
    }

    var tags = [["", "All"]].concat(cats.map(function (c) { return [c.slug, c.label || c.title]; }));
    tags.forEach(function (t) {
      var b = el("button", { class: "field-tag", type: "button", "data-tag": t[0], "aria-pressed": "false", text: t[1] });
      b.addEventListener("click", function () { if (t[0] !== activeTag) setTag(t[0], true); });
      tagBar.appendChild(b);
    });

    window.addEventListener("scroll", function () { readScroll(); wake(); }, { passive: true });
    window.addEventListener("resize", function () { layout(); readScroll(); wake(); });
    if (!calmMotion && window.matchMedia("(hover: hover)").matches) {
      stage.addEventListener("pointermove", function (e) {
        tiltTX = ((e.clientX / window.innerWidth) - 0.5) * 6;
        tiltTY = -((e.clientY / window.innerHeight) - 0.5) * 4;
        wake();
      });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) wake();
      }).observe(root);
    }

    setTag("", false);
    // Always arrive at the start of the field (not wherever the last visit left off).
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, startY());
    // Some phones restore or shift the scroll position as the page finishes
    // loading, so set it again then (unless the visitor has already moved).
    var arrivedAt = window.scrollY;
    window.addEventListener("load", function () {
      if (Math.abs(window.scrollY - arrivedAt) < 2 && Math.abs(window.scrollY - startY()) > 2) { window.scrollTo(0, startY()); readScroll(); cam = camTarget; }
    });
    // No pull-to-refresh here: swiping down at the top of the field shouldn't reload the page.
    document.documentElement.style.overscrollBehaviorY = "none";
    document.body.style.overscrollBehaviorY = "none";
    readScroll();
    cam = camTarget;

    // ---- Arrival: title over a quick-fire full-screen slideshow, then into the field ----
    var intro = root.querySelector(".field-intro");
    var flash = root.querySelector(".field-flash");
    var finish = function () {
      if (introDone) return;
      introDone = true;
      root.classList.add("is-ready");
      if (intro) intro.classList.add("is-done");
      if (flash) flash.hidden = true;
      wake();
    };
    if (calmMotion || !flash || Math.abs(window.scrollY - startY()) > 10 || visible.length < 3) { finish(); return; }

    var first = visible[0];
    var shots = visible.slice(1, 8).concat([first]);
    var flashImg = flash.querySelector("img");
    var load = function (src) {
      return new Promise(function (res) { var i = new Image(); i.onload = i.onerror = function () { res(); }; i.src = src; });
    };
    var stopIntro = function () {
      // Any scroll, key or tap skips straight to the field.
      ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (ev) { window.removeEventListener(ev, stopIntro); });
      if (!introDone) { flash.getAnimations().forEach(function (a) { a.cancel(); }); finish(); }
    };
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (ev) { window.addEventListener(ev, stopIntro, { passive: true }); });

    root.classList.add("is-intro");
    pool.forEach(function (p) { p.reveal = 0; });
    running = true; requestAnimationFrame(frame);

    var preload = Promise.all(shots.map(function (p) { return load(url(p.thumb || p.src)); }));
    var timeout = new Promise(function (res) { setTimeout(res, 2500); });
    Promise.race([preload, timeout]).then(function () {
      if (introDone) return;
      var stageBox = stage.getBoundingClientRect();
      var full = { left: 0, top: 0, width: stageBox.width, height: stageBox.height };
      var box = function (r) { return { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" }; };
      var STEP = 130;
      flashImg.src = url(shots[0].thumb || shots[0].src);
      Object.assign(flash.style, box(full));
      flash.hidden = false;
      flash.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
      shots.forEach(function (p, i) {
        if (i) setTimeout(function () { if (!introDone) flashImg.src = url(p.thumb || p.src); }, i * STEP);
      });
      setTimeout(function () {
        if (introDone) return;
        intro.classList.add("is-leaving");
        // Shrink the last photo into its place in the field.
        var r = first.node.getBoundingClientRect();
        var target = { left: r.left - stageBox.left, top: r.top - stageBox.top, width: r.width, height: r.height };
        var shrink = flash.animate([box(full), box(target)], { duration: 900, easing: "cubic-bezier(.7,0,.15,1)", fill: "forwards" });
        shrink.finished.then(function () {
          if (introDone) return;
          root.classList.add("is-ready");
          first.reveal = 1;
          draw(performance.now());
          flash.hidden = true;
          // The rest of the field fades up, front to back.
          var start = performance.now();
          var reveal = function (now) {
            var t = (now - start) / 900;
            visible.forEach(function (p, k) { if (k) p.reveal = Math.max(0, Math.min(1, t * 2.2 - (R - p.z) / (2 * R) * 1.2)); });
            if (t < 1.6) requestAnimationFrame(reveal); else stopIntro();
            wake();
          };
          requestAnimationFrame(reveal);
        }).catch(function () {});
      }, shots.length * STEP + 250);
    });
  }

  // Grid gallery (used on the category pages).
  function renderPhotos(photos) {
    photos = photos || [];
    var open = setupLightbox(photos);
    renderList(document.getElementById("gallery"), photos, function (p, i) {
      var btn = el("button", { class: "gallery-item", type: "button", "aria-label": "Enlarge: " + (p.alt || "photo " + (i + 1)) }, [
        el("img", { src: url(pick(p.thumb || p.src, p.mobile)), alt: p.alt || "", loading: "lazy", decoding: "async" })
      ]);
      btn.addEventListener("click", function () { open(i, btn); });
      return btn;
    }, "Photos coming soon.");
  }

  // Featured grid (main Photography page): a "justified" layout. Every photo
  // is shown uncropped at its real shape; each row's photos share one height,
  // chosen so the row exactly fills the width. Rows follow the CMS order.
  function photoRatio(p) {
    return new Promise(function (resolve) {
      var img = new Image(), done = false;
      var finish = function (r) { if (!done) { done = true; resolve(r); } };
      img.onload = function () { finish(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1.5); };
      var tried = false;
      img.onerror = function () {
        if (!tried && p.thumb) { tried = true; img.src = url(pick(p.src, p.mobile)); return; }
        finish(1.5);
      };
      setTimeout(function () { finish(1.5); }, 8000);
      img.src = url(pick(p.thumb || p.src, p.mobile));
    });
  }

  // Ideal row height for the space available (rows end up within about ±30% of it).
  function targetRowHeight(width) { return width < 640 ? 190 : width < 1000 ? 260 : 340; }

  function layoutJustified(list, items, gap) {
    var width = list.clientWidth;
    if (!width) return;
    var target = targetRowHeight(width);
    var row = [], rowRatio = 0;
    var place = function (rowItems, height, isLast) {
      var used = 0;
      rowItems.forEach(function (it, i) {
        var w = it.ratio * height;
        // Give rounding leftovers to the last photo so full rows end exactly at the edge.
        if (!isLast && i === rowItems.length - 1) w = width - used - gap * (rowItems.length - 1);
        w = Math.max(1, Math.floor(w));
        used += w;
        it.li.style.width = w + "px";
        it.li.style.height = Math.round(height) + "px";
      });
    };
    var heightFor = function (ratioSum, count) { return (width - gap * (count - 1)) / ratioSum; };
    items.forEach(function (it, i) {
      var hWith = heightFor(rowRatio + it.ratio, row.length + 1);
      if (row.length && hWith < target) {
        // Adding this photo makes the row too short. Close the row before or
        // after it, whichever height is closer to the ideal.
        var hWithout = heightFor(rowRatio, row.length);
        if (Math.abs(hWithout - target) < Math.abs(hWith - target) && hWithout < target * 1.5) {
          place(row, hWithout, false);
          row = [it]; rowRatio = it.ratio;
        } else {
          row.push(it);
          place(row, hWith, false);
          row = []; rowRatio = 0;
        }
      } else {
        row.push(it); rowRatio += it.ratio;
      }
    });
    if (row.length) {
      // Last row: fill the width only if that keeps it close to the ideal height.
      var h = heightFor(rowRatio, row.length);
      if (h <= target * 1.25) place(row, h, false); else place(row, target, true);
    }
  }

  function renderFeatured(root, photos) {
    if (!root) return;
    if (!photos || !photos.length) { root.appendChild(el("p", { class: "empty", text: "Photos coming soon." })); return; }
    root.setAttribute("aria-busy", "true");
    Promise.all(photos.map(photoRatio)).then(function (ratios) {
      var open = setupLightbox(photos);
      var list = el("ul", { class: "justified" });
      var items = photos.map(function (p, i) {
        var btn = el("button", { class: "feature-tile", type: "button", "aria-label": "Enlarge: " + (p.alt || "photo " + (i + 1)) }, [
          (function () {
            var im = el("img", { src: url(pick(p.thumb || p.src, p.mobile)), alt: p.alt || "", loading: "lazy", decoding: "async" });
            im.addEventListener("error", function once() { im.removeEventListener("error", once); im.src = url(pick(p.src, p.mobile)); });
            return im;
          })(),
          p.caption ? el("span", { class: "feature-caption", text: p.caption }) : null
        ]);
        btn.addEventListener("click", function () { open(i, btn); });
        var li = el("li", { class: "reveal" }, [btn]);
        list.appendChild(li);
        return { li: li, ratio: ratios[i] };
      });
      root.replaceChildren(list);
      var gap = parseFloat(getComputedStyle(list).columnGap) || 8;
      layoutJustified(list, items, gap);
      // Re-flow when the window (or phone orientation) changes size.
      var lastWidth = list.clientWidth;
      var relayout = function () { if (list.clientWidth !== lastWidth) { lastWidth = list.clientWidth; layoutJustified(list, items, gap); } };
      if ("ResizeObserver" in window) new ResizeObserver(relayout).observe(list);
      else window.addEventListener("resize", relayout);
      root.removeAttribute("aria-busy");
      revealOnScroll();
    });
  }

  // Cards linking to each photography category page.
  function renderPhotoCategories(target, skipSlug) {
    if (!target) return;
    // Galleries with no photos yet are left out until photos are added.
    var cats = (content.photoCategories || []).filter(function (c) { return c.slug !== skipSlug && (c.photos || []).length; });
    renderList(target, cats, function (c) {
      var first = (c.photos || [])[0] || {};
      var cover = pick(c.cover, c.coverMobile) || pick(first.thumb || first.src, first.mobile);
      var n = (c.photos || []).length;
      return el("a", { class: "category-card", href: ROOT + "photography/" + c.slug + "/" }, [
        cover ? el("img", { src: url(cover), alt: "", loading: "lazy", decoding: "async" }) : null,
        el("span", { class: "category-label" }, [
          el("span", { class: "category-title", text: c.label || c.title }),
          el("span", { class: "category-count", text: n + (n === 1 ? " photo" : " photos") })
        ])
      ]);
    }, "");
  }

  function renderPhotoCategoryPage() {
    var slug = document.body.getAttribute("data-category");
    var cat = (content.photoCategories || []).filter(function (c) { return c.slug === slug; })[0];
    var intro = document.getElementById("category-intro");
    if (!cat) {
      if (intro) intro.textContent = "This gallery isn't set up yet. Add it under Photography in the CMS (data/photos.json).";
      return;
    }
    if (intro && cat.intro) intro.textContent = cat.intro;
    applySeo(cat.metaTitle, cat.metaDescription);
    renderPhotos(cat.photos);
    renderPhotoCategories(document.getElementById("more-categories"), slug);
  }

  /* ---------- Music ---------- */
  // Accepts the whole embed code Bandcamp gives you (or just its URL), pulls
  // out the album/track numbers, and builds a player that matches the site.
  function bandcampPlayer(t) {
    var code = String(t.bandcamp);
    var ids = code.match(/(album|track)=\d+/g);
    if (!ids) return el("p", { class: "notes", text: "Bandcamp embed code not recognised. Paste the code from Bandcamp's Share / Embed button." });
    var isAlbum = /album=/.test(ids.join(""));
    // Albums show their track list unless the embed code (or tracklist: false) says otherwise.
    var tracklist = isAlbum && (t.tracklist !== undefined ? !!t.tracklist : !/tracklist=false/.test(code));
    // Use the height Bandcamp chose for this release, so the artwork fits exactly.
    var h = code.match(/height:\s*(\d+)px/);
    var height = tracklist ? (h && +h[1] > 500 ? +h[1] : 720) : 442;
    var src = "https://bandcamp.com/EmbeddedPlayer/" + ids.join("/") +
      "/size=large/bgcol=18181b/linkcol=f05a32/tracklist=" + (tracklist ? "true" : "false") +
      "/transparent=true/";
    return el("iframe", {
      class: "bandcamp",
      src: src,
      style: "height:" + height + "px",
      title: "Listen to " + (t.title || "this release") + " on Bandcamp",
      loading: "lazy",
      seamless: true
    });
  }

  // Uses the link inside Bandcamp's embed code (or a "link" you set yourself).
  function bandcampLink(t) {
    var m = t.link ? [0, t.link] : String(t.bandcamp || "").match(/href="(https:\/\/[^"]+)"/);
    if (!m) return null;
    return el("p", { class: "meta" }, [
      el("a", { href: m[1], target: "_blank", rel: "noopener", text: "Buy / listen on Bandcamp \u2192" })
    ]);
  }

  function trackCard(t) {
    return el("li", { class: "track" + (t.bandcamp ? " track--bandcamp" : "") }, [
      t.bandcamp ? bandcampPlayer(t) : null,
      el("div", { class: "track-head" }, [el("h3", { text: t.title || "Untitled" })]),
      el("p", { class: "meta", text: metaLine(t, ["artist", "year", "duration"]) }),
      t.notes ? el("p", { class: "notes", text: t.notes }) : null,
      bandcampLink(t),
      t.bandcamp ? null : el("audio", { controls: true, preload: "none", src: url(t.src), "aria-label": t.title })
    ]);
  }

  // Accepts a Spotify share link (https://open.spotify.com/artist/...) or
  // Spotify's embed code, and turns it into Spotify's embedded player.
  function spotifyPlayer(b) {
    var m = String(b.spotify || "").match(/(artist|album|track|playlist)\/([A-Za-z0-9]+)/);
    if (!m) return el("p", { class: "notes", text: "Spotify player coming soon." });
    return el("iframe", {
      class: "spotify",
      src: "https://open.spotify.com/embed/" + m[1] + "/" + m[2] + "?theme=0",
      title: b.name + " on Spotify",
      allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
      loading: "lazy"
    });
  }

  function hideIfEmpty(id, items) {
    var section = document.getElementById(id);
    if (section && (!items || !items.length)) section.hidden = true;
  }

  function renderMusic() {
    // Releases are sorted automatically: Bandcamp albums/EPs on one row,
    // singles (Bandcamp tracks or your own audio files) on another.
    // Set type: "album" or type: "single" on a release to override.
    var intro = document.getElementById("music-intro");
    if (intro) {
      intro.textContent = String(content.musicIntro || "").trim();
      intro.hidden = !intro.textContent;
    }
    var tracks = content.tracks || [];
    function isAlbum(t) {
      if (t.type) return t.type === "album";
      return /album=\d+/.test(String(t.bandcamp || ""));
    }
    var albums = tracks.filter(isAlbum);
    var singles = tracks.filter(function (t) { return !isAlbum(t); });

    renderList(document.getElementById("albums"), albums, trackCard, "");
    renderList(document.getElementById("singles"), singles, trackCard, "");
    hideIfEmpty("albums-section", albums);
    hideIfEmpty("singles-section", singles);

    var bands = content.bands || [];
    renderList(document.getElementById("bands"), bands, function (b) {
      return el("article", { class: "band" }, [
        el("h3", { text: b.name }),
        b.notes ? el("p", { class: "notes", text: b.notes }) : null,
        spotifyPlayer(b)
      ]);
    }, "");
    hideIfEmpty("bands-section", bands);

    // Only one track plays at a time.
    document.addEventListener("play", function (e) {
      document.querySelectorAll("audio").forEach(function (a) { if (a !== e.target) a.pause(); });
    }, true);
  }

  /* ---------- Shared ---------- */
  // Dropdown menu: opens from the three-line button, closes on Esc,
  // on a click outside the menu, or when a link is chosen.
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("site-menu");
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.classList.toggle("is-open", open);
      if (open) { var first = menu.querySelector("a"); if (first) first.focus(); }
    };
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (menu.classList.contains("is-open") && !menu.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    // Clicks inside embedded players (Bandcamp, Spotify, YouTube) don't reach
    // the page, but they do take focus away from it, so close then too.
    window.addEventListener("blur", function () { if (menu.classList.contains("is-open")) setMenu(false); });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Homepage background videos: always muted, only start if the visitor
  // hasn't asked for reduced motion and isn't on a data-saver connection.
  var startYouTubeBackgrounds = null;
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    (navigator.connection && navigator.connection.saveData);
  if (!calm) {
    document.querySelectorAll("video[data-bg-src]").forEach(function (v) {
      v.muted = true;
      v.src = url(v.getAttribute("data-bg-src"));
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });

    // YouTube background: muted, looping, no controls. Loaded after the page
    // has finished loading so it never slows down the first view.
    startYouTubeBackgrounds = function () {
      document.querySelectorAll("[data-youtube-bg]").forEach(function (box) {
        if (box.querySelector("iframe")) return;
        var id = encodeURIComponent(box.getAttribute("data-youtube-bg"));
        var iframe = el("iframe", {
          src: "https://www.youtube-nocookie.com/embed/" + id +
            "?autoplay=1&mute=1&loop=1&playlist=" + id +
            "&controls=0&playsinline=1&rel=0&disablekb=1&iv_load_policy=3&modestbranding=1&enablejsapi=1",
          title: "Background video",
          allow: "autoplay; encrypted-media; picture-in-picture",
          tabindex: "-1",
          frameborder: "0"
        });
        iframe.addEventListener("load", function () {
          setTimeout(function () { box.classList.add("is-playing"); }, 1500);
        });
        box.appendChild(iframe);
      });
    };
  }

  // Contact form: build an email from the fields and open the visitor's
  // email app. No server or form service needed, so it works on any host.
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var subject = "Website enquiry: " + f.type.value + " (from " + f.name.value + ")";
      var body = f.message.value + "\n\n— " + f.name.value + "\n" + f.email.value;
      window.location.href = "mailto:" + form.getAttribute("data-email") +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      document.getElementById("form-success").hidden = false;
    });
  }

  var page = document.body.getAttribute("data-page");
  loadContent(page).then(function (c) {
    content = c;
    applySite(page);
    var seo = (content.seo || {})[SEO_KEY[page]];
    if (seo) applySeo(seo.title, seo.description);
    if (page === "home") renderHome();
    if (page === "film") renderFilm();
    if (page === "photography") {
      if (document.getElementById("photo-field")) renderField(document.getElementById("photo-field"));
      else renderFeatured(document.getElementById("featured"), content.photos || []);
      renderPhotoCategories(document.getElementById("photo-categories"));
    }
    if (page === "photo-category") renderPhotoCategoryPage();
    if (page === "music") renderMusic();
    if (page === "about") renderAbout();
    revealOnScroll();

    // Start the homepage background video once its ID is known and the page has loaded.
    if (startYouTubeBackgrounds) {
      if (document.readyState === "complete") startYouTubeBackgrounds();
      else window.addEventListener("load", startYouTubeBackgrounds);
    }
  });
})();
