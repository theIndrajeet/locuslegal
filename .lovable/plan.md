# Generate BIND Zone File to Add NS Records via Hostinger Import

## Why this approach

Hostinger's "Manage DNS records" form does not expose an `NS` record type for subdomains (only A, AAAA, CNAME, MX, SRV, TXT, CAA). The "Child nameservers" tab is for glue records, which is not what we need.

The **Import DNS zone file** dialog accepts BIND format (RFC 1035), which natively supports NS records. This is the only way to add the email subdomain delegation through Hostinger's UI.

## Steps

### 1. Diagnostic (read-only)

Run `email_domain--check_email_domain_status` to retrieve:
- Exact email subdomain Lovable assigned (likely `notify.locus.legal`)
- Current verification status
- Confirmed NS targets (`ns3.lovable.cloud` / `ns4.lovable.cloud`)

### 2. Generate `locus.legal.zone` file at `/mnt/documents/locus.legal.zone`

Will include:
- Existing A records for `@` and `www` → `185.158.133.1` (preserve website)
- Existing TXT verification records (`_lovable`, `_lovable.www`) — preserve
- New NS records for the email subdomain → Lovable nameservers
- Standard TTL of 14400

Sample structure:
```text
$ORIGIN locus.legal.
$TTL 14400
@               IN  A      185.158.133.1
www             IN  A      185.158.133.1
_lovable        IN  TXT    "lovable_verify=..."
_lovable.www    IN  TXT    "lovable_verify=..."
notify          IN  NS     ns3.lovable.cloud.
notify          IN  NS     ns4.lovable.cloud.
```

Deliver as a downloadable artifact via `<lov-artifact>`.

### 3. User action at Hostinger

- Open **Import DNS zone file** dialog
- **Leave "Replace existing DNS records" UNCHECKED** (critical — checking it would wipe MX records or anything else)
- Upload the generated `.zone` file
- Confirm import

### 4. Wait & verify

- 15–60 min propagation
- Re-run email status check
- Test signup/password reset on `/auth`

## Fallback

If Hostinger rejects NS records on import (some registrars restrict subdomain NS for security), the alternative is to disable Lovable Emails entirely. Auth still works, just falls back to default Lovable-branded sender. Not blocking for launch.

## Mode requirement

Need default mode to:
1. Call `email_domain--check_email_domain_status` (deferred tool)
2. Write the zone file to `/mnt/documents/`
3. Surface the artifact for download

Approve to proceed.
