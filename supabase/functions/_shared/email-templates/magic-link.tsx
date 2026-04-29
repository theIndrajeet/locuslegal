/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Locus login link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brand}>
            Loc<span style={brandAccent}>us</span>
          </Text>
        </Section>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Tap below to sign in to Locus. The link expires shortly, so use it soon.
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>
            Log In
          </Button>
        </Section>
        <Text style={footer}>
          Didn't request this? Ignore this email — no action needed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif", margin: 0, padding: '40px 0' }
const container = { maxWidth: '520px', margin: '0 auto', padding: '0', backgroundColor: '#ffffff', border: '2px solid #000000', boxShadow: '6px 6px 0 0 #000000' }
const brandBar = { padding: '20px 28px', borderBottom: '2px solid #000000', backgroundColor: '#ffffff' }
const brand = { fontFamily: "'Sora', Arial, sans-serif", fontSize: '24px', fontWeight: 800 as const, color: '#000000', margin: 0, letterSpacing: '-0.02em' }
const brandAccent = { color: '#000000', backgroundColor: '#FACC15', padding: '0 6px', borderRadius: '2px' }
const h1 = { fontFamily: "'Sora', Arial, sans-serif", fontSize: '26px', fontWeight: 800 as const, color: '#000000', margin: '28px 28px 16px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#3f3f46', lineHeight: '1.6', margin: '0 28px 18px' }
const btnWrap = { padding: '8px 28px 28px' }
const button = { backgroundColor: '#FACC15', color: '#000000', fontFamily: "'Sora', Arial, sans-serif", fontSize: '15px', fontWeight: 700 as const, borderRadius: '0px', padding: '14px 24px', textDecoration: 'none', border: '2px solid #000000', display: 'inline-block', boxShadow: '4px 4px 0 0 #000000' }
const footer = { fontSize: '12px', color: '#71717a', margin: '0 28px 28px', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }
