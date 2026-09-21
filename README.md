# The Alejo Collection

A portfolio built as a walkable 3D museum. One hall, four projects hung on the
walls, an attendant that briefs you, and a plain catalogue underneath for anyone
who would rather just read.

Astro 7 · React 19 · React Three Fiber · Tailwind 4 · static output.

## Running it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
npm run preview  # serve the build
npm run check    # typecheck
npm run images   # rebuild the shipped screenshots
```

`astro dev` and `astro preview` run in the background: stop them with
`npx astro dev stop` and `npx astro preview stop`.

## Controls

**WASD** walk · **mouse** look · **shift** hurry · **E** interact · **esc**
pause. On a phone: left thumb to walk, drag to look, **Menu** in the corner to
pause. The pause menu is also the way out to the plain catalogue.

## Adding a project

Everything lives in `src/data/projects.ts`, including where the piece hangs.
Put the screenshot in `src/media/projects/` and run `npm run images` — that
builds the WebP the site actually ships. See `CLAUDE.md` for how the room is
put together.
