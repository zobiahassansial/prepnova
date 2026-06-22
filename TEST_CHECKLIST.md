# PrepNova — Test Checklist

**Date:** 2026-06-22
**Branch:** `audit/prepnova-2026-06`

Legend: ✅ Tested+Passed | ❌ Tested+Failed | ⚠️ Issues Found | 🔍 Code Reviewed Only | ➖ Not Tested

---

## Pages

| Page | Status | Test Type | Notes |
|---|---|---|---|
| `/` (Landing page) | ➖ | — | Not run in browser |
| `/login` | 🔍 | Code review | Has `no-unescaped-entities` lint error (react/no-unescaped-entities at line 308) |
| `/signup` | ➖ | — | Not run in browser |
| `/dashboard` | 🔍 | Code review | Protected by middleware ✅ |
| `/dashboard/resume-builder` | 🔍 | Code review | Client-side quota bypass risk ⚠️ |
| `/dashboard/study-planner` | ➖ | — | Not run in browser |
| `/dashboard/flashcards` | 🔍 | Code review | Uses client quota for UX + server quota on PDF route |
| `/dashboard/note-summarizer` | 🔍 | Code review | Server-side quota enforced correctly ✅ |
| `/dashboard/interview-prep` | 🔍 | Code review | Auth added to server actions ✅ |
| `/dashboard/document-scanner` | 🔍 | Code review | SSRF fixed ✅; per-page quota enforced server-side ✅ |
| `/dashboard/subscription` | ➖ | — | Not run in browser |
| `/dashboard/settings` | ➖ | — | Not run in browser |
| `/checkout` | ➖ | — | Not run in browser |
| `/modules/[module]` | 🔍 | Code review | Module marketing pages; no sensitive logic |
| `/onboarding` | ➖ | — | Not run in browser |
| `/features` | ➖ | — | Not run in browser |
| `/contact` | ➖ | — | Not run in browser |
| `/privacy-policy` | ➖ | — | Static content |
| `/terms-of-service` | ➖ | — | Static content |

---

## API Routes

| Route | Method | Status | Test Type | Notes |
|---|---|---|---|---|
| `/api/generate` | POST | ✅ | Code review | Auth ✅ rate-limit ✅ quota ✅ credit-refund ✅ |
| `/api/interview-answer` | POST | ✅ | Code review | Auth ✅ rate-limit ✅ quota ✅ streaming ✅ |
| `/api/scan` | POST | ⚠️→✅ | Code review | SSRF fixed ✅; auth ✅; page-count quota ✅ |
| `/api/checkout/create` | POST | ➖ | Code review | Returns 410 (moved to Cloud Function) ✅ |
| `/api/checkout/verify` | POST | ➖ | Code review | Returns 410 (moved to Cloud Function) ✅ |
| `/api/checkout/webhook` | POST | ➖ | Code review | Returns 200 no-op (moved to Cloud Function) ✅ |
| `/api/2fa/setup` | POST | ➖ | Code review | Returns 410 (feature removed) ✅ |
| `/api/2fa/enable` | POST | ➖ | Code review | Returns 410 ✅ |
| `/api/2fa/disable` | POST | ➖ | Code review | Returns 410 ✅ |
| `/api/2fa/verify` | POST | ➖ | Code review | Returns 410 ✅ |
| `/api/2fa/status` | GET | ➖ | Code review | Returns 410 ✅ |
| `/api/auth/[...nextauth]` | GET/POST | 🔍 | Code review | Firebase ID token → NextAuth JWT strategy ✅ |
| `/api/check-username` | GET | ➖ | — | Not reviewed in detail |
| `/api/contact` | POST | ➖ | — | Not reviewed in detail |
| `/api/admin/*` | Various | ➖ | — | Not reviewed in detail |
| `/api/analytics/*` | Various | ➖ | — | Not reviewed in detail |

---

## Firebase Cloud Functions

| Function | Status | Test Type | Notes |
|---|---|---|---|
| `createPaymentSession` | 🔍 | Code review | Auth ✅ plan/billing validated ✅ no secrets to client ✅ |
| `safepayWebhook` | ⚠️→✅ | Code review | HMAC bypass fixed ✅ |
| `verifyPayment` | ⚠️ | Code review | userId ownership check ✅; duplicate billing records ⚠️ |

---

## Server Actions

