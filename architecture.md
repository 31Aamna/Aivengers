
Techtonix — Simplest Hackathon Architecture
                         ┌──────────────────────┐
                         │      React + Vite    │
                         │      Frontend        │
                         │                      │
                         │ Feed                 │
                         │ Create Post          │
                         │ AI Review            │
                         │ Search / Filters     │
                         │ Map                  │
                         └──────────┬───────────┘
                                    │
                         Supabase Auth session
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Node + Express     │
                         │      Backend         │
                         │                      │
                         │ Auth middleware      │
                         │ Post APIs            │
                         │ Vote/Validity APIs   │
                         │ Resolve/Report APIs  │
                         │ Gemini service       │
                         └───────┬───────┬──────┘
                                 │       │
                    ┌────────────┘       └──────────────┐
                    ▼                                   ▼
          ┌───────────────────┐               ┌─────────────────┐
          │ Supabase          │               │ Gemini API      │
          │ PostgreSQL        │               │                 │
          │                   │               │ Post structuring│
          │ profiles          │               │                 │
          │ posts             │               └─────────────────┘
          │ votes             │
          │ validity          │
          │ reports           │
          └───────────────────┘
The key architectural rule

React talks to Express for application data. Express talks to Supabase and Gemini.

Don't create a complicated chain of services.

1. Component Architecture

Keep it to roughly five frontend areas and five backend areas.

Frontend
App
│
├── Navbar
│
├── Feed
│   ├── CategoryFilter
│   ├── SearchBar
│   └── PostCard
│
├── CreatePost
│   ├── FreeTextInput
│   ├── AIAnalysis
│   └── PostPreview
│
├── Map
│
└── Auth
    ├── Login
    └── Signup
Backend
Express
│
├── Auth Middleware
│
├── Post Routes
│
├── Interaction Routes
│
├── AI Service
│
└── Database/Supabase Client

Don't create controllers/services/repositories/interfaces for every tiny feature during the hackathon.

A little separation is useful, but too much architecture will slow you down.

2. User Flow
Public user
Open Techtonix
      ↓
See local feed
      ↓
Filter / Search
      ↓
View post
      ↓
View map

No login required.

Authenticated user
Login / Google
      ↓
Browse
      ↓
Create Post
      ↓
Enter natural language
      ↓
Gemini analyzes
      ↓
Structured fields appear
      ↓
User edits if necessary
      ↓
Publish
      ↓
Post appears in feed

Then:

Other user
    ↓
Discover post
    ↓
Upvote / Still Valid / Outdated
    ↓
Report if necessary
    ↓
Original author
    ↓
Mark Resolved

That is your entire MVP lifecycle.

3. Database Tables

Keep the database to five tables.

1. profiles

Stores application-level user information.

profiles
──────────────
id
name
email
role
community_type
trust_score
created_at

Possible roles:

student
resident
faculty
organization
admin

Don't create a separate roles table.

2. posts

This is the central table.

posts
────────────────────
id
author_id
title
description
category
location
latitude
longitude
urgency
tags
is_anonymous
status
created_at
expires_at
resolved_at
resolution_note

Possible status:

active
resolved
expired
reported

You can store an image URL here if you decide to support images.

3. votes

Don't store votes as editable numbers on the post.

votes
────────────
id
post_id
user_id
vote_type
created_at

Example:

vote_type:
up
down

This also lets you prevent a user from voting repeatedly.

4. validity_checks
validity_checks
────────────────
id
post_id
user_id
status
created_at

Possible values:

still_valid
outdated
5. reports
reports
────────────
id
post_id
user_id
reason
created_at

That's enough.

Don't create these yet

❌ notifications

❌ messages

❌ organizations

❌ moderation_queue

❌ ai_embeddings

❌ audit_logs

❌ analytics_events

❌ subscriptions

❌ permissions

They aren't necessary for the MVP.

4. API Endpoints

Keep the API small.

