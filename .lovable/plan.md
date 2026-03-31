

## Plan: Remove Phone Login Option

Remove the phone/SMS login flow from the Auth page since it requires a Twilio account to function.

### Changes

**File: `src/pages/Auth.tsx`**
- Remove the `phone`, `otp`, and `mode` state variables
- Remove `handleSendOtp` and `handleVerifyOtp` functions
- Remove the "Continue with Phone" button
- Remove the phone-enter and phone-verify UI sections
- Remove the `Phone`, `ArrowLeft` icon imports and `InputOTP` imports
- Simplify `AuthMode` type (no longer needed)
- Keep Google and Apple social login + credentials form as-is

