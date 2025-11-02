# Design Guidelines: SaaS Multi-Tenant Community Management

## Core Design Approach

**Hybrid Design System** combining Linear's efficient interfaces, Notion's organization, Stripe's professional data presentation, and modern admin frameworks.

**Principles**: Data Clarity First • Professional Trust • Efficient Workflows • Tenant Flexibility

---

## Typography

**Font**: Inter (primary) / System UI (fallback)

**Scale**:
- Display: `text-4xl/5xl font-semibold` (tenant branding)
- Page Titles: `text-3xl font-semibold`
- Sections: `text-2xl font-semibold`
- Component Titles: `text-xl font-medium`
- Body: `text-base font-normal`
- Labels/Metadata: `text-sm font-medium`
- Supporting: `text-sm font-normal`
- Micro: `text-xs font-normal`

---

## Layout & Spacing

**Spacing Scale**: Use `2, 3, 4, 6, 8, 12, 16` units
- Micro: `p-2, gap-2`
- Component: `p-4, gap-4`
- Section: `p-6/8`
- Major: `gap-8, p-12`
- Page: `p-16` (desktop)

**Structure**:
- Sidebar: 64px (collapsed) / 256px (expanded)
- Content: max-w-7xl, px-8
- Dashboard Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Forms: max-w-2xl, two-column for related fields

---

## Components

### Navigation

**Top Bar** (`h-16`, fixed):
- Logo (left) • Search (center, max-w-md) • User/notifications (right)
- Subtle bottom border

**Sidebar** (full height, scrollable):
- Collapsible icon-only mode
- Active state with subtle background
- Badge counts for notifications
- Sticky tenant switcher (bottom, super-admins)

### Dashboard Cards

**KPI Cards** (`min-h-32`):
```
- Number: text-3xl font-bold
- Label: text-sm
- Icon: 24px (top-right)
- Trend: small arrow + %
- Elevation: shadow-sm, hover:shadow-md
```

**Activity Cards**:
- Avatar/icon + title + metadata
- Timestamp: `text-xs text-muted`
- Status badges: pill-shaped, `text-xs`
- Footer: "View all" link

### Data Tables

**Structure**:
- Header: sticky, `bg-subtle font-medium text-sm`
- Rows: `min-h-14`, hover state, optional zebra striping
- Mobile: stack to cards (< md)

**Column Types**:
- Text: left-aligned, truncate
- Numbers: right-aligned, `tabular-nums`
- Status: centered badges
- Actions: right-aligned icon buttons
- Selection: checkbox (40px width)

**Pagination**: Bottom, "1-20 of 156", prev/next

### Forms

**Inputs**:
```
- Height: h-10 (40px)
- Rounded: rounded-md
- Labels: text-sm font-medium mb-2 (above)
- Helper: text-xs (below)
- Focus: clear ring, error icon + message
```

**Layout**:
- Mobile: single column
- Desktop: `grid-cols-2 gap-6` for related fields
- Textareas: full-width
- Actions: sticky footer

**Buttons**:
- Primary/Secondary: `h-10 px-6 rounded-md font-medium`
- Danger: destructive actions
- Icon: `w-10 h-10` centered
- Groups: `gap-3`

### Document Management

**List**:
- Card with thumbnail/icon
- Title: `text-base font-medium`
- Metadata: date, uploader, size (`text-sm`)
- AI badge, quick actions (view, download, analyze)

**AI Analysis**:
- Collapsible panel
- Summary + agreement cards with:
  - Text, responsible badge, deadline, status toggle

### Incidents

**Card**:
```
- Title: text-lg font-medium
- Status badge (top-right)
- Priority: 4px left border
- Avatar, dates, category icon
```

**Detail**:
- Desktop: two-column (timeline left, metadata right)
- Sticky action bar (top)

### Financial (Derramas)

**Cards**:
- Amount: `text-2xl font-bold tabular-nums`
- Description, date range, progress bar
- Member list (expandable)

**Tracking**:
- Sortable/filterable table
- Bulk actions, export (CSV/PDF)

### Modals

```
- Width: max-w-2xl (forms) / max-w-4xl (complex)
- Header: h-16, border-bottom, title + close
- Body: p-6, scrollable
- Footer: sticky, right-aligned, p-6, border-top
```

**Dropdowns**: `rounded-lg shadow-lg`, max-height scroll

---

## Page Layouts

### Login
Centered card (`max-w-md`), dynamic tenant logo, minimal decoration

### Dashboard
```
- Welcome + quick actions
- KPI grid (responsive 4→3→2→1 columns)
- Two-column: recent activities (2/3) + alerts (1/3)
```

### List Pages
```
- Toolbar: search + filters + view + create (h-14)
- Optional filter sidebar (280px, collapsible)
- Table/grid + bulk actions (sticky when selected)
```

### Detail Pages
```
- Breadcrumb (text-sm)
- Header: title + actions (min-h-20)
- Multi-tab (accordion on mobile)
```

### Settings
Two-column: nav (256px) + content, sticky save/cancel (top-right)

---

## Responsive Strategy

