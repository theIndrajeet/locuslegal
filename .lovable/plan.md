

## Fix: "Signups not allowed for this instance" for Phone Login

### Root Cause
The Phone provider is correctly enabled, but the **global signup toggle** is turned off. This blocks all new user creation including via phone OTP. The auth logs confirm: `error_code: "signup_disabled"` on `/otp`.

### Fix (Manual — No Code Changes Needed)
In your Cloud settings:
1. Go to **Cloud → Users → Auth Settings (gear icon)**
2. Look for a **general setting** called **"Allow new users to sign up"** (this is separate from the Phone provider toggle)
3. **Enable it**

This is the master switch that controls whether any new accounts can be created across all providers (email, phone, Google, Apple). With it off, only existing users can sign in.

Once enabled, phone OTP login will work immediately — no code changes are required.

