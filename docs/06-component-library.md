# Component library

## Existing components

Core UI:
- `Button`
- `Badge`
- `Card`
- `Input`
- `Label`
- `Textarea`
- `Select`
- `Separator`
- `PlatformBadge`
- `PlanBadge`
- `ProgressStepper`
- `StreamingText`
- `InlineEditor`
- `ContentCard`
- `HookCard`
- `ExportModal`
- `ToneSelector`
- `DragHandle`

Layout:
- `AppShell`
- `Sidebar`
- `TopBar`
- `ThemeToggle`

Product:
- `ProjectWorkspace`
- `GeneratePanel`
- `SourceInput`
- `IngestionStepper`
- `ViralHookIntelligence`
- `PlatformPreviewEngine`
- `PhoneFrame`
- `ScheduleCalendar`
- `PricingModal`
- `RazorpayButton`

## Component standards

Buttons:
- Use visible text when possible.
- Icon-only buttons require `aria-label`.
- Button radius: 8 px.
- Use lucide icons only.

Cards:
- Radius: 12 to 24 px depending on density.
- Avoid nested cards.
- Use cards only for grouped tools, repeated items, and modals.

Forms:
- Validate with zod.
- Show field-level errors.
- Keep inputs at least 40 px high on mobile.

Modals:
- Use glassmorphism only on modal shells.
- Escape key and click outside should close in future dialog implementation.

Tables:
- Use only for admin or invoice history.
- Prefer card/list surfaces for creator workflows.

Tabs:
- Use tabs for content format switching.
- Preserve selected tab in URL for deep links in future.

Loading states:
- Skeletons must match final layout.
- Ingestion should use stepper progress, not generic spinner.
- Generation should use streaming text.

Charts:
- Use simple metric cards until real analytics exists.
- Do not add fake complex dashboards on the primary screen.

## Missing primitives to add next

- `Dialog`
- `Drawer`
- `DropdownMenu`
- `CommandMenu`
- `Table`
- `Skeleton`
- `ChartCard`

Implementation preference:
- Add Radix/shadcn primitives when dependencies are available.
- Keep app-specific components outside `components/ui`.