**Breakpoints**:
- **< md**: Single column, stacked nav, cards (not tables), bottom sheet actions
- **md-lg**: Two columns, collapsed sidebar default
- **lg+**: Full layout, expanded sidebar, multi-column grids

**Mobile Patterns**: Swipeable cards, FAB for create, filter modals

---

## Interactions

**Loading**: Skeletons (initial), inline spinners (buttons), progress bars (uploads/AI)

**Empty States**:
```
- Icon: 96px, centered
- Message: text-lg font-medium
- Primary CTA + optional help link
```

**Toasts**: Top-right (desktop) / bottom (mobile), 5s auto-dismiss, stackable

**Contextual**: Hover actions, right-click menus, keyboard shortcuts

---

## Images

**Hero** (`h-64`): Modern Spanish residential building/courtyard, gradient overlay, welcome text + CTAs

**Empty States**: Minimalist line illustrations (48px)

**Thumbnails**: 48×48 (lists) / 160×120 (grid), type icons as fallback

**Avatars**: Circular, 32px standard / 40px profiles, initials fallback

---

## Accessibility

- Touch targets: min 44×44px
- Focus: clear rings on all interactive elements
- ARIA labels on icon buttons
- Full keyboard navigation
- Inline form validation with clear errors
- Auto-save indicators
- Confirmation for destructive actions
- Consistent feedback (loading/success/error)

---

## Color & Visual System

### Paleta de Colores Base

**Colores Primarios** - Tonos difuminados de morado y naranja:

**Morado (Primary)** - `hsl(270° 65% 55%)`:
- Representa profesionalismo, tecnología e innovación
- Usado en: Botones principales, encabezados, elementos interactivos
- Modo claro: Morado medio difuminado (65% saturación)
- Modo oscuro: Morado más brillante (70% saturación, 60% luminosidad)

**Naranja (Accent)** - `hsl(25° 85% 60%)`:
- Aporta calidez, energía y dinamismo
- Usado en: Acentos, badges secundarios, elementos de énfasis
- Modo claro: Naranja/coral difuminado (85% saturación)
- Modo oscuro: Naranja cálido (75% saturación)

### Aplicación de Gradientes

**Principio fundamental**: Usar opacidades bajas (5-20%) para crear efectos difuminados sutiles

**Gradientes principales**:
- `from-primary/10 to-primary/5` - Fondo sutil morado
- `from-accent/10 to-accent/5` - Fondo sutil naranja
- `from-primary/10 via-accent/5 to-primary/5` - Transición morado-naranja
- `from-primary to-accent` - Gradiente completo para CTAs importantes

**Ubicaciones**:
- **Hero sections**: Overlay con `from-primary/90 via-primary/70 to-accent/80`
- **Backgrounds de página**: `from-background via-primary/[0.02] to-accent/[0.02]`
- **Cards**: Overlay interno con gradientes al 5-10% de opacidad
- **Buttons primarios**: `bg-gradient-to-r from-primary to-accent`
- **Iconos**: Contenedores con `bg-gradient-to-br from-primary to-accent`

### Efectos Visuales Avanzados

**Glassmorphism**:
- `backdrop-blur-md` para efecto de cristal
- Backgrounds semi-transparentes: `bg-white/10` o `bg-card/50`
- Bordes sutiles: `border border-white/20` o `border-primary/20`
- Usado en: Hero CTAs, overlays, elementos flotantes

**Sombras con Color**:
- `shadow-[inset_4px_0_8px_-2px_rgba(139,92,246,0.1)]` - Sombra interna morada
- Glow effects: Gradiente blur detrás de progress bars
- Elevación: Sombras más pronunciadas en hover

**Text Gradients**:
- Títulos principales: `bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary`
- Números/valores: `bg-gradient-to-r from-foreground to-foreground/80`

### Semantic Colors

**Estados con gradientes**:
- Success: `bg-gradient-to-r from-success/20 to-success/10` + border
- Warning: `bg-gradient-to-r from-warning/20 to-warning/10` + border
- Info: `bg-gradient-to-r from-info/20 to-info/10` + border
- Destructive: Mantiene color sólido para claridad

### Componentes Específicos

**Stat Cards**:
- Gradientes variados según título (4 opciones rotativas)
- Iconos con gradiente `from-primary to-accent/60`
- Background overlay con gradiente específico

**Badges**:
- `bg-gradient-to-r from-primary/15 to-accent/15`
- Border: `border-primary/20`
- Estados específicos mantienen sus colores pero con gradiente

**Progress Bars**:
- Barra principal con colores estándar
- Glow effect: Gradiente blur `from-primary via-accent to-primary` al 20% opacidad

**Elevation**: 
- Sin bordes (`border-0`) en la mayoría de cards
- `shadow-md` por defecto
- `shadow-lg` en hover
- `shadow-xl` en modals

**Borders**: 
- Eliminados en cards principales
- Bordes de color en badges y estados: `border-primary/20`
- 4px left border con sombra interna en priority

**States**: 
- Hover: `hover-elevate` + shadow increase
- Active: `active-elevate-2`
- Disabled: `opacity-50`
- Images: `group-hover:scale-110` con transición suave