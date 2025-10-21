# Backend Structure Document for Crypto Trade Journal App

## 1. Backend Architecture

This section describes how the backend is organized, the frameworks in use, and how the design supports key goals like scalability, maintainability, and performance.

Overview
- The app is built on **Next.js** using its App Router. This lets us colocate frontend pages and backend API routes within a single project.
- **TypeScript** is used throughout for type safety, reducing runtime errors and making the code easier to maintain.
- **Design patterns**:
  - **Modular Routes**: Each API feature lives in its own folder under `/app/api`, making it easy to add or modify endpoints without affecting unrelated parts.
  - **Layered Logic**: We separate request handling (Next.js routes), business logic (utility functions in `/lib`), and data access (Drizzle ORM models in `/db/schema`).

How it supports key goals
- **Scalability**: Serverless functions (via Vercel or a similar host) scale automatically with request volume. Database connections are managed efficiently by the ORM.
- **Maintainability**: Clear folder structure and TypeScript types help new developers onboard quickly and reduce bugs when extending features.
- **Performance**: Co-located API routes reduce network overhead. Built-in CDN (if deployed on Vercel) caches static assets and API responses when appropriate.

## 2. Database Management

We use PostgreSQL as our primary data store, accessed via Drizzle ORM.

Database technology
- **Type**: Relational (SQL) database
- **System**: PostgreSQL
- **ORM**: Drizzle ORM for type-safe schema definition and queries

Data structure and access patterns
- **Users**: Stored in a `users` table managed by the authentication library (`better-auth`).
- **Trades**: Stored in a `trades` table with a foreign key to `users`. Fields include date, trading pair, prices, P/L, and screenshot URL.
- **Access**:
  - Read operations use indexed columns (like `user_id`) to fetch only the authenticated user’s data.
  - Write operations validate data server-side before inserting to ensure data integrity.

Data management practices
- **Migrations**: We use `drizzle-kit` to generate and apply database migrations, ensuring schema changes are versioned and repeatable.
- **Backups**: Regular database backups to a secure storage location (for example, AWS S3 or built-in cloud provider snapshots).
- **Connection pooling**: Handled by the host or custom pooling library to prevent exhausting database connections.

## 3. Database Schema

Below is the PostgreSQL schema in SQL for the main tables. It’s presented in a human-readable format.

Users Table (managed by better-auth)
- id: UUID (primary key)
- email: string (unique)
- password_hash: string
- created_at: timestamp

Trades Table (defined by us)
- id: UUID (primary key)
- user_id: UUID (foreign key to users.id)
- trade_date: timestamp
- trading_pair: text
- entry_price: numeric
- exit_price: numeric
- profit_loss: numeric
- screenshot_url: text (optional)
- created_at: timestamp

SQL Schema Definition
```
-- Users table created by authentication library
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table for storing journal entries
CREATE TABLE trades (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_date TIMESTAMPTZ NOT NULL,
  trading_pair TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC NOT NULL,
  profit_loss NUMERIC NOT NULL,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index to speed up lookups by user
CREATE INDEX idx_trades_user_id ON trades(user_id);
```  

## 4. API Design and Endpoints

The backend exposes RESTful API routes under `/app/api` in Next.js. All routes return JSON and expect a valid user session.

Key Endpoints

1. **GET /api/trades**
   - Purpose: Fetch all trades for the logged-in user.
   - Input: Session cookie or token.
   - Output: Array of trade objects.

2. **POST /api/trades**
   - Purpose: Create a new trade entry.
   - Input: JSON body containing trade_date, trading_pair, entry_price, exit_price, profit_loss, screenshot_url.
   - Validation: Server-side checks for required fields and data types.
   - Output: Created trade object or error message.

3. **POST /api/upload**
   - Purpose: Handle image uploads for screenshots.
   - Input: Multipart form data with file.
   - Processing: Upload to cloud storage (e.g., Vercel Blob or AWS S3).
   - Output: URL of the stored image.

How they work together
- The frontend’s “Add Trade” form first hits `/api/upload`. Once it receives the image URL, it sends all trade details to `/api/trades`.
- After creating a trade, the frontend calls `GET /api/trades` to refresh the dashboard data.

