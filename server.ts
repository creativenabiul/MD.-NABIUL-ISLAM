import fs from 'node:fs';
import path from 'node:path';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { z } from 'zod';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const firebaseConfig = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf8')
) as {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
};

dotenv.config({ quiet: true });

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'creative.nabiul@gmail.com';

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const adminAuth = getAuth();
const app = express();

// Trust proxy headers in Cloud Run
app.set('trust proxy', 1);

// Basic security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '18mb' }));

// Ensure upload directories exist
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));
app.use('/media', express.static(path.resolve(process.cwd(), 'public', 'media')));

// Sliding-window IP rate limiter
const rateBuckets = new Map<string, number[]>();
function isRateLimited(key: string, maxHits: number, windowMs: number): boolean {
  const now = Date.now();
  const prev = rateBuckets.get(key) || [];
  const active = prev.filter((ts) => now - ts < windowMs);
  if (active.length >= maxHits) {
    rateBuckets.set(key, active);
    return true;
  }
  active.push(now);
  rateBuckets.set(key, active);
  return false;
}

function sanitizePlainText(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100, 'Name is too long'),
  email: z.string().trim().email('Please provide a valid email address').max(150),
  subject: z.string().trim().min(2, 'Please enter a subject').max(160),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(3000),
  website: z.string().max(200).optional().default(''),
});

