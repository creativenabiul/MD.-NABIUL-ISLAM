# Md. Nabiul Islam — Interactive 3D Creative Portfolio & CMS

A minimal luxury, interactive 3D full-stack personal portfolio built for **Md. Nabiul Islam** (Graphic Designer, Digital Marketer, AI Automation Enthusiast, and B.Sc Chemistry Student).

## Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, React Router, Three.js (WebGL hero + 3D project showcase mockups), GSAP ScrollTrigger.
- **Backend**: Node.js + Express (`server.ts`) on port `3000` handling:
  - Rate-limited, Zod-validated, honeypot-protected contact submissions (`POST /api/contact`).
  - Firebase Admin token-verified media & CV uploads (`POST /api/admin/upload`).
  - Dynamic printable PDF CV generation (`GET /api/cv/download`).
  - Dynamic SEO endpoints (`GET /robots.txt`, `GET /sitemap.xml`).
- **Database & Authentication**: Firebase Firestore (with strict security rules in `firestore.rules`) & Firebase Authentication (Google Sign-In restricted to the authorized administrator account).

## Publishing on GitHub Pages

Because this app uses Vite, TypeScript, and React, **do not** set GitHub Pages source to "Deploy from a branch (`main / root`)"—that serves uncompiled TypeScript and results in a blank page.

Instead, use the included GitHub Actions workflow (`.github/workflows/deploy.yml`):

1. Push the repository to GitHub (`main` or `master`).
2. Open your repository on GitHub and go to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. The included workflow builds `dist/` with the exact repository `base` path, adds `.nojekyll` and `404.html` SPA routing fallback, and publishes automatically.
5. **Important for Admin Login (`/admin`)**: In your [Firebase Console](https://console.firebase.google.com/) → **Authentication → Settings → Authorized domains**, add `<your-username>.github.io` (and any custom domain) so Google Sign-In works on the published URL.

## Publishing on Vercel / Netlify / Render

- **Vercel**: Import the GitHub repository; `vercel.json` is preconfigured for Vite SPA routing (`npm run build`, output `dist`).
- **Full-Stack Node Hosting**: Set `NODE_ENV=production`, build with `npm run build`, and start with `npm start` (`node server.ts`).

## Local Development & Verification

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the full-stack development server (Express + Vite middleware on port `3000`):
   ```bash
   npm run dev
   ```
3. Run TypeScript & Vite production build verification:
   ```bash
   npm run lint
   npm run build
   ```
4. Start the production build:
   ```bash
   NODE_ENV=production npm start
   ```

## Administrator Setup (`/admin`)

- Navigate to `/admin/login` and sign in via Google using the configured `ADMIN_EMAIL`.
- On initial admin login, verified starter profile, services, skills, projects, experience, education, and award records are automatically seeded into Firestore if collections are empty.
- All public sections (Hero 3D/Effects toggles, Profile, About, Projects, Services, Skills, Statistics, Experience, Education, Certifications, Testimonials, Media Library, Messages, and SEO/Social Settings) can be edited directly in `/admin`.

## Security Notes

- Contact form messages write with strict validation (`POST /api/contact` on Node servers, or direct Firestore validated submission fallback on static GitHub Pages) and can only be read or managed by authenticated administrators in `/admin/messages`.
- Review `firestore.rules` before sharing or deploying publicly to ensure rules align with your deployment project and administrator email.