Health
GET /api/health

Used to confirm the backend is alive.

Posts
Get posts
GET /api/posts

Supports simple query parameters later:

/api/posts?category=lost
/api/posts?search=internship
Get one post
GET /api/posts/:id
Create post
POST /api/posts
Update own post
PUT /api/posts/:id
Delete own post
DELETE /api/posts/:id
Resolve
PATCH /api/posts/:id/resolve
AI
Analyze post
POST /api/ai/analyze-post

Input:

natural language

Output:

title
category
location
urgency
tags
suggested expiry

This is your most important API.

Community interactions
Vote
POST /api/posts/:id/vote
Validity
POST /api/posts/:id/validity
Report
POST /api/posts/:id/report
Important simplification

You don't need separate endpoints for:

GET /api/categories
GET /api/locations
GET /api/trust
GET /api/analytics

until you actually need them.

5. Frontend Pages

You only need four actual screens.

/
Home / Feed

Contains:

Navbar
Search
Category filters
Post cards
Map preview
Login button

This is the main screen.

/create
Create Post
What's happening?

[ Free-text input ]

        ✨ Analyze

AI Analysis
────────────────
Category
Location
Urgency
Tags
Expiry

[Edit] [Publish]

This is your hero feature.

/login

Simple:

Welcome to Techtonix

[ Continue with Google ]

──────── OR ────────

Email
Password

[Login]
/post/:id

Post details:

Description
Location
Author
Trust score
Map location
Upvote
Still Valid
Outdated
Report
Contact
Resolve if owner
You don't need separate pages for

❌ Admin dashboard

❌ Profile dashboard

❌ Analytics dashboard

❌ Search results

❌ Notifications

❌ Messages

The feed can handle most of these.

6. AI Workflow

This should be extremely simple.

User types:
"Lost my red water bottle near the central library around 2 PM"
                    │
                    ▼
             React frontend
                    │
                    ▼
       POST /api/ai/analyze-post
                    │
                    ▼
             Express backend
                    │
                    ▼
               Gemini API
                    │
                    ▼
       Structured response
                    │
                    ▼
              React form
                    │
                    ▼
            User reviews
                    │
                    ▼
                Publish
                    │
                    ▼
            POST /api/posts
Gemini should return only the fields you actually need:
title
category
location
urgency
tags
suggested_expiry_hours

Don't make Gemini responsible for:

database writes
authentication
permissions
deciding whether to publish
modifying trust scores

AI suggests. The application decides.

AI failure path
Gemini succeeds
      ↓
Show AI-generated fields

Gemini fails
      ↓
Show manual fields
      ↓
User completes them
      ↓
Publish

This is especially important in a live hackathon demo.

7. Environment Variables
Frontend

client/.env.local

VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_URL=http://localhost:5000

Only values beginning with VITE_ should be exposed to the frontend.

Backend

server/.env

PORT=5000

SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=

GEMINI_API_KEY=
Never put these in React:
GEMINI_API_KEY
Supabase secret/service-role key

Your existing frontend/backend environment separation fits this architecture.

8. Folder Structure

Don't over-engineer it.

Techtonix/
│
├── client/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── CategoryFilter.jsx
│   │   │   ├── Map.jsx
│   │   │   └── Loading.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── CreatePost.jsx
│   │   │   ├── Login.jsx
│   │   │   └── PostDetails.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── .env.local
│   └── package.json
│
├── server/
│   │
│   ├── routes/
│   │   ├── posts.js
│   │   ├── interactions.js
│   │   └── ai.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── services/
│   │   └── gemini.js
│   │
│   ├── supabaseClient.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── .gitignore
├── AGENTS.md
└── README.md

This is intentionally small.

9. What Should Be Built First?

This is the most important part.

Phase 1 — Foundation

First 20–30 minutes

Make sure:

React → running
Express → running
Supabase → connected
Gemini → key configured
Git → working

Test:

