# Persisted Information for Next Context

## Current Task - URGENT FIX NEEDED
Fixing sidebar navigation for Battery Health Digital Twin app. User reports that clicking sidebar items (System Diagnostics, Kinetic Analysis, Multi-Cycle Trends, References, Insights, etc.) does NOT scroll to those sections.

## Root Cause Identified
The `ScrollArea` component from Radix UI creates its own scroll viewport (`ScrollAreaPrimitive.Viewport`). The `scrollIntoView()` method doesn't work properly because:
1. The sections are inside ScrollArea's internal viewport div
2. `scrollIntoView()` expects the document body to be the scroll container
3. The scroll needs to happen on the viewport, not the document

## Required Fix
In `client/src/pages/dashboard.tsx`:

1. Change line ~313 from:
```jsx
<ScrollArea className="h-full" ref={scrollContainerRef as React.RefObject<HTMLDivElement>}>
```
To:
```jsx
<div className="h-full overflow-y-auto" ref={scrollContainerRef}>
```

2. Change the closing tag from `</ScrollArea>` to `</div>` (around line 600).

3. Remove the unused `import { ScrollArea } from "@/components/ui/scroll-area";` from line 14.

## Files Changed So Far
1. `client/src/App.tsx` - Added `scrollToSection` function that calls both `setActiveSection` and `scrollIntoView`
2. `client/src/components/app-sidebar.tsx` - Uses `scrollToSection` instead of just `setActiveSection`  
3. `client/src/pages/dashboard.tsx` - Added section IDs, IntersectionObserver, References section inline, removed ML confidence badge

## User Requirements (from attached file)
- Single-page architecture with all sections always mounted
- Sidebar clicks should smooth scroll to sections (NOT routing)
- IntersectionObserver should update sidebar highlight on scroll
- References section must be accessible and visible
- Remove "Limited training data similarity" ML confidence messaging

## Next Steps
1. Read dashboard.tsx and find the ScrollArea usage (around line 313)
2. Replace `<ScrollArea className="h-full"...>` with `<div className="h-full overflow-y-auto"...>`
3. Update the corresponding closing tag at the end of the file
4. Remove unused ScrollArea import
5. Test that sidebar navigation now scrolls correctly to all sections
