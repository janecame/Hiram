# Frontend Style Rules

## MUI usage

- Use MUI components for all layout and UI. No plain `<div>` grids — use MUI `Box` with `sx` grid props.
- All spacing and sizing go through `sx` prop or theme values. Do not write raw CSS files or inline `style={}` for anything the theme can express.
- The theme (`src/theme/theme.ts`) is the single source of truth for palette, typography, and shape. Never hardcode color hex values in component files — use `color="primary"`, `color="secondary"`, `sx={{ color: "text.secondary" }}`, or `theme.palette.*` references.
- Exception: `CategoryBlock` and `StampBadge` accept a color prop for per-category tints defined in `src/lib/format.ts` (`CATEGORY_VISUALS`).

## Typography variants

- Use `variant="overline"` for small uppercase mono labels (prices, tags, distances). It maps to JetBrains Mono in the theme.
- Use `variant="caption"` for secondary mono text.
- Use `h3`–`h6` for page and section headings — they use Archivo Display via the theme.
- Prices are rendered with `formatPeso()` from `src/lib/format.ts`, displayed in `color="secondary"` (rust `#C94A2A`) with JetBrains Mono font.

## Component conventions

- Functional components only, exported as named exports (not default exports).
- Props typed inline as interfaces directly above the component.
- `StampBadge` — round dashed badge for price and distance. Hiram's signature element. Use it for those two values only.
- `CategoryBlock` — category-tinted icon block replacing item photos. Never use `<img>` for item images.
- `ItemCardSkeleton` — use for loading states in grid views. Number of skeletons: 8.

## Forms

- React Hook Form + Zod via `@hookform/resolvers/zod`.
- All form schemas live in `src/schemas/`. Do not define Zod schemas inside component files.
- Use MUI `TextField` with `error` and `helperText` props wired to `formState.errors`.
- Use `Controller` for MUI select fields; use `register` for plain text/number inputs.
- `select` fields drive their options from the constants in `src/types/item.ts` (`CATEGORIES`, `CONDITIONS`, `CATEGORY_LABELS`, `CONDITION_LABELS`) — never hardcode option strings.

## Routing

- Three routes: `/` (BrowsePage), `/item/:id` (ItemDetailPage), `/list` (ListItemPage).
- Use `RouterLink` from `react-router-dom` as the `component` prop on MUI components that need navigation — do not nest `<a>` inside MUI interactive elements.

## Design tokens

| Token | Value |
|---|---|
| Background (paper) | `#FAF7F2` |
| Primary (pine green) | `#1C4A3A` |
| CTA accent (rust) | `#C94A2A` |
| Highlight (amber) | `#E8A020` |
| Display font | Archivo |
| Body font | Inter |
| Mono / labels | JetBrains Mono |

Tokens are wired in `src/theme/theme.ts`. Never hardcode these hex values in component files.

## Responsive grid

The Browse grid uses this pattern:
```ts
gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)", lg: "repeat(4,1fr)" }
```
Follow this breakpoint ladder for any new grids.
