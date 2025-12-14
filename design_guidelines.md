# Battery Health Digital Twin - Design Guidelines

## Design Approach: Data-First Dashboard

**Selected Framework:** Fluent Design System (Microsoft) - optimized for data-dense, professional dashboards with strong information hierarchy

**Core Principle:** Professional electrochemical research dashboard - clean, stable, suitable for academic/technical presentations. Zero artistic experimentation.

---

## Typography

**Font Stack:**
- Primary: Inter (Google Fonts) - exceptional readability for data-heavy interfaces
- Monospace: JetBrains Mono - for numerical values, SI units, technical readouts

**Hierarchy:**
- Page Title: text-2xl font-semibold (Dashboard title)
- Section Headers: text-lg font-medium (Chart titles, panel headers)
- Metric Labels: text-sm font-medium uppercase tracking-wide (SoH, ΔEp labels)
- Metric Values: text-3xl font-bold font-mono (numerical readouts)
- Body Text: text-sm (descriptions, diagnostic messages)
- Technical Units: text-xs font-mono text-gray-500 (mV, µA, %)

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 (p-2, m-4, gap-6, h-8)

**Grid Structure:**
- Left Sidebar: Fixed 16rem width (w-64), full height
- Main Content: Flex-1, padding p-6 to p-8
- Metric Cards: Grid layout gap-4 to gap-6
- Charts: Full-width containers with aspect ratios

---

## Component Library

### 1. Left Sidebar Navigation
- Fixed position, dark neutral background
- Logo/title at top (p-6)
- Navigation items: py-3 px-4, hover states with subtle bg change
- Active state: border-l-4 accent color
- Icons from Heroicons (outline style)
- Sections: Dashboard, Analysis, Diagnostics, Settings

### 2. Metric Cards (SoH, Degradation, Stability)
- White background, border, rounded-lg
- Padding: p-6
- Structure: Label (top) → Large Value (center) → Unit/Trend (bottom)
- Include small trend indicators (↑↓) where applicable
- Grid: 3 columns on desktop (grid-cols-3 gap-4)

### 3. CV Voltammogram Plot
- Full-width chart container
- Border, subtle shadow
- Title bar with cycle selector
- X-axis: Voltage (V), Y-axis: Current (µA)
- Grid lines, axis labels in monospace
- Dual-curve display: forward scan (one color), reverse scan (second color)
- Peak markers (Ipa, Ipc, Epa, Epc) with labels

### 4. Multi-Cycle Trend Plots
- 2-column grid (grid-cols-2 gap-6) on desktop
- Each plot: border, padding p-4
- Plots include: ΔEp vs Cycle, Ipa Decay, Peak Separation, Reversibility
- X-axis: Cycle Number, Y-axis: respective metric
- Line charts with data points

### 5. Health/Degradation Gauge
- Circular or semi-circular gauge visualization
- Color mapping: 80-100% green zone, 50-80% yellow, <50% red
- Large percentage value in center (text-4xl font-bold)
- Label below: "State of Health (SoH)"
- Bordered card container

### 6. 3D Electrochemical Cell
- Fixed aspect ratio container (16:9 or 4:3)
- Border, subtle shadow
- Controls overlay (top-right): rotation reset, view angles
- Color legend for SoH mapping
- Labels for electrodes visible on hover

### 7. BMS Intelligence Panel
- Dedicated section below charts
- Grid layout for: Operating Envelope, Risk Indicators, Health Margins, Advisory Insights
- Each subsection: title + data table or key-value pairs
- Subtle background differentiation from main content

### 8. Data Upload Interface
- Prominent "Upload CSV" button in top-right of main content
- File input with drag-drop zone
- Format requirements displayed: "Expected: cycle, voltage, current"
- Upload state: loading spinner, success/error messages

---

## Dashboard Layout Composition

**Top Bar:**
- Height: h-16
- Title: "Battery Health Digital Twin"
- Right-side: Upload button, settings icon

**Main Grid:**
```
[Sidebar] [Top Metrics Row: 3 cards]
          [CV Plot - Full Width]
          [Trend Plots - 2x2 Grid]
          [Health Gauge + 3D Cell - 2 columns]
          [BMS Intelligence Panel - Full Width]
```

---

## Professional Constraints

**Visual Treatment:**
- Neutral color palette (grays, blues for accents)
- Minimal shadows (shadow-sm to shadow-md)
- Sharp, clean borders (border-gray-200)
- No gradients, no animations (except loading states)
- Data visualization uses distinct, color-blind safe palettes

**Data Presentation:**
- All numerical values right-aligned
- SI units always displayed with values
- Scientific notation for very small/large numbers
- Consistent decimal precision (2-4 places)

---

## Images

**No hero images or marketing imagery.** This is a technical dashboard - all visual elements are data-driven (charts, 3D model, gauges).