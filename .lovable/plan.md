# Fix 3 Critical RLS Issues Before Beta Launch

## What's broken

1. **`beta_testers` SELECT policy** is `USING (true)` for `{public}` — anyone can scrape every tester's name + email.
2. **`beta_testers` UPDATE policy** `Anyone can mark tester submitted` lets any anon user flip `submitted_at` on any pending row, locking testers out.
3. **`profiles` SELECT policy** is `USING (true)` and exposes `cv_url` + `cv_uploaded_at` columns to the public — CV storage paths leak.

## Migration (single SQL file)

```sql
-- 1. beta_testers SELECT: drop public, allow only public-opted rows + admin + own row
DROP POLICY "Anyone can read beta testers" ON public.beta_testers;

CREATE POLICY "Public can view opted-in testers"
  ON public.beta_testers FOR SELECT TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "Users can view own beta tester row"
  ON public.beta_testers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. beta_testers UPDATE: drop the open policy, replace with RPC
DROP POLICY "Anyone can mark tester submitted" ON public.beta_testers;

CREATE OR REPLACE FUNCTION public.mark_beta_tester_submitted(p_id uuid, p_feedback_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.beta_testers
    SET submitted_at = now(), feedback_id = p_feedback_id
    WHERE id = p_id AND submitted_at IS NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_beta_tester_submitted(uuid, uuid) TO anon, authenticated;

-- Helper RPC so a user/anon can fetch their own claimed row by id (the id stored in localStorage)
CREATE OR REPLACE FUNCTION public.get_beta_tester_self(p_id uuid)
RETURNS public.beta_testers
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT * FROM public.beta_testers WHERE id = p_id LIMIT 1; $$;
GRANT EXECUTE ON FUNCTION public.get_beta_tester_self(uuid) TO anon, authenticated;

-- 3. profiles: keep public read but strip sensitive columns
DROP POLICY "Anyone can view profiles" ON public.profiles;

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, username, display_name, avatar_url, bio, college, degree,
  graduation_year, cgpa, subjects_of_interest, open_to_opportunities,
  bar_leaderboard_opt_out, applications_count, created_at
) ON public.profiles TO anon, authenticated;

CREATE POLICY "Public can view profiles (column-scoped)"
  ON public.profiles FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Users can view own full profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- RPC for own CV ref (used by CvAnalyser, ProfileEdit, DraftEmailDialog)
CREATE OR REPLACE FUNCTION public.get_own_cv_ref()
RETURNS TABLE(cv_url text, cv_uploaded_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT cv_url, cv_uploaded_at FROM public.profiles WHERE id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_own_cv_ref() TO authenticated;
```

## Frontend changes

- `src/pages/BetaChecklist.tsx` — replace `.from('beta_testers').select(...).eq('id', ...)` with `supabase.rpc('get_beta_tester_self', { p_id })`; replace the `update({submitted_at, feedback_id}).eq('id',...)` with `supabase.rpc('mark_beta_tester_submitted', { p_id, p_feedback_id })`.
- `src/components/CvAnalyser.tsx`, `src/components/ProfileEdit.tsx`, `src/components/DraftEmailDialog.tsx` — replace any `select('cv_url, cv_uploaded_at').eq('id', user.id)` with `supabase.rpc('get_own_cv_ref')`.
- Audit any other place that reads `cv_url` from `profiles` and migrate to the RPC.
- Audit any place that reads `email`/raw `beta_testers` rows; for the public Beta Wall use the new "is_public = true" path (already works because policy allows it).

## Verification after apply

1. As anon: `select email from beta_testers` → returns 0 rows (only is_public rows, and those have no email exposure needed — confirm UI doesn't render email for public ones).
2. As anon: `update beta_testers set submitted_at = now()` → denied.
3. As anon: `select cv_url from profiles` → permission denied on column.
4. As authenticated user: `rpc('get_own_cv_ref')` → returns own row only.
5. Beta checklist flow end-to-end: claim → check progress → submit feedback still works.

## Out of scope
Privacy Policy / Terms pages and the final Publish step — separate follow-ups before public beta.
