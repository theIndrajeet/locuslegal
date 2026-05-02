/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your new email for {siteName}</Preview>
    <Body style={main}>
      <Container style={wrap}>
        <Section style={wordmarkRow}>
          <Text style={wordmark}>
            Loc<span style={accentBox}>us</span>
          </Text>
        </Section>
        <Section style={card}>
          <Text style={eyebrow}>EMAIL CHANGE</Text>
          <Heading style={h1}>Confirm new address</Heading>
          <Text style={text}>
            You requested to change the email on your {siteName} account.
            Confirm below to finish the switch.
          </Text>
          <Section style={swapBox}>
            <Text style={swapLabel}>FROM</Text>
            <Text style={swapValue}>{oldEmail}</Text>
            <Text style={swapArrow}>↓</Text>
            <Text style={swapLabel}>TO</Text>
            <Text style={swapValueAccent}>{newEmail}</Text>
          </Section>
          <Section style={ctaRow}>
            <Button style={button} href={confirmationUrl}>
              Confirm change
            </Button>
          </Section>
          <Text style={fallbackLabel}>Or paste this link into your browser:</Text>
          <Link href={confirmationUrl} style={fallbackLink}>
            {confirmationUrl}
          </Link>
          <Hr style={hr} />
          <Text style={meta}>
            Didn't request this change? Secure your account immediately by
            resetting your password.
          </Text>
        </Section>
        <Text style={footer}>
          Locus by LexRoot · sent from send.locus.legal
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Helvetica, Arial, sans-serif', margin: 0, padding: '32px 16px' }
const wrap = { maxWidth: '560px', margin: '0 auto' }
const wordmarkRow = { padding: '0 0 20px', textAlign: 'left' as const }
const wordmark = { fontFamily: 'Sora, Helvetica, Arial, sans-serif', fontSize: '28px', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.02em', margin: 0 }
const accentBox = { backgroundColor: '#FFE600', border: '2px solid #0A0A0A', padding: '0 6px', marginLeft: '2px' }
const card = { backgroundColor: '#ffffff', border: '3px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A', padding: '32px 28px' }
const eyebrow = { fontFamily: 'Sora, Helvetica, Arial, sans-serif', fontSize: '11px', fontWeight: 700, color: '#0A0A0A', letterSpacing: '0.18em', margin: '0 0 12px', textTransform: 'uppercase' as const }
const h1 = { fontFamily: 'Sora, Helvetica, Arial, sans-serif', fontSize: '28px', fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 18px' }
const text = { fontSize: '15px', color: '#2B2B2B', lineHeight: 1.6, margin: '0 0 20px' }
const swapBox = { backgroundColor: '#F8F7F2', border: '2px solid #0A0A0A', padding: '16px 18px', margin: '0 0 24px', textAlign: 'center' as const }
const swapLabel = { fontFamily: 'Sora, Helvetica, Arial, sans-serif', fontSize: '10px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.18em', margin: '0 0 4px' }
const swapValue = { fontSize: '14px', color: '#0A0A0A', fontWeight: 600, margin: '0 0 10px', wordBreak: 'break-all' as const }
const swapValueAccent = { fontSize: '15px', color: '#0A0A0A', fontWeight: 700, margin: 0, wordBreak: 'break-all' as const, backgroundColor: '#FFE600', display: 'inline-block', padding: '2px 8px', border: '2px solid #0A0A0A' }
const swapArrow = { fontSize: '18px', color: '#0A0A0A', fontWeight: 700, margin: '4px 0' }
const ctaRow = { padding: '4px 0 24px' }
const button = { backgroundColor: '#FFE600', color: '#0A0A0A', fontFamily: 'Sora, Helvetica, Arial, sans-serif', fontSize: '15px', fontWeight: 700, padding: '14px 26px', textDecoration: 'none', border: '3px solid #0A0A0A', borderRadius: 0, display: 'inline-block', boxShadow: '4px 4px 0 #0A0A0A' }
const fallbackLabel = { fontSize: '12px', color: '#6B6B6B', margin: '0 0 6px' }
const fallbackLink = { fontSize: '12px', color: '#0A0A0A', wordBreak: 'break-all' as const, textDecoration: 'underline' }
const hr = { border: 'none', borderTop: '2px solid #0A0A0A', margin: '24px 0 16px' }
const meta = { fontSize: '12px', color: '#6B6B6B', lineHeight: 1.5, margin: 0 }
const footer = { fontFamily: 'Sora, Helvetica, Arial, sans-serif', fontSize: '11px', color: '#6B6B6B', textAlign: 'center' as const, letterSpacing: '0.08em', margin: '20px 0 0' }
