# Frontend Guideline Document for crypto-trade-journal-app

This document outlines the frontend architecture, design principles, styling, component structure, state management, routing, performance optimizations, testing strategies, and overall summary for the crypto-trade-journal-app. It is written in clear, everyday language so anyone—technical or not—can understand how the frontend is set up and why.

## 1. Frontend Architecture

### Frameworks and Libraries
- **Next.js (App Router)**: Provides file-based routing, server-side rendering (SSR), and API routes in a single project. This lets us co-locate pages, data fetching, and backend logic for trade entries and file uploads.
- **React**: The core UI library for building components and handling state with hooks.
- **TypeScript**: Adds type safety across frontend code, reducing bugs and making maintenance easier.
- **Tailwind CSS**: A utility-first CSS framework for fast, consistent styling without writing custom CSS classes.
- **shadcn/ui & Radix UI**: A collection of accessible, headless UI components (buttons, dialogs, tables) that we style with Tailwind.

### Scalability, Maintainability, Performance
- **Scalability**: Modular files and folders (pages, components, API routes) make it easy to add new features like charts or OCR endpoints without clutter.
- **Maintainability**: TypeScript and clearly named components help developers understand and update code quickly.
- **Performance**: Next.js handles code splitting by route, and Tailwind’s utility classes avoid large CSS bundles. We can also use Next.js image optimization and lazy loading for heavy components.

## 2. Design Principles

- **Usability**: A simple, clean interface ensures users can log trades with minimal clicks. Key actions like “Add Trade” are prominent.
- **Accessibility**: Using Radix-based components ensures keyboard navigation and screen reader support out of the box.
- **Responsiveness**: Mobile-first design makes the app look great on phones and scales up to desktops seamlessly.
- **Consistency**: A shared design system (colors, fonts, components) means every part of the app feels unified.
- **Feedback**: Loading states, error messages, and success toasts guide the user through actions like uploading screenshots.

## 3. Styling and Theming

### Styling Approach
- **Utility-First CSS**: Tailwind CSS is used throughout. We avoid custom CSS files by composing small utility classes (for padding, colors, layout).
- **Component Styling**: Each shadcn/ui component is styled via Tailwind classes, ensuring a predictable and consistent look.

### Theming
- We define colors, font sizes, and spacing in `tailwind.config.js`. This central theme file controls the entire appearance.
- Dark mode can be enabled by adding the `dark` class on the `<html>` element and styling tailwind utilities accordingly.

### Visual Style
- **Overall Style**: Modern, flat design with slight glassmorphism accents on cards (using semi-transparent backgrounds + blur).
- **Color Palette**:
  - Primary: #2D9CDB (blue)
  - Secondary: #27AE60 (green)
  - Accent: #F2994A (orange)
  - Neutral Light: #F2F2F2 (light gray)
  - Neutral Dark: #333333 (dark gray)

### Typography
- **Font Family**: Inter, a clean and versatile sans-serif font for digital interfaces.
- **Font Sizes**: Defined in Tailwind’s theme (e.g., `text-sm`, `text-base`, `text-lg`, `text-xl`).

## 4. Component Structure

- **Atomic Components**: Basic building blocks live in `components/ui/` (Button, Card, Dialog, Input, Table).
- **Feature Components**: Pages or complex UI pieces (AddTradeForm, PerformanceChart) live alongside or under `components/` to show domain grouping.
- **Reusability**: Each component accepts props for customization (e.g., `<Button variant="primary" size="lg" />`). This avoids duplication.
- **Folder Organization**:
  ```
  components/
    ui/           # reusable UI primitives
    AddTradeForm/ # form component + subcomponents
    PerformanceChart/ # chart wrapper
  app/
    dashboard/    # dashboard page and layout
    api/          # API routes (trades, upload)
  ```

## 5. State Management

- **Local State**: React’s `useState` and `useReducer` for form fields and UI toggles.
- **Context API**: A custom `AuthContext` shares authentication status and user info across the app.
- **Data Fetching**: `useEffect` with `fetch` calls to `/api/trades` and `/api/upload`. In future, we can introduce SWR or React Query for caching and background revalidation.

## 6. Routing and Navigation

- **File-Based Routing**: Next.js App Router in `app/`. Each folder under `app/` maps to a URL.
  - `/`: Landing or sign-in page
  - `/dashboard`: Protected dashboard (requires auth)
  - `/api/trades`: REST endpoint for creating/fetching trades
  - `/api/upload`: Endpoint for handling screenshot uploads
- **Protected Routes**: A layout or middleware checks auth (via `better-auth`) and redirects unauthenticated users to `/`.
- **Navigation Components**: Use `next/link` for client-side transitions and `<nav>` with `<ul>`/`<li>` lists styled via Tailwind.

## 7. Performance Optimization

- **Code Splitting**: Next.js automatically splits code per page. Heavy components (like charts) can be asynchronously loaded with `next/dynamic`.
- **Lazy Loading**: Use `next/image` for screenshots and trade images; it generates optimized formats and lazy-loads by default.
- **Asset Optimization**: Tailwind’s JIT compiler ensures only used CSS classes are included in production builds.
- **Caching**: API responses for trade data can be cached at the edge or via HTTP headers to reduce repeat fetches.

## 8. Testing and Quality Assurance

- **Unit Tests**: Jest + React Testing Library for components and utility functions (e.g., P/L calculations).
- **Integration Tests**: Test form submission flows by rendering the dashboard and mocking fetch calls.
- **End-to-End Tests**: Cypress or Playwright to simulate real user flows—sign in, add a trade with screenshot upload, view analytics.
- **Linting & Formatting**: ESLint with TypeScript rules and Prettier for consistent code style.
- **CI/CD Integration**: Run tests and lint checks on each pull request via GitHub Actions.

## 9. Conclusion and Overall Frontend Summary

This crypto-trade-journal-app frontend is built on Next.js, React, and TypeScript, with Tailwind CSS and shadcn/ui providing a robust, accessible, and customizable UI foundation. Key design principles—usability, accessibility, responsiveness, and consistency—guide every decision. The component-based structure and clear folder organization make the code easy to scale and maintain. State is managed simply with hooks and context, while Next.js routing keeps navigation and API logic co-located.

Performance is optimized through code splitting, lazy loading, and Tailwind’s JIT compiler. Testing spans unit, integration, and end-to-end suites to ensure reliability. Together, these guidelines give a clear roadmap for any developer or stakeholder to understand, extend, and maintain the frontend, empowering the team to focus on delivering core features like trade logging, analytics, and screenshot-based OCR in the future.

---

Feel free to refer back to this document whenever you need clarity on the frontend setup, and use it as a checklist as you build out new features.