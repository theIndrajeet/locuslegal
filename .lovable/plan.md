

## Remove Testimonials, Money/Payment References, and Urgency Banner

### Changes to `src/components/ForFirms.tsx`:

1. **Remove testimonials data** (lines 37-48) and the `testimonialRef` (line 70), and **Block 5** (lines 149-170) entirely.

2. **Remove urgency banner** — delete `urgencyRef` (line 71) and **Block 6** (lines 172-182) entirely.

3. **Remove "Free forever for firms" value prop** (line 32) — the one with `BadgeDollarSign` icon that says "No subscription. No per-hire fee. No catch. We charge students, not firms."

4. **Clean up money/payment language elsewhere**:
   - Hero subtext (line 89): remove "For free." at the end → "LexRoot fixes that."
   - Value props heading (line 131): change "Zero cost. Zero noise." → "Zero noise." (remove cost claim)
   - CTA subheadline (line 212): change "It costs nothing. It takes 5 minutes." → "It takes 5 minutes."
   - CTA button (line 216): change "List My Firm — It's Free →" → "List My Firm →"
   - CTA microcopy (line 220): change "No payment. No commitment. Cancel anytime." → "No commitment. Cancel anytime."

5. **Remove unused imports**: `BadgeDollarSign`, `Quote` (no longer used after testimonials removal).

