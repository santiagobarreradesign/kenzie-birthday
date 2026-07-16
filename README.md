# Happy Birthday Kenzie ★

A vintage-grunge interactive birthday tribute site. Friends can decorate Kenzie’s photo with stickers, doodle, swap backgrounds, tint her hair, leave floating love-note bubbles, and customize the marquee banner.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **react-konva** for the interactive collage canvas
- **Framer Motion** for floating comment bubbles
- **Zustand** for editor state
- **Supabase** for shared persistence (Postgres + Storage + Realtime)
- Falls back to a local `.data/store.json` when Supabase env vars are missing

## Getting started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase setup (shared mode)

1. Create a Supabase project
2. Run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) in the SQL editor
3. Fill `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PIN=kenzie
```

Default admin PIN for marquee edits is `kenzie` (override with `ADMIN_PIN`).

## Features

- Drag / rotate / scale accessory stickers from the “Purse”
- Draw & erase on the canvas
- Background swaps, hair tint, distort skew
- **Add to collage** persists layers for everyone
- Floating comment bubbles (expandable, optional photo)
- Editable scrolling marquee (PIN-protected)

## Assets

- Base photo: `public/assets/kenzie-base.png`
- Stickers: `public/assets/accessories/*.svg`
- Style references: `public/assets/references/`

Swap in transparent PNG cutouts anytime — keep the same filenames or update `lib/constants/palette.ts`.

## Deploy

Live: [https://kenzie-birthday.vercel.app](https://kenzie-birthday.vercel.app)

```bash
npx vercel --yes --name kenzie-birthday
```

Set the Supabase + `ADMIN_PIN` env vars in the Vercel project settings for true shared persistence across visitors. Without Supabase, the app runs in demo mode (in-memory on Vercel, file-backed locally).
