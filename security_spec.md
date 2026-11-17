# Security Specification & Hardened Rule Audit

## 1. Data Invariants
1. **Admin Authority**: Only verified administrators (`request.auth.token.email_verified == true` and either the bootstrapped owner email or a document in `/admins/{uid}`) may write, update, delete, or view draft records across portfolio collections.
2. **Public Draft Isolation**: Unauthenticated visitors and non-admin users may only `get` or `list` records whose `status == 'published'` on draftable collections (`services`, `skills`, `statistics`, `experiences`, `education`, `projects`, `certifications`, `achievements`, `testimonials`), enforced directly in Firestore rules via `resource.data.status == 'published'`.
3. **Contact Message PII Isolation**: `/contact_messages/{msgId}` may NEVER be read, listed, updated, or deleted by unauthenticated or non-admin users. Public `create` is strictly constrained to validated fields (`status == 'unread'`, `createdAt == request.time`, `updatedAt == request.time`, strict `hasOnly`, bounded lengths).
4. **Admin List Isolation**: `/admins/{adminId}` and `/media_assets/{assetId}` are readable and writable exclusively by verified administrators.
5. **Path ID Hardening**: All single-document operations validate `isValidId(id)` (`^[a-zA-Z0-9_-]+$`, `<= 128` chars) to block oversized or malformed document IDs.
6. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps on client writes must equal `request.time`, and `createdAt` is immutable on updates.

## 2. Dirty Dozen Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Admin Write**: `create /projects/hacked` with `auth: null`.
2. **Email Spoof (Unverified Admin Email)**: `update /profiles/main` with `auth: { email: 'creative.nabiul@gmail.com', email_verified: false }`.
3. **Non-Admin Authenticated Write**: `create /services/fake` with `auth: { uid: 'attacker1', email: 'other@example.com', email_verified: true }`.
4. **Public Read of Contact Messages**: `list /contact_messages` or `get /contact_messages/msg1` with `auth: null`.
5. **Public Read of Draft Project**: `get /projects/secret-draft` where `resource.data.status == 'draft'` with `auth: null`.
6. **Public Unfiltered List of Projects**: `list /projects` without `where('status', '==', 'published')` with `auth: null`.
7. **Shadow Field Injection on Contact Message**: `create /contact_messages/m1` with `isAdmin: true` or extra key `bypass: true`.
8. **Pre-Marked Read Contact Message**: `create /contact_messages/m1` with `status: 'read'` (must be `'unread'`).
9. **Spoofed Timestamp on Contact Message**: `create /contact_messages/m1` with `createdAt: '2020-01-01T00:00:00Z'` instead of `request.time`.
10. **Denial-of-Wallet Oversized Contact Message**: `create /contact_messages/m1` with `message` length `10000` (> `3000`).
11. **ID Poisoning**: `create /contact_messages/invalid$id*with!junk` violating `^[a-zA-Z0-9_-]+$`.
12. **Privilege Self-Escalation**: `create /admins/attacker1` with `auth: { uid: 'attacker1', email_verified: true }` trying to grant self `role: 'super_admin'`.
