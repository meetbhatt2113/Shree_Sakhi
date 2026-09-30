# Worker follow-up for the September usability release

The GitHub/Vercel deployment updates the website. It does **not** deploy `sakhi-ai-worker.mjs` to the existing Cloudflare Worker.

The Worker source now bounds request bodies before parsing (32 KiB JSON; 4.2 MB multipart), rejects unknown routes, and strengthens uncertainty/follow-up instructions. Existing API secrets remain in Cloudflare; none are added to this repository.

Deploy the updated Worker to the existing `sakhi-ai-proxy` service after checking its environment. Retain `GROQ_API_KEY` and the currently working `GROQ_MODEL` setting. Test chat, transcription and speech after deployment.

Optional binding configuration for Wrangler (merge into the existing Worker configuration; do not overwrite it):

```toml
[[ratelimits]]
name = "SAKHI_RATE_LIMITER"
namespace_id = "21130930"
[ratelimits.simple]
limit = 120
period = 60
```

Choose an unused namespace ID in this account. This configuration provides an aggregate limit of 120 requests per route per minute **per Cloudflare location**, shared by visitors. It is not per-user authentication or a global spend cap. If the binding is absent the Worker remains compatible but rate limiting is not active. Monitor 429 counts before adjusting the limit; speech uses multiple requests per reply. Rate-limit errors fail closed with 503. Configure provider usage limits separately.

Do not log question text, recordings, reply content, authorization headers or appointment notes. Monitor status counts and request duration using existing platform tools; no browser tracking service was added in this release.

Reference: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/

Clinical review remains outstanding. The new guide summaries show sources and a content-update date, not a clinical approval date. Arrange independent clinician review before claiming clinical validation.