GET /api/health
Phase 2 — Database + Auth

Build:

profiles
posts
Supabase Auth
Login
Auth middleware

Don't spend time polishing authentication UI.

Phase 3 — Core lifecycle

Build in this exact order:

Create Post
     ↓
AI Analyze
     ↓
Review
     ↓
Publish
     ↓
Feed
     ↓
Resolve

Do not move on until this works end-to-end.

Phase 4 — Community interaction

Add:

Upvote
Still Valid
Outdated
Report
Phase 5 — UI polish

Then:

Category filters
Search
Map
Trust badge
Anonymous toggle
Phase 6 — Demo preparation

Seed your three posts:

Lost Water Bottle
Road Blockage
Internship Opportunity

Then create one live post during the presentation.

10. What Should Be Skipped?

For this 5-hour MVP, I would explicitly freeze these out:

❌ Don't build
Feature	Reason
AI duplicate detection	High complexity, not necessary
AI report triage	Manual reporting is enough
Vector search	Too much infrastructure
Natural-language search	Keyword search demonstrates discovery
Admin dashboard	Use Supabase Studio for demo administration
WebSockets	Refresh/state updates are enough
Push notifications	Not core
Chat	Contact button is enough
Image storage pipeline	Use image URLs/placeholders
Cron jobs	Calculate expiry when fetching/rendering
Complex trust algorithm	Simple score
Advanced geofencing	Fixed demo radius
Multi-campus support	Single campus
Redis	No need
Microservices	No need
Kubernetes	Absolutely no need
Advanced CI/CD	Git + deployment is sufficient
Analytics	Not needed
Payment	Not relevant
The Architecture I Would Actually Freeze

If you want the absolute minimum mental model, remember this:

                  TECHTONIX

              ┌─────────────┐
              │ React/Vite  │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │  Express    │
              └───┬─────┬───┘
                  │     │
             ┌────┘     └─────┐
             ▼                ▼
       ┌──────────┐      ┌─────────┐
       │ Supabase │      │ Gemini  │
       │   DB     │      │   AI    │
       └──────────┘      └─────────┘

And your one critical workflow:

Free Text
   ↓
Gemini
   ↓
Structured Post
   ↓
User Review
   ↓
Supabase
   ↓
Feed
   ↓
Community Validation
   ↓
Resolve / Expire

Everything else is secondary.



JUST FRONTEND PROMPT 


# TECHTONIX — FRONTEND BUILD PROMPT

You are the senior frontend engineer responsible for building the frontend of **Techtonix**, a 2-person hackathon MVP.

Your job is to build a polished, responsive, reliable React + Vite frontend based strictly on the product architecture and requirements below.

## 1. IMPORTANT CONSTRAINTS

### Fixed stack — DO NOT CHANGE

* React
* Vite
* JavaScript/JSX
* Supabase Auth
* Express backend API
* Supabase PostgreSQL
* Gemini API through the backend

Do NOT migrate to:

* Next.js
* TypeScript unless already configured
* Firebase
* MongoDB
* Redux unless absolutely necessary
* another authentication provider
* another UI framework
* another backend

Do not redesign the architecture.

The frontend must communicate with the Express backend for application data and AI operations.

The Gemini API key MUST NEVER appear in frontend code.

The frontend must never contain:

* `GEMINI_API_KEY`
* Supabase service-role/secret key
* backend secrets
* database passwords
* private API credentials

Only public frontend environment variables beginning with `VITE_` may be used.

---

# 2. PRODUCT PURPOSE

Techtonix is an AI-powered local information-sharing platform for:

* college students
* faculty
* nearby residents
* verified organizations

The platform allows users to turn messy local information into structured, discoverable, and time-aware community knowledge.

Core lifecycle:

CREATE
→ AI STRUCTURE
→ REVIEW
→ PUBLISH
→ DISCOVER
→ EVALUATE
→ REPORT/UPDATE
→ RESOLVE/EXPIRE

