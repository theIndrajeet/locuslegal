

## Rebrand: LexRoot → Locus by LexRoot

### Scope
Find-and-replace all brand references across 6 files. The new brand is **Locus** with a subtle "by LexRoot" sub-brand where appropriate.

### Brand format
- **Logo/navbar**: `Locus` (accent on "Locus") with a small `by LexRoot` subtitle
- **Body copy**: Replace "LexRoot" → "Locus" throughout
- **localStorage keys**: Update `lexroot_*` → `locus_*`
- **HTML meta**: Update title, description, author, OG tags

### Files to change

| File | What changes |
|------|-------------|
| `index.html` | Title → "Locus by LexRoot — Merit-Based Legal Internships in India", author → "Locus by LexRoot", all OG/Twitter meta tags |
| `src/components/Navbar.tsx` | Logo text → `Locus` with small "by LexRoot" beneath |
| `src/components/Footer.tsx` | Brand → `Locus` with "by LexRoot", copyright → "Locus" |
| `src/components/ForFirms.tsx` | All "LexRoot" → "Locus" in copy text |
| `src/components/ForUniversities.tsx` | All "LexRoot" → "Locus" in copy text (~8 occurrences) |
| `src/components/WaitlistSection.tsx` | localStorage keys `lexroot_students/firms/universities` → `locus_students/firms/universities` |
| `src/components/ForStudents.tsx` | Check for any "LexRoot" references |

No structural or layout changes — purely text/brand updates.

