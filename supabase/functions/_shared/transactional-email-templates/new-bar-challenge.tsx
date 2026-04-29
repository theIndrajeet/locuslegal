/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Locus'
const SITE_URL = 'https://locus.legal'

interface NewBarChallengeProps {
  title?: string
  areaOfLaw?: string
  difficulty?: string
  questionType?: string
  challengeUrl?: string
}

const niceCase = (s?: string) =>
  (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const NewBarChallengeEmail = ({
  title = 'A new challenge is live',
  areaOfLaw,
  difficulty,
  questionType,
  challengeUrl = `${SITE_URL}/the-bar`,
}: NewBarChallengeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`New in The Bar — ${niceCase(areaOfLaw) || 'fresh challenge'}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandRow}>
          <Text style={brand}>
            Loc<span style={brandAccent}>us</span>
          </Text>
        </Section>

        <Section style={card}>
          <Text style={kicker}>NEW IN THE BAR</Text>
          <Heading style={h1}>{title}</Heading>

          <Text style={meta}>
            {[niceCase(areaOfLaw), niceCase(difficulty), niceCase(questionType)]
              .filter(Boolean).join(' · ')}
          </Text>

          <Text style={bodyText}>
            A fresh challenge just dropped. Take it on, climb the leaderboard,
            and sharpen your edge.
          </Text>

          <Section style={ctaWrap}>
            <Button href={challengeUrl} style={ctaBtn}>Take the challenge</Button>
          </Section>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          You are receiving this because you signed up for {SITE_NAME}.{' '}
          <a href={SITE_URL} style={footerLink}>{SITE_URL}</a>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewBarChallengeEmail,
  subject: (data: Record<string, any>) =>
    `New challenge in The Bar — ${niceCase(data?.areaOfLaw) || 'try it now'}`,
  displayName: 'New Bar challenge',
  previewData: {
    title: 'Doctrine of frustration in commercial leases',
    areaOfLaw: 'contract_law',
    difficulty: 'intermediate',
    questionType: 'mcq',
    challengeUrl: 'https://locus.legal/the-bar',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif', margin: 0, padding: 0 }
const container = { padding: '32px 20px', maxWidth: '600px', margin: '0 auto' }
const brandRow = { paddingBottom: '20px' }
const brand = { fontFamily: 'Sora, Inter, Arial, sans-serif', fontSize: '28px', fontWeight: 800, color: '#0a0a0a', margin: 0, letterSpacing: '-0.02em' }
const brandAccent = { color: '#FACC15' }
const card = { border: '2px solid #0a0a0a', borderRadius: '4px', padding: '28px 26px', backgroundColor: '#ffffff', boxShadow: '4px 4px 0 #0a0a0a' }
const kicker = { fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#0a0a0a', backgroundColor: '#FACC15', display: 'inline-block', padding: '4px 8px', margin: '0 0 14px', border: '2px solid #0a0a0a' }
const h1 = { fontFamily: 'Sora, Inter, Arial, sans-serif', fontSize: '24px', fontWeight: 800, color: '#0a0a0a', margin: '0 0 8px', lineHeight: 1.25, letterSpacing: '-0.01em' }
const meta = { fontSize: '13px', color: '#525252', margin: '0 0 16px', textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontWeight: 600 }
const bodyText = { fontSize: '14px', lineHeight: 1.6, color: '#1a1a1a', margin: '0 0 8px' }
const ctaWrap = { marginTop: '24px', textAlign: 'left' as const }
const ctaBtn = { backgroundColor: '#FACC15', color: '#0a0a0a', border: '2px solid #0a0a0a', padding: '12px 22px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', borderRadius: '4px', display: 'inline-block', boxShadow: '3px 3px 0 #0a0a0a' }
const hr = { border: 'none', borderTop: '1px solid #e5e5e5', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#737373', margin: 0, lineHeight: 1.5 }
const footerLink = { color: '#0a0a0a', textDecoration: 'underline' }
