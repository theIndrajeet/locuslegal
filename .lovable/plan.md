## Remove "Verified only" filter chip

The "Verified only · 51" toggle next to the Mail Now / Cold Call switch on `/directory` will be removed. Verified firms will still float to the top of results (sort logic unchanged) and will still display the "Verified" badge on their cards.

### Changes
- `src/pages/Directory.tsx`
  - Delete the "Verified only" `<button>` block (lines ~320–332).
  - Remove the now-unused `verifiedOnly` state, the `?verified=1` URL sync, and the `verifiedOnly` branch inside the filter `useMemo`.
  - Drop `verifiedCount` constant and the `ShieldCheck` import if no longer used elsewhere in the file (it is still used for the per-card badge, so keep the import).

No data, schema, or other component changes required.