# Admin Playbook — common owner operations

Practical snippets for running Proscene day-to-day: comping an org, recovering
an admin, extending a trial, lifetime deals, and discounts. Most are SQL you run
in the **Supabase SQL editor** (project `avqgfzrcwegebtbvmcwo`); a few are done in
the **Stripe dashboard**, noted as such.

> **Golden rule:** always run the `SELECT` first to confirm the exact row, then
> run the `UPDATE`/`INSERT` scoped to the **id** you confirmed. Never update by
> name alone.

---

## How billing fields fit together

On `organizations`:

| Column | Meaning |
|---|---|
| `grandfathered` (bool) | `true` = permanent full access. Short-circuits everything — no trial, no lock, no purge, no lifecycle emails. This is the comp / lifetime-access lever. |
| `plan` | `free` \| `season` \| `repertory` \| `company`. Concurrency limits 1 / 1 / 3 / unlimited. Normally set by the Stripe webhook. |
| `subscription_status` | `active` / `past_due` / `canceled` / `trialing` / null. Set by Stripe. `active`/`past_due` = full access. |
| `trial_started_at` | Set **once** when the org creates its first production. The whole clock derives from this: lock at +90 days, file purge at +180. |
| `trial_ends_at` | `trial_started_at + 60 days`. Drives the in-app "trialing" access state. |
| `billing_lifecycle_stage` | 0–7. How far the daily cron has emailed/purged. Reset to 0 to "start over." |

Precedence for access: **subscription (active/past_due) → grandfathered → trial window → locked.**

---

## Find an org or a person

```sql
-- Org by name or slug
SELECT id, name, slug, plan, grandfathered, subscription_status,
       trial_started_at, trial_ends_at, billing_lifecycle_stage
FROM organizations
WHERE name ILIKE '%lincoln%' OR slug ILIKE '%lincoln%';

-- Person by email
SELECT id, email, first_name, last_name FROM profiles
WHERE email ILIKE '%jane@%';

-- Everyone in an org and their role
SELECT p.email, p.first_name, p.last_name, m.role
FROM organization_memberships m
JOIN profiles p ON p.id = m.user_id
WHERE m.organization_id = '<org-id>'
ORDER BY m.role;
```

---

## Comp an org (free forever)

The simplest "give them a free account." Works for a charity, a partner, an
early supporter — anyone you want on full access at no charge.

```sql
SELECT id, name, grandfathered FROM organizations WHERE slug = 'their-slug'; -- confirm
UPDATE organizations SET grandfathered = true, updated_at = now() WHERE id = '<org-id>';
```

To un-comp (put them back on normal billing):

```sql
UPDATE organizations SET grandfathered = false, updated_at = now() WHERE id = '<org-id>';
```

---

## Lifetime deal (pay once, access forever)

Don't model this as a subscription with a "forever" 100%-off coupon — you'd get
recurring $0 invoices. Instead:

1. Take a **one-time payment** in Stripe (a Payment Link or one-off price).
2. Then comp the org in the DB — same as above:

```sql
UPDATE organizations SET grandfathered = true, updated_at = now() WHERE id = '<org-id>';
```

`grandfathered` *is* your lifetime-access flag.

---

## Discounts (educator rate, launch promo) — Stripe, not SQL

Discounts live in **Stripe → Products → Coupons**, applied via **Promotion
codes** at checkout (we already enable promo codes).

| Goal | Coupon `duration` |
|---|---|
| One term only (e.g. trial nudge 15% off) | `once` |
| First N months/years | `repeating` (`duration_in_months`) |
| **Educator rate — every renewal** | `forever` |

Make a **separate coupon per purpose** (duration can't be changed after
creation). Wrap each in a promotion code with guardrails — expiry,
`max_redemptions: 1`, restrict to one customer — so a code can't be shared.
Hand educators a code after you verify the school via the contact form.

---

## Extend a trial

Give an org more runway. Moving `trial_started_at` shifts the *entire* clock
(lock at +90, purge at +180), so this is the clean way:

```sql
-- e.g. give them a fresh 60 days starting today, and restart the email cadence
UPDATE organizations
SET trial_started_at = now(),
    trial_ends_at    = now() + interval '60 days',
    billing_lifecycle_stage = 0,
    updated_at = now()
WHERE id = '<org-id>';
```

(Reset `billing_lifecycle_stage = 0` so the lifecycle emails don't think they've
already fired.)

---

## Recover an admin (creator left / lost access)

The app already prevents a zero-admin org (it won't let you remove or demote the
last admin), and any admin can promote others in **Settings → Members**. Use SQL
only when there's no reachable admin left.

```sql
-- Promote an existing member of the org to admin
UPDATE organization_memberships
SET role = 'admin'
WHERE organization_id = '<org-id>' AND user_id = '<member-id>';

-- If the person has a profile but no membership in that org yet, add one
INSERT INTO organization_memberships (user_id, organization_id, role)
VALUES ('<member-id>', '<org-id>', 'admin');
```

Tip to prevent this: encourage every org to keep **at least two admins**.

---

## Manually set a plan (rare)

The Stripe webhook normally sets `plan`. Only override by hand to fix a desync.
Remember the concurrency limit follows the plan (free/season = 1, repertory = 3,
company = unlimited):

```sql
UPDATE organizations SET plan = 'company', updated_at = now() WHERE id = '<org-id>';
```

---

## Stop lifecycle emails / the purge for an org

Comping (`grandfathered = true`) removes an org from the cron entirely. To pause
without comping, push `billing_lifecycle_stage` to the terminal value so it
won't email or purge:

```sql
UPDATE organizations SET billing_lifecycle_stage = 7, updated_at = now() WHERE id = '<org-id>';
```

> The day-180 purge only ever targets **non-grandfathered, never-subscribed**
> orgs and deletes **uploaded file bytes only** (documents, attachments, images),
> scoped to that org's productions — never DB rows, never another org, never
> workspace logos. Your existing orgs are all grandfathered, so none are eligible.

---

## Recover a deleted workspace or production (within 30 days)

Delete is a **soft-delete** — the row and all its data are retained; only
`deleted_at` is set. Restore by clearing it (within the 30-day window, before
any future purge runs).

```sql
-- Find a soft-deleted workspace
SELECT id, name, slug, deleted_at
FROM organizations
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- Restore it (scope to the confirmed id)
UPDATE organizations SET deleted_at = NULL, updated_at = now()
WHERE id = '<org-id>';
```

Restoring an org does **not** re-select it for the user who deleted it (their
`profiles.selected_organization_id` was moved off). They'll see it again in the
workspace switcher and can switch back in; or set it for them:

```sql
UPDATE profiles SET selected_organization_id = '<org-id>'
WHERE id = '<user-id>';
```

Productions are normally self-serve restorable by an admin from the
**Recently deleted** section on `/productions`. To restore one by hand:

```sql
SELECT id, title, slug, organization_id, deleted_at
FROM productions
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

UPDATE productions SET deleted_at = NULL, updated_at = now()
WHERE id = '<production-id>';
```

> There is **no automatic hard purge yet** — soft-deleted rows past 30 days are
> hidden but not removed, so recovery is always possible until a purge step is
> built.

---

## When in doubt

Tell Claude the org name and what you want; you'll get a `SELECT` to confirm the
target and a scoped statement to run — or Claude can run it for you against the
Supabase project.
