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
      <Container style={container}>
        <Text style={brand}>Locus</Text>
        <Section style={card}>
          <Text style={eyebrow}>Verification code</Text>
          <Heading style={h1}>Confirm it&apos;s you</Heading>
          <Text style={text}>
            Use the code below to confirm your identity and complete the sensitive action you requested.
          </Text>
          <Text style={codeStyle}>{token}</Text>
          <Hr style={hr} />
          <Text style={footer}>
            This code expires shortly. Locus staff will never ask for it.
          </Text>
        </Section>
        <Text style={footerBrand}>Locus by LexRoot · send.locus.legal</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '32px 16px',
}
const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0',
}
const brand: React.CSSProperties = {
  fontFamily: 'Sora, Helvetica, Arial, sans-serif',
  fontSize: '28px',
  fontWeight: 800,
  color: '#0A0A0A',
  margin: '0 0 18px',
}
const card: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '3px solid #0A0A0A',
  boxShadow: '6px 6px 0 #0A0A0A',
  padding: '30px 26px',
}
const eyebrow: React.CSSProperties = {
  fontFamily: 'Sora, Helvetica, Arial, sans-serif',
  fontSize: '11px',
  fontWeight: 700,
  color: '#0A0A0A',
  letterSpacing: '0.14em',
  margin: '0 0 12px',
  textTransform: 'uppercase',
}
const h1: React.CSSProperties = {
  fontFamily: 'Sora, Helvetica, Arial, sans-serif',
  fontSize: '26px',
  fontWeight: 800,
  color: '#0A0A0A',
  lineHeight: '1.2',
  margin: '0 0 16px',
}
const text: React.CSSProperties = {
  fontSize: '15px',
  color: '#2B2B2B',
  lineHeight: '1.6',
  margin: '0 0 22px',
}
const button: React.CSSProperties = {
  backgroundColor: '#FFE600',
  color: '#0A0A0A',
  fontFamily: 'Sora, Helvetica, Arial, sans-serif',
  fontSize: '15px',
  fontWeight: 800,
  padding: '14px 24px',
  textDecoration: 'none',
  border: '3px solid #0A0A0A',
  borderRadius: '0',
  display: 'inline-block',
  boxShadow: '4px 4px 0 #0A0A0A',
}
const fallbackLabel: React.CSSProperties = {
  fontSize: '12px',
  color: '#666666',
  margin: '22px 0 6px',
}
const fallbackLink: React.CSSProperties = {
  fontSize: '12px',
  color: '#0A0A0A',
  textDecoration: 'underline',
  wordBreak: 'break-all',
}
const hr: React.CSSProperties = {
  border: 'none',
  borderTop: '2px solid #0A0A0A',
  margin: '24px 0 16px',
}
const footer: React.CSSProperties = {
  fontSize: '12px',
  color: '#666666',
  lineHeight: '1.5',
  margin: '0',
}
const footerBrand: React.CSSProperties = {
  fontFamily: 'Sora, Helvetica, Arial, sans-serif',
  fontSize: '11px',
  color: '#666666',
  textAlign: 'center',
  letterSpacing: '0.08em',
  margin: '20px 0 0',
}
const codeStyle: React.CSSProperties = {
  backgroundColor: '#FFE600',
  border: '3px solid #0A0A0A',
  boxShadow: '4px 4px 0 #0A0A0A',
  color: '#0A0A0A',
  display: 'inline-block',
  fontFamily: 'Sora, Helvetica, Arial, sans-serif',
  fontSize: '32px',
  fontWeight: 800,
  letterSpacing: '0.22em',
  margin: '0 0 8px',
  padding: '14px 20px',
}