Main categories:

* Internships & Scholarships
* Lost & Found
* Local Issues & Emergencies
* Events & Announcements

Primary USP:

> AI turns messy local information into structured, searchable, location-aware community knowledge.

---

# 3. PRIMARY FRONTEND GOAL

The frontend must make this workflow extremely obvious:

User writes:

"Fallen branch near West Gate blocking traffic"

↓

Clicks:

"✨ Analyze with AI"

↓

AI-generated structured information appears:

* Category
* Title
* Location
* Urgency
* Tags
* Suggested expiry

↓

User reviews/edits

↓

Clicks:

"Publish"

↓

Post immediately appears in the local feed.

This is the primary hackathon "magic moment".

Prioritize this over secondary features.

---

# 4. REQUIRED PAGES

Build these pages:

## `/`

Main home/feed page.

Must contain:

* Navbar
* Techtonix branding
* Clear primary CTA
* Search
* Category filters
* Local feed
* Post cards
* Basic map preview
* Login/signup entry point

The main CTA should be something like:

> "Share Local Information"

or

> "Create a Local Post"

There should be ONE visually dominant primary CTA.

---

## `/create`

Create-post page.

Design this as the main AI experience.

Initial state:

```text
What's happening in your community?

[ Tell us what happened... ]

[ ✨ Analyze with AI ]
```

After AI analysis:

```text
✨ AI Analysis Complete

Title
Category
Location
Urgency
Tags
Suggested Expiry

[ Edit ]

[ Publish Post ]
```

All AI-generated fields must remain editable.

The user must always have control over the final information.

If AI fails:

* do not crash
* show a friendly error
* fall back to manual fields
* allow the user to continue creating the post

---

## `/login`

Include:

* Google login
* Email
* Password
* Login button
* Signup link

Keep the UI simple.

---

## `/signup`

Include:

* Name
* Email
* Password
* Signup button
* Google OAuth
* Login link

Do not build a complicated onboarding flow.

---

## `/post/:id`

Post details page.

Include:

* Title
* Description
* Category
* Location
* Map
* Author/pseudonym
* Trust score
* Created time
* Expiry
* Urgency
* Tags
* Upvote
* Still Valid
* Outdated
* Report
* Contact poster
* Resolve button when appropriate

For anonymous posts, never expose the real user's identity.

---

## `404`

Create a custom 404 page.

It should:

* clearly state that the page doesn't exist
* provide a "Back to Home" button
* provide the primary CTA
* maintain the same visual design

---

# 5. MAIN FEED DESIGN

The home page should feel like a modern community information platform, not a generic social media clone.

Suggested structure:

```text
------------------------------------------------
TECHTONIX                         Login / Profile
------------------------------------------------

Know what's happening around you.

[ Search local information... ]

[All] [Internships] [Lost & Found]
[Issues] [Events]

------------------------------------------------
|                    |                       |
|   LOCAL FEED       |       MAP             |
|                    |                       |
|   Post Card        |      📍 📍             |
|   Post Card        |         📍             |
|   Post Card        |                       |
|                    |                       |
------------------------------------------------
```

Use a clean card-based interface.

Every card should make these immediately visible:

* category
* title
* location
* urgency
* time
* status
* trust/verified indicator

Avoid excessive UI elements.

---

# 6. POST CARD

Design a reusable `PostCard` component.

A card should visually communicate:

### Example

🚨 LOCAL ISSUE

**Road blocked near North Gate**

📍 North Gate

High urgency

Posted 25 minutes ago

✓ 8 people say this is still valid

Trust Score: 85

[Still Valid] [Outdated]

Do not overload the card.

---

# 7. TRUST AND VERIFIED UI

Support:

### Normal user

```text
Trust Score: 72
```

### Verified organization/faculty/admin

Show:

```text
✓ Verified Source
```

Official posts can receive stronger visual emphasis.

