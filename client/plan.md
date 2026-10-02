# Techtonix frontend implementation plan

## Scope

A responsive React + Vite frontend for Techtonix, preserving the editorial civic-tech visual system while separating the UI into reusable components, pages, utilities, and authentication context. The browser uses only public Vite variables. Posts and AI analysis are ready to connect through an Express API; local mock data remains available so the preview is useful before backend deployment.

## Design direction

- **Design movement:** Editorial civic-tech with a warm paper surface, high-contrast ink, and precise dashboard-like information density.
- **Core principles:** signal before chrome; human warmth with operational clarity; one clear action per surface; trust is visible but never noisy.
- **Color philosophy:** Ink navy carries credibility; warm shell and cream surfaces feel local and human; electric lime is the ownable action color; category colors index opportunities, issues, lost/found, and events.
- **Layout paradigm:** Split editorial canvas: the feed is the reading rail and the map is the location-intelligence rail. Mobile stacks discovery first, then map and trust context.
- **Signature elements:** lime signal dot/underline, small all-caps metadata labels, and a map grid with category-colored pins.
- **Interaction philosophy:** browsing is public and low-friction; create is explicitly protected; AI suggestions remain editable; validation and resolve actions explain their effect.
- **Animation:** quick ease-out card lift, subtle map pin motion, shimmer only for AI progress, and no decorative motion that competes with content.
- **Typography:** Fraunces for editorial headings and DM Sans for UI, labels, and data.
- **Brand essence:** a local signal layer that helps communities share useful information while it is actionable. Personality: clear, neighbourly, capable.
- **Brand voice:** direct, specific, optimistic. Example lines: “Know what’s moving around you.” and “Turn a messy moment into a useful signal.”
- **Wordmark & logo:** lowercase wordmark paired with a compact two-bar signal mark, recreated in CSS and SVG.
- **Signature brand color:** Techtonix lime `#D7F36B`.

## Project structure

- `src/App.jsx`: BrowserRouter, shared shell, route metadata, global mock post state, consent, and notifications.
- `src/main.jsx`: React entry point.
- `src/components/`: Navbar, Footer, buttons, inputs, loading/error/empty states, search/filter controls, post cards/lists, map, AI analysis, post form/preview, cookie consent, and ProtectedRoute.
- `src/pages/`: Home, CreatePost, PostDetails, Login, Signup, Privacy, Terms, and NotFound route screens.
- `src/context/AuthContext.jsx`: Supabase session, user, auth state changes, signup, login, Google OAuth seam, and logout.
- `src/lib/supabase.js`: one browser-safe Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `src/lib/api.js`: centralized Express API helper with `Authorization: Bearer <access_token>` when a Supabase session exists.
- `src/lib/validation.js`: auth and post validation helpers.
- `src/lib/analytics.js`: non-blocking page-view/event seam that filters sensitive property names.
- `src/mockData.js`, `src/utils/`: shared demo posts, categories, date formatting, and category helpers.
- `src/styles.css`: the existing Techtonix visual system, responsive layouts, states, forms, map treatment, and accessibility states.
- `public/manus-routes.json`: complete managed-preview page route manifest.
- `public/robots.txt`, `public/sitemap.xml`, `public/favicon.svg`, `public/social-preview.svg`: public metadata and crawl assets.
- `.env.example`: public browser-safe variable contract only.

## Runtime and backend seams

- Required public variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_API_URL`.
- Optional `VITE_SUPABASE_GOOGLE_ENABLED=true` exposes Continue with Google only when the provider is configured in Supabase.
- React never calls Gemini directly. AI analysis calls `POST /api/ai/analyze-post` through `src/lib/api.js` when `VITE_API_URL` is configured; otherwise a clearly local/demo heuristic keeps the preview usable.
- Protected Express calls receive the current Supabase access token; the backend remains the source of truth for authorization and rate limiting.
- No service-role keys, Gemini keys, private keys, or hardcoded bearer tokens belong in the frontend.
