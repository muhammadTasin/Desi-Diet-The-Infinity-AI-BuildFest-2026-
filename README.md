# Deshi Digest (দেশি ডাইজেস্ট)

> **Culturally Intelligent Bangladeshi Nutrition Platform, AI Plate Vision, Nanumoni Care Companion & WebMCP Agent Integration**
> *Built for Google Gemini API Infinity BuildFest 2026*

---

## 🌟 Overview

**Deshi Digest** is a culturally aware nutrition companion engineered specifically for South Asian and Bangladeshi food systems. Mainstream nutrition trackers are overwhelmingly biased toward Western diets and barcode-packaged foods, leaving Bangladeshi users guessing the nutritional impact of everyday meals like *bhat, masoor dal, macher jhol, pui shak, vorta,* and street foods.

Deshi Digest solves this with an authentic, highly visual, and clinically grounded wellness experience powered by **Nanumoni**—our warm, culturally attuned AI nutrition companion.

---

## 🚀 Key Features

* **Culturally Aware Nutrition Tracking:** A localized database and parser that understands Banglish, phonetic spellings, and Bengali script (e.g., estimating accurate macros and micronutrients for typed meals like *"gorur mangsho dim vat"* or *"ডাল ভাত শাক"*).
* **Photo-Based Plate Analyzer:** Multimodal vision pipeline that inspects Bangladeshi food plates, identifies indigenous dishes, estimates portion sizes and rice-to-curry ratios, and computes a balanced health score with actionable feedback.
* **Smart Health Nudges:** Personalized, bilingual (Bangla & English) daily health nudges based on logged nutritional gaps (fiber deficits, low hydration, excessive sodium, or carb-heavy rice portions) paired with curated local imagery and deterministic safety fallbacks.
* **Nanumoni AI Care Companion:** A conversational health guide grounded in Bangladeshi food intelligence that explains nutrition, retrieves personal meal history, and suggests healthy recipe modifications without making unsafe medical diagnoses.
* **WebMCP Agent Integration (Model Context Protocol):** Zero-regression, 100% read-only agent tools registered on `document.modelContext` (`search_foods`, `get_food_details`, `compare_foods`, `find_budget_meal`), enabling autonomous AI agents to explore authentic Bangladeshi nutrition intelligence.
* **Raw Food Basket Bridge:** Turns dietary advice directly into a practical shopping list for your local *kacha bazar*—a zero-checkout, privacy-conscious bridge to help users source fresh local ingredients.
* **Shops Near You (Local Discovery):** A privacy-first local discovery map connecting users to nearby public wet markets (*arots*), fish vendors, and grocery stores using Google Maps geolocation without third-party tracking.
* **Dashboard & Progress Tracking:** Visual macro rings (Calories, Protein, Fiber, Water), daily streaks, and comprehensive meal histories.
* **Shareable Doctor PDF Reports:** Instantly export 7-day nutrition summaries as structured PDFs or WhatsApp-ready clinical summaries for doctors and family.
* **Judge Demo Mode:** Offline-safe, credential-free exploration mode for competition judges and evaluators.

---

## 🤖 WebMCP Agent Integration (Model Context Protocol)

Deshi Digest exposes a competition-ready WebMCP adapter layer that allows browser-based AI coding and research agents to query verified Bangladeshi food composition datasets, calculate nutritional tradeoffs, and generate affordable meal plans.

