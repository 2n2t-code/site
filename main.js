/* ==========================================================================
   2N2T — renders content.js into the Film, Photography and Music pages.
   You shouldn't need to edit this file to add content.
   ========================================================================== */
(function () {
  "use strict";

  var content = window.SITE_CONTENT || {};
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

  /* ---------- Film ---------- */
  function videoThumb(v) {
    if (v.thumb) return url(v.thumb);
    if (v.type === "youtube") return "https://i.ytimg.com/vi/" + encodeURIComponent(v.id) + "/hqdefault.jpg";
    return "";
  }

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

    // Click-to-load: show a thumbnail; only load the player/iframe on click.
    var btn = el("button", { class: "video-poster", type: "button", "aria-label": "Play video: " + title }, [
      videoThumb(v) ? el("img", { src: videoThumb(v), alt: "", loading: "lazy", decoding: "async", width: "1280", height: "720" }) : null,
      el("span", { class: "play-icon", "aria-hidden": "true" })
    ]);
    btn.addEventListener("click", function () {
      var player = v.type === "mp4"
        ? el("video", { controls: true, autoplay: true, playsinline: true, src: url(v.src), poster: videoThumb(v) || null, "aria-label": title })
        : el("iframe", {
            src: embedSrc(v),
            title: title,
            allow: "autoplay; fullscreen; picture-in-picture; encrypted-media",
            allowfullscreen: true
          });
      frame.replaceChildren(player);
      player.focus();
    });
    frame.appendChild(btn);

    if (featured) frame.appendChild(el("span", { class: "badge", text: "Live In Session" }));

    var caption = el("figcaption", null, [
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
    var film = content.film || {};
    renderList(document.getElementById("live-in-session"), film.liveInSession,
      function (v) { return videoCard(v, true); }, "Live In Session videos coming soon.");
    renderList(document.getElementById("film-work"), film.work,
      function (v) { return videoCard(v, false); }, "More work coming soon.");
  }

  /* ---------- Photography + lightbox ---------- */
  function renderPhotos() {
    var photos = content.photos || [];
    var gallery = document.getElementById("gallery");
    renderList(gallery, photos, function (p, i) {
      var btn = el("button", { class: "gallery-item", type: "button", "aria-label": "Enlarge: " + (p.alt || "photo " + (i + 1)) }, [
        el("img", { src: url(p.thumb || p.src), alt: p.alt || "", loading: "lazy", decoding: "async" })
      ]);
      btn.addEventListener("click", function () { openLightbox(i, btn); });
      return btn;
    }, "Photos coming soon.");

    var lb = document.getElementById("lightbox");
    if (!lb) return;
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
    function openLightbox(i, trigger) {
      lastFocus = trigger;
      show(i);
      lb.hidden = false;
      document.body.classList.add("no-scroll");
      lb.querySelector(".lb-close").focus();
      document.addEventListener("keydown", onKey);
    }
    function close() {
      lb.hidden = true;
      img.removeAttribute("src");
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
      if (lastFocus) lastFocus.focus();
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
  }

  /* ---------- Music ---------- */
  // Accepts the whole embed code Bandcamp gives you (or just its URL), pulls
  // out the album/track numbers, and builds a player that matches the site.
  function bandcampPlayer(t) {
    var code = String(t.bandcamp);
    var ids = code.match(/(album|track)=\d+/g);
    if (!ids) return el("p", { class: "notes", text: "Bandcamp embed code not recognised — check content.js." });
    var isAlbum = /album=/.test(ids.join(""));
    // Albums show their track list unless the embed code (or tracklist: false) says otherwise.
    var tracklist = isAlbum && (t.tracklist !== undefined ? !!t.tracklist : !/tracklist=false/.test(code));
    // Use the height Bandcamp chose for this release, so the artwork fits exactly.
    var h = code.match(/height:\s*(\d+)px/);
    var height = h ? +h[1] : (tracklist ? 720 : 442);
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
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Homepage background videos: always muted, only start if the visitor
  // hasn't asked for reduced motion and isn't on a data-saver connection.
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    (navigator.connection && navigator.connection.saveData);
  if (!calm) {
    document.querySelectorAll("video[data-bg-src]").forEach(function (v) {
      v.muted = true;
      v.src = url(v.getAttribute("data-bg-src"));
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  var page = document.body.getAttribute("data-page");
  if (page === "film") renderFilm();
  if (page === "photography") renderPhotos();
  if (page === "music") renderMusic();
})();
