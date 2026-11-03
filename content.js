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
      tracklist: true,
      title: "LKDWN (demos)",
      artist: "2N2T",
      notes: ""
    },
    {
      bandcamp: `<iframe style="border: 0; width: 350px; height: 753px;" src="https://bandcamp.com/EmbeddedPlayer/album=3959238659/size=large/bgcol=ffffff/linkcol=333333/transparent=true/" seamless><a href="https://2n2t.bandcamp.com/album/twin-peaks-ep">TWIN PEAKS EP by 2N2T</a></iframe>`,
      tracklist: true,
      title: "TWIN PEAKS EP",
      artist: "2N2T",
      notes: ""
    }

    // To add your own audio file instead of Bandcamp, add a comma after the
    // last } above and an entry like this:
    // { src: "assets/audio/my-track.mp3", title: "Track", artist: "2N2T", year: "2026", notes: "" }
  ]
};
