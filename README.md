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

## Question saving is disabled on the website

The site does not show a question-saving checkbox or deletion button and sends no save request. The D1 schema and dormant Worker support remain in the repository for a future opt-in launch, but no D1 database is required for the current website. Before enabling saving later, set up D1, retention cleanup, privacy review, and consent controls together.

Before enabling paid features or human support:

1. Have a qualified clinician review health content, dates, escalation language, and cited sources. Recheck helpline numbers and hours with the organizations.
2. If collecting user questions or callback numbers, build a real backend inbox, staffed workflow, consent notice, retention schedule, deletion process, and abuse protection. Do not re-enable the old browser-only forms.
3. Add server-side AI rate limiting, budget caps, observability without storing sensitive prompts, and controlled model selection. Keep `GROQ_API_KEY` only in the Worker secret store.
4. Reconcile the privacy and terms pages against the real hosting, AI, analytics, and payment data flows. Get local professional review before processing health data or minors' information.
5. Establish a support and complaint contact, payment terms, refunds, invoice/tax handling, and clear separation between educational content and paid services.

## Possible monetization sequence

Start with free, medically reviewed information and measure whether users return. Test one opt-in paid feature with clear pricing and refunds. Keep emergency information and core educational material accessible without payment. Do not promise a human response unless a staffed service exists.

## Home page redesign (September 2026)

The home page now loads `portal.css` after `refresh.css`. Deploy the updated `index.html`, `portal.css`, and `site.js` together; the service worker version was also raised so returning visitors receive the new styling. The redesign adds direct paths to AI, periods, pregnancy, and tools, as well as a clearly labeled future ideas section. Existing AI, tools, and support sections remain in place.

The future section describes concepts under consideration, not available services. Review the English-only new path cards and future section before advertising the site as fully translated. Check the layout on physical iOS Safari and Android Chrome, especially the voice flow, because voice recognition depends on device and browser support.

## Topic-page layout (September 2026)

The homepage (`index.html`) now leads with Sakhi AI. Topics are separate pages: `periods.html`, `pregnancy.html`, `tools.html`, `faqs.html`, `wellbeing.html`, `care.html`, and `about.html`. All topic pages load the shared stylesheet `portal.css` and script `site.js`; the existing components still use the base styles in `index.html` copied into their page heads and `refresh.css`. Deploy the entire folder together so navigation, scripts, and the service worker remain in sync. Old homepage fragment links to moved topics are redirected by `site.js`.

The site is not live from this local edit. Check text chat, optional question saving/deletion, trackers, tabs, and mobile navigation on the deployed domain after uploading. Voice dictation support depends on the visitor's browser and device; iOS visitors can type questions.
