

## Fix: Scroll Reveal Animation Causing Layout Jump

### Problem
The `useScrollReveal` hook applies `opacity: 0` and `translateY(24px)` via JavaScript *after* the component mounts. This means elements first render visibly, then suddenly jump down 24px and disappear, then animate back in. This causes the entire page to visually shift on load.

### Solution
Set the initial hidden state via CSS className (`opacity-0 translate-y-6`) so elements are hidden from the very first paint — no flash or jump. The hook then only needs to add the reveal transition.

### Changes

**`src/hooks/useScrollReveal.ts`** — Remove the JS lines that set initial `opacity`/`transform`. Instead, only animate *in* when intersecting. The initial hidden state is already on the elements via `className="opacity-0"`.

**`src/components/ForStudents.tsx`** — Add `translate-y-6` alongside existing `opacity-0` on each ref'd container, so the transform is set from first render (no JS flash).

**All other components using `useScrollReveal`** (`ForFirms.tsx`, `ForUniversities.tsx`, `WaitlistSection.tsx`, etc.) — Same fix: ensure each ref'd element has `opacity-0 translate-y-6` in its className.

This eliminates the visible jump because the browser never renders the element in its "visible" state first.

