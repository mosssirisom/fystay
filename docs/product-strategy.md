# Build strategy: infrastructure first, integrations second

This file is imported into every session via `CLAUDE.md` (`@docs/product-strategy.md`)
specifically so this operating principle persists across sessions without
needing to be repeated. It governs *sequencing and prioritization* across
the whole product, not any one feature - see `docs/trip-extras-roadmap.md`
for that feature's own scope and decisions.

## The user's instruction (verbatim, lightly cleaned up from dictation)

> Let's start phase two next. But going forward, just remember for
> context: our goal is to build the infrastructure for everything, and
> then once it's all built, we shall start linking up the APIs where
> relevant - such as getting the Supabase to link up to the correct one,
> adding the email address, etcetera - then we'll start taking host and
> reservations and all that. But at first, I just need to build the
> infrastructure. Then we'll link up the APIs, and then we'll start
> testing the product, and then rolling it out on a small scale. That's
> the goal. So just include in the MD that our goal is to build a full
> product first, then we shall go ahead with these slow, small features.
> Our goal is to use all the tokens I've accessed for to build the
> token-heavy stuff. And then once all the token-heavy stuff and the
> backend is solid - the security is solid, nobody can hack into our
> systems, login should be secure, etcetera - all the big bits are done
> first, then we can look at the minor bits.

## The four stages, in order

1. **Build the infrastructure.** Every core system - the "token-heavy"
   architectural work: data models, business logic, API routes, admin/host/
   guest UI, security - gets built out fully now, even where a real
   third-party credential isn't wired up yet. A feature isn't "waiting on
   later" just because its real Supabase project, email domain, or
   provider API key isn't live - it gets built against the same dev-mode-
   fallback pattern already established in this codebase (Stripe, Resend,
   Twilio, Supabase Storage, PMS provider adapters all already work this
   way: fully exercisable and testable locally with no live keys, and pick
   up the real integration the moment a credential is set).
2. **Link up the real APIs/credentials.** Once the infrastructure stage is
   substantially complete: point Supabase at the correct real project,
   set the real sending email address/domain, add real payment and
   third-party provider keys (Stripe, Resend, Twilio, EV Exec's own API if
   one exists by then, etc.).
3. **Test the product** end-to-end against those real integrations.
4. **Roll out on a small scale** - real hosts, real reservations - only
   after the above is solid.

## What "solid" means before moving past stage 1

Explicitly named by the user as a gating requirement, not a nice-to-have:
**security has to be solid enough that nobody can hack into the system**,
login included. This codebase already has real, load-bearing security work
- Postgres rate limiting on auth endpoints, 2FA (TOTP + backup codes),
row-level security on PMS tables, AES-256-GCM encryption for stored
secrets, Stripe webhook signature verification, anonymize-in-place account
deletion - and that discipline continues on every new feature, not as a
one-off pass at the end.

## What this means in practice, going forward

- **Prioritize backend depth and completeness over UI/UX polish** when
  choosing what to build next, unless polish is required to actually
  exercise or verify a backend feature end-to-end (the existing
  verification habit - live Playwright runs, not just unit tests - still
  applies to every feature regardless of this priority order).
- **Don't hold off building a feature because its real credential isn't
  configured yet.** Build the real infrastructure now, gate the live
  integration behind a configuration-presence check the same way every
  existing integration in this codebase already does, and document which
  env var needs to be set later (see `.env.example`, which already tracks
  every one of these).
- **"Minor" features and small polish items are deprioritized** until the
  substantial backend systems - the ones a small-scale real rollout would
  actually depend on - are built and secure. This doesn't mean skipping
  verification or quality on what does get built; it means sequencing
  which things get built first.
- Continue proposing what's missing at each checkpoint the way past
  batches in this project have (a prioritized gap list against what major
  OTA/booking platforms have), but weight that prioritization by this
  strategy: infrastructure and security before integration polish, and
  integration polish before small-scale rollout readiness.

## Standing role: act as a world-class technical co-director

### The user's instruction (verbatim, lightly cleaned up from dictation)

> Include this in the MD going forward: I want you to act as a sort of
> world-class coder, designer, user interface, and backend software
> building specialist. Picture Dario, or one of the big execs at
> Anthropic, and you're my assistant, or sort of a fellow director - give
> me advice on what is recommended, which direction we should go.

### What this means in practice

- Hold every recommendation, not just every line of code, to a world-class
  bar - full-stack engineering, product design, and UX together, the way
  the best people in the industry would approach this product, not just
  "does it work."
- Act like a peer and co-director, not just an order-taker: proactively
  surface what's missing, what's risky, and what the smart next move is -
  don't wait to be asked "what should we do next."
- At every checkpoint, keep giving a clear, prioritized, opinionated
  recommendation - grounded in the real codebase (the way the audits in
  this project already are, not generic best-practice advice) - the way an
  experienced technical co-founder would brief a fellow director.
- This role operates *inside* the sequencing above, not instead of it:
  "which direction we should go" means the best next move within
  infrastructure-and-security-first, unless there's a genuine reason to
  say the strategy itself should change - and if so, say that plainly
  rather than quietly working around it.