## 5. Hosting Solutions

We recommend deploying on **Vercel** for simplicity and cost-effectiveness, but other cloud providers (AWS, Google Cloud) work just as well.

Chosen Environment: Vercel (Serverless Functions + CDN)

Benefits
- **Reliability**: Automatic scaling of serverless functions ensures uptime during traffic spikes.
- **Scalability**: Functions spin up on demand, so there’s no need to manage servers manually.
- **Cost-effectiveness**: Pay-as-you-go billing means low cost when traffic is low and you only pay for what you use.
- **Integration**: Built-in support for Next.js projects, including environment variables and secret management.

Alternative: AWS (API Gateway + Lambda + RDS)
- Roughly similar benefits but requires more setup and operational overhead.

## 6. Infrastructure Components

Beyond the application code and database, the following services help deliver a fast and reliable user experience.

Load Balancing and CDN
- **CDN**: Vercel’s global CDN caches static assets (JavaScript, CSS, images) close to end users.
- **Edge Functions** (optional): Run API routes at the edge for ultra-low latency.

Caching
- **HTTP caching**: Use cache headers on read-only API responses (e.g., GET /api/trades) when data is infrequently updated.
- **In-memory store** (optional): Redis can be introduced later for session caching or rate-limiting.

File Storage
- **Vercel Blob** or **AWS S3** for storing uploaded screenshots securely.
- Files served directly from the storage provider’s CDN.

Logging and Error Tracking
- **Built-in Vercel logs** for request tracking.
- **Sentry** (recommended) for application error monitoring and performance tracing.

## 7. Security Measures

Protecting user data is critical. Here’s how we secure the backend.

Authentication & Authorization
- **better-auth** handles sign-up, sign-in, password hashing, session management, and token storage.
- All API routes validate the session before processing requests.

Data Encryption
- **In transit**: All requests use HTTPS.
- **At rest**: Database encryption provided by the cloud provider (e.g., AWS RDS encryption) and secure object storage buckets.

Input Validation and Sanitization
- All incoming data is validated with server-side checks.
- ORM queries use parameterized statements to prevent SQL injection.

Access Controls
- ACLs on file storage buckets ensure only authenticated users can upload; public read rules apply only to the final screenshot URLs.

Compliance
- Adhere to GDPR principles by allowing users to delete their account and associated data.

## 8. Monitoring and Maintenance

To keep the backend healthy and performant, we use the following tools and practices.

Monitoring Tools
- **Vercel Analytics**: Real-time traffic and latency insights for serverless functions.
- **Sentry**: Tracks uncaught exceptions, slow requests, and performance bottlenecks.
- **Database Monitoring**: PostgreSQL dashboard (e.g., AWS RDS console) for CPU, connections, and query performance.

Maintenance Strategies
- **Automated Migrations**: Use CI/CD pipelines to run `drizzle-kit` migrations on each deploy.
- **Dependency Updates**: Regularly update Node.js, Next.js, and other libraries to patch vulnerabilities.
- **Backups and Recovery**: Daily automated database backups with retention policy, periodic restore drills.
- **Load Testing**: Periodic load tests to validate scaling behavior and estimate costs under peak usage.

## 9. Conclusion and Overall Backend Summary

This backend structure delivers a secure, scalable, and maintainable foundation for the Crypto Trade Journal App. By leveraging Next.js serverless functions, PostgreSQL with Drizzle ORM, and modern cloud hosting, we ensure:

- **Developer Productivity**: TypeScript, clear folder structure, and built-in auth speed up feature development.
- **User Trust**: Strong security practices around authentication, encryption, and data validation protect sensitive trade records.
- **Performance & Scalability**: Serverless functions and CDN caching deliver low-latency experiences worldwide at predictable costs.

Unique aspects include the seamless integration of cloud storage for screenshots, co-located API routes in Next.js, and type-safe database interactions with Drizzle. This setup not only meets the project’s immediate needs but also lays a robust groundwork for advanced features like OCR-based trade entry and real-time analytics.