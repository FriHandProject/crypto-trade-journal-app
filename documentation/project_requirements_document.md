# Project Requirements Document (PRD)

## 1. Project Overview

This mobile-first Crypto Trade Journal App is designed to help individual traders securely record, track, and analyze their cryptocurrency trades in one place. It provides a private, password-protected dashboard where users can log details like trading pair, entry/exit prices, P/L (profit and loss), attach screenshots of trade confirmations, and view performance charts over time. By replacing scattered spreadsheets and screenshots in your phone’s gallery, the app centralizes your trading history and delivers insights into your win/loss ratio, total trades, and net profitability.

The app is being built to streamline the habit of journaling trades—one of the best ways to learn from your successes and mistakes. Key objectives include:  
1. Strong security so each user’s data stays private.  
2. An intuitive, mobile-friendly interface that makes logging trades painless.  
3. Reliable screenshot uploads with cloud storage.  
4. Accurate analytics and charts that update in real time.  
5. A solid, extensible codebase so future features (like OCR or mobile apps) can be added without major rewrites.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (v1.0)**
- **User Authentication**: Email/password sign-up and sign-in using `better-auth` with secure session management.  
- **Protected Dashboard**: Only authenticated users can access their personal dashboard.  
- **Trade Data Model**: Drizzle ORM schema for a `trades` table (fields: `userId`, `date`, `tradingPair`, `entryPrice`, `exitPrice`, `pnl`, `screenshotUrl`).  
- **API Endpoints**:  
  - `POST /api/trades`: Create a new trade.  
  - `GET /api/trades`: Fetch logged-in user’s trades.  
  - `POST /api/upload`: Upload screenshot to cloud storage (e.g., Vercel Blob or AWS S3) and return public URL.  
- **Frontend UI**: Dashboard page with  
  - A table or list of past trades.  
  - “Add Trade” button opening a modal form.  
  - Performance summary cards and charts using a library like Recharts.  
- **Image Storage**: Integration with Vercel Blob (or AWS S3) for storing screenshots.  
- **Development Environment**: Docker + Docker Compose to run Next.js and PostgreSQL locally.

**Out-of-Scope (Phase 2+)**
- OCR-based automatic extraction of trade data from screenshots.  
- Native mobile applications (iOS/Android).  
- Real-time data feeds or trading execution.  
- CSV export, social sharing, or public profiles.  
- Multi-currency conversions or fiat integrations.  
- Advanced AI-powered trading suggestions.

## 3. User Flow

When a new user arrives, they land on a welcome/login page where they can sign up with an email and password or log in if they already have an account. Upon successful authentication, the user is automatically redirected to their personal dashboard. This redirect happens client-side in Next.js (App Router) after `better-auth` verifies the session.

On the dashboard, the user sees a summary section (total trades, win/loss ratio, net P/L) at the top and a table or list of individual trade entries below. To record a new trade, they click the “Add Trade” button, which opens a modal form. The form collects date, trading pair, entry price, exit price, P/L (optional or calculated), and lets the user choose an image file. When the user hits “Save,” the app first uploads the image to `/api/upload`, receives its URL, then submits the trade data via `/api/trades`. After the server confirms the save, the client re-fetches the user’s trades and updates both the table and the summary charts.

## 4. Core Features

- **Authentication**  
  - Secure sign-up/sign-in with email and password.  
  - Session tokens and password hashing handled by `better-auth`.
- **Protected Dashboard**  
  - Route guard to ensure only logged-in users access `/dashboard`.
- **Trade Entry & Management**  
  - Add, view, and list trades with fields: date, pair, entry/exit price, P/L.  
  - Edit/Delete functionality (optional for v1).
- **Screenshot Upload**  
  - File picker in form.  
  - `/api/upload` endpoint to store images in cloud storage.  
- **Performance Analytics**  
  - Calculation of key metrics (total trades, win/loss ratio, net P/L).  
  - Charts for profit over time (using Recharts or similar).
- **API Layer**  
  - Next.js API Routes under `/app/api/` for trade and upload endpoints.  
  - Input validation, authentication checks.
- **Database Schema**  
  - `trades` table defined via Drizzle ORM.  
  - Foreign key relationship to `users` table.
- **Dev Environment**  
  - Docker Compose config spinning up Next.js server + PostgreSQL.
- **UI Library**  
  - `shadcn/ui` (Radix UI + Tailwind CSS) for accessible, customizable components.

## 5. Tech Stack & Tools

- **Frontend**  
  - Next.js (App Router) + React  
  - TypeScript for type safety  
  - shadcn/ui (Radix UI + Tailwind CSS)  
  - Recharts (or similar) for charts
- **Backend**  
  - Next.js API Routes  
  - `better-auth` for authentication
- **Database**  
  - PostgreSQL  
  - Drizzle ORM (type-safe schema definitions)
- **Storage**  
  - Vercel Blob (preferred) or AWS S3 for screenshots
- **Containerization**  
  - Docker & Docker Compose
- **Testing (Recommendations)**  
  - Playwright or Cypress for end-to-end flows  
  - Jest/React Testing Library for unit tests

## 6. Non-Functional Requirements

- **Performance**  
  - Dashboard page should load in under 2 seconds on a 4G connection.  
  - `GET /api/trades` responses under 200ms; `POST` under 500ms (excluding file upload time).
- **Security**  
  - All traffic over HTTPS.  
  - Passwords hashed with a modern algorithm (e.g., bcrypt).  
  - CSRF protection on form submissions.  
  - Sanitization of all user inputs to prevent XSS/SQL injection.
- **Usability & Accessibility**  
  - Mobile-first, responsive design.  
  - All interactive elements keyboard-navigable, ARIA attributes for screen readers.
- **Scalability**  
  - Support at least 1,000 concurrent users in the first year.  
  - Database indexes on userId and date fields for fast queries.
- **Reliability**  
  - 99.9% uptime in production.  
  - Graceful error handling with user-friendly messages.

## 7. Constraints & Assumptions

- The project will be deployed on Vercel, leveraging Vercel Blob for storage.  
- PostgreSQL is provisioned either via Docker Compose (dev) or a managed service (prod).  
- Drizzle ORM migrations (`drizzle-kit`) must be run whenever schema changes.  
- No real-time WebSocket communication is needed in v1.  
- Assume the user has a modern browser (Chrome, Safari, Firefox) with JavaScript enabled.

## 8. Known Issues & Potential Pitfalls

- **Large Image Uploads**: Uploading multi-megabyte screenshots can be slow or hit size limits. Mitigation: implement client-side image compression and enforce a max file size (e.g., 5 MB).
- **API Rate Limits**: If using a third-party storage service, watch for rate limits on upload endpoints. Consider exponential backoff and retry logic.
- **Database Migration Conflicts**: If multiple branches define new Drizzle schemas, conflicts may arise. Mitigation: adopt a clear migration versioning strategy.
- **Error Handling Complexity**: Multi-step form submission (upload then data save) can fail mid-process. Mitigation: implement transactional cleanup or rollback of orphaned uploads.
- **CORS & Security Headers**: Ensure CORS is configured correctly on API routes and that security headers (Content-Security-Policy) are in place.

---

This PRD serves as the single source of truth for all subsequent technical documentation: tech stack choices, frontend guidelines, backend architecture, database schema, file structure, and IDE-specific rules. All details here are explicitly defined to eliminate guesswork and ensure the AI model can generate consistent, accurate code artifacts.