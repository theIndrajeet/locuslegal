## Goal

Send one broadcast email to every Locus user (and waitlist) acknowledging the recent maintenance window, and pointing them to the new Bar challenges + new vacancies they may have missed.

This uses your existing **Updates Broadcast** system at `/admin/updates` — no new infrastructure or code needed. I'll just hand you the ready-to-paste copy and you click "Send to all users".

## What I'll prepare

A single draft with all four fields filled in:

**Subject**
> You missed a few things while we were under the hood

**Preheader**
> New Bar challenges, fresh vacancies, and what was happening behind the scenes.

**Body (Markdown)**

```
Hey,

Quick note — Locus was under maintenance for a short stretch this week
while we shipped some upgrades behind the scenes. If you tried to log in
or got radio silence on notifications, that's why. Everything is back,
faster, and you may have missed a couple of things worth your time.

**New on The Bar**
We dropped a fresh batch of challenges across Brief Builder, Ethics, and
Client Counseling — including bail applications, writ petitions, medical
negligence, and a few that will genuinely make you think twice before
hitting submit. Climb the leaderboard while it's still early.

**New vacancies live now**
The Vacancy Board picked up new internships and openings during the
quiet period. They expire fast — first to apply, first considered.

**Heads-up on emails**
A few of you may not have received notifications during the maintenance
window. If you saw nothing from us in the last few days, this is the
catch-up. Going forward, you'll get pinged the moment a new challenge
or vacancy goes live.

Sorry for the silence — and thanks for sticking around.

— Locus
```

**CTA label**
> Open Locus

**CTA URL**
> https://locus.legal/the-bar/browse

(Single CTA points to The Bar; the body links can stay as plain references — the system already appends a branded footer + unsubscribe link automatically.)

## How to send

1. I open `/admin/updates`
2. I paste the four fields above into the composer
3. You hit **"Send test to me"** first to QA in your inbox
4. Once it looks right, hit **"Send to all users"** — it queues to every signed-up user + waitlist email, deduped, suppressed addresses skipped

## Notes

- I will NOT auto-send. The plan only pre-fills the composer; the "Send to all" click stays with you.
- I won't modify any code or add new files — this is pure content in your existing system.
- If you want a different tone (more apologetic, more casual, shorter), tell me before I draft it into the page.

Want me to also add a "pre-filled draft" button to `/admin/updates` so you can one-click-load this exact copy? Or just paste it in for you this once?