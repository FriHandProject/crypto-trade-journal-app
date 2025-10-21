# Security Guidelines for crypto-trade-journal-app

This document provides actionable security guidance tailored to the **crypto-trade-journal-app**. By following these recommendations, you will ensure strong protection of user data, resilient infrastructure, and overall application integrity.

---

## 1. Security by Design

- **Embed security early**: Integrate these controls during feature development (e.g., trade logging, file uploads, analytics), not as an afterthought.
- **Threat modeling**: Identify critical assets (user credentials, trade data, screenshots) and assess risks (data leakage, injection, unauthorized access) before adding new functionality.
- **Secure defaults**: Wherever possible, enable strict settings out-of-the-box (e.g., secure cookies, strict CORS, least-privilege database roles).

## 2. Authentication & Access Control

- **Better-auth configuration**:
  - Enforce strong password policies (minimum 12 characters, mix of upper/lowercase, digits, symbols).
  - Use bcrypt or Argon2 with unique salts for password hashing.
  - Enable multi-factor authentication (MFA) for high-privilege or sensitive operations (e.g., exporting journal data).
- **Session management**:
  - Set secure (`Secure`, `HttpOnly`, `SameSite=Strict`) attributes on session cookies.
  - Implement session timeouts (idle and absolute) and a logout endpoint that invalidates the session.
- **Role-Based Access Control (RBAC)**:
  - Define minimal roles (e.g., `user`, `admin`) and enforce server-side checks in Next.js API routes.
  - On each trade or upload API call, validate that the `userId` in the session matches the resource being accessed.

## 3. Input Handling & Processing

- **Server-side validation**:
  - Validate all request bodies in `/app/api/*/route.ts` using a schema validator (e.g., Zod or Joi).
  - Enforce data types and ranges for fields like `entryPrice`, `exitPrice`, `pnl`, and `tradingPair`.
- **Prevent injection**:
  - Use Drizzle ORM’s parameterized queries to avoid SQL injection.
  - Sanitize any user-generated strings (e.g., `tradingPair`) before displaying.
- **File upload checks**:
  - Restrict allowed MIME types (e.g., `image/jpeg`, `image/png`).
  - Enforce maximum file size (e.g., 5 MB).
  - Sanitize filenames and prevent path traversal.

## 4. Data Protection & Privacy

- **Encryption in transit**:
  - Serve the app over HTTPS (enforce TLS 1.2+).
  - Redirect HTTP to HTTPS and enable HSTS (`Strict-Transport-Security` header).
- **Encryption at rest**:
  - Ensure your PostgreSQL data directory is on encrypted volumes.
  - If using cloud storage (e.g., S3, Vercel Blob), enable server-side encryption (SSE).
- **Secrets management**:
  - Do **not** hardcode API keys, database credentials, or storage keys. Use environment variables and a secrets manager (e.g., AWS Secrets Manager, Vault).
- **Data minimization**:
  - Store only necessary user PII (e.g., email) and trade metadata.
  - Mask or redact logs to avoid leaking sensitive information.

## 5. File Upload Security

- **Store uploads outside webroot**:
  - If storing on your server, place uploads in a non-servable directory and use a signed URL for access.
- **Virus/malware scanning**:
  - Integrate a scanning step (e.g., ClamAV) before accepting files.
- **Access controls on storage**:
  - Set tight ACLs: user-specific containers/buckets or object prefixes.
  - Serve images via a protected proxy that verifies the user’s session.

## 6. API & Service Security

- **HTTPS-only API**:
  - Configure Next.js to reject non-TLS traffic.
- **Rate limiting & throttling**:
  - Protect endpoints (especially authentication and upload) with IP-based rate limits (e.g., `express-rate-limit` or Vercel edge rate limits).
- **CORS policy**:
  - Allow only your front-end origin(s) and disallow credentials sharing from unknown domains.
- **Versioning & deprecation**:
  - Namespace critical APIs under `/api/v1/` to enable safe evolution.

## 7. Web Application Security Hygiene

- **Security headers**:
  - Content-Security-Policy: restrict scripts/styles to self and trusted CDNs.
  - X-Frame-Options: `DENY` (prevent clickjacking).
  - X-Content-Type-Options: `nosniff`.
  - Referrer-Policy: `no-referrer-when-downgrade`.
- **CSRF protection**:
  - Use anti-CSRF tokens (e.g., `csrf` package) for all state-changing requests.
- **Secure client storage**:
  - Do not store tokens or PII in `localStorage` or `sessionStorage`.

## 8. Infrastructure & Configuration Management

- **Docker security**:
  - Run containers with non-root user.
  - Limit container capabilities and avoid mounting sensitive host paths.
- **Server hardening**:
  - Disable unused services, close unnecessary ports, and remove default accounts.
- **Automated patching**:
  - Keep the OS, Docker base images, Next.js, and dependencies up-to-date.

## 9. Dependency Management

- **Use lockfiles** (`package-lock.json`) to ensure deterministic builds.
- **Vet third-party packages**:
  - Avoid unmaintained or high-risk libraries.
  - Regularly run SCA tools (e.g., Snyk, GitHub Dependabot) to catch known CVEs.
- **Minimize footprint**:
  - Only include essential libraries (e.g., drop unused charting or utility packages).

## 10. Monitoring, Logging & Incident Response

- **Secure logging**:
  - Do not log sensitive data (passwords, tokens, PII).
  - Centralize logs in a protected service (e.g., AWS CloudWatch, ELK) with access controls and retention policies.
- **Health checks & alerts**:
  - Monitor error rates, latency, and suspicious activity (e.g., repeated failed logins).
- **Incident playbook**:
  - Define roles, communication channels, and remediation steps for potential breaches.

---

By following these guidelines, your **crypto-trade-journal-app** will adhere to modern security best practices, protecting both user data and application integrity throughout development and production.
