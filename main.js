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
    film: ["videos"],
    photography: ["photos"],
    "photo-category": ["photos"],
    music: ["music"],
    about: ["about"],
    contact: [],
    "404": []
  };

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
    return Promise.all(names.map(loadJSON)).then(function (files) {
      var d = {};
      names.forEach(function (n, i) { d[n] = files[i] || {}; });
      var videos = ((d.videos || {}).videos || []).map(function (v) {
        var parsed = parseVideoLink(v.link || v.id);
        return parsed ? Object.assign({}, v, parsed) : null;
      }).filter(Boolean);
      return {
        site: d.site || {},
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
    var src = videoThumb(v);
    if (!src) return null;
    var img = el("img", Object.assign({ src: src, alt: "", loading: "lazy", decoding: "async" }, attrs || {}));
    if (v.type === "youtube" && !v.thumb) {
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
      if (poster && poster.src.indexOf(reel.id) === -1) {
        poster.onerror = function () { poster.onerror = null; poster.src = "https://i.ytimg.com/vi/" + reel.id + "/hqdefault.jpg"; };
        poster.src = "https://i.ytimg.com/vi/" + reel.id + "/maxresdefault.jpg";
      }
      document.querySelectorAll("[data-youtube-bg]").forEach(function (b) { b.setAttribute("data-youtube-bg", reel.id); });
      document.querySelectorAll("[data-play-youtube]").forEach(function (b) { b.setAttribute("data-play-youtube", reel.id); });
    }
    document.querySelectorAll("[data-play-youtube]").forEach(function (b) {
      if (home.showreelTitle) b.setAttribute("data-play-title", home.showreelTitle);
    });

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
    if (img && a.photo) { img.src = url(a.photo); img.alt = a.photoAlt || ""; }
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
      img.src = url(p.src);
      img.alt = p.alt || "";
      cap.textContent = (p.caption ? p.caption + " — " : "") + (current + 1) + " / " + photos.length;
      // Preload neighbours so arrow navigation feels instant.
      [current + 1, current - 1].forEach(function (n) {
        var q = photos[(n + photos.length) % photos.length];
        if (q) new Image().src = url(q.src);
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
        el("img", { src: url(p.thumb || p.src), alt: p.alt || "", loading: "lazy", decoding: "async" })
      ]);
      btn.addEventListener("click", function () { open(i, btn); });
      return btn;
    }, "Photos coming soon.");
  }

  // Highlights slideshow: one big photo with its neighbours peeking in,
  // a slow zoom, and progress dots. Auto-advances every SLIDE_SECONDS;
  // pauses when off screen, when the viewer is open, or when the visitor
  // presses pause. Visitors with reduced motion get no autoplay or zoom.
  var SLIDE_SECONDS = 5;

  function renderSlideshow(root, photos) {
    if (!root) return;
    if (!photos || !photos.length) { root.appendChild(el("p", { class: "empty", text: "Photos coming soon." })); return; }

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var state = { index: 0, userPaused: reduced, offscreen: false, viewerOpen: false };
    root.style.setProperty("--slide-duration", SLIDE_SECONDS + "s");
    root.setAttribute("aria-roledescription", "carousel");

    var track = el("ol", { class: "slideshow-track" });
    var viewport = el("div", { class: "slideshow-viewport" }, [track]);
    var dots = el("div", { class: "slideshow-dots" });
    var playBtn = el("button", { class: "slideshow-play", type: "button" }, [el("span", { class: "play-glyph", "aria-hidden": "true" })]);
    root.appendChild(viewport);
    root.appendChild(el("div", { class: "slideshow-bar" }, [el("div", { class: "slideshow-controls" }, [dots, playBtn])]));

    var open = setupLightbox(photos, {
      onOpen: function () { state.viewerOpen = true; update(); },
      onClose: function (i) { state.viewerOpen = false; go(i, true); }
    });

    var slides = photos.map(function (p, i) {
      var bg = el("span", { class: "slide-bg", "aria-hidden": "true" });
      var img = el("img", { alt: p.alt || "", decoding: "async", draggable: "false" });
      var cap = p.caption ? el("span", { class: "slide-caption", text: p.caption, "aria-hidden": "true" }) : null;
      var btn = el("button", { class: "slide-btn", type: "button", "aria-label": (p.alt || "Photo " + (i + 1)) + " (open full size)" }, [bg, img, cap]);
      btn.addEventListener("click", function () {
        if (dragged) return;
        if (i === state.index) open(i, btn); else go(i);
      });
      var li = el("li", { class: "slide", "aria-roledescription": "slide", "aria-label": (i + 1) + " of " + photos.length }, [btn]);
      track.appendChild(li);
      return { li: li, img: img, bg: bg, loaded: false };
    });

    var dotBtns = photos.map(function (p, i) {
      var d = el("button", { class: "dot", type: "button", "aria-label": "Show photo " + (i + 1) }, [el("span", { class: "dot-fill" })]);
      d.addEventListener("click", function () { go(i); });
      dots.appendChild(d);
      return d;
    });

    function load(i) {
      var s = slides[(i + slides.length) % slides.length];
      if (!s || s.loaded) return;
      var p = photos[(i + slides.length) % slides.length];
      s.img.src = url(p.src);
      s.bg.style.backgroundImage = "url('" + url(p.thumb || p.src) + "')";
      s.loaded = true;
    }

    function position(animate) {
      var s = slides[state.index].li;
      var x = s.offsetLeft - (viewport.clientWidth - s.offsetWidth) / 2;
      track.style.transition = animate ? "" : "none";
      track.style.transform = "translate3d(" + (-x) + "px,0,0)";
    }

    function go(i, instant) {
      state.index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        var active = n === state.index;
        s.li.classList.toggle("is-active", active);
        s.li.querySelector(".slide-btn").tabIndex = active ? 0 : -1;
      });
      dotBtns.forEach(function (d, n) {
        var active = n === state.index;
        d.classList.remove("is-active");
        d.setAttribute("aria-current", active ? "true" : "false");
      });
      // Restart the progress-fill animation on the new active dot.
      void dots.offsetWidth;
      dotBtns[state.index].classList.add("is-active");
      [0, 1, -1, 2].forEach(function (o) { load(state.index + o); });
      position(!instant);
    }

    function update() {
      var paused = state.userPaused || state.offscreen || state.viewerOpen || document.hidden;
      root.classList.toggle("is-paused", paused);
      playBtn.setAttribute("aria-label", state.userPaused ? "Play slideshow" : "Pause slideshow");
      playBtn.classList.toggle("is-playing", !state.userPaused);
    }

    // When the active dot's progress fill finishes, move to the next photo.
    dots.addEventListener("animationend", function (e) {
      if (e.target.classList.contains("dot-fill") && e.target.parentNode === dotBtns[state.index]) go(state.index + 1);
    });

    playBtn.addEventListener("click", function () { state.userPaused = !state.userPaused; update(); });
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { go(state.index + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { go(state.index - 1); e.preventDefault(); }
    });

    // Swipe / drag between photos.
    var startX = null, dragged = false;
    viewport.addEventListener("pointerdown", function (e) { startX = e.clientX; dragged = false; });
    viewport.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 40) { dragged = true; go(state.index + (dx < 0 ? 1 : -1)); setTimeout(function () { dragged = false; }, 0); }
      startX = null;
    });
    viewport.addEventListener("pointercancel", function () { startX = null; });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        state.offscreen = !entries[0].isIntersecting; update();
      }, { threshold: 0.35 }).observe(root);
    }
    document.addEventListener("visibilitychange", update);
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { position(false); }, 100);
    });

    update();
    go(0, true);
  }

  // Cards linking to each photography category page.
  function renderPhotoCategories(target, skipSlug) {
    if (!target) return;
    var cats = (content.photoCategories || []).filter(function (c) { return c.slug !== skipSlug; });
    renderList(target, cats, function (c) {
      var first = (c.photos || [])[0] || {};
      var cover = c.cover || first.thumb || first.src;
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
    if (page === "home") renderHome();
    if (page === "film") renderFilm();
    if (page === "photography") {
      renderSlideshow(document.getElementById("highlights"), content.photos || []);
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