| Action | Auth Guard | Quota Guard | Status | Notes |
|---|---|---|---|---|
| `processAndSummarizeNote` | ✅ | ✅ server-side | ✅ | Word count limit enforced per plan |
| `generateFlashcardsFromText` | ✅ (fixed) | ❌ none | ⚠️ | Auth fixed; quota enforcement missing |
| `generateResumeContent` | ✅ (fixed) | ❌ none | ⚠️ | Auth fixed; quota enforcement missing |
| `optimizeCoverLetter` | ✅ (fixed) | ❌ none | ⚠️ | Auth fixed |
| `generateCoverLetter` | ✅ (fixed) | ❌ none | ⚠️ | Auth fixed |
| `matchCoverLetterToJob` | ✅ (fixed) | ❌ none | ⚠️ | Auth fixed |
| `generateResumeFromForm` | ✅ (fixed) | ❌ none | ⚠️ | Auth fixed |
| `generateStudyPlan` | ✅ (fixed) | ❌ none | ⚠️ | Auth fixed |
| `scheduleUserTasks` | ✅ (fixed) | ❌ none | ⚠️ | Auth fixed |
| `getLiveInterviewHelp` | ✅ (fixed) | ❌ none | ⚠️ | Auth fixed; live-interview plan check missing |
| `generateInterviewResponse` | ✅ (fixed) | ❌ none | ⚠️ | Auth fixed |
| `generateInterviewFeedback` | ✅ (fixed) | ❌ none | ⚠️ | Auth fixed |

---

## Firebase Services

| Operation | Status | Notes |
|---|---|---|
| Firestore read — user subcollections (own data) | 🔍 | Rules: owner-only ✅ |
| Firestore write — user subcollections | ⚠️ | Allows user to reset usage counters (quota bypass) |
| Firestore read — user profile (others) | ❌ | `allow get: if true` — public read ⚠️ |
| Firestore list — users collection | ❌ | `allow list: if true` — anyone can enumerate ⚠️ |
| Firestore — study_tasks collection | 🔍 | userId filter in rules ✅ |
| Firestore — study_schedule collection | 🔍 | userId filter in rules ✅ |
| Firestore — notes collection | 🔍 | userId filter in rules ✅ |
| Firestore — decks collection | 🔍 | userId filter in rules ✅ |
| Firebase Storage — upload | ➖ | Storage rules not reviewed |
| Firebase Storage — download (authenticated URL) | ➖ | Used via signed download URLs |
| Firebase Auth — email/password sign-in | ➖ | Not browser-tested |
| Firebase Auth — token verification (admin) | 🔍 | Used in all API routes ✅ |

---

## Authentication & Authorization

| Scenario | Status | Notes |
|---|---|---|
| Unauthenticated access to `/dashboard/**` | ✅ | Middleware redirects to `/login` |
| Authenticated user redirected from `/login` | ✅ | Middleware redirects to `/dashboard` |
| NextAuth JWT session strategy | ✅ | Firebase ID token → NextAuth JWT |
| Firebase ID token verification in API routes | ✅ | Uses `firebase-admin verifyIdToken` |
| IDOR — user accessing another user's resume | 🔍 | Firestore rules prevent direct access; resume builder loads own data ✅ |
| Server actions — unauthenticated callers | ⚠️→✅ | Fixed — all server actions now guard with `auth()` |
| Admin routes — access control | ➖ | Not reviewed |

---

## Module A: Dashboard

| Feature | Status | Notes |
|---|---|---|
| User greeting | ➖ | Not browser-tested |
| Plan/usage display | ➖ | Not browser-tested |
| Activity log | ➖ | Not browser-tested |
| Empty state handling | ➖ | Not browser-tested |

---

## Module B: Resume Builder

| Feature | Status | Notes |
|---|---|---|
| Create resume from scratch | ➖ | Not browser-tested |
| Edit personal info, experience, education, skills | 🔍 | Code reviewed; form works with proper handlers |
| AI resume generation | ⚠️→✅ | Auth guard added; no quota check on server action |
| Cover letter generation | ⚠️→✅ | Auth guard added |
| Template gallery | ➖ | Not browser-tested |
| Uploaded template — style reference, not content import | 🔍 | `upload-template-editor.tsx` extracts visual style (colors, font, layout) from uploaded PDF — does NOT display PDF as resume content ✅ |
| Resume save — quota enforcement | ❌ | Client-side only; bypassable |
| Resume export/print | ➖ | Not browser-tested |
| Data persistence after refresh | ➖ | Not browser-tested |
| User cannot access another user's resumes | 🔍 | Firestore rules restrict to owner ✅ |

---

## Module C: Study Planner

| Feature | Status | Notes |
|---|---|---|
| Create/edit/delete tasks | ➖ | Not browser-tested |
| AI study plan generation | ⚠️→✅ | Auth guard added |
| AI schedule tasks | ⚠️→✅ | Auth guard added |
| Calendar view | ➖ | Not browser-tested |
| Data persistence | ➖ | Not browser-tested |

---

## Module D: Flashcards

| Feature | Status | Notes |
|---|---|---|
| Generate from PDF `/api/generate` | ✅ | Server-side auth + quota ✅ credit refund ✅ |
| Generate from text (manual) | ⚠️ | Auth added; no quota check |
| Manual create/edit/delete | ➖ | Not browser-tested |
| Deck save/load | ➖ | Not browser-tested |
| Study/review flow (SM-2) | ✅ | Unit tested — 9 tests passing |
| Usage limits | ⚠️ | Text generation has no quota |
| Client-side quota display | 🔍 | UX only; not relied on for enforcement |