// Secure Contact Form Endpoint
app.post('/api/contact', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(`contact:${ip}`, 5, 15 * 60 * 1000)) {
    return res.status(429).json({
      ok: false,
      message: 'Too many requests. Please wait a few minutes before sending another inquiry.',
    });
  }

  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      message: parsed.error.issues[0]?.message || 'Please check your form entries and try again.',
    });
  }

  // Honeypot check: silently acknowledge without persisting spam
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return res.status(200).json({
      ok: true,
      message: 'Thank you. Your inquiry has been received.',
    });
  }

  const cleanName = sanitizePlainText(parsed.data.name);
  const cleanEmail = sanitizePlainText(parsed.data.email).toLowerCase();
  const cleanSubject = sanitizePlainText(parsed.data.subject);
  const cleanMessage = sanitizePlainText(parsed.data.message);

  try {
    const docId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    const docPath = `projects/${firebaseConfig.projectId}/databases/${databaseId}/documents/contact_messages/${docId}`;
    const commitUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${databaseId}/documents:commit?key=${encodeURIComponent(firebaseConfig.apiKey)}`;

    const firestoreResp = await fetch(commitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: docPath,
              fields: {
                name: { stringValue: cleanName },
                email: { stringValue: cleanEmail },
                subject: { stringValue: cleanSubject },
                message: { stringValue: cleanMessage },
                status: { stringValue: 'unread' },
              },
            },
            updateTransforms: [
              { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
              { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
            ],
          },
        ],
      }),
    });

    if (!firestoreResp.ok) {
      const errText = await firestoreResp.text();
      console.error('Firestore contact write rejected:', errText);
      return res.status(500).json({
        ok: false,
        message: 'Unable to send your message right now. Please try again shortly.',
      });
    }

    return res.status(201).json({
      ok: true,
      message: 'Thank you. Your inquiry has been received.',
    });
  } catch (error) {
    console.error('Contact endpoint error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Unable to send your message right now. Please try again shortly.',
    });
  }
});

// Auth Middleware for Admin API Routes
interface AuthedRequest extends Request {
  adminEmail?: string;
  adminUid?: string;
}

async function requireAdminAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const ip = req.ip || 'unknown';
  if (isRateLimited(`admin:${ip}`, 80, 60 * 1000)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.email_verified || decoded.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
    }
    req.adminEmail = decoded.email;
    req.adminUid = decoded.uid;
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ error: 'Unauthorized: Invalid session token' });
  }
}

// Server-side Session Verification Check
app.get('/api/admin/verify-session', requireAdminAuth, (req: AuthedRequest, res: Response) => {
  return res.json({
    ok: true,
    email: req.adminEmail,
    uid: req.adminUid,
  });
});

const uploadSchema = z.object({
  filename: z.string().min(1).max(160),
  mimeType: z.string().min(3).max(100),
  dataBase64: z.string().min(4),
  folder: z.string().max(60).optional(),
});

const ALLOWED_MIME_PREFIXES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
];

function sanitizeSvgBuffer(inputBuffer: Buffer): Buffer | null {
  const raw = inputBuffer.toString('utf8');
  if (!/<svg[\s>]/i.test(raw)) {
    return null;
  }
  const cleaned = raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<(iframe|object|embed|applet|meta|link)[\s\S]*?>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|applet|meta|link)[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked:');
  return Buffer.from(cleaned, 'utf8');
}

// Authenticated Media / CV Upload Endpoint
app.post('/api/admin/upload', requireAdminAuth, (req: AuthedRequest, res: Response) => {
  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid upload payload' });
  }

  const { filename, mimeType, dataBase64, folder } = parsed.data;
  if (!ALLOWED_MIME_PREFIXES.includes(mimeType)) {
    return res.status(400).json({ error: 'Unsupported file type. Allowed: JPG, PNG, WebP, AVIF, SVG, MP4, WebM, PDF.' });
  }

  const rawBase64 = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
  let buffer: Buffer = Buffer.from(rawBase64, 'base64');

  if (mimeType === 'image/svg+xml') {
    const sanitized = sanitizeSvgBuffer(buffer);
    if (!sanitized) {
      return res.status(400).json({ error: 'Invalid SVG file: missing <svg> root element.' });
    }
    buffer = sanitized;
  }

  const maxBytes = mimeType.startsWith('video/') ? 15 * 1024 * 1024 : 8 * 1024 * 1024;
  if (buffer.byteLength === 0 || buffer.byteLength > maxBytes) {
    return res.status(400).json({ error: 'File exceeds allowed size limit.' });
  }

  const safeExt = path.extname(filename).replace(/[^a-zA-Z0-9.]/g, '').toLowerCase() || '.bin';
  const safeBase = path
    .basename(filename, path.extname(filename))
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 48) || 'asset';
  const finalName = `${safeBase}-${Date.now()}${safeExt}`;
  const targetPath = path.join(uploadsDir, finalName);

  fs.writeFileSync(targetPath, buffer);

  const assetType = mimeType.startsWith('video/')
    ? 'video'
    : mimeType === 'application/pdf'
    ? 'document'
    : 'image';

  return res.status(201).json({
    url: `/uploads/${finalName}`,
    filename: finalName,
    mimeType,
    sizeBytes: buffer.byteLength,
    type: assetType,
    folder: folder ? sanitizePlainText(folder).slice(0, 50) : 'general',
  });
});

app.delete('/api/admin/upload', requireAdminAuth, (req: AuthedRequest, res: Response) => {
  const urlParam = typeof req.query.url === 'string' ? req.query.url : '';
  if (!urlParam.startsWith('/uploads/')) {
    return res.status(400).json({ error: 'Invalid asset path' });
  }
  const safeName = path.basename(urlParam);
  const fullPath = path.join(uploadsDir, safeName);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
  return res.json({ ok: true });
});

// Dynamic Printable Resume / CV PDF Generator (Fallback when custom PDF isn't uploaded)
function buildMinimalPdfBuffer(lines: string[]): Buffer {
  const escaped = lines.map((l) => l.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'));
  let textOps = 'BT\n/F1 18 Tf\n54 750 Td\n';
  escaped.forEach((line, idx) => {
    if (idx === 0) {
      textOps += `(${line}) Tj\n/F1 10 Tf\n0 -22 Td\n`;
    } else {
      textOps += `(${line}) Tj\n0 -16 Td\n`;
    }
  });
  textOps += 'ET';

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(textOps, 'utf8')} >>\nstream\n${textOps}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

app.get('/api/cv/download', (_req: Request, res: Response) => {
  const cvLines = [
    'MD. NABIUL ISLAM',
    'Graphic Designer | Digital Marketer | AI Automation Enthusiast | Chemistry Student',
    'Location: Kanchipara, Fulchhari, Gaibandha, Rangpur, Bangladesh',
    'Email: nabi_ul@yahoo.com  |  Phone: 01795110021',
    'Availability: Available for freelance projects and full-time opportunities.',
    ' ',
    'PROFILE SUMMARY',
    'I transform creative ideas into meaningful digital experiences through graphic design,',
    'strategic marketing, and intelligent automation. I combine visual creativity with',
    'technology to help brands communicate better, grow faster, and work smarter.',
    ' ',
    'CORE SERVICES & CAPABILITIES',
    '- Graphic Design: Brand identity, logo design, social media graphics, ad creatives, mockups',
    '- Social Media Strategy: Content planning, campaign strategy, optimization, brand voice',
    '- AI for Marketing & AI Automation: n8n workflows, APIs, webhooks, email & Telegram bots',
    '- Web Analytics & Training: Tracking, performance dashboards, design & AI fundamentals',
    ' ',
    'EXPERIENCE & TRAINING',
    '- Graphic Design for Freelancing | Uttarbanga Engineering Institute (ASSET Program Level 3)',
    '- Basic Computer Operation & Graphic Design | Gaibandha Govt. Technical School & College',
    '- Teacher (Classes 5-10 Tuition Mentor) | RABS Coaching Centre',
    ' ',
    'EDUCATION',
    '- B.Sc (Honours) in Chemistry | Gaibandha Government College',
    '- Higher Secondary Certificate (Science) | Gaibandha Adarsha College',
    '- Secondary School Certificate (Science) | Kanchipara Mohammad Ali United Academy',
    '- Junior School Certificate | Kanchipara Mohammad Ali United Academy',
    '- Primary School Certificate | Medhakunja Vidda Niketon',
    ' ',
    'ACHIEVEMENTS',
    '- Creative Talent Exploration Competition (2018): 1st (School) & 2nd (Upazila) - Jr. Secondary',
    '- Leadership: Elected Class Captain in Classes 2, 3, 6, 7, and 9',
  ];

  const pdfBuffer = buildMinimalPdfBuffer(cvLines);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="Md_Nabiul_Islam_CV.pdf"');
  res.send(pdfBuffer);
});

// SEO: Robots.txt & Sitemap.xml
app.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${baseUrl}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', async (req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const urls = ['/', '/about', '/projects', '/contact'];

  try {
    const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
    const listUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${databaseId}/documents/projects?pageSize=100&key=${encodeURIComponent(firebaseConfig.apiKey)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(listUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (resp.ok) {
      const json = (await resp.json()) as {
        documents?: Array<{
          fields?: {
            slug?: { stringValue?: string };
            status?: { stringValue?: string };
          };
        }>;
      };
      for (const docItem of json.documents || []) {
        const slugVal = docItem.fields?.slug?.stringValue;
        const statusVal = docItem.fields?.status?.stringValue;
        if (slugVal && statusVal === 'published') {
          urls.push(`/projects/${encodeURIComponent(slugVal)}`);
        }
      }
    }
  } catch {
    // Non-blocking fallback to static routes
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${baseUrl}${u}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u === '/' ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
  res.type('application/xml').send(xml);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
