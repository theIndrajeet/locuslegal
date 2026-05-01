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
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password for {siteName}. Click
          the button below to choose a new password.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reset Password
        </Button>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this
          email. Your password will not be changed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto', border: '2px solid #000000' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#000000', textDecoration: 'underline' }
const button = { backgroundColor: '#FACC15', color: '#000000', fontSize: '15px', fontWeight: 'bold', borderRadius: '4px', padding: '14px 24px', textDecoration: 'none', border: '2px solid #000000', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#71717a', margin: '32px 0 0' }
