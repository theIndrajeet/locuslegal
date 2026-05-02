/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Locus verification code: {token}</Preview>
    <Body style={main}>
      <Container style={wrap}>
        <Section style={wordmarkRow}>
          <Text style={wordmark}>
            Loc<span style={accentBox}>us</span>
          </Text>
        </Section>
        <Section style={card}>
          <Text style={eyebrow}>VERIFICATION CODE</Text>
          <Heading style={h1}>Confirm it's you</Heading>
          <Text style={text}>
            Use the code below to confirm your identity and complete the
            sensitive action you just requested.
          </Text>
          <Section style={otpWrap}>
            <Text style={otp}>{token}</Text>
          </Section>
          <Text style={meta}>
            This code expires in a few minutes. Don't share it with anyone —
            Locus staff will never ask for it.
          </Text>
          <Hr style={hr} />
          <Text style={meta}>
            Didn't request this? You can safely ignore this email.
          </Text>
        </Section>
        <Text style={footer}>
          Locus by LexRoot · sent from send.locus.legal
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Helvetica, Arial, sans-serif', margin: 0, padding: '32px 16px' }
const wrap = { maxWidth: '560px', margin: '0 auto' }
const wordmarkRow = { padding: '0 0 20px', textAlign: 'left' as const }
const wordmark = { fontFamily: 'Sora, Helvetica, Arial, sans-serif', fontSize: '28px', fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.02em', margin: 0 }
const accentBox = { backgroundColor: '#FFE600', border: '2px solid #0A0A0A', padding: '0 6px', marginLeft: '2px' }
const card = { backgroundColor: '#ffffff', border: '3px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A', padding: '32px 28px' }
const eyebrow = { fontFamily: 'Sora, Helvetica, Arial, sans-serif', fontSize: '11px', fontWeight: 700, color: '#0A0A0A', letterSpacing: '0.18em', margin: '0 0 12px', textTransform: 'uppercase' as const }
const h1 = { fontFamily: 'Sora, Helvetica, Arial, sans-serif', fontSize: '28px', fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 18px' }
const text = { fontSize: '15px', color: '#2B2B2B', lineHeight: 1.6, margin: '0 0 24px' }
const otpWrap = { textAlign: 'center' as const, margin: '0 0 20px' }
const otp = { fontFamily: 'Sora, Helvetica, Arial, sans-serif', fontSize: '36px', fontWeight: 800, color: '#0A0A0A', letterSpacing: '0.32em', backgroundColor: '#FFE600', border: '3px solid #0A0A0A', boxShadow: '4px 4px 0 #0A0A0A', padding: '18px 24px', display: 'inline-block', margin: 0 }
const hr = { border: 'none', borderTop: '2px solid #0A0A0A', margin: '20px 0 16px' }
const meta = { fontSize: '12px', color: '#6B6B6B', lineHeight: 1.5, margin: '0 0 8px' }
const footer = { fontFamily: 'Sora, Helvetica, Arial, sans-serif', fontSize: '11px', color: '#6B6B6B', textAlign: 'center' as const, letterSpacing: '0.08em', margin: '20px 0 0' }