Do not create complex trust algorithms in the frontend.

The frontend only displays the score/status supplied by the backend.

---

# 8. ANONYMOUS POSTS

During creation provide:

```text
[ ] Post anonymously
```

If anonymous:

Show:

> Posted anonymously

Never display the real user's name/email.

---

# 9. CATEGORY SYSTEM

Use these exact categories:

* Internships & Scholarships
* Lost & Found
* Local Issues & Emergencies
* Events & Announcements

Allow category filtering directly from the feed.

Filtering should feel instant.

---

# 10. SEARCH

Implement simple keyword search for the MVP.

Search should work across relevant post information such as:

* title
* description
* category
* location
* tags

Do NOT build vector search or a separate search engine.

Natural-language/vector search is explicitly out of scope for this hackathon MVP.

---

# 11. MAP

Include a lightweight interactive map.

The map is a supporting feature, not the primary feature.

Display basic post pins using stored latitude/longitude.

Clicking a marker should allow the user to identify/open the associated post.

Do not spend excessive time on advanced map features.

No:

* clustering system
* advanced geofencing
* route planning
* custom map engine
* real-time location tracking

---

# 12. AUTHENTICATION UX

Users can browse publicly.

Authentication is required for:

* creating posts
* voting
* marking valid/outdated
* reporting
* resolving
* other protected interactions

If an unauthenticated user attempts a protected action:

Show a clean login prompt/modal or redirect to login.

Do not silently fail.

After successful login, return the user to the action they were attempting when practical.

---

# 13. FORM VALIDATION

All forms must have frontend validation.

Validate:

### Signup

* valid email
* reasonable password requirements
* required name

### Login

* required email
* required password

### Create Post

At minimum:

* description/free-text input required
* title required before publish
* category required
* location required
* urgency required

Show errors close to the relevant field.

Do not rely only on browser validation.

Frontend validation improves UX, but backend validation remains the ultimate authority.

---

# 14. AI LOADING EXPERIENCE

When AI is processing:

Show a polished loading state.

Example:

```text
✨ Understanding your post...

Extracting:
✓ Category
✓ Location
✓ Urgency
○ Tags
○ Suggested expiry
```

Do not make the interface appear frozen.

If the AI request fails:

```text
We couldn't analyze this automatically.

You can continue manually.

[Continue Manually]
```

Never expose technical errors such as raw API responses to users.

---

# 15. ERROR STATES

Create reusable error UI.

Handle:

* backend unavailable
* authentication failure
* Gemini failure
* invalid post
* network timeout
* failed publish
* failed vote
* failed report
* failed resolve
* missing post
* expired post

Use clear human-readable messages.

Do not expose:

* stack traces
* API keys
* internal server errors
* database errors

---

# 16. LOADING STATES

Use loading states for:

* initial feed
* post details
* AI analysis
* publishing
* authentication
* voting
* reporting
* resolving

Prefer skeleton loaders where they improve the experience.

Do not create a huge loading animation for every tiny action.

---

# 17. PRIVACY POLICY

Create a simple `/privacy` page.

It should clearly explain, in plain language:

* what user information is collected
* account information
* post information
* location information associated with posts
* anonymous posting behavior
* how information is used
* that users can browse publicly
* that anonymous posts hide identity from normal users
* that authorized administrators may need access to the underlying account identity for moderation/accountability
* basic data retention/deletion language
* contact information placeholder if no official contact has been decided

Do NOT invent legal company information.

Use clearly marked placeholders where required.

This is a hackathon privacy notice, not a claim of legal compliance.

---

# 18. TERMS & CONDITIONS

Create `/terms`.

Keep it concise and readable.

Cover:

* acceptable use
* user-generated content
* prohibition of spam/abuse
* reporting inaccurate information
* responsibility for user-submitted information
* moderation/removal rights
* account responsibility
* limitation/disclaimer appropriate for a hackathon prototype

