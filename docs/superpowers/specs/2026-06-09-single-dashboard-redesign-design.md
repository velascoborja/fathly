# Single Dashboard Redesign Design

Date: 2026-06-09

## Goal

Redesign Fathly so users can manage the household budget from one dashboard instead of navigating through sidebar sections. Users should be able to add data, review current data, and see charts/totals update on the dashboard immediately after saves and deletes.

## Approved Direction

Use the selected **Command Center** direction:

- One authenticated workspace at `/dashboard`.
- No primary sidebar navigation and no mobile bottom navigation.
- Top-level summary, add actions, charts, and data tables are all visible on the dashboard.
- Settings/account controls live on the dashboard for now.
- Existing section routes redirect to `/dashboard` for compatibility.

## Design System

Replace the current Hugging Face-inspired system with the CreateSpace system from `/Users/velasb3/Downloads/createspace-DESIGN.md`.

Key implementation tokens:

- Primary: `#E11D48`
- Secondary: `#2563EB`
- Tertiary: `#FACC15`
- Surface base: `#FFFFFF`
- Surface glass: `rgba(255, 255, 255, 0.65)`
- Success: `#16A34A`
- Warning: `#D97706`
- Error: `#DC2626`
- Info: `#2563EB`
- Heading font: Poppins
- Body font: DM Sans
- Mono font: Fira Code
- Radius: 8px for controls, 16px for panels, 24px for prominent hero/modal surfaces
- Glass panels use translucent white, a subtle white border, `backdrop-filter: blur(16px)`, and restrained shadows

The CreateSpace design is originally described for creative agency sites, so the dashboard implementation should adapt the visual language to a finance tool: expressive color blocks and asymmetric structure are welcome, but budget numbers, tables, and forms must stay legible and operationally clear.

## Information Architecture

The authenticated app becomes one dashboard page. The app shell should no longer present route navigation as the primary interaction model.

Dashboard regions:

1. Top bar
2. Monthly command summary
3. Quick add controls
4. Live chart area
5. Budget data section with all current records
6. Settings/account controls

Old routes:

- `/deposits`
- `/monthly-bills`
- `/annual-costs`
- `/savings`
- `/settings`

These should redirect to `/dashboard` for now so bookmarks and stale links do not break.

## Dashboard Layout

### Top Bar

The top bar replaces the sidebar header/footer.

Content:

- Fathly app mark and app name
- Household name
- Language toggle
- Household name edit affordance
- Sign out

The top bar should be compact on desktop and collapse cleanly on mobile without becoming a bottom nav.

### First Viewport

Use an asymmetric Command Center composition:

- A large primary coverage panel with remaining/short amount, monthly deposits, monthly commitments, and progress.
- A quick action panel with add actions:
  - Add income
  - Add expense
  - Add monthly bill preset
  - Add annual cost preset
  - Add savings preset
- A chart panel showing expense/category breakdown.
- Small summary tiles for deposits, commitments, prorated annual costs, and savings.

The dashboard should show enough data in the first viewport that a user can understand whether the monthly budget is covered before scrolling.

### Data Area

The “Budget data” area appears below the first viewport and keeps all current records visible on one page.

Sections:

- Deposits
- Monthly bills
- Annual costs
- Savings

Each section should:

- Show existing rows in a table or compact list using current delete behavior.
- Include an add action where useful, using the correct defaults.
- Preserve readable currency formatting and category/frequency information.
- Avoid nested card stacks; use panels, tables, lanes, and glass surfaces deliberately.

## Data Flow and Behavior

Live updating means immediate same-page refresh after save/delete, not unsaved preview and not multi-user real-time sync.

Use the existing server actions where possible:

- `createDeposit`
- `deleteDeposit`
- `createCommitment`
- `deleteCommitment`
- `updateHouseholdName`
- `setLocaleAction`
- `signOutUser`

Current action revalidation can support the behavior, but `revalidateBudgetPaths` should include the final dashboard path and route redirects should not interfere with the refresh.

After a user saves or deletes:

- The dialog/form closes or returns to an idle state.
- The dashboard remains on `/dashboard`.
- Summary totals update.
- Charts update.
- Relevant table rows update.
- Toast feedback remains available.

## Component Plan

Reuse existing components where they fit:

- `BudgetDialogForm` for add dialogs, with defaults for monthly, annual, and savings commitments.
- `CommitmentChart` for charting, updated to match CreateSpace chart colors.
- `DepositTable` and `CommitmentTable` as a starting point, likely restyled or wrapped for one-page lanes.
- `HouseholdNameForm` for household settings.
- Existing button, dialog, input, table, tooltip, badge, progress, and chart primitives.

Expected new or changed components:

- Simplified `AppShell` without sidebar navigation.
- Dashboard top bar/account area.
- Coverage command panel.
- Quick action panel.
- Unified budget data section.
- Route redirect pages for old sections.

## Responsive Behavior

Desktop:

- Asymmetric grid for summary, actions, and chart.
- Budget data can use two-column lanes where space allows.
- Top bar actions remain visible.

Tablet:

- Summary first, then action/chart panels in a two-column or stacked arrangement.
- Data sections stack as needed.

Mobile:

- Single-column dashboard.
- No bottom nav.
- Add actions remain reachable near the top.
- Tables must avoid horizontal clipping; use responsive table wrappers or compact row layouts.
- Touch targets remain at least 44px.

## Error Handling and Empty States

Empty dashboard state:

- Appears inside the dashboard first viewport or data area.
- Encourages adding income first, then expenses/savings.
- Does not route the user away.

Form errors:

- Continue using existing validation messages.
- Error states should adopt CreateSpace input styling.

Unsupported glass/backdrop behavior:

- Provide an opaque white fallback so content remains readable.

## Testing and Verification

Automated checks:

- Update existing tests that assert sidebar or app-shell layout.
- Add or update tests for dashboard structure and route redirects.
- Keep validation, formatting, and budget math tests passing.
- Run lint, unit tests, and build.

Visual/browser QA:

- Verify desktop dashboard first viewport.
- Verify mobile dashboard layout.
- Add income and confirm summary/chart/table update after save.
- Add monthly bill, annual cost, and savings entries and confirm the correct lanes update.
- Delete entries and confirm dashboard updates.
- Update household name from dashboard.
- Toggle language from dashboard.
- Sign out from dashboard.

## Out of Scope

- Multi-user live sync without refresh.
- Unsaved chart previews while typing.
- Full inline editing of existing rows.
- New budget categories beyond the existing free-text category field.
- Replacing the database model.

## Notes

The visual companion mockups are stored under `.superpowers/brainstorm/` and should not be committed. Add `.superpowers/` to `.gitignore` to keep those files local.
