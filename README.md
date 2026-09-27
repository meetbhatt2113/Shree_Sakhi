# Shree Sakhi

An educational site about menstrual and pregnancy health. The current deployment is static HTML on Vercel, with a separate Cloudflare Worker sending AI questions to Groq.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/index.html`. AI requests still go to the deployed Worker and its CORS policy currently allows only the production domain, so local AI chat needs a separate development origin configuration.

## Production work in progress

The current branch corrects misleading form and privacy claims, makes AI failures visible in the browser console, and restricts offline caching to first-party pages. This is a foundation, **not a clinical or legal approval**.

## Replace the Groq Worker

The standalone source is [`sakhi-ai-worker.mjs`](sakhi-ai-worker.mjs). In Cloudflare, open **Workers & Pages → sakhi-ai-proxy → Edit code**, replace the Worker source with that file's contents, then deploy. Keep `GROQ_API_KEY` in **Settings → Variables and Secrets** as a Secret. The website posts `{system, message}` and expects `{reply}`; this Worker accepts the same request and ignores browser-supplied system instructions.

The public page sends requests to `/api/sakhi-ai`. Vercel routes that path to the Worker through `vercel.json`, so the chat interface and browser request URL use the Shree Sakhi domain. The upstream destination still appears in the public repository configuration; a URL is not a secret. The API key stays in the Worker Secret. Deploy the website files and Worker code together, then test text chat and the browser network request on the Vercel site.

The Worker uses deterministic replies for privacy, self-harm concerns, selected medical emergencies, condom failure, and obvious unrelated requests. Other questions still go to Groq. It detects the user's language and rejects obvious script mismatches, but fluent translations and medical accuracy still require human review. Change `GROQ_MODEL` in Cloudflare Variables if your account has access to a better model. Do not set it to a model that the account cannot access.

Before using the service at scale, add Cloudflare rate limiting and a Groq spending limit. Review every fixed health response and translation with a qualified professional. Test the 20 representative questions again after deployment; a local mock response cannot establish medical accuracy.

## Optional saved questions

The chat has an unchecked contribution option for adults. Only selected questions are saved; urgent questions are excluded. A deletion receipt is kept in that visitor's browser, and the Worker offers a `DELETE` request with that receipt. No admin read endpoint is exposed publicly. The D1 table stores the question, detected language, date, and a hash of the deletion code; it does not store the AI reply, name, phone, or IP address.

1. Create a D1 database named `sakhi-questions` in Cloudflare. In its **Console**, run the SQL in `questions-schema.sql`.
2. Bind the database to the existing Worker with the exact binding name `QUESTIONS_DB` (Workers & Pages → Worker → Settings → Bindings).
3. Replace the Worker code with `sakhi-ai-worker.mjs` and deploy. Keep `GROQ_API_KEY` as a Secret.
4. Add a daily Cron Trigger (`0 3 * * *`, UTC) to the same Worker. Its `scheduled()` handler deletes records older than 30 days. Until the Cron Trigger is active, the promised automatic expiry does not happen.
5. Deploy the updated website files to Vercel. The checkbox and deletion button send requests to `/api/sakhi-ai`, which `vercel.json` forwards to the Worker.
6. Test an unchecked question (no database row), an opted-in adult question (one row), deletion (row removed), and daily cleanup. Review your privacy policy and collection flow with a qualified adviser before using real health questions.

You can review consented questions in the D1 Console, for example:

```sql
SELECT id, question, language, datetime(created_at/1000, 'unixepoch') AS created_utc
FROM contributed_questions ORDER BY created_at DESC LIMIT 50;
```

Restrict access to the Cloudflare account: these questions may contain sensitive health information. Do not publish raw questions as testimonials or FAQs without separate permission and editorial review.

Before enabling paid features or human support:

1. Have a qualified clinician review health content, dates, escalation language, and cited sources. Recheck helpline numbers and hours with the organizations.
2. If collecting user questions or callback numbers, build a real backend inbox, staffed workflow, consent notice, retention schedule, deletion process, and abuse protection. Do not re-enable the old browser-only forms.
3. Add server-side AI rate limiting, budget caps, observability without storing sensitive prompts, and controlled model selection. Keep `GROQ_API_KEY` only in the Worker secret store.
4. Reconcile the privacy and terms pages against the real hosting, AI, analytics, and payment data flows. Get local professional review before processing health data or minors' information.
5. Establish a support and complaint contact, payment terms, refunds, invoice/tax handling, and clear separation between educational content and paid services.

## Possible monetization sequence

Start with free, medically reviewed information and measure whether users return. Test one opt-in paid feature with clear pricing and refunds. Keep emergency information and core educational material accessible without payment. Do not promise a human response unless a staffed service exists.

## Home page redesign (September 2026)

The homepage now loads `studio.css` after `refresh.css`. Deploy **both** the updated `index.html` and new `studio.css`; the service worker version was also raised so returning visitors receive the new styling. The redesign adds direct paths to AI, periods, pregnancy, and tools, as well as a clearly labeled future ideas section. Existing AI, consent, tools, and support sections remain in place.

The future section describes concepts under consideration, not available services. Review the English-only new path cards and future section before advertising the site as fully translated. Check the layout on physical iOS Safari and Android Chrome, especially the voice flow, because voice recognition depends on device and browser support.

## Topic-page layout (September 2026)

The homepage (`index.html`) now leads with Sakhi AI. Topics are separate pages: `periods.html`, `pregnancy.html`, `tools.html`, `faqs.html`, `wellbeing.html`, `care.html`, and `about.html`. All topic pages load the shared stylesheet `portal.css` and script `site.js`; the existing components still use the base styles in `index.html` copied into their page heads and `refresh.css`. Deploy the entire folder together so navigation, scripts, and the service worker remain in sync. Old homepage fragment links to moved topics are redirected by `site.js`.

The site is not live from this local edit. Check text chat, optional question saving/deletion, trackers, tabs, and mobile navigation on the deployed domain after uploading. Voice dictation support depends on the visitor's browser and device; iOS visitors can type questions.