Do not invent company names, addresses, legal entities, or jurisdiction-specific claims.

---

# 19. COOKIE CONSENT

Implement a lightweight cookie/privacy consent banner.

Do not introduce a large cookie-management library unless absolutely necessary.

The banner should:

* explain that cookies/local storage may be used for authentication, preferences, and analytics if analytics is enabled
* provide an Accept option
* provide a way to decline non-essential analytics where practical
* remember the user's choice

Do not block the entire application behind the banner.

Essential authentication functionality should continue to work.

---

# 20. ANALYTICS

Prepare lightweight analytics setup without compromising the 5-hour MVP.

Analytics should be privacy-conscious.

Track only useful high-level events, for example:

* page view
* create-post started
* AI analysis requested
* AI analysis succeeded
* post published
* post resolved
* search used

Do not track:

* passwords
* access tokens
* full private user content
* Gemini API keys
* sensitive information

If an analytics provider has not been configured, create a clean integration point/configuration rather than spending excessive time setting up a complex analytics system.

---

# 21. SEO / META

Add sensible page metadata.

At minimum:

### Home

Title:

> Techtonix — Local Information, Shared Smarter

Description:

> Discover, share, and validate useful information around your campus and local community.

### Create

> Create a Local Post — Techtonix

### Login

> Login — Techtonix

### Privacy

> Privacy Policy — Techtonix

### Terms

> Terms & Conditions — Techtonix

Use appropriate descriptions for other pages.

---

# 22. SOCIAL PREVIEW

Add Open Graph/social sharing metadata.

Include:

* title
* description
* preview image
* URL where appropriate

Create or use a simple Techtonix social preview asset.

Do not spend hours designing it.

The preview should clearly communicate:

> Techtonix — Local Information, Shared Smarter

---

# 23. FAVICON

Add a simple Techtonix favicon.

It should match the application's visual identity.

Do not use an unrelated default Vite favicon.

---

# 24. SITEMAP + ROBOTS

Create:

* `sitemap.xml`
* `robots.txt`

Include public pages such as:

* `/`
* `/login`
* `/signup`
* `/privacy`
* `/terms`

Do not expose private/authenticated routes unnecessarily.

---

# 25. IMAGE ACCESSIBILITY

Every meaningful image must have appropriate `alt` text.

Examples:

Good:

```text
alt="Techtonix local information map"
```

Bad:

```text
alt="image"
```

Decorative images should use appropriate empty alt text where applicable.

Do not use images purely for decoration when CSS/icons can accomplish the same result.

---

# 26. IMAGE PERFORMANCE

For images that are actually required:

* use appropriately sized images
* avoid huge source images
* use modern formats where practical
* lazy-load non-critical images
* provide dimensions where appropriate to reduce layout shift

Do not build a custom image-processing pipeline.

For the hackathon, placeholder/category images are acceptable.

---

# 27. PERFORMANCE

Optimize for fast initial loading.

Avoid:

* unnecessary dependencies
* huge component libraries
* massive images
* unnecessary API requests
* duplicated requests
* large client-side datasets

Use:

* lazy loading where appropriate
* reusable components
* simple state management
* efficient list rendering

After the core frontend works, perform a basic page-load/performance check.

Do not spend an hour chasing tiny performance improvements.

---

# 28. ACCESSIBILITY

Ensure:

* sufficient color contrast
* visible focus states
* buttons have understandable labels
* inputs have labels
* keyboard navigation works for important actions
* icons have accessible labels when needed
* errors are understandable
* interactive elements are not too small on mobile

Fix obvious contrast problems.

Do not sacrifice readability for visual effects.

---

# 29. MOBILE RESPONSIVENESS

The application must work on:

* desktop
* tablet
* mobile

The feed + map layout should adapt.

Desktop:

```text
Feed | Map
```

Mobile:

```text
Feed
↓
Map
```

The primary CTA should remain easy to access on mobile.

