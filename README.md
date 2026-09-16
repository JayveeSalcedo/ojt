# OJT Tracker

A PWA for tracking 486 OJT hours, keeping a daily photo and narrative journal (polished by Groq AI), and filling in the PSU Practicum Weekly Report (FM-AA-INT-19).

## Setup
1. Create a Supabase project. In the SQL Editor, run `supabase/schema.sql`, then `supabase/seed.sql` after replacing the placeholder names with your class list.
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL, anon key, and Groq API key.
3. Add the university logo as `public/psu-logo.png` for the report header.
4. Run `npm install`, then `npm run dev`.

## Deploy (Vercel)
Import the folder or repo into Vercel and set the same 3 environment variables. You need HTTPS for the install prompt to work.

## Notes
- There's no login. Anyone with the URL can read and edit data, which is fine for a class tool.
- A 60-minute break is deducted automatically for shifts over 5 hours. You can edit this per day.
- Report: pick a 4-week block, tap **Fill Template**, edit any cell, then **Print / Save PDF**.
