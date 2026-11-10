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
        photos: (d.photos || {}).highlights || [],
        photoCategories: (d.photos || {}).categories || [],
        tracks: (d.music || {}).releases || [],
        bands: (d.music || {}).bands || []
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

  function videoCard(v, featured) {
    var frame = el("div", { class: "video-frame" });
    var title = v.title || "Untitled";
    var fullTitle = (v.category ? v.category + " — " : "") + title;

    // Click-to-load: show a thumbnail; only load the player/iframe on click.
    var btn = el("button", { class: "video-poster", type: "button", "aria-label": "Play video: " + fullTitle }, [
      thumbImg(v, { width: "1280", height: "720" }),
      el("span", { class: "play-icon", "aria-hidden": "true" })
    ]);
    btn.addEventListener("click", function () {
      var player = v.type === "mp4"
        ? el("video", { controls: true, autoplay: true, playsinline: true, src: url(v.src), poster: videoThumb(v) || null, "aria-label": title })
        : el("iframe", {
            src: embedSrc(v),
            title: fullTitle,
            allow: "autoplay; fullscreen; picture-in-picture; encrypted-media",
            allowfullscreen: true
          });
      frame.replaceChildren(player);
      player.focus();
    });
    frame.appendChild(btn);

    var caption = el("figcaption", null, [
      v.category ? el("p", { class: "meta video-category", text: v.category }) : null,
      el("h3", { text: title }),
      el("p", { class: "meta", text: metaLine(v, ["client", "role", "year"]) })
    ]);
    return el("figure", { class: "video-card" }, [frame, caption]);
  }

  function renderList(target, items, render, emptyText) {
    if (!target) return;
    if (!items || !items.length) {
      target.appendChild(el("p", { class: "empty", text: emptyText }));
      return;
    }
    items.forEach(function (item, i) { target.appendChild(render(item, i)); });
  }

  function renderFilm() {
    // Big showreel at the top, from the YouTube link under Homepage in the CMS.
    var home = content.home || {};
    var reel = parseVideoLink(home.showreel);
    var reelBox = document.getElementById("showreel");
    if (reelBox && reel) {
      reelBox.appendChild(videoCard(Object.assign({}, reel, { title: home.showreelTitle || "Showreel" }), false));
    } else if (reelBox) {
      reelBox.closest("section").hidden = true;
    }

    var videos = (content.film || {}).videos || [];
    renderList(document.getElementById("live-in-session"), videos.filter(isLiveInSession),
      function (v) { return videoCard(v, true); }, "Live In Session videos coming soon.");
    renderList(document.getElementById("film-work"), videos.filter(function (v) { return !isLiveInSession(v); }),
      function (v) { return videoCard(v, false); }, "More work coming soon.");
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
  function setupHeroVideo(home) {
    var media = document.querySelector(".hero-media");
    var ytBox = document.querySelector(".hero-yt[data-youtube-bg]");
    if (!home.showreelFile || !media) return;
    var base = "assets/video/Web/" + webVideoName(home.showreelFile);
    var ytId = ytBox && ytBox.getAttribute("data-youtube-bg");
    if (ytBox) ytBox.removeAttribute("data-youtube-bg"); // hold YouTube back while we check
    var useYouTube = function () {
      if (!ytBox || !ytId) return;
      ytBox.setAttribute("data-youtube-bg", ytId);
      if (startYouTubeBackgrounds && document.readyState === "complete") startYouTubeBackgrounds();
    };
    var check = new Image();
    check.onerror = useYouTube; // web versions not made yet
    check.onload = function () {
      var posterSrc = url(pick(base + "-poster.jpg", home.showreelMobileImage));
      var poster = document.querySelector(".hero-poster");
      if (poster) { poster.onerror = null; poster.src = posterSrc; poster.classList.add("is-custom"); }
      if (calm) return; // reduced motion / data saver: the still image only
      var slow = navigator.connection && /(^|-)2g|3g/.test(navigator.connection.effectiveType || "");
      var video = el("video", { class: "hero-video", muted: true, loop: true, playsinline: true, autoplay: true,
        preload: "auto", poster: posterSrc, "aria-hidden": "true", tabindex: "-1" });
      video.muted = true; video.defaultMuted = true;
      video.src = url(base + (PHONE.matches || slow ? "-720.mp4" : "-1080.mp4"));
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
    };
    check.src = url(base + "-poster.jpg");
  }

  function renderHome() {
    // Editable homepage text and showreel (data/home.json).
    var home = content.home || {};
    var setText = function (sel, val) { var n = document.querySelector(sel); if (n && val) n.textContent = val; };
    setText(".hero-eyebrow", home.eyebrow);
    setText(".hero-title", home.headline);
    setText("#cta-title", home.ctaHeading);
    setText(".home-cta p", home.ctaText);
    var reel = parseVideoLink(home.showreel);
    if (reel && reel.type === "youtube") {
      var poster = document.querySelector(".hero-poster");
      if (poster && PHONE.matches && home.showreelMobileImage) {
        poster.onerror = null;
        poster.src = url(home.showreelMobileImage);
        poster.classList.add("is-custom");
      } else if (poster && poster.src.indexOf(reel.id) === -1) {
        poster.onerror = function () { poster.onerror = null; poster.src = "https://i.ytimg.com/vi/" + reel.id + "/hqdefault.jpg"; };
        poster.src = "https://i.ytimg.com/vi/" + reel.id + "/maxresdefault.jpg";
      }
      document.querySelectorAll("[data-youtube-bg]").forEach(function (b) { b.setAttribute("data-youtube-bg", reel.id); });
      document.querySelectorAll("[data-play-youtube]").forEach(function (b) { b.setAttribute("data-play-youtube", reel.id); });
    }
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

    // Phones: no background video at all (saves data and battery). They keep
    // the still image: the "Showreel background on phones" image if set in the
    // CMS, otherwise the YouTube showreel's thumbnail.
    if (PHONE.matches) {
      document.querySelectorAll(".hero-yt[data-youtube-bg]").forEach(function (b) { b.removeAttribute("data-youtube-bg"); });
    } else {
      // HD background: your own showreel file, if one is set in the CMS.
      setupHeroVideo(home);
    }

    // Showreel button in the hero.
    document.querySelectorAll("[data-play-youtube]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openVideo({ type: "youtube", id: btn.getAttribute("data-play-youtube"), title: btn.getAttribute("data-play-title") }, btn);
      });
    });

    // Selected work: every video in data/videos.json, in the order listed there.
    var videos = (content.film || {}).videos || [];
    renderList(document.getElementById("home-work"), videos, function (v) {
      var fullTitle = (v.category ? v.category + " — " : "") + (v.title || "Untitled");
      var btn = el("button", { class: "work-tile", type: "button", "aria-label": "Play video: " + fullTitle }, [
        thumbImg(v),
        el("span", { class: "work-play", "aria-hidden": "true", text: "Play" }),
        el("span", { class: "work-info" }, [
          v.category ? el("span", { class: "work-meta", text: v.category }) : null,
          el("span", { class: "work-title", text: v.title || "Untitled" })
        ])
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
      img.onerror = function () { finish(1.5); };
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
          el("img", { src: url(pick(p.thumb || p.src, p.mobile)), alt: p.alt || "", loading: "lazy", decoding: "async" }),
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
      renderFeatured(document.getElementById("featured"), content.photos || []);
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
