# Divi Core Values

> The guiding principles for building an app people actually want to use.

---

## 🎯 Positioning: The Niche

**Divi is NOT Splitwise.** We don't track ongoing balances or manage roommate rent.

**Divi does ONE thing:** Scan → Split → Text. Done in 60 seconds.

### Our Advantages Over Splitwise

| What | Why It Matters |
|------|----------------|
| **SMS-First** | Recipients don't need the app. Just a text. |
| **Free Receipt Scanning** | Splitwise charges $5/mo for this. |
| **One-Off Focus** | No account needed to receive. No groups to manage. |
| **Speed** | Dinner ends → everyone knows their share before leaving. |

### What We're NOT Building (For Now)
- ❌ Ongoing balance tracking
- ❌ Groups and roommate expenses  
- ❌ Payment integration (users Venmo separately)
- ❌ Multi-currency support

---

## 1. Clean UI/UX

### User Interface
- **Modern & Premium**: Not just functional — visually delightful. No "project" feel.
- **Consistent Design Language**: Colors, typography, spacing follow a system.
- **Intentional Animations**: Page transitions, micro-interactions that feel polished.
- **Mobile-First**: Designed for thumbs, not mice.

### User Experience  
- **Frictionless Flow**: Minimum taps to complete core actions.
- **Intuitive Navigation**: Users know where they are and how to get back.
- **Error Prevention > Error Messages**: Design to prevent mistakes, not just handle them.
- **Delightful Details**: Small touches that make users smile.

---

## 2. Infrastructure

### Scalability
- Handle growth gracefully (10 users → 10,000 users).
- Database queries optimized for performance.
- Caching where it makes sense (Redis, CDN).

### Reliability
- Graceful degradation when things fail.
- Proper error handling and logging.
- Health checks and uptime monitoring.

### Maintainability
- Clean code structure and separation of concerns.
- Documentation for future-you and collaborators.
- Tests for critical paths.

### Security
- Auth done right (we're using Supabase + JWT).
- Input validation and sanitization.
- Never expose secrets, use environment variables.

---

## 3. Performance

- **Fast First Load**: App feels instant.
- **Smooth Interactions**: 60fps animations, no jank.
- **Optimized Assets**: Images compressed, lazy loading.
- **Offline-Friendly**: Core features work without network (future goal).

---

## 4. Accessibility

- Screen reader support.
- Sufficient color contrast.
- Touch targets large enough for all users.
- Text resizable without breaking layout.

---

## 5. User Trust

- **Transparent Data Usage**: Users know what we collect and why.
- **No Dark Patterns**: No tricks to keep users "engaged."
- **Respect User Time**: Do one thing well, don't bloat with features.

---

## 6. Analytics & Observability

- Know how users actually use the app.
- Track errors and crashes (Sentry, LogRocket).
- Measure what matters (not vanity metrics).

---

## The Vision

**Divi splits bills. That's it. But it does it so well that people choose it over Venmo's "request" feature or awkward group chats.**

A successful Divi means:
- Someone scans a receipt after dinner and everyone gets a text in 30 seconds.
- The UI is so clean people screenshot it.
- It "just works" — no crashes, no weird bugs, no confusion.

---

## Where We Are vs. Where We're Going

| Area | Current State | Target State |
|------|---------------|--------------|
| UI | Functional but basic | Modern, polished, premium feel |
| UX | Works but has friction | Delightful, 3-tap core flow |
| Infra | Render + Supabase | + Monitoring, caching, CDN |
| Testing | Manual | Automated critical paths |
| Performance | Acceptable | Fast and smooth everywhere |

---






*Last updated: Feb 2026*
🎯 Priority 1: Complete & Bulletproof Core Flow
The "happy path" should work flawlessly every time:

Scan receipt → Items extracted
Review/edit → Add people, assign items
Send → Everyone gets their text
View history → See past receipts, delete if needed
Ask yourself: Can you do this flow 10 times in a row without hitting a bug or confusion point?

🎯 Priority 2: Error Handling & Edge Cases
Users break things. The app shouldn't.

Scenario	Current Behavior?
No network connection	?
OCR fails / bad receipt image	?
Session expires mid-use	?
Backend is down	?
User has no contacts selected	?
🎯 Priority 3: Auth Edge Cases
What happens when token expires?
Proper logout flow (clear local state)
"Remember me" / persistent login
Handle account deletion (future)
🎯 Priority 4: Observability (Know What's Happening)
Before you have real users, set up:

Error tracking — Sentry (free tier) catches crashes
Basic analytics — Know if anyone uses it (Mixpanel, Amplitude, PostHog)
Backend logging — Render logs work, but structured logs are better
🎯 Priority 5: Beta Testing
Get 5-10 friends to actually use it

So currently, the app is suposed to tak two other options besides choose from library which is manual (manually input the info) and Scan (live camera). Lets get the easy part done first. Adhering to the current UI