# פריסה מהטלפון — mix & fire

כל השלבים נעשים מהדפדפן בטלפון. אין צורך במחשב או בטרמינל — ה-migrations וטעינת
צבעי הבסיס רצים אוטומטית בזמן ה-build של Vercel.

> **טיפ:** ב-Google Cloud Console כדאי להפעיל "אתר לגרסת מחשב / Desktop site"
> בתפריט הדפדפן — זה מקל על המסכים שם.

---

## שלב 1 — ייבוא הפרויקט ל-Vercel
1. פותחים **vercel.com** ומתחברים עם **GitHub**.
2. **Add New → Project** ובוחרים את ה-repo `tomer362/glaze`.
3. **Deploy**. הפריסה הראשונה תרוץ בלי מסד נתונים — זה בסדר, נחזור אליה.

## שלב 2 — מסד נתונים (Neon Postgres)
1. בפרויקט: לשונית **Storage → Create Database → Neon (Postgres)**.
2. מחברים אותו לפרויקט (**Connect**). זה מזריק אוטומטית את `DATABASE_URL`.

## שלב 3 — אחסון תמונות (Blob)
1. **Storage → Create → Blob → Connect**.
2. זה מזריק אוטומטית את `BLOB_READ_WRITE_TOKEN`.

## שלב 4 — התחברות Google
1. פותחים **console.cloud.google.com** (מומלץ Desktop site).
2. יוצרים פרויקט חדש, למשל `mix-and-fire`.
3. **APIs & Services → OAuth consent screen**:
   - סוג: **External** → Create.
   - ממלאים שם אפליקציה (`mix & fire`), אימייל תמיכה, ואימייל מפתח → Save.
   - **Publishing status → Publish app → In production** (עבור הרשאות בסיס של
     אימייל/פרופיל אין צורך באימות של Google).
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - תחת **Authorized redirect URIs** מוסיפים:
     `https://<הכתובת-שלך>.vercel.app/api/auth/callback/google`
     (את הכתובת המדויקת מוצאים ב-Vercel, בלשונית הפרויקט למעלה).
   - **Create** ומעתיקים את **Client ID** ואת **Client Secret**.

## שלב 5 — משתני סביבה ב-Vercel
בפרויקט: **Settings → Environment Variables**, מוסיפים (לכל ה-Environments):

| Name | Value |
|------|-------|
| `AUTH_SECRET` | (המחרוזת שקיבלת בצ׳אט) |
| `AUTH_GOOGLE_ID` | ה-Client ID מ-Google |
| `AUTH_GOOGLE_SECRET` | ה-Client Secret מ-Google |

> `DATABASE_URL` ו-`BLOB_READ_WRITE_TOKEN` כבר הוזרקו אוטומטית בשלבים 2–3.

## שלב 6 — פריסה מחדש
**Deployments → הפריסה האחרונה → ⋯ → Redeploy**.
בפעם הזאת ה-build ייצור את הטבלאות ויטען את ~60 צבעי הבסיס אוטומטית.

## שלב 7 — בדיקה
1. נכנסים לכתובת של האפליקציה.
2. **התחברות עם Google**.
3. מוסיפים צבע / מתעדים ערבוב עם תמונה, ובודקים חיפוש.

---

### פתרון תקלות
- **התחברות Google נכשלת (redirect_uri_mismatch):** ודאו שה-URI ב-Google תואם
  בדיוק לכתובת ב-Vercel, כולל `/api/auth/callback/google`.
- **שגיאות DB / דף ריק:** ודאו ש-`DATABASE_URL` קיים, והריצו Redeploy כדי
  שה-build יריץ שוב את ה-migrations.
- **תמונה לא נטענת בהעלאה:** ודאו ש-`BLOB_READ_WRITE_TOKEN` קיים (שלב 3).
