## Wipe seeded beta testers

**Single migration**: `DELETE FROM public.beta_testers;`

This removes the 7 pre-seeded entries (Abhishek, Aditi, Anam, Asmi, Khushbu, Reshad, Indrajeet). The `claim_beta_slot` RPC auto-numbers from `MAX(slot_number) + 1`, so after the wipe the next person to claim becomes Founding Tester #001 — and the counter on `/beta` will read `0 CLAIMED · 0 SUBMITTED` until then.

No frontend code changes needed.