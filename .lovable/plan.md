

# Lex Root — Landing Page Plan

## Overview
A bold, modern landing page for India's legal internship platform connecting law students with firms based on merit. Dark/light mode support with a gold (#E8A020) brand accent.

## Design System Setup
- Custom color tokens for light and dark modes as specified
- Typography: Sora (headings) + Inter (body) via Google Fonts
- Consistent gold accent (#E8A020) across both modes
- Smooth scroll-reveal animations on sections

## Page Sections (top to bottom)

### 1. Navbar
- Lex Root logo/wordmark with gold accent
- Navigation links (Students, Firms, Waitlist)
- Dark/light mode toggle
- Mobile hamburger menu

### 2. Hero Section
- Gold badge: "Your merit. Your internship."
- Large headline: "Get the internship you deserve — not the one your college got you."
- Subtext explaining the platform
- Two CTA buttons: "I'm a Student" / "I'm a Firm"
- Subtle fade-in animations

### 3. Problem Stats Bar
- Full-width contrasting strip (navy in light mode, slightly lighter dark card in dark mode)
- Animated counters: 500,000+ law students, ~600 top-firm spots, 1,800 colleges vs 26 NLUs, zero placement infrastructure
- Numbers count up on scroll into view

### 4. For Students Section
- Headline: "Built for the 95% that top firms ignore."
- Three feature cards: Direct Apply, Skill-Based Matching, Guaranteed Internship
- Icons + short descriptions
- Student-focused CTA button

### 5. For Firms Section
- Headline: "Stop drowning in unscreened applications."
- Three feature cards: Pre-Screened Candidates, Free Listing, Quality Interns
- Icons + short descriptions
- Firm-focused CTA button

### 6. Waitlist Section
- Two-column layout side by side (stacked on mobile)
- **Students form**: email, year of study, city → "I want an internship"
- **Firms form**: email, firm name, city → "I want pre-screened interns"
- Data stored in localStorage for now (Supabase-ready structure)
- Success toast on submission

### 7. Footer
- Lex Root logo + tagline
- Social links placeholders (Twitter, LinkedIn, Instagram)
- Minimal, clean design

## Technical Notes
- Intersection Observer for scroll-reveal animations and counter triggers
- Dark/light mode via next-themes (already installed)
- Fully responsive — mobile-first approach
- All waitlist data persisted to localStorage as JSON arrays
- Single-page with smooth scroll navigation between sections

