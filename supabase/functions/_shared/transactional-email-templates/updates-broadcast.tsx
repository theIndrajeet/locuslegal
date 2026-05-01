/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Locus'
const SITE_URL = 'https://locus.legal'

interface UpdatesBroadcastProps {
  subject?: string
  bodyMarkdown?: string
  ctaLabel?: string
  ctaUrl?: string
  preheader?: string
}

// Minimal, safe markdown -> React Email block renderer.
// Supports: # / ## / ### headings, blank-line paragraphs, - / * bullet lists,
// inline **bold**, *italic*, `code`, [text](url), and bare links.
// Everything is rendered through React components, so output is auto-escaped.
type Block =
  | { kind: 'h1' | 'h2' | 'h3' | 'p'; text: string }
  | { kind: 'ul'; items: string[] }

function parseBlocks(src: string): Block[] {
  const lines = (src || '').replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  let list: string[] = []

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: 'p', text: para.join(' ').trim() })
      para = []
    }
  }
  const flushList = () => {
    if (list.length) {
      blocks.push({ kind: 'ul', items: list })
      list = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { flushPara(); flushList(); continue }
    const h = /^(#{1,3})\s+(.*)$/.exec(line)
    if (h) {
      flushPara(); flushList()
      const level = h[1].length
      blocks.push({
        kind: level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3',
        text: h[2],
      })
      continue
    }
    const li = /^[-*]\s+(.*)$/.exec(line)
    if (li) { flushPara(); list.push(li[1]); continue }
    flushList()
    para.push(line)
  }
  flushPara(); flushList()
  return blocks
}

// Inline parser: returns React nodes for **bold**, *italic*, `code`,
// [text](url), and bare URLs. No raw HTML is ever produced.
function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let key = 0
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+))/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[2] !== undefined) {
      out.push(<strong key={key++} style={{ fontWeight: 700, color: '#0a0a0a' }}>{m[2]}</strong>)
    } else if (m[3] !== undefined) {
      out.push(<em key={key++}>{m[3]}</em>)
    } else if (m[4] !== undefined) {
      out.push(
        <code key={key++} style={{ background: '#f4f4f5', padding: '1px 5px', borderRadius: 3, fontSize: '13px' }}>
          {m[4]}
        </code>
      )
    } else if (m[5] !== undefined && m[6] !== undefined) {
      out.push(<Link key={key++} href={m[6]} style={inlineLink}>{m[5]}</Link>)
    } else if (m[7] !== undefined) {
      out.push(<Link key={key++} href={m[7]} style={inlineLink}>{m[7]}</Link>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const UpdatesBroadcastEmail = ({
  subject = 'A new update from Locus',
  bodyMarkdown = 'Hello from Locus.',
  ctaLabel,
  ctaUrl,
  preheader,
}: UpdatesBroadcastProps) => {
  const blocks = parseBlocks(bodyMarkdown)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preheader || subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Text style={brand}>
              Loc<span style={brandAccent}>us</span>
            </Text>
          </Section>

          <Section style={card}>
            <Heading style={h1}>{subject}</Heading>

            {blocks.map((b, i) => {
              if (b.kind === 'h1') return <Heading key={i} as="h2" style={mdH1}>{renderInline(b.text)}</Heading>
              if (b.kind === 'h2') return <Heading key={i} as="h3" style={mdH2}>{renderInline(b.text)}</Heading>
              if (b.kind === 'h3') return <Heading key={i} as="h4" style={mdH3}>{renderInline(b.text)}</Heading>
              if (b.kind === 'ul') {
                return (
                  <Section key={i} style={listWrap}>
                    {b.items.map((it, j) => (
                      <Text key={j} style={listItem}>• {renderInline(it)}</Text>
                    ))}
                  </Section>
                )
              }
              return <Text key={i} style={paragraph}>{renderInline(b.text)}</Text>
            })}

            {ctaUrl && ctaLabel ? (
              <Section style={ctaWrap}>
                <Button href={ctaUrl} style={ctaBtn}>{ctaLabel}</Button>
              </Section>
            ) : null}
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You are receiving this because you signed up for {SITE_NAME}.{' '}
            <Link href={SITE_URL} style={footerLink}>{SITE_URL}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: UpdatesBroadcastEmail,
  subject: (data: Record<string, any>) =>
    (data?.subject as string) || 'A new update from Locus',
  displayName: 'Updates broadcast',
  previewData: {
    subject: 'Locus shipped: vacancy alerts',
    bodyMarkdown:
      'Hey there,\n\nThis week we shipped real-time **vacancy alerts**. Pick the firms you care about and we will email you when they post.\n\n- Curated by the Locus team\n- One-tap unsubscribe\n- Zero spam\n\n— Team Locus',
    ctaLabel: 'See vacancies',
    ctaUrl: 'https://locus.legal/vacancies',
    preheader: 'New: vacancy alerts are live',
  },
} satisfies TemplateEntry

// Neobrutalist styling — white body (mandatory), black borders, yellow accent.
const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const container = { padding: '32px 20px', maxWidth: '600px', margin: '0 auto' }
const brandRow = { paddingBottom: '20px' }
const brand = {
  fontFamily: 'Sora, Inter, Arial, sans-serif',
  fontSize: '28px',
  fontWeight: 800,
  color: '#0a0a0a',
  margin: 0,
  letterSpacing: '-0.02em',
}
const brandAccent = { color: '#FACC15' }
const card = {
  border: '2px solid #0a0a0a',
  borderRadius: '4px',
  padding: '28px 26px',
  backgroundColor: '#ffffff',
  boxShadow: '4px 4px 0 #0a0a0a',
}
const h1 = {
  fontFamily: 'Sora, Inter, Arial, sans-serif',
  fontSize: '24px',
  fontWeight: 800,
  color: '#0a0a0a',
  margin: '0 0 18px',
  lineHeight: 1.25,
  letterSpacing: '-0.01em',
}
const mdH1 = { fontSize: '20px', fontWeight: 800, color: '#0a0a0a', margin: '20px 0 8px', lineHeight: 1.3 }
const mdH2 = { fontSize: '17px', fontWeight: 700, color: '#0a0a0a', margin: '18px 0 6px', lineHeight: 1.3 }
const mdH3 = { fontSize: '15px', fontWeight: 700, color: '#0a0a0a', margin: '16px 0 6px', lineHeight: 1.3 }
const paragraph = { fontSize: '15px', lineHeight: 1.65, color: '#1a1a1a', margin: '0 0 12px' }
const listWrap = { margin: '0 0 12px' }
const listItem = { fontSize: '15px', lineHeight: 1.65, color: '#1a1a1a', margin: '0 0 4px' }
const inlineLink = { color: '#0a0a0a', textDecoration: 'underline' }
const ctaWrap = { marginTop: '24px', textAlign: 'left' as const }
const ctaBtn = {
  backgroundColor: '#FACC15',
  color: '#0a0a0a',
  border: '2px solid #0a0a0a',
  padding: '12px 22px',
  fontWeight: 700,
  fontSize: '14px',
  textDecoration: 'none',
  borderRadius: '4px',
  display: 'inline-block',
  boxShadow: '3px 3px 0 #0a0a0a',
}
const hr = { border: 'none', borderTop: '1px solid #e5e5e5', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#737373', margin: 0, lineHeight: 1.5 }
const footerLink = { color: '#0a0a0a', textDecoration: 'underline' }