- **Dedicated Agent Route:** [`/webmcp`](http://localhost:3000/webmcp) (hosts live agent runtime, capability detector, and interactive testing playground)
- **Canonical API:** Imperatively registered via `document.modelContext.registerTool(...)` with `AbortController` lifecycle cleanup.
- **Exposed Read-Only Tools:**
  1. `search_foods`: Search 82+ curated items across staples, dals, fishes, meats, greens, and street foods with Bengali script and Banglish aliases.
  2. `get_food_details`: Fetch verified calories, macros, iron, sodium, portion grams, glycemic impact, and preparation notes.
  3. `compare_foods`: Side-by-side comparison for 2 to 4 foods with normalized per-100g/per-portion metrics and cultural trade-off verdicts.
  4. `find_budget_meal`: Generate balanced Deshi meal plates within a specific BDT budget (Bangladeshi Taka) using authentic local market pricing.
- **Safety Guarantee:** 100% read-only operations (`readOnlyHint: true`); zero database writes, zero auth mutations, full SSR safety.
- **Automated Tests:** Run `npm run test:webmcp` (45/45 tests passing). Complete architectural specification available in [`docs/webmcp.md`](./docs/webmcp.md).

---

## 🧠 AI Architecture & Vision Models

### 1. Production Multimodal AI Pipeline (Google Gemini API)
The live production web application utilizes Google Gemini (`gemini-2.5-flash` via `@ai-sdk/google` and Vercel AI SDK) for:
- **Multimodal Plate Analysis:** Visual dish identification, ingredient segmentation, and portion weight estimation.
- **Nanumoni Conversational Care:** Culturally grounded dialogue guided by strict clinical safety boundaries.
- **Deterministic Guardrails & Fallbacks:** If API connectivity fluctuates, the system seamlessly activates local deterministic nutrition datasets and offline heuristics.

### 2. Custom Vision-Language Model Research (Qwen3-VL)
As part of Deshi Digest's specialized AI research for South Asian food understanding:
- **Base Model:** `Qwen/Qwen3-VL-2B-Instruct`
- **Purpose:** Fine-tuned vision-language research to understand Bangladeshi dishes and meal-plate imagery (e.g., differentiating *Ilish bhaja* from *Rohu*, identifying varieties of *shak*, and recognizing multi-item *vorta* spreads)—an area underrepresented in general-purpose food datasets.
- **Fine-Tuning Method:** LoRA (Low-Rank Adaptation)
- **Tooling:** MS-SWIFT
- **Training Environment:** Kaggle
- **Compute Hardware:** 2 × NVIDIA T4 GPUs

#### Deployment Status
The custom Qwen3-VL model was trained, fine-tuned, and evaluated as a research artifact within the project. However, it is **not currently serving inference on the live public Deshi Digest website** due to the requirement for dedicated, persistent GPU server hosting infrastructure.

The live production application therefore actively uses the **cloud-hosted Google Gemini API (`gemini-2.5-flash`)** inference pipeline, augmented by rich few-shot Bangladeshi food knowledge prompting and deterministic local nutrition fallback datasets. The custom Qwen3-VL model remains a standalone, evaluated model artifact that can be deployed when suitable persistent GPU infrastructure is provisioned.

---

## 🛠 Tech Stack

- **Framework:** TanStack Start & TanStack Router (Vite 7, Nitro SSR)
- **Frontend UI:** React 19, TypeScript, Tailwind CSS v4, Shadcn/ui, Radix UI, Framer Motion
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage, Row-Level Security)
- **AI & Multimodal SDK:** Google Gemini API via Vercel AI SDK (`@ai-sdk/google`, `ai`)
- **WebMCP Integration:** Browser Model Context Protocol (`document.modelContext`)
- **Data & Charts:** TanStack Query, Recharts, Lucide React, Sonner
- **Testing & Tooling:** TypeScript (`tsc --noEmit`), TSX Test Runner, Prettier, ESLint

---

## 👨‍💻 Team & Technical Contributions

This project was developed for the **Infinity AI BuildFest 2026** by a collaborative team. For full details, see [`CONTRIBUTIONS.md`](./CONTRIBUTIONS.md).

### Team Summary
| Member | Core Role & Responsibilities |
|---|---|
| **Tasfiq Tasin** | **Technical Lead & Full-Stack AI Engineer** (Architecture, Backend, AI Integration, WebMCP, QA) |
| **Mohammed Rayyanul** | **Frontend Engineer** (UI Structure, Components, Pages, Theme, Visual Styling) |
| **Nafisa Karim** | **Research & Media** (Market Acceptance Analysis, Video Presentation, Deshi User Trust Research) |
| **Safin** | **Team Lead & Product Manager** (Product Direction, Concept Ideation, UX Vision) |
| **Sakib Mahmud** | **LLM/VLM Research** (Custom Model Training & Dataset Preparation) |

