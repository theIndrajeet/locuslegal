# Give the mobile dock more time before it collapses

## What happens today
`src/components/MobileBottomDock.tsx` collapses the expanded nav pill back to the single active-page chip after **1.5 seconds** of idle (no scroll, no tap). That's too short — by the time you finish reading the labels, it's already gone.

```ts
const IDLE_MS = 1500; // line 38
```

This timer fires:
- on initial mount
- after every scroll event
- on route change
- after tapping the collapsed pill to expand it
- after using Search / context action / nav link

## Change
Bump `IDLE_MS` from `1500` to `4500` (4.5 seconds). Keeps the auto-collapse behaviour intact — just gives users meaningful time to read and tap.

That's the only line touched. No other behaviour or visual change.

## Why 4.5s and not longer
- 4–5s is the standard "snackbar / toast" dwell time — long enough to read 7 nav labels comfortably, short enough that the dock still feels responsive and gets out of the way.
- If after testing you want it longer (e.g. 6s) or want it to **stay open until tap-outside**, that's a one-line tweak we can do next.