Forms must not overflow horizontally.

Post cards must remain readable on small screens.

---

# 30. SPAM PROTECTION

Do not build sophisticated anti-spam infrastructure.

For MVP frontend:

* disable duplicate submit clicks while publishing
* prevent accidental repeated submissions
* validate minimum content length
* show clear rate-limit errors from backend
* prevent obvious empty/spam submissions

The backend should remain responsible for actual enforcement.

Do not pretend frontend checks are security controls.

---

# 31. HTTPS

The frontend must be designed for HTTPS deployment.

Do not hardcode:

```text
http://
```

for production API calls.

Use:

```text
VITE_API_URL
```

for the backend URL.

Local development may use:

```text
http://localhost:5000
```

Production must use an HTTPS backend URL.

Do not implement custom SSL infrastructure inside the React application.

HTTPS should be enforced by the deployment platform/server configuration.

---

# 32. FRONTEND SECRET AUDIT

Before considering the frontend complete, search the frontend source for:

* `GEMINI_API_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* `SERVICE_ROLE`
* passwords
* secret keys
* private credentials

There must be no frontend secrets.

Only public configuration should exist in Vite environment variables.

The frontend should call:

```text
React
  ↓
Express API
  ↓
Gemini
```

NOT:

```text
React
  ↓
Gemini directly
```

---

# 33. BROKEN LINKS

Before finishing:

Check every:

* navbar link
* CTA
* footer link
* privacy link
* terms link
* login link
* signup link
* post link
* back button

There must be no dead or placeholder navigation.

---

# 34. SINGLE PRIMARY CTA

The application should have one obvious primary action:

> **Share Local Information**

Secondary actions should visually remain secondary.

Do not make every button look equally important.

The main CTA should take the user to `/create`.

---

# 35. VISUAL DESIGN

The UI should look like a polished modern hackathon product.

Desired characteristics:

* clean
* modern
* trustworthy
* community-focused
* information-dense but not cluttered
* strong visual hierarchy
* clear category colors
* clear urgency indicators
* subtle animations
* responsive cards
* excellent spacing

Avoid:

* excessive gradients
* excessive glassmorphism
* excessive animations
* giant decorative illustrations
* overly complicated dashboards
* generic Bootstrap-looking interfaces

The product should look credible enough to demonstrate to judges.

---

# 36. IMPORTANT UX PRIORITY

The visual hierarchy should be:

### 1. Discover information

### 2. Share information

### 3. Understand AI analysis

### 4. Validate information

### 5. Resolve information

Everything else is secondary.

---

# 37. DEMO DATA

The frontend should work well with seeded backend data containing at least:

### Post 1

Lost Red Water Bottle

Category:
Lost & Found

### Post 2

Road Blockage

Category:
Local Issues & Emergencies

### Post 3

Software Engineering Internship

Category:
Internships & Scholarships

The UI must also support creating a fourth post live during the hackathon presentation.

---

# 38. DO NOT BUILD

Explicitly do NOT implement:

* AI duplicate detection
* AI report triage
* vector search
* natural-language search
* WebSockets
* push notifications
* chat
* complex admin dashboard
* advanced geofencing
* image storage infrastructure
* cron infrastructure
* complex reputation algorithms
* payment system
* multi-campus support
* Redis
* microservices
* Kubernetes
* unnecessary state-management libraries
* unnecessary UI libraries

Do not add dependencies unless there is a clear reason.

---

# 39. IMPLEMENTATION ORDER

Build in this exact priority:

## Phase 1

1. App shell
2. Navbar
3. Home/feed
4. Post card
5. Create page
6. Login/signup

## Phase 2

7. Supabase Auth integration
8. API integration
9. Create post flow
10. Gemini AI analysis
11. Publish

## Phase 3

12. Feed refresh
13. Category filtering
14. Upvote
15. Still Valid
16. Outdated
17. Resolve
18. Report
19. Contact

## Phase 4

20. Map
21. Search
22. Trust indicators
23. Anonymous posting

## Phase 5

24. Mobile responsiveness
25. Accessibility
26. Error/loading states
27. Privacy
28. Terms
29. Cookie consent
30. SEO metadata
31. Favicon
32. Social preview
33. Sitemap
34. robots.txt
35. Performance check
36. Broken-link check
37. Frontend secret audit

Do NOT start Phase 4 or 5 until the core Create → AI → Publish → Feed flow works.

---

# 40. ENGINEERING RULES

Before modifying the project:

1. Inspect the existing repository.
2. Understand the current frontend structure.
3. Do not overwrite working code unnecessarily.
4. Do not change the architecture.
5. Do not change the backend unless absolutely necessary for frontend integration.
6. Reuse existing dependencies.
7. Do not add dependencies without explaining why.
8. Keep components small and reusable.
9. Keep API calls centralized.
10. Keep authentication state centralized.
11. Do not put secrets in frontend code.
12. Do not hardcode production URLs.
13. Do not hardcode fake API responses when the backend is available.
14. Seeded demo data is acceptable for the demo.
15. Never claim something works without testing it.

---

# 41. TESTING CHECKLIST

Before declaring the frontend complete, manually verify:

### Authentication

* [ ] Login works
* [ ] Signup works
* [ ] Google login works if configured
* [ ] Logout works
* [ ] Protected actions require authentication

### Create Post

* [ ] Free text works
* [ ] AI analysis works
* [ ] AI fields are editable
* [ ] AI failure fallback works
* [ ] Publish works
* [ ] New post appears in feed

### Feed

* [ ] Posts load
* [ ] Categories filter correctly
* [ ] Search works
* [ ] Post details open
* [ ] Map works

### Interaction

* [ ] Upvote works
* [ ] Still Valid works
* [ ] Outdated works
* [ ] Report works
* [ ] Resolve works
* [ ] Contact works

### Responsive

* [ ] Desktop
* [ ] Tablet
* [ ] Mobile

### Security

* [ ] No Gemini API key in frontend
* [ ] No Supabase secret/service-role key
* [ ] No passwords/tokens hardcoded
* [ ] Production API URL uses HTTPS

### SEO / Web

* [ ] Page titles
* [ ] Meta descriptions
* [ ] Open Graph metadata
* [ ] Favicon
* [ ] Sitemap
* [ ] robots.txt
* [ ] Privacy page
* [ ] Terms page
* [ ] Custom 404
* [ ] No broken links

### Accessibility

* [ ] Image alt text
* [ ] Form labels
* [ ] Keyboard focus
* [ ] Color contrast
* [ ] Mobile usability

### Performance

* [ ] No unnecessary dependencies
* [ ] Images optimized
* [ ] Lazy loading where appropriate
* [ ] No obvious unnecessary requests
* [ ] Basic page-load check completed

---

# 42. IMPORTANT HACKATHON RULE

Do NOT spend the entire hackathon perfecting:

* SEO
* analytics
* cookie banners
* legal pages
* performance micro-optimizations

The judging-critical workflow remains:

> **Create → AI → Publish → Discover → Evaluate → Resolve**

If time becomes limited, protect that workflow first.

The secondary requirements should be implemented as lightweight, credible versions after the core workflow works.

---

# 43. BEFORE YOU START CODING

First inspect the repository and report:

1. Current frontend structure
2. Existing dependencies
3. Existing pages/components
4. Existing Supabase setup
5. Existing API helper
6. Existing environment variables
7. What can be reused
8. What needs to be created
9. Any conflicts with this specification

Then provide a short implementation plan.

**Do not immediately rewrite the project.**

After the inspection, implement the frontend incrementally.

After each major phase:

* run the app
* check for errors
* verify the relevant flow
* report changed files
* report anything incomplete

Do not claim the frontend is complete if the core workflow is broken.
