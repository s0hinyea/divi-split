---
name: Divi Architecture
description: Complete technical context for the Divi bill-splitting app
---

# Divi — Architecture Overview

## What Divi Does
Mobile app that scans restaurant receipts via camera, uses AI to parse items, and splits the bill among friends with proportional tax & tip.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native + Expo Router (custom dev client, NOT Expo Go) |
| State | Zustand (`splitStore.ts`) + React Context (Profile, History, Session, OCR) |
| Backend | Supabase Edge Functions (Deno runtime) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email/password, manual JWT decoding in edge functions) |
| OCR/AI | OpenAI `gpt-4o-mini` via Structured Outputs (strict JSON schema) |
| Scanner | `react-native-document-scanner-plugin` (Apple VisionKit on iOS) |

## Key Files

### Frontend
- `frontend/app/scan.tsx` — Native document scanner integration
- `frontend/utils/ocrUtil.tsx` — Image compression (1024px, 0.7 JPEG) + edge function call
- `frontend/stores/splitStore.ts` — Zustand store for receipt state (items, contacts, assignments)
- `frontend/utils/SessionContext.tsx` — Auth session management
- `frontend/utils/ProfileContext.tsx` — User profile CRUD
- `frontend/utils/HistoryContext.tsx` — Receipt history pagination
- `frontend/styles/theme.ts` — Design tokens (colors, fonts, spacing, radii)

### Backend
- `supabase/functions/ocr-vision/index.ts` — OpenAI vision call with strict JSON schema
- `supabase/migrations/` — Database schema (receipts, receipt_items, contacts, assignments, profiles)

### Tests
- `tests/scripts/ocr-pipeline.integration.test.js` — End-to-end OCR accuracy + timing benchmarks
- `tests/images/` — Test receipt images

## Conventions
- All styles use theme tokens from `@/styles/theme` — never hardcode colors
- Use `SafeAreaView` from `react-native-safe-area-context`, NOT from `react-native`
- Edge functions use `npm:` imports (e.g. `npm:openai@4.60.0`), not node_modules
- JWT verification is manual (`atob()` on payload) — `verify_jwt = false` in config.toml
- Images are downscaled to 1024px width before sending to OpenAI
- OpenAI uses Structured Outputs (strict mode) — schema is defined inline, not in prompt text
