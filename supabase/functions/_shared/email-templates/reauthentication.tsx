/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
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
    <Preview>Your Locus verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brand}>
            Loc<span style={brandAccent}>us</span>
          </Text>
        </Section>
        <Heading style={h1}>Confirm it's you</Heading>
        <Text style={text}>Use the code below to verify your identity:</Text>
        <Section style={codeWrap}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={footer}>
          Code expires shortly. Didn't request this? Ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif", margin: 0, padding: '40px 0' }
const container = { maxWidth: '520px', margin: '0 auto', padding: '0', backgroundColor: '#ffffff', border: '2px solid #000000', boxShadow: '6px 6px 0 0 #000000' }
const brandBar = { padding: '20px 28px', borderBottom: '2px solid #000000', backgroundColor: '#ffffff' }
const brand = { fontFamily: "'Sora', Arial, sans-serif", fontSize: '24px', fontWeight: 800 as const, color: '#000000', margin: 0, letterSpacing: '-0.02em' }
const brandAccent = { color: '#000000', backgroundColor: '#FACC15', padding: '0 6px', borderRadius: '2px' }
const h1 = { fontFamily: "'Sora', Arial, sans-serif", fontSize: '26px', fontWeight: 800 as const, color: '#000000', margin: '28px 28px 16px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#3f3f46', lineHeight: '1.6', margin: '0 28px 18px' }
const codeWrap = { padding: '0 28px 18px' }
const codeStyle = { fontFamily: "'Sora', 'Courier New', monospace", fontSize: '32px', fontWeight: 800 as const, color: '#000000', margin: 0, padding: '20px', textAlign: 'center' as const, letterSpacing: '0.2em', backgroundColor: '#FACC15', border: '2px solid #000000', boxShadow: '4px 4px 0 0 #000000' }
const footer = { fontSize: '12px', color: '#71717a', margin: '0 28px 28px', paddingTop: '16px', borderTop: '1px solid #e4e4e7' }