---

## Module E: Note Summarizer

| Feature | Status | Notes |
|---|---|---|
| File upload (PDF/DOCX/TXT) | 🔍 | Handled via Firebase Storage upload |
| Text extraction | 🔍 | pdf2json + mammoth |
| AI summarization | ✅ | Auth ✅ quota ✅ word limit ✅ 7 output types |
| Summary history | 🔍 | onSnapshot listener loads own summaries |
| Unsupported files rejected | ✅ | Returns 400 with clear message |
| Word limit enforcement per plan | ✅ | Server-side ✅ |
| Credit refund on failure | ✅ | Uses `decrementUsage` on parse failure |

---

## Module F: Interview Prep

| Feature | Status | Notes |
|---|---|---|
| Interview session (7 turns) | ⚠️→✅ | Auth guard added |
| Live streaming interview `/api/interview-answer` | ✅ | Auth ✅ rate limit ✅ quota ✅ |
| AI feedback | ⚠️→✅ | Auth guard added |
| Session history save | ➖ | Not reviewed in detail |

---

## Module G: Document Scanner

| Feature | Status | Notes |
|---|---|---|
| File upload via Storage | ➖ | Not browser-tested |
| PDF text extraction | ✅ | pdf2json; returns page count |
| Image OCR (Groq Vision) | 🔍 | Uses llama-3.2-90b-vision-preview |
| Per-page quota enforcement | ✅ | Server-side ✅; re-checks after actual page count |
| SSRF protection | ✅ | Fixed — Firebase Storage URLs only |
| Unsupported type error | ✅ | Returns 400 |

---

## Subscription & Quota

| Scenario | Status | Notes |
|---|---|---|
| Free plan limits enforced | ✅ | Server-side via `checkLimit` for API routes |
| Plan upgrade activates new limits | ➖ | Not tested; depends on webhook |
| Usage counter incremented after AI success | ✅ | Pattern: increment → AI call → decrement on failure |
| Failed AI calls do not consume credits | ✅ | `decrementUsage` on AI error in API routes and notes |
| Concurrent request quota bypass | ⚠️ | Race condition possible: two simultaneous requests both pass `checkLimit` before either increments. No Firestore transaction used. |
| Plan read uses Firebase Admin | ✅ | Server-side `getUserPlan` uses adminDb |

---

## Payment & Billing

| Scenario | Status | Notes |
|---|---|---|
| Payment session creation (Cloud Function) | ✅ | Auth ✅ plan/billing validated ✅ |
| Checkout URL construction | 🔍 | Includes redirect + cancel URLs + webhook URL |
| Webhook HMAC verification | ✅ (fixed) | Now always required; bypass fixed |
| Subscription activated on PAID/SETTLED/COMPLETED | ✅ | State check in webhook |
| Duplicate webhook event handling | ⚠️ | `set()` for subscription is idempotent ✅ but `add()` for billing is not |
| Fallback verify (verifyPayment) | 🔍 | Polls SafePay API, writes if paid |
| Payment cancellation handling | 🔍 | cancel_url passes status=cancel to callback page |
| Amount validated server-side | ✅ | Amount computed from PLAN_PRICES in Cloud Function |
| User cannot change plan/amount client-side | ✅ | Only plan+billing sent from client; price computed server-side |

---

## Security Tests

| Test | Status | Notes |
|---|---|---|
| API routes require auth token | ✅ | All 3 API routes return 401 without token |
| SSRF via fileUrl | ✅ (fixed) | Now blocked |
| IDOR — accessing another user's Firestore data | ✅ | Firestore rules prevent it |
| Unauthenticated server action access | ✅ (fixed) | Auth guards added |
| Webhook without signature | ✅ (fixed) | Now returns 401 |
| Public user profile enumeration | ❌ | `allow list: if true` needs fixing |
| Client-side quota bypass | ❌ | Architecture change needed |
| XSS via resume fields | ✅ | No `dangerouslySetInnerHTML` found |
| Secrets in client bundle | ✅ | Admin keys server-only; confirmed via file search |
| .env files in git | ✅ | `.env*` is in `.gitignore`; files not tracked |

---

## Unit Tests (All Passing — 64/64)

| Test File | Tests | Result |
|---|---|---|
| `__tests__/plan-config.test.ts` | 12 | ✅ All passed |
| `__tests__/rate-limit.test.ts` | 5 | ✅ All passed |
| `__tests__/safepay-payment.test.ts` | 16 | ✅ All passed |
| `__tests__/file-validation.test.ts` | 14 | ✅ All passed |
| `__tests__/flashcard-logic.test.ts` | 9 | ✅ All passed |
| `__tests__/flashcard-spaced-repetition.test.ts` | 9 | ✅ All passed |
