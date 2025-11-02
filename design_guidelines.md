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

**Semantic Colors** (use tenant-configurable primaries):
- Primary: CTAs, active states
- Success: confirmations, paid status
- Warning: pending, approaching deadlines
- Danger: errors, overdue, destructive actions
- Muted: secondary text, borders

**Elevation**: `shadow-sm` (cards), `shadow-md` (hover), `shadow-lg` (modals)

**Borders**: Subtle separators, 4px accent for priority/status

**States**: Hover (background shift), active (fill), disabled (opacity-50)