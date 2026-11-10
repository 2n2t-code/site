/* ==========================================================================
   2N2T — SITE CONTENT
   This is the only file you need to edit to add videos, photos and tracks.

   Paths: write local files relative to the site root, e.g. "assets/img/x.jpg"
   (no leading slash). Full URLs (https://...) also work.
   ========================================================================== */

window.SITE_CONTENT = {

  /* ------------------------------------------------------------------------
     VIDEO WORK
     One list, in the order it appears on the homepage ("Selected work").
     On the Video Production page, videos whose category includes
     "Live In Session" are featured at the top; the rest follow in order.

     Each video:
       type     -> "youtube" (id = the bit after watch?v=, e.g. "FGRNWgGfReA")
                   "vimeo"   (id = the number in the Vimeo link)
                   "mp4"     (src = path or link to an .mp4 file)
       category -> small label above the title, e.g. "Live Event"
       title    -> the artist, client or event
     Optional:
       thumb    -> your own thumbnail image (YouTube thumbnails are automatic)
       year, client, role -> shown as extra detail on the Video Production page
     ------------------------------------------------------------------------ */
  film: {
    videos: [
      { type: "youtube", id: "FGRNWgGfReA", category: "Live Concert", title: "Pierre Bensusan" },
      { type: "youtube", id: "AzLkLzCOuoA", category: "Live In Session at Silk Mill Studios", title: "Chief Springs" },
      { type: "youtube", id: "IkFYZh9kbAk", category: "Music Video", title: "Paul Walker & Karen Pfeiffer" },
      { type: "youtube", id: "TS9bDqmXpWc", category: "Live Event", title: "Dirty Weekend at The Edge Festival, Solva" },
      { type: "youtube", id: "UYP-mWkQISc", category: "Live Event", title: "Discoteca at O2 Victoria Warehouse, Manchester" },
      { type: "youtube", id: "xAbLxqtVRqo", category: "Wedding Entertainment Highlights", title: "Peckforton Castle" },
      { type: "youtube", id: "6tPhsQtXXog", category: "Live In Session", title: "Algorhythm" },
      { type: "youtube", id: "XldxVfA5WPk", category: "Wedding Band Highlights", title: "Dirty Weekend Festival Wedding" },
      { type: "youtube", id: "_a9PFn6zo1c", category: "Fire Performer Promo", title: "Kat Fire" },
      { type: "youtube", id: "nIYWaXC5TNk", category: "Live In Session at Hope Mill Studios", title: "The Beautiful Failures" }
    ]
  },

  /* ------------------------------------------------------------------------
     PHOTOGRAPHY — HIGHLIGHTS (the main gallery at the top of /photography/)
       src   -> full-size image (opened in the lightbox)
       thumb -> smaller version for the grid (optional, falls back to src)
       alt   -> describe the photo (important for accessibility & SEO)
       caption -> optional text under the enlarged photo
     ------------------------------------------------------------------------ */
  photos: [
    { src: "assets/img/photos/rival-consoles-live.jpg",   thumb: "assets/img/photos/rival-consoles-live-sm.jpg",   alt: "Rival Consoles performing in silhouette under red and blue laser beams", caption: "Rival Consoles, live" },
    { src: "assets/img/photos/levenshulme-fireworks.jpg", thumb: "assets/img/photos/levenshulme-fireworks-sm.jpg", alt: "Fireworks bursting over Levenshulme station platform at night", caption: "Levenshulme station, fireworks night" },
    { src: "assets/img/photos/vw-camper-tram-trails.jpg", thumb: "assets/img/photos/vw-camper-tram-trails-sm.jpg", alt: "A cream VW camper van parked at night as a passing tram leaves light trails behind it", caption: "Camper and tram trails" },
    { src: "assets/img/photos/photo-1.jpg",  thumb: "assets/img/photos/photo-1-sm.jpg",  alt: "Placeholder photo 1",  caption: "Live at a Manchester venue" },
    { src: "assets/img/photos/photo-2.jpg",  thumb: "assets/img/photos/photo-2-sm.jpg",  alt: "Placeholder photo 2",  caption: "Portrait session" },
    { src: "assets/img/photos/photo-3.jpg",  thumb: "assets/img/photos/photo-3-sm.jpg",  alt: "Placeholder photo 3",  caption: "Behind the scenes" },
    { src: "assets/img/photos/photo-4.jpg",  thumb: "assets/img/photos/photo-4-sm.jpg",  alt: "Placeholder photo 4",  caption: "" },
    { src: "assets/img/photos/photo-5.jpg",  thumb: "assets/img/photos/photo-5-sm.jpg",  alt: "Placeholder photo 5",  caption: "Northern Quarter" },
    { src: "assets/img/photos/photo-6.jpg",  thumb: "assets/img/photos/photo-6-sm.jpg",  alt: "Placeholder photo 6",  caption: "" },
    { src: "assets/img/photos/photo-7.jpg",  thumb: "assets/img/photos/photo-7-sm.jpg",  alt: "Placeholder photo 7",  caption: "Studio session" },
    { src: "assets/img/photos/photo-8.jpg",  thumb: "assets/img/photos/photo-8-sm.jpg",  alt: "Placeholder photo 8",  caption: "" },
    { src: "assets/img/photos/photo-9.jpg",  thumb: "assets/img/photos/photo-9-sm.jpg",  alt: "Placeholder photo 9",  caption: "Festival season" },
    { src: "assets/img/photos/photo-10.jpg", thumb: "assets/img/photos/photo-10-sm.jpg", alt: "Placeholder photo 10", caption: "" },
    { src: "assets/img/photos/photo-11.jpg", thumb: "assets/img/photos/photo-11-sm.jpg", alt: "Placeholder photo 11", caption: "" },
    { src: "assets/img/photos/photo-12.jpg", thumb: "assets/img/photos/photo-12-sm.jpg", alt: "Placeholder photo 12", caption: "Golden hour" }
  ],

  /* ------------------------------------------------------------------------
     PHOTOGRAPHY — GALLERIES (category pages, listed under the highlights)
     Each category has its own page at /photography/<slug>/.
       slug   -> must match the folder name (e.g. "weddings" = photography/weddings/)
       title  -> page heading;  label -> short name on the gallery card
       intro  -> a sentence under the heading
       cover  -> optional card image (defaults to the first photo's thumb)
       photos -> same format as the highlights above
     To add a whole new category, see the README.
     ------------------------------------------------------------------------ */
  photoCategories: [
    {
      slug: "weddings",
      title: "Wedding Photography",
      label: "Weddings",
      intro: "Relaxed, story-led wedding photography, from getting ready to the last dance.",
      photos: [
        { src: "assets/img/photos/photo-2.jpg", thumb: "assets/img/photos/photo-2-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-4.jpg", thumb: "assets/img/photos/photo-4-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-7.jpg", thumb: "assets/img/photos/photo-7-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-10.jpg", thumb: "assets/img/photos/photo-10-sm.jpg", alt: "Placeholder photo", caption: "" }
      ]
    },
    {
      slug: "landscape",
      title: "Landscape Photography",
      label: "Landscape",
      intro: "Hills, coastlines and big skies across the North West and beyond.",
      photos: [
        { src: "assets/img/photos/photo-6.jpg", thumb: "assets/img/photos/photo-6-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-11.jpg", thumb: "assets/img/photos/photo-11-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-1.jpg", thumb: "assets/img/photos/photo-1-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-9.jpg", thumb: "assets/img/photos/photo-9-sm.jpg", alt: "Placeholder photo", caption: "" }
      ]
    },
    {
      slug: "portraits",
      title: "Portrait Photography",
      label: "Portraits",
      intro: "Artist, press and personal portraits, on location or in the studio.",
      photos: [
        { src: "assets/img/photos/photo-5.jpg", thumb: "assets/img/photos/photo-5-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-8.jpg", thumb: "assets/img/photos/photo-8-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-12.jpg", thumb: "assets/img/photos/photo-12-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-3.jpg", thumb: "assets/img/photos/photo-3-sm.jpg", alt: "Placeholder photo", caption: "" }
      ]
    },
    {
      slug: "music",
      title: "Music Photography",
      label: "Music",
      intro: "Live shows, festivals and behind-the-scenes with artists.",
      photos: [
        { src: "assets/img/photos/rival-consoles-live.jpg", thumb: "assets/img/photos/rival-consoles-live-sm.jpg", alt: "Rival Consoles performing in silhouette under red and blue laser beams", caption: "Rival Consoles, live" },
        { src: "assets/img/photos/photo-1.jpg", thumb: "assets/img/photos/photo-1-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-9.jpg", thumb: "assets/img/photos/photo-9-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-3.jpg", thumb: "assets/img/photos/photo-3-sm.jpg", alt: "Placeholder photo", caption: "" }
      ]
    },
    {
      slug: "street",
      title: "Street Photography",
      label: "Street",
      intro: "Manchester after dark: stations, trams and the city in motion.",
      photos: [
        { src: "assets/img/photos/vw-camper-tram-trails.jpg", thumb: "assets/img/photos/vw-camper-tram-trails-sm.jpg", alt: "A cream VW camper van parked at night as a passing tram leaves light trails behind it", caption: "Camper and tram trails" },
        { src: "assets/img/photos/levenshulme-fireworks.jpg", thumb: "assets/img/photos/levenshulme-fireworks-sm.jpg", alt: "Fireworks bursting over Levenshulme station platform at night", caption: "Levenshulme station, fireworks night" }
      ]
    },
    {
      slug: "film",
      title: "Film Photography",
      label: "Film",
      intro: "Shot on 35mm and medium format film.",
      photos: [
        { src: "assets/img/photos/photo-4.jpg", thumb: "assets/img/photos/photo-4-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-12.jpg", thumb: "assets/img/photos/photo-12-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-6.jpg", thumb: "assets/img/photos/photo-6-sm.jpg", alt: "Placeholder photo", caption: "" },
        { src: "assets/img/photos/photo-8.jpg", thumb: "assets/img/photos/photo-8-sm.jpg", alt: "Placeholder photo", caption: "" }
      ]
    }
  ],

  /* ------------------------------------------------------------------------
     MUSIC — SOLO PRODUCTIONS
     Releases are sorted onto two rows automatically: Bandcamp albums/EPs
     go under "Albums & EPs", everything else under "Singles". To override,
     add  type: "album"  or  type: "single"  to a release.
     Each release uses EITHER a Bandcamp player OR your own audio file:
       bandcamp -> on Bandcamp, open the track/album, click Share/Embed,
                   choose any player style, then copy the code it gives you
                   and paste it between backticks ` ` like the example below.
       tracklist -> false to hide an album's track list (shown by default)
       src      -> OR a .mp3 (or .m4a/.ogg/.wav) path or URL
       title, artist, year, duration -> shown on the track (leave out any you don't want)
       notes -> a sentence or two about the release
     ------------------------------------------------------------------------ */
  tracks: [
    {
      bandcamp: `<iframe style="border: 0; width: 350px; height: 442px;" src="https://bandcamp.com/EmbeddedPlayer/track=1068435607/size=large/bgcol=ffffff/linkcol=333333/tracklist=false/transparent=true/" seamless><a href="https://2n2t.bandcamp.com/track/chugga">Chugga by 2N2T</a></iframe>`,
      title: "Chugga",
      artist: "2N2T",
      notes: ""
    },
    {
      bandcamp: `<iframe style="border: 0; width: 350px; height: 442px;" src="https://bandcamp.com/EmbeddedPlayer/track=2351636420/size=large/bgcol=ffffff/linkcol=333333/tracklist=false/transparent=true/" seamless><a href="https://2n2t.bandcamp.com/track/highfields">Highfields by 2N2T</a></iframe>`,
      title: "Highfields",
      artist: "2N2T",
      notes: ""
    },
    {
      bandcamp: `<iframe style="border: 0; width: 350px; height: 720px;" src="https://bandcamp.com/EmbeddedPlayer/album=2459414514/size=large/bgcol=ffffff/linkcol=333333/transparent=true/" seamless><a href="https://2n2t.bandcamp.com/album/lkdwn-demos">LKDWN (demos) by 2N2T</a></iframe>`,
      title: "LKDWN (demos)",
      artist: "2N2T",
      notes: ""
    },
    {
      bandcamp: `<iframe style="border: 0; width: 350px; height: 753px;" src="https://bandcamp.com/EmbeddedPlayer/album=3959238659/size=large/bgcol=ffffff/linkcol=333333/transparent=true/" seamless><a href="https://2n2t.bandcamp.com/album/twin-peaks-ep">TWIN PEAKS EP by 2N2T</a></iframe>`,
      title: "TWIN PEAKS EP",
      artist: "2N2T",
      notes: ""
    }

    // To add your own audio file instead of Bandcamp, add a comma after the
    // last } above and an entry like this:
    // { src: "assets/audio/my-track.mp3", title: "Track", artist: "2N2T", year: "2026", notes: "" }
  ],

  /* ------------------------------------------------------------------------
     BANDS (shown under "Bands" on the Music page)
       name    -> band name
       spotify -> the band's Spotify link. On Spotify, open the artist (or an
                  album/track/playlist), click ... → Share → Copy link, and
                  paste it here. Spotify's embed code also works.
       notes   -> optional sentence about the band / your role in it
     ------------------------------------------------------------------------ */
  bands: [
    {
      name: "Vordermann",
      spotify: "https://open.spotify.com/artist/6q8MQV9ZLqQtv1UN44SgwN",
      notes: ""
    },
    {
      name: "This Sun No More",
      spotify: "https://open.spotify.com/artist/5z5jmWVA2F4Pcpx7eXJfTP",
      notes: ""
    }
  ]
};
