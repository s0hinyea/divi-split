# Divi Voice AI — First Draft Spec

## 1. Overview
The goal is to transition Divi into an **agentic financial assistant** while preserving the current manual flow. The core manual swipe/tap experience will remain the free, default tier. The **Voice AI Assistant** will be introduced as a premium, paywalled feature (Divi Pro/Plus).

When the premium user activates the voice flow, the only manual action required is capturing the photo. From there, a voice-enabled AI guides the user through adding contacts, reviewing the items, assigning splits, and dispatching payment requests.

---

## 2. The UX Flow (Step-by-Step)

### Step 1: Capture (Manual)
- User snaps or uploads the receipt photo normally.
- Vision OCR processes the receipt in the background.
- UI transitions into an **"Active Listening"** state (e.g., a pulsing orb or waveform at the bottom of the screen).

### Step 2: Contact Picking (Voice)
- **AI Agent:** *"I've scanned the receipt. The total is $85.00. Who was at dinner with you?"*
- **User:** *"It was me, Sarah, and John."*
- **System Logic:** 
  - NLP extracts names.
  - Queries native device contacts for "Sarah" and "John" via fuzzy matching.
  - If multiple matches (e.g., three Sarahs), the AI asks for clarification: *"Do you mean Sarah Smith or Sarah Jones?"*
- **AI Confirms:** *"Great, I've added Sarah Smith and John Doe."*
- **UI:** The contacts appear dynamically on the screen as they are identified.

### Step 3: Review / Assign Items (Voice)
The AI begins walking through the unassigned items.
- **AI Agent:** *"Let's assign the items. Who had the Steak Frites for $35?"*
- **User:** *"That was John."*
- **AI Agent:** *"Got it, John's tab is started. Who had the Caesar Salad for $15?"*
- **User:** *"Sarah and I split that."*
- **System Logic:**
  - AI calls a `split_item()` tool/function to divide the item.
  - AI calls an `assign_item()` tool to attach the halves to the user and Sarah.
- **UI:** Items physically move (animate) into the respective contact boxes as the AI speaks, mimicking the manual swipe/tap flow but driven by voice.

### Step 4: Final Review (Voice)
- **AI Agent:** *"All done! John owes $35, Sarah owes $7.50, and your share is $42.50. Does that sound right?"*
- **User:** *"Actually, move the salad completely to Sarah."*
- **System Logic:** AI processes the correction, unwinds the split, and reassigns the full item to Sarah.
- **AI Agent:** *"Updated. Sarah now owes $15.00. Ready to send the requests?"*

### Step 5: Dispatch (Voice -> Manual Hand-off)
- **User:** *"Yes, send them."*
- **System Logic:** 
  - AI triggers the native `expo-sms` module.
  - Due to iOS/Android security restrictions, the OS SMS modal will pop up pre-filled.
  - The user taps the final "Send" button on the native modal.

---

## 3. Technical Architecture

### 3.1. Voice Infrastructure
The system requires ultra-low latency for a conversational feel.
- **Option A (Preferred): OpenAI Realtime API (WebSockets).** Enables true duplex conversation, allowing the user to interrupt the AI mid-sentence (e.g., *"Actually wait, I had the steak"*).
- **Option B: Whisper (STT) -> GPT-4o -> TTS (Text-to-Speech).** Easier to implement initially via standard REST calls but lacks interruptibility and has higher latency overhead.

### 3.2. Function Calling / Tools
The AI must act as a controller for the frontend `splitStore.ts`. It will be granted access to JSON-schema tools it can trigger during the conversation:
- `lookup_contacts(names: string[])`
- `add_contact(id: string)`
- `assign_item(item_id: string, contact_ids: string[])`
- `split_item(item_id: string, into_parts: number)`
- `trigger_dispatch()`

### 3.3. Hybrid State Management
The voice UI and the visual UI must remain perfectly synced.
- The user can seamlessly switch between voice and touch. For example, the AI asks *"Who had the steak?"* but instead of speaking, the user just taps John's avatar on the screen. 
- The AI must be context-aware of manual UI changes. It will receive system prompts/events when the state updates manually to avoid repeating questions for items already tapped.

---

## 4. Monetization & Freemium Strategy (Paywall Logic)
- **Free Tier (Default):** Users go through the standard manual tap-to-assign flow that exists today. OCR extraction is still free, but they must hunt and peck to assign contacts.
- **Premium Tier (Divi Pro):** Users unlock the "Voice Assistant" mode.
- **Upsell Hook:** After parsing a receipt on the free tier, a non-intrusive banner or button (e.g., a glowing microphone icon) offers: *"Split this instantly with Voice AI (Try Divi Pro)."*
- **Paywall Gate:** Tapping the microphone triggers the subscription paywall. If subscribed, it seamlessly transitions into the "Active Listening" state.

---

## 5. Edge Cases & Considerations

- **Noisy Environments:** Restaurants or bars have heavy background noise. We need robust Voice Activity Detection (VAD) and a prominent "Mute/Skip Voice" button to fall back to the manual flow at any time.
- **Interrupting the AI:** If the receipt has 20 items, having the AI read them one by one will be tedious. The user must be able to say *"Assign all the drinks to Sarah and everything else to me,"* and the AI must have the context to execute that bulk action.
- **Unrecognized Contacts:** Handling names the user says that don't match any phone contacts (e.g., *"Just create a temporary contact for that"*).
- **Math Corrections:** Handling vague commands like *"Add a $10 tip to Sarah's bill"* and calculating the new dynamic total.
