# Bakkar Cricket Tournament 2026 — setup guide

This ZIP contains the website source code and Supabase database setup. It is a deployable starter project, **not an already-hosted public website**. Live database features work after you connect your own Supabase project and deploy it.

## Admin login requested
- Username: `admin`
- Password: `Bakkar@player`

The username is checked by the website. Supabase Auth uses an email behind the scenes, so choose an email address you control and put it in `ADMIN_EMAIL` and `VITE_ADMIN_EMAIL` in your private `.env` file. The bootstrap script creates/resets that Supabase Auth account and adds its `admin` role. Change the password after setup. **Do not share `.env` or the Supabase service-role key.** The service-role key must never be prefixed with `VITE_`.

## 1. Create Supabase project
1. Create a project at https://supabase.com.
2. In Project Settings → API, copy Project URL, anon/public key, and service_role key.
3. Copy `.env.example` to `.env`.
4. Fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_EMAIL`.
5. Keep `ADMIN_USERNAME=admin` and `ADMIN_PASSWORD=Bakkar@player` for initial setup.

## 2. Create database
1. Open Supabase → SQL Editor.
2. Paste and run all of `supabase/schema.sql`.
3. This creates profiles, teams, matches, player photo records, security policies, and the player-photos storage bucket.

## 3. Create admin account
Requires Node.js 20 or later.
```bash
npm install
npm run create-admin
```
The script creates the Supabase Auth account and the admin profile. It uses the private service-role key only on your local machine.

## 4. Run locally
```bash
npm run dev
```
Open the local URL printed by Vite. Admin login is `admin` plus the configured password. Team registrations are stored as pending until an admin approves them. Admin can add matches, update match score/status, and upload/change player photos.

## 5. Build and deploy
```bash
npm run build
```
Deploy the generated `dist` folder to Netlify. Add only these public environment variables in Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`

Never add `SUPABASE_SERVICE_ROLE_KEY` to Netlify frontend environment variables. Do not commit `.env` to GitHub.

## Included website sections
- Home page, tournament overview, prize and entry fee
- Bakkar host team and 22-player squad
- Other approved team listings
- Team registration (11 or more player names; reserves allowed)
- Fixtures and match schedule
- Live score display and admin score/status updates
- Admin login, registration approval/rejection, match creation
- Admin player photo upload/change via Supabase Storage
- English/Hindi language toggle

## Important notes before public launch
- Tournament management still needs to confirm total teams, overs, fixtures, match rules, and contact details.
- Add real player mobile numbers privately in the admin/database workflow; public pages intentionally do not display mobile numbers.
- This starter's score editor updates match totals and overs/status. A full ball-by-ball scorer, automatic points table/NRR, Playing XI selector, editable player roster, and complete photo rendering on every public player card are planned extensions and are not yet implemented in this first ZIP.
- The Bakkar squad is preloaded in the public UI; the other team registrations are stored in Supabase after setup.
- Before a real tournament, test admin access, RLS policies, registration, photo uploads, match updates, backups, and mobile display with test data.
