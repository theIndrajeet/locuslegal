

# Force redeploy of rit-chat

Source code is already fixed (uses `auth.getUser(token)`), but the deployed runtime still throws `getClaims is not a function` — auto-deploy didn't pick up the previous edit. Just need to manually redeploy.

## Action

Run `supabase--deploy_edge_functions` with `["rit-chat"]`, then re-test by sending a chat message on a real attempt and verifying logs no longer contain the `getClaims` TypeError.

## Files

No code changes. Deployment-only fix.

## Definition of Done

Edge function logs show a fresh boot followed by successful `200` responses (no `getClaims` errors). Tapping "Why isn't my answer correct?" on a real post-attempt screen returns an AI reply within ~5s instead of "Rit couldn't reply."

