# mix & fire 🔥

קהילת ערבוב צבעי גלזורה — אפליקציה וובית לתיעוד ערבובים של צבעי גלזורה קרמיים.
_A community web app for documenting ceramic glaze color mixes._

## מה זה עושה

- **ספריית צבעים** — ~60 צבעי גלזורה אמיתיים ממותגים מובילים (AMACO Potter's Choice,
  Mayco Stoneware, Coyote, Spectrum) כבסיס, ומשתמשים יכולים להוסיף צבעים משלהם עם תמונה.
- **תיעוד ערבובים** — בוחרים כמה צבעים מהספרייה, מעלים תמונה של התוצאה השרופה, ואופציונלית
  רושמים יחסים/כמויות לכל צבע.
- **חיפוש לפי צבעים** — בוחרים צבעים ורואים מה יצא לאחרים כשהם ערבבו אותם (מצב "כל הצבעים"
  או "לפחות אחד").
- **התחברות עם Google** — תוכן שמעלים שייך למשתמש המחובר.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (RTL, עברית) |
| Database | Postgres (Neon on Vercel) + Drizzle ORM |
| Auth | Auth.js (NextAuth v5) + Google |
| Images | Vercel Blob (client uploads) |
| Hosting | Vercel (Hobby plan מספיק) |

## הרצה מקומית

1. **התקנת תלויות**
   ```bash
   npm install
   ```

2. **משתני סביבה** — צרו `.env.local` (ראו `.env.example`):
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mixfire
   AUTH_SECRET=…            # npx auth secret
   AUTH_GOOGLE_ID=…         # Google Cloud Console
   AUTH_GOOGLE_SECRET=…
   BLOB_READ_WRITE_TOKEN=…  # רק לפרודקשן / העלאת תמונות
   ```

3. **מסד הנתונים**
   ```bash
   npm run db:migrate   # יוצר את הטבלאות
   npm run db:seed      # טוען את צבעי הבסיס (אידמפוטנטי)
   ```

4. **הרצה**
   ```bash
   npm run dev          # http://localhost:3000
   ```

### סקריפטים של DB
- `npm run db:generate` — יצירת migration מ-`src/db/schema.ts`
- `npm run db:migrate` — החלת migrations
- `npm run db:seed` — טעינת צבעי בסיס
- `npm run db:studio` — Drizzle Studio לעיון בנתונים

## פריסה ל-Vercel

1. **חברו את ה-repo** ל-Vercel (Import Project).
2. **Storage → Neon Postgres** — יוצר ומזריק `DATABASE_URL`. השתמשו ב-connection string
   ה-*pooled* (`...-pooler...`).
3. **Storage → Blob** — יוצר ומזריק `BLOB_READ_WRITE_TOKEN`.
4. **Google OAuth** (Google Cloud Console → OAuth client):
   - Authorized redirect URI: `https://<your-app>.vercel.app/api/auth/callback/google`
   - עבור scopes בסיסיים (`email`, `profile`) אין צורך באימות של Google — פרסמו כ-"In production".
5. **משתני סביבה** ב-Vercel: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
   (ה-DB וה-Blob מוזרקים אוטומטית).
6. **Migrations** — הריצו migrations מול ה-DB של Vercel פעם אחת
   (`vercel env pull .env.local` ואז `npm run db:migrate && npm run db:seed`).

## מבנה

```
src/
  app/                 # דפים (App Router) + api/auth + api/upload
  components/          # ColorSwatch, MixtureCard, ImageUpload, pickers, forms
  db/                  # schema.ts, index.ts (postgres.js), seed + seed-data
  lib/                 # auth.ts, queries.ts, validators.ts, actions/
drizzle/               # migrations שנוצרו
```

> **הערה על צבעי בסיס:** שמות הצבעים והקודים הם נתוני קטלוג עובדתיים. דגימות ה-hex הן
> *קירוב* בלבד לצורך תצוגה — הצבע השרוף האמיתי תלוי בחומר ובכבשן. אין שימוש בתמונות של
> המותגים; תמונות אמיתיות מגיעות רק ממשתמשים.