### Technical Leadership & Implementation: Tasfiq Tasin
Tasfiq drove the core architecture, backend systems, AI safety pipelines, and competition-ready features:
- **Supabase Backend & Security:** Architected database schemas, Auth flows, Storage buckets, and strict Row-Level Security (RLS) policies.
- **Gemini Multimodal & AI Pipeline:** Engineered prompt grounding, food knowledge retrieval, structured output schemas, and strict medical safety boundaries.
- **WebMCP Integration:** Implemented the entire WebMCP adapter layer, 4 read-only tools, canonical `document.modelContext` lifecycle registration with `AbortController`, `/webmcp` interactive sandbox, and 45-case automated test suite.
- **Smart Health Nudge Engine:** Built deterministic fallback systems, verified local image mapping, and bilingual Bangla/English nutrition insights.
- **Banglish Meal Parser:** Engineered local lexical parsers for mixed Banglish and phonetic food text logging without external dependencies.
- **Local Discovery & Bridges:** Built the privacy-first "Shops Near You" wet market locator and "Raw Food Basket" grocery bridge.
- **Production QA & Reliability:** Resolved SSR memory boundaries, zero-regression typechecks (`tsc`), and production Nitro/Vite builds.

---

## 💻 Local Development & Setup

### Prerequisites
- Node.js 20+
- npm 10+
- Supabase Project & Google Gemini API Key

### Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/muhammadTasin/Desi-Diet-The-Infinity-AI-BuildFest-2026-.git
   cd Desi-Diet-The-Infinity-AI-BuildFest-2026-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Fill in your `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.*

4. **Run WebMCP test suite:**
   ```bash
   npm run test:webmcp
   ```

5. **Typecheck & Build:**
   ```bash
   npm run typecheck
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

6. **Start local development server:**
   ```bash
   npm run dev
   ```

---

<!-- PRODUCT_SCREENSHOTS_START -->

## 📸 Product Screenshots

### Dashboard and Nutrition Overview
<p align="center">
  <img src="./public/project-screenshots/dashboard.png" width="48%" alt="Deshi Digest nutrition dashboard" />
  <img src="./public/project-screenshots/plate-analysis.png" width="48%" alt="AI-powered Bangladeshi food plate analysis" />
</p>

### AI Nutrition Assistant and Meal History
<p align="center">
  <img src="./public/project-screenshots/ai-nutrition-chat.png" width="48%" alt="Bangla and Banglish AI nutrition assistant" />
  <img src="./public/project-screenshots/meal-history.png" width="48%" alt="Meal logging and nutrition history" />
</p>

### Personal Goals and Local Discovery
<p align="center">
  <img src="./public/project-screenshots/profile-and-goals.png" width="48%" alt="Personal nutrition goals and profile" />
  <img src="./public/project-screenshots/shops-near-you.png" width="48%" alt="Nearby healthy food shop discovery" />
</p>

### Responsive Mobile Experience
<p align="center">
  <img src="./public/project-screenshots/mobile-responsive-view.png" width="70%" alt="Deshi Digest responsive mobile experience" />
</p>

---

## 📄 Licensing and Third-Party Components

This repository is licensed under the [MIT License](./LICENSE).

The repository's MIT License applies to Deshi Digest's own source code and project-owned materials. It does not automatically relicense third-party materials, which remain governed by their respective licenses and terms:

- **Upstream Base Models:** Upstream weights and architectures for `Qwen/Qwen3-VL-2B-Instruct` remain governed by the original upstream [Qwen License and Terms](https://github.com/QwenLM/Qwen2.5-VL). Fine-tuned adapters and model artifacts must be used consistently with the underlying base model license.
- **Google Gemini & AI SDK:** Google Gemini and related API services remain subject to the [Google APIs Terms of Service](https://developers.google.com/terms) and applicable Gemini API terms.
- **Third-Party Datasets:** Third-party datasets and reference food compositions retain their original licenses or contributor permissions. Any dataset utilized under author permission remains subject to that permission and its source terms.
- **Libraries & Dependencies:** Third-party open-source libraries (e.g., TanStack Router, React, Tailwind CSS, Radix UI, Lucide, Supabase JS, Zod) retain their respective open-source licenses (MIT, Apache 2.0, BSD).
- **Media & Visual Assets:** Externally sourced photographs, icons, and illustrations retain their respective licensing terms.

---

## ⚠️ Medical Disclaimer

Deshi Digest provides general nutrition education, plate analysis, and dietary guidance. It is **not** a medical diagnosis tool, treatment plan, or substitute for professional medical advice from a registered dietitian or licensed physician.
