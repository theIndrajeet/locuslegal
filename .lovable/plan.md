

## Plan: Add Mobile Number (Phone/SMS) Login

### Overview
Add a phone number login option to the Auth page. Users enter their phone number, receive an OTP via SMS, and verify it to sign in.

### Prerequisites (Manual Step)
You need to enable Phone (SMS) authentication in your Cloud settings. Since you're already viewing the Auth settings section:
- Go to **Users > Auth Settings (gear icon) > Sign in methods**
- Enable **Phone (SMS)** authentication

Once enabled, confirm here and I'll implement the UI.

### Code Changes

**File: `src/pages/Auth.tsx`**
- Add a "Continue with Phone" button in the social login section (or as a tab/toggle)
- Add phone login state: `phone`, `otp`, `otpSent`
- Implement two-step flow:
  1. **Send OTP**: Call `supabase.auth.signInWithOtp({ phone })` — sends SMS code
  2. **Verify OTP**: Show OTP input, call `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` — signs user in
- On successful verification, check if user has a display name; if not, redirect to `/choose-username` (same flow as social login)
- Phone input uses E.164 format with a placeholder like `+1234567890`

### UI Layout
The phone login will appear as a third social-style button ("Continue with Phone") above the separator. Clicking it swaps the form to a phone number input + "Send Code" button, then an OTP input + "Verify" button.

### Technical Details
- Uses `supabase.auth.signInWithOtp()` (not the lovable OAuth wrapper, since phone is handled directly by the auth client)
- No database changes needed — phone auth creates users in the auth system automatically
- The existing `handle_new_user` trigger will create a profile row for phone-based signups

