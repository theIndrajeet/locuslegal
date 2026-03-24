

## Add Type Filter Pills Below Existing Filters

### What
Add a row of clickable pill/button filters (All, Law Firms, Chambers, Individual Advocates) just below the existing filter bar in `src/pages/Directory.tsx`. Each firm is auto-classified by parsing its name/tier.

### Changes — `src/pages/Directory.tsx` only

1. **Add `getType()` helper** (top of file):
   - Returns `"Chamber"` if name contains "chamber" (case-insensitive) or tier is "Individual Chamber"
   - Returns `"Individual Advocate"` if name contains "advocate", "adv.", or "adv "
   - Returns `"Law Firm"` for everything else

2. **Add state**: `const [type, setType] = useState("")`

3. **Add pill buttons** inside the filter `<section>`, just below the existing `rounded-2xl` div — a flex row of 4 pills: All, Law Firms, Chambers, Individual Advocates. Active pill gets `bg-accent text-accent-foreground`, inactive gets `bg-card border border-border`.

4. **Update `useMemo` filter**: add `if (type && getType(f) !== type) return false;`

5. **Show type badge** on each card alongside the tier badge.

No other files changed.

