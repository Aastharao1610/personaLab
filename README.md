# PersonaLab

> Find the UX blockers that will stop users from converting before you launch.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-URL%20Capture-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

PersonaLab is a pre-launch UX intelligence platform. Give it a product screenshot or live URL, and it simulates realistic AI users moving through the interface, then returns a launch-readiness report with persona journeys, friction points, an attention map, and ranked recommendations.

Built for founders, designers, builders, and hackathon teams who need actionable product feedback before they have real traffic, analytics, or user research sessions.

![PersonaLab hero screenshot](./docs/screenshots/hero-placeholder.png)

## Table of Contents

- [Why PersonaLab Exists](#why-personalab-exists)
- [Why This Matters](#why-this-matters)
- [Solution](#solution)
- [Product Flow](#product-flow)
- [Example Report](#example-report)
- [Architecture](#architecture)
- [AI Pipeline](#ai-pipeline)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Screenshots](#screenshots)
- [Local Setup](#local-setup)
- [Folder Structure](#folder-structure)
- [API Overview](#api-overview)
- [Hackathon Submission](#hackathon-submission)
- [Demo Flow](#demo-flow)
- [Why PersonaLab Is Different](#why-personalab-is-different)
- [Future Scope](#future-scope)
- [Production Notes](#production-notes)

## Why PersonaLab Exists

Most teams launch with opinions.

They debate whether the CTA is clear, whether the page builds trust, whether pricing is visible enough, and whether users will understand the value proposition. The problem is that real answers usually arrive too late: after launch, after traffic, after users bounce, and after conversion has already suffered.

Traditional UX research is powerful, but it is slow. Analytics tools are powerful, but they require existing users. Session replay tools are powerful, but only after people have already used the product.

PersonaLab fills the pre-launch gap.

## Why This Matters

Teams often ship interfaces with unanswered questions:

- Is the main CTA obvious enough?
- Do users understand the page intent?
- Is pricing visible when users need it?
- Are trust signals appearing before hesitation starts?
- Which users convert, hesitate, abandon, or exit?

Analytics tools answer those questions after launch. User research answers them well, but often slowly and expensively. PersonaLab gives teams a fast pre-launch read so obvious UX risks can be caught before real users arrive.

## Solution

PersonaLab lets teams test a product surface before real users arrive.

Users can:

- Upload a product screenshot.
- Analyze a live website URL.
- Generate AI personas matched to the product context.
- Simulate realistic user journeys.
- See where users convert, hesitate, abandon, or exit.
- Review a launch score and recommendation.
- Explore an AI attention heatmap and friction pins.
- Open persona-level journey timelines.
- Get ranked UX improvements.

The result is not just a generic AI critique. PersonaLab turns a static interface into simulated behavioral evidence.

## Product Flow

```text
Screenshot or Website URL
        ↓
Product Understanding
        ↓
AI Persona Generation
        ↓
Behavior Simulation
        ↓
UX Intelligence Report
        ↓
Launch Score + Heatmap + Recommendations
```

## Example Report

A typical PersonaLab output is designed to be understood in seconds:

```text
Input
https://example.com

↓

Launch Score
72 / 100

↓

Main Blocker
Users consistently hesitated because pricing appears too late.

↓

Highest Impact Fix
Move pricing above the fold and clarify what the primary CTA unlocks.

↓

Result
Higher confidence before launch, with specific UX fixes to prioritize.
```

The goal is not to replace real analytics or user research. The goal is to help teams identify likely conversion blockers before those signals exist.

## Architecture

PersonaLab is a full-stack JavaScript application split into two workspaces:

```text
personalab/
  client/   React + Vite frontend
  server/   Express API + AI orchestration
```

### High-Level System

```text
┌──────────────────────────┐
│      React Frontend      │
│  Upload, URL, Report UI  │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│       Express API        │
│  Validation and Routing  │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│    Screenshot Source     │
│  Multer Upload or        │
│  Playwright URL Capture  │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│       AI Pipeline        │
│  Engines 1, 2, 3, and 4  │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│      UX Report UI        │
│  Score, Personas,        │
│  Heatmap, Fixes          │
└──────────────────────────┘
```

## AI Pipeline

PersonaLab uses a four-engine pipeline. Each engine has a focused responsibility and passes structured output to the next stage.

### Engine 1: Product Understanding

Analyzes the uploaded or captured screenshot and extracts:

- Page intent
- Product type
- Industry
- Primary user goal
- Target audience
- CTA structure
- Navigation
- Trust signals
- Forms
- Pricing visibility
- Checkout presence
- Potential UX problems
- Confidence score

### Engine 2: Persona Generation

Creates realistic users for the product context, including:

- Name, role, age, country
- Primary goal
- Technical skill
- Motivations
- Frustrations
- Decision style
- Risk tolerance
- Accessibility needs
- Expected journey

### Engine 3: Behavior Simulation

Runs each persona through the interface and records:

- Step-by-step journey
- Observations
- Interpretations
- Actions
- Targets
- Friction
- Trust
- Motivation
- Final outcome

Possible outcomes:

- Converted
- Hesitated
- Abandoned
- Exited

### Engine 4: UX Intelligence

Turns simulated behavior into a launch report:

- Launch score
- Launch recommendation
- Strengths
- Weaknesses
- Friction points
- Persona outcome summary
- Ranked UX recommendations

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- Framer Motion
- PropTypes

### Backend

- Node.js
- Express
- Multer
- Playwright
- Helmet
- CORS
- Morgan
- Zod
- Mongoose

### AI Providers

- Gemini via `@google/genai`
- Groq-compatible OpenAI chat completions endpoint
- Configurable primary and fallback models

### Tooling

- npm workspaces
- ESLint
- Concurrently
- Nodemon

## Features

PersonaLab features are organized around the end-to-end analysis workflow.

### Analysis

#### Screenshot Upload

Upload PNG, JPEG, or WebP screenshots up to 8 MB.

#### Website URL Analysis

Submit a public URL. PersonaLab opens it with Playwright, waits for the page to render, captures a full-page screenshot, and sends that screenshot into the same analysis pipeline.

### AI

#### Premium AI Workflow

The analysis experience shows real pipeline stages:

1. Understanding Product
2. Creating AI Personas
3. Simulating User Behaviour
4. Calculating UX Intelligence
5. Building Final Report

Each stage completes only when the corresponding backend request finishes.

#### Product Understanding

Engine 1 identifies the product context, page intent, CTA structure, trust signals, forms, pricing visibility, checkout presence, and likely UX problems from the screenshot.

#### Persona Generation

Engine 2 creates realistic personas matched to the product surface, including goals, motivations, frustrations, decision style, accessibility needs, and expected journey.

#### Behavior Simulation

Engine 3 runs each persona through the interface and records observations, interpretations, actions, friction, trust, motivation, and final outcome.

### Reporting

#### Launch Readiness Report

The final report includes:

- Website/product summary
- Launch score
- Recommendation
- One-line AI summary
- Top insights
- Persona outcomes
- Ranked recommendations
- Detailed analysis accordion

#### Persona Journey Drawer

Click any persona to inspect:

- Journey timeline
- Observation
- Interpretation
- Action
- Reason for final outcome

#### AI Attention Heatmap

The screenshot can be viewed in three modes:

- Original Screenshot
- AI Attention Heatmap
- Friction Overlay

The overlay derives approximate regions from existing AI output:

- Green: attention
- Yellow: hesitation
- Red: friction
- Gray: ignored

#### Friction Pins

Numbered pins appear on the screenshot and connect visual friction to related recommendations.

#### Responsive UI

PersonaLab is designed for desktop, tablet, and mobile screens with a dark premium SaaS interface.

## Screenshots

Replace these placeholders with real product screenshots before submission or publishing.

### Landing Page

Show the hero, product promise, and upload/URL entry point above the fold.

![Landing page](./docs/screenshots/landing-placeholder.png)

### Upload and URL Analysis

Show the two input modes: screenshot upload and website URL analysis.

![Upload flow](./docs/screenshots/upload-placeholder.png)

### AI Workflow

Show the multi-stage analysis state while the pipeline is running.

![AI workflow](./docs/screenshots/workflow-placeholder.png)

### Final Report

Show the launch score, recommendation, top insights, and persona summary grid.

![Final report](./docs/screenshots/report-placeholder.png)

### Persona Journey Drawer

Show a persona journey timeline with observation, interpretation, action, and final outcome reason.

![Persona drawer](./docs/screenshots/persona-drawer-placeholder.png)

### AI Attention Heatmap

Show the screenshot overlay with attention regions, friction pins, and legend.

![AI heatmap](./docs/screenshots/heatmap-placeholder.png)

## Local Setup

### Requirements

- Node.js 20 or newer
- npm 10 or newer
- AI provider API key
- Optional MongoDB connection string

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd personaLab
npm install
```

### 2. Configure Environment

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Client:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Server:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173,http://localhost:5174
MONGODB_URI=

AI_PROVIDER=groq
GROQ_API_KEY=<your_groq_api_key>
GROQ_TEXT_MODEL=openai/gpt-oss-120b
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GROQ_FALLBACK_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

GEMINI_API_KEY=<your_gemini_api_key>
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODEL=gemini-2.5-pro
```

> Security note: never commit real API keys. Use placeholder values in examples and keep secrets in local `.env` files or deployment secrets.

### 3. Install Playwright Browser

Website URL analysis requires Chromium:

```bash
npx playwright install chromium
```

### 4. Run Development Server

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

### 5. Run Apps Separately

```bash
npm run dev:client
npm run dev:server
```

### 6. Build

```bash
npm run build
```

### 7. Lint

```bash
npm run lint
```

## Folder Structure

```text
personaLab/
  README.md
  package.json
  package-lock.json

  client/
    index.html
    package.json
    vite.config.js
    tailwind.config.js
    postcss.config.js
    src/
      App.jsx
      main.jsx
      styles/
        index.css
      services/
        uploadService.js
      utils/
        dashboardMetrics.js
      components/
        Header.jsx
        Hero.jsx
        Features.jsx
        HowItWorks.jsx
        CTA.jsx
        Footer.jsx
        upload/
          UploadScreen.jsx
          AnalysisLoadingSequence.jsx
        simulation/
          SimulationWorkspace.jsx
          PersonaInterview.jsx
          HeatmapOverlay.jsx
        dashboard/
          InsightsDashboard.jsx
        comparison/
          ComparisonUploader.jsx
          ComparisonDashboard.jsx

  server/
    package.json
    src/
      server.js
      app.js
      config/
        env.js
        cors.js
        database.js
        openai.js
      api/
        v1/
          routes/
          controllers/
      middlewares/
        analyzeUpload.js
        uploadImage.js
        errorHandler.js
      schemas/
        productUnderstanding.schema.js
        persona.schema.js
        simulation.schema.js
        insights.schema.js
        heatmap.schema.js
      services/
        ProductUnderstandingEngine.js
        PersonaGenerationEngine.js
        BehaviorSimulationEngine.js
        InsightsEngine.js
        AIProvider.js
        websiteCapture.service.js
        tempFile.service.js
      utils/
        logger.js
```

## API Overview

PersonaLab exposes a small API surface for the frontend.

```text
POST /analyze
POST /analyze/url
POST /api/v1/personas
POST /api/v1/simulations
POST /api/v1/insights
GET  /api/v1/health
GET  /health/ai
```

The frontend keeps the same pipeline for both screenshot upload and website URL analysis. URL analysis simply creates a screenshot first.

## Hackathon Submission

### One-Liner

PersonaLab lets founders launch to AI users before real users by simulating UX behavior from a screenshot or website URL.

### Problem

Teams often launch products without knowing whether users will understand, trust, or convert. Real analytics arrive after launch, and user research takes time.

### Solution

PersonaLab creates simulated users, runs them through the product interface, and returns a launch-readiness report with friction points, heatmaps, persona journeys, and prioritized fixes.

### What Makes It Demoable

- Upload or analyze a URL live.
- Watch the AI pipeline progress through five stages.
- Show a launch score immediately.
- Open a persona journey to prove behavior simulation.
- Toggle the heatmap and friction pins.
- End with the highest-priority fix.

## Demo Flow

Use a product page with visible UX issues: unclear CTA, hidden pricing, weak trust proof, or cluttered navigation. The goal is to tell a complete story in under three minutes.

1. Open on the landing page.

   > PersonaLab tests your product with simulated AI users before real users see it.

2. Submit a live URL or upload a screenshot.

   **WOW moment:** the product accepts a real product surface, not a template.

3. Narrate the pipeline while it runs:

   - Understanding Product
   - Creating AI Personas
   - Simulating User Behaviour
   - Calculating UX Intelligence
   - Building Final Report

   **WOW moment:** the loading state maps directly to the real AI workflow.

4. Stop on the launch score and recommendation.

   Read the one-line AI summary before scrolling.

5. Show the three top insights.

   Keep this fast. Judges should understand the main blocker in seconds.

6. Open one persona journey drawer.

   **WOW moment:** the report is backed by simulated user behavior, not a generic critique.

7. Toggle the AI Attention Heatmap.

   **WOW moment:** friction becomes visible directly on the screenshot.

8. Click one friction pin.

   Connect the pin to the related recommendation.

9. End on the highest-priority fix.

   Make the closing concrete: one issue, one fix, one reason it matters.

Recommended closing line:

> PersonaLab gives teams pre-launch behavioral evidence before they have traffic, analytics, or user interviews.

## Why PersonaLab Is Different

PersonaLab is not trying to replace analytics, session replay, heatmaps, or user research. It exists earlier in the product lifecycle: before traffic, before recordings, and before teams have enough data to inspect.

| Capability | Analytics Tools | Session Replay Tools | Heatmap Tools | Generic AI UX Review | PersonaLab |
| --- | --- | --- | --- | --- | --- |
| Works before launch | ✕ | ✕ | ✕ | ✓ | ✓ |
| Requires real users | ✓ | ✓ | ✓ | ✕ | ✕ |
| Accepts screenshot or URL | ✕ | ✕ | ✕ | ✓ | ✓ |
| Generates product-specific personas | ✕ | ✕ | ✕ | ✕ | ✓ |
| Simulates user journeys | ✕ | ✕ | ✕ | ✕ | ✓ |
| Produces launch score | ✕ | ✕ | ✕ | ✕ | ✓ |
| Connects friction to recommendations | ✕ | ✕ | ✕ | ✓ | ✓ |
| Shows visual attention/friction overlay | ✕ | ✓ | ✓ | ✕ | ✓ |

The key difference is the structured pipeline:

```text
Product understanding → Personas → Journeys → UX intelligence
```

The output is tied to simulated user behavior, not just a list of generic suggestions.

### Relationship to User Research

User research is still the gold standard.

PersonaLab does not replace real user interviews, usability testing, or analytics. It helps teams catch obvious UX risks earlier, faster, and cheaper so those later research cycles can start from a stronger baseline.

## Future Scope

- Exportable PDF reports
- Shareable report links
- Before/after score comparison
- Team workspaces
- Saved projects
- Real analytics import
- Figma plugin
- Chrome extension
- Task-based simulation goals
- A/B variant comparison
- Multi-page funnel simulation
- More precise visual region mapping
- Confidence explanations for launch score
- Integration with issue trackers

## Production Notes

- URL analysis works only with public websites.
- Local/private network URLs are blocked for safety.
- Some websites may block automated browser capture.
- AI provider rate limits can affect analysis speed.
- The heatmap is AI-derived from existing outputs, not real eye-tracking or click-tracking data.

## License

Add your license here before publishing.

## Credits

Built for hackathon-speed product validation and pre-launch UX intelligence.
