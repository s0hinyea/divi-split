# Divi Split - Context & Specifications

This file serves as a context reference to minimize token usage and provide a consistent understanding of the Divi Split project architecture, stack, and constraints.

## Tech Stack
**Frontend:**
- **Framework:** React Native with Expo (Managed Flow)
- **Routing:** Expo Router (`app/` directory)
- **UI Components:** React Native Paper, custom design system (`styles/theme.ts`)
- **Key Libraries:** `expo-camera`, `expo-image-picker`, `expo-image-manipulator`, `expo-contacts`, `expo-sms`

**Backend:**
- **Runtime & Framework:** Node.js, Express
- **API integrations:** OpenAI API (for OCR & Receipt Processing)
- **Security:** Helmet, CORS, Rate Limiting (`express-rate-limit`)

**Database & Auth:**
- **Provider:** Supabase
- **Features Used:** PostgreSQL (Receipt history, Profiles), Supabase Auth

## Current Architecture
Divi Split is a mobile-first expense-splitting application. The React Native frontend captures receipt images (camera or gallery), compresses them locally using `expo-image-manipulator`, and sends them to the Node.js backend. The backend securely relays the heavily compressed images to the OpenAI Vision API to extract structured receipt data (items, prices, tax, tip). This parsed data is returned to the frontend where users can cleanly assign items to contacts fetched natively from their device, calculate personalized totals natively, and finally dispatch customized SMS payment requests including personalized deep links (Venmo, CashApp, Zelle). Supabase serves as our real-time persistence layer for user profiles and global receipt history.

## Core Entities & React Contexts
**React Contexts:**
- `SessionContext`: Manages Supabase authentication state.
- `ProfileContext`: Manages the authenticated user's profile (`username`, `venmo_handle`, `cashapp_handle`, `zelle_number`).
- `ContactsContext`: Manages the native device contacts selected to split the current bill.
- `ReceiptContext`: Manages the active, in-flight receipt data (`items`, `tax`, `tip`, `total`).
- `OCRContext`: Manages the highly granular OCR processing state (`isProcessing`, `status`: Compressing -> Sending -> Extracting).
- `HistoryContext`: Manages the synchronization of the user's past receipts from Supabase to the Home Dashboard.

**Core Interfaces:**
- `Profile`: `{ id, username, full_name, venmo_handle, cashapp_handle, zelle_number }`
- `ReceiptItem`: `{ id, name, price }`
- `Contact`: `{ id, name, phoneNumber, items: ReceiptItem[] }`

## Definition of Done
A feature is considered "Done" when a receipt can be captured or uploaded, accurately parsed by the LLM, seamlessly assigned to contacts, saved to the user's history in Supabase, and a customized SMS containing accurate math and functional payment deep links is successfully queued on the user's device, all without crashes, UI jank, or exceeding latency targets.

## Constraints
- **Privacy:** Never upload or store the user's raw device contacts to the backend database. Processing happens locally; only summary data is sent via standard SMS. 
- **Costs:** Minimize LLM costs. Always compress images (`1024px` width, `70%` quality) before sending them to the backend/OpenAI.
- **Latency:** The end-to-end OCR processing pipeline (Capture -> Results UI) should target < 5 seconds. Use optimistic UI updates where possible.
- **Reliability:** No hallucinated APIs. Always handle network failures, missing permissions, and malformed OCR responses gracefully.

## Current Known Bugs / Open Decisions
- **Open Decision:** Transitioning the Node.js Express OCR route to a Serverless Edge Function (e.g., Supabase Edge Functions) to eliminate cold starts and further reduce latency.
- **Known Issue:** OCR parsing edge cases with highly crumpled, faded, or unusually formatted receipts.
- **Open Decision:** Handling decimal rounding discrepancies when splitting items unevenly among multiple people.
