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
- Empty optional sections (e.g., Statistics, Certifications, Testimonials) remain hidden on the public portfolio until published entries are added.

## Security Notes

- Contact form messages are write-only via `POST /api/contact` with server-side validation, spam honeypot filtering, and IP rate limiting; only authenticated administrators can read or update messages in `/admin/messages`.
- Review `firestore.rules` before sharing or deploying publicly to ensure rules align with your deployment project and administrator email.
