/* ==========================================================================
   2N2T — SITE CONTENT
   This is the only file you need to edit to add videos, photos and tracks.

   Paths: write local files relative to the site root, e.g. "assets/img/x.jpg"
   (no leading slash). Full URLs (https://...) also work.
   ========================================================================== */

window.SITE_CONTENT = {

  /* ------------------------------------------------------------------------
     FILM
     Each video needs a "type":
       "youtube" -> id: the bit after watch?v=  (e.g. "dQw4w9WgXcQ")
       "vimeo"   -> id: the number in the Vimeo URL (e.g. "76979871")
       "mp4"     -> src: path or URL to the .mp4 file
     Optional on every video:
       thumb  -> poster image. YouTube thumbs are automatic if you leave it out.
       client, year, role -> shown under the title.
     ------------------------------------------------------------------------ */
  film: {
    // Shown first, larger, under "Live In Session".
    liveInSession: [
      {
        type: "youtube",
        id: "aqz-KE-bpKQ",
        title: "Artist Name — Song Title (Live In Session)",
        client: "Live In Session",
        year: "2026",
        role: "Directed, shot & edited",
        thumb: "assets/img/film/film-1.jpg"
      },
      {
        type: "vimeo",
        id: "76979871",
        title: "Another Artist — Track (Live In Session)",
        client: "Live In Session",
        year: "2026",
        role: "Multi-cam production",
        thumb: "assets/img/film/film-2.jpg"
      }
    ],

    // The grid of other work.
    work: [
      {
        type: "mp4",
        src: "assets/video/film-loop.mp4",
        title: "Brand Film — Placeholder",
        client: "Client Name",
        year: "2026",
        role: "Producer / Editor",
        thumb: "assets/img/film/film-3.jpg"
      },
      {
        type: "youtube",
        id: "aqz-KE-bpKQ",
        title: "Music Video — Placeholder",
        client: "Record Label",
        year: "2025",
        role: "Director / DOP",
        thumb: "assets/img/film/film-4.jpg"
      },
      {
        type: "vimeo",
        id: "76979871",
        title: "Event Highlights — Placeholder",
        client: "Venue, Manchester",
        year: "2025",
        role: "Videographer",
        thumb: "assets/img/film/film-5.jpg"
      },
      {
        type: "youtube",
        id: "aqz-KE-bpKQ",
        title: "Documentary Short — Placeholder",
        client: "Independent",
        year: "2025",
        role: "Editor",
        thumb: "assets/img/film/film-6.jpg"
      },
      {
        type: "youtube",
        id: "aqz-KE-bpKQ",
        title: "Social Campaign — Placeholder",
        client: "Client Name",
        year: "2024",
        role: "Shoot & edit",
        thumb: "assets/img/film/film-7.jpg"
      },
      {
        type: "mp4",
        src: "assets/video/film-loop.mp4",
        title: "Showreel Cut — Placeholder",
        client: "2N2T",
        year: "2024",
        role: "Edit & grade",
        thumb: "assets/img/film/film-8.jpg"
      }
    ]
  },

  /* ------------------------------------------------------------------------
     PHOTOGRAPHY
       src   -> full-size image (opened in the lightbox)
       thumb -> smaller version for the grid (optional, falls back to src)
       alt   -> describe the photo (important for accessibility & SEO)
       caption -> optional text under the enlarged photo
     ------------------------------------------------------------------------ */
  photos: [
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
     MUSIC
     Each track uses EITHER a Bandcamp player OR your own audio file:
       bandcamp -> on Bandcamp, open the track/album, click Share/Embed,
                   choose any player style, then copy the code it gives you
                   and paste it between backticks ` ` like the example below.
       tracklist -> true to show the full album track list (albums only)
       src      -> OR a .mp3 (or .m4a/.ogg/.wav) path or URL
       title, artist, year, duration -> shown on the track
       notes -> a sentence or two about the track
     ------------------------------------------------------------------------ */
  tracks: [
    // EXAMPLE Bandcamp entry: remove the two slashes at the start of each
    // line below and replace the embed code with your own.
    // {
    //   bandcamp: `<iframe style="border: 0; width: 100%; height: 120px;" src="https://bandcamp.com/EmbeddedPlayer/album=1234567890/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/" seamless><a href="https://2n2t.bandcamp.com/album/example">Example by 2N2T</a></iframe>`,
    //   title: "My Bandcamp Release",
    //   artist: "2N2T",
    //   year: "2026",
    //   notes: "Out now on Bandcamp."
    // },

    {
      src: "assets/audio/track-1.mp3",
      title: "Placeholder Track One",
      artist: "2N2T",
      year: "2026",
      duration: "0:06",
      notes: "Recorded live in one take. Replace this with a note about the track."
    },
    {
      src: "assets/audio/track-2.mp3",
      title: "Placeholder Track Two",
      artist: "2N2T feat. Guest",
      year: "2025",
      duration: "0:06",
      notes: "Mixed and mastered at a studio in Manchester."
    },
    {
      src: "assets/audio/track-3.mp3",
      title: "Placeholder Track Three",
      artist: "2N2T",
      year: "2025",
      duration: "0:06",
      notes: "Score written for a short film."
    },
    {
      src: "assets/audio/track-4.mp3",
      title: "Placeholder Track Four",
      artist: "2N2T",
      year: "2024",
      duration: "0:06",
      notes: ""
    }
  ]
};
