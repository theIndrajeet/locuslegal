

# Tools Page — Catalogue View with Drill-Down

## Summary

Replace the current tab-based Tools page with a two-state layout: a **catalogue grid** showing all 4 tools as cards, and a **detail view** when a tool is clicked — matching the Playbook/Resources drill-down pattern.

## Changes

### 1. Edit `src/pages/Tools.tsx`

**Add catalogue state**: New `selectedTool` state (`ToolType | null`). When `null`, show the catalogue grid. When set, show the existing tool form/output UI.

**Catalogue view** (when no tool selected):
- Hero section with "LOCUS TOOLS" heading, eyebrow pill, subtitle
- 4 tool cards in a 2×2 grid (stacks to 1 col on mobile), each showing:
  - Tool number (`01`–`04`)
  - Tool name
  - Short description (e.g. "Generate enforceable NDAs across APAC jurisdictions")
  - Jurisdiction/feature tags
  - Arrow icon → click opens the tool
- Cards styled in the neobrutalist theme: black bg, yellow borders, hard shadows, hover lift

**Detail view** (when tool selected):
- Back button ("← All Tools") at top to return to catalogue
- Existing tool form + output UI (unchanged)
- `activeTool` auto-set to `selectedTool`

**Tool descriptions** (new constant):
| Tool | Description |
|------|-------------|
| NDA Generator | Generate enforceable non-disclosure agreements across multiple jurisdictions |
| Data Protection Checklist | Interactive compliance audit with risk-rated action items |
| DPA Template | Draft data processing agreements with cross-border transfer clauses |
| Internship Agreement | Formalize legal internship terms with BCI-compliant templates |

### 2. No other files need changes
Route and nav link already exist.

## Files

| Action | File |
|--------|------|
| Edit | `src/pages/Tools.tsx` — add catalogue grid + drill-down state |

