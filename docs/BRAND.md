# Santh Digital — Design system

Living preview: [http://localhost:3000/brand](http://localhost:3000/brand)

**Default:** every clinic website and dashboard uses these tokens.  
**Override:** set `clinics.brand_primary` (optional `brand_deep`, `brand_paper`, `logo_url`). Components do not change — only CSS variables.

---

## Logo (source files)

Use the supplied artwork. Do not redraw the barless **A** in a web font.

| File | Use |
| --- | --- |
| `public/brand/favicon.png` | Browser tab — orange S on **white** |
| `public/brand/mark.png` | In-app chip on light UI (black field, for contrast) |
| `public/brand/wordmark.png` | Platform header / login (larger display size) |
| `public/brand/lockup.png` | Mark + stacked SANTH / DIGITAL |

Clinic sites show the **clinic name** (and `logo_url` if provided), not the Santh wordmark.

---

## Tokens (`src/app/globals.css`, `src/lib/theme.ts`)

| Token | Default | Role |
| --- | --- | --- |
| `--brand` | `#FF4F00` | Logo orange, CTA, active nav, labels |
| `--brand-hover` | `#E04600` | Primary hover |
| `--brand-deep` | `#000000` | Header / footer / mark field |
| `--paper` | `#F4F4F4` | Page |
| `--white` | `#FFFFFF` | Cards |
| `--ink` | `#0A0A0A` | Text |
| `--ink-soft` | `#4A4A4A` | Secondary text |
| `--line` | `#E4E4E4` | Borders |
| `--ok` | `#1F7A4D` | Success |

Legacy class names (`text-teal`, `btn-clay`, `bg-teal-deep`, `text-gold`) map to `--brand` / `--brand-deep` so existing UI follows the system.

**Type:** Outfit for all UI. Wordmark letterforms stay in the PNG.

---

## Clinic override

```sql
UPDATE clinics SET
  brand_primary = '#0B6E4F',  -- required to opt out of Santh orange
  brand_deep    = '#06281D',  -- optional footer/header
  brand_paper   = '#F7FBF9',  -- optional page
  logo_url      = 'https://cdn.example.com/clinic.png'
WHERE slug = 'their-clinic';
```

Hex must be `#` + 6 digits. Invalid values are ignored and the default system stays.

`ThemeScope` on `/c/[slug]` and `/dashboard` applies the variables.

---

## Voice

Direct and operational. Yes: “The clinic will confirm this slot.” No: “You’re all set!”

Platform vs clinic: Santh Digital owns `/`, `/login`, `/brand`. `/c/{slug}` is the practice’s name and (optional) colours.
