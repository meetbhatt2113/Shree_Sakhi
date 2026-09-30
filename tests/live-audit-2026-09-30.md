# Live reliability audit — 30 September 2026

Target: https://shreesakhiiiii.vercel.app/index.html
Baseline commit: 895919c1d3c3f8cf8e9e791fd81565cd88180d32
Environment: remote desktop Chrome. No physical iPhone or mobile network benchmark.
Only invented/general questions were used. No patient data or clinic messages.

## Live chat observations before fixes

| Mode | Question | Result |
| --- | --- | --- |
| English | What is the menstrual cycle? Explain simply. | English response received. |
| Hindi | What is the menstrual cycle? Explain simply. | Hindi response received despite English input. |
| Gujarati | What is the menstrual cycle? Explain simply. | Gujarati response received, but medically incorrect: it called the cycle “માનસિક” and placed the endometrium in the ovary. Failed content-quality check. |
| Auto | માસિક ચક્ર શું છે? | Gujarati detected; awkward wording. |
| Auto | मासिक धर्म चक्र क्या है? | Hindi detected. |
| Auto | Menstrual cycle kya hai? Simple words mein batao. | Latin-script Hinglish response received. |

These are language-routing spot checks, not a clinical assessment of every answer.

## Backend checks

- Live health GET returned 200 and hasKey=true. This does not prove other protections.
- Live site headers include nosniff, DENY framing, strict-origin-when-cross-origin and restricted microphone/camera permissions.
- Live AI response headers include Cache-Control: no-store.
- Five direct HTTP validation probes (invalid origin, invalid JSON, oversized body, overlong message and wrong content type) all received Cloudflare error 1010. This prevents attributing rejection to the application's validation. No bypass attempted.
- Repository Worker tests pass for body limits, origin restrictions, invalid JSON, optional rate-limit binding and fail-closed limiter errors.
- Live Worker version and SAKHI_RATE_LIMITER binding are unverified. Updating GitHub/Vercel does not deploy the Cloudflare Worker. No load test performed.

## Changes in this release

- Restore failed questions without overwriting a new draft.
- Replay invokes device speech synchronously from the click; avoid waiting for a network request before Safari speech starts. Automatic English playback still uses the existing AI speech path.
- Show an actionable status when device speech does not start.
- Precache only the shared shell instead of all HTML pages. Other supported pages become available offline after being visited under the service worker.
- Preconnect to the font asset host on the homepage. No measured speedup claimed.
- Use a narrow fixed educational definition for basic menstrual-cycle questions on the homepage and in Worker source. Longer symptom questions still reach the existing AI handling. Sources: CDC menstrual hygiene and Cleveland Clinic menstrual cycle pages, checked 2026-09-30. Hindi/Gujarati clinical translation review remains pending.

## Automated checks

Run: `node tests/release-checks.mjs`

Coverage includes cancellation suppressing late responses; failed-question restoration; preservation of newly typed drafts; synchronous replay and recording guard; matching website/Worker definitions; longer symptom questions bypassing fixed definitions; calendar IST-to-UTC conversion, midnight rollover, invalid/past dates, Unicode line folding, injection escaping and symptom exclusion; optional local saving and deletion.

## Still needs real-device verification

- iPhone Safari: permit mic, record in English/Hindi/Gujarati, stop, inspect transcript, play reply and Replay, repeat after playback; confirm actual audio and selected language.
- Verify with mic permission denied, silent mode and background/foreground changes.
- Calendar: enter a future IST appointment, download .ics, import into the phone calendar, verify displayed local time/duration and 15-minute alert. Confirm no symptom notes are included. Browser automation previously observed the prepared status but did not capture the download event; download/import is not marked passed.
- Measure mobile performance on a real device or controlled throttling; desktop rendering is not evidence of mobile speed.
- Deploy Worker separately and verify its configured rate-limit binding through the owner account.
