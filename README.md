# Storybook evaluation — Button component

A sandbox for evaluating Storybook before adopting it in the main codebase. Scope is deliberately **one component**: the `Button` from the design system, built to full fidelity against the Figma specs, including both brand themes.

The goal is to settle the questions that matter for a real adoption — how components are structured, how design tokens map from Figma, how variants are modelled, how accessibility is enforced — on something small enough to review properly.

## Running it

```bash
cd storybook-playground
npm install
npm run storybook      # http://localhost:6006
```

Start at **Components/Button → Brands (default / Dispatch)**. That single story renders the entire design sheet: 3 types × 2 sizes × 6 states, in both brands.

Other scripts:

```bash
npm test                 # 22 story tests in headless Chromium
npm run dev              # the host Vite app
npm run build            # tsc -b && vite build
npm run build-storybook  # static Storybook into storybook-static/
npm run lint
```

## What's here

```
storybook-playground/src/
  styles/tokens.css              design tokens: primitives → semantics → brands
  components/Button/
    Button.tsx                   the component
    Button.css                   variant/size/state styling
    Button.stories.tsx           12 stories incl. the full design-sheet matrix
    index.ts
```

`src/stories/` still holds Storybook's stock `Example/*` scaffold (Button, Header, Page). It is **not** part of this work — kept only as a reference for the default conventions.

## The component

```tsx
<Button variant="primary" size="sm" startIcon={<Icon />} endIcon={<Icon />}>
  Button
</Button>
```

| prop | values | notes |
| --- | --- | --- |
| `variant` | `primary` \| `secondary` \| `ghost` | Figma calls this `type` |
| `size` | `sm` \| `lg` | 37px / 45px tall |
| `startIcon` / `endIcon` | `ReactNode` | rendered `aria-hidden` |
| `loading` | `boolean` | collapses to a spinner-only circle |
| `fullWidth` | `boolean` | |
| plus all native `<button>` props | | via `ComponentPropsWithRef<'button'>` |

Figma's `state` (default / hover / focused / clicked / disabled) is **not** a prop — those are CSS pseudo-classes, plus the native `disabled` attribute.

## Decisions worth reviewing

These are the choices a reviewer should push back on, with the reasoning:

**Design tokens in three layers.** `tokens.css` defines primitives (`--color-blue-500: #2052AA`, named to match Figma's own token names), semantics that point at them (`--color-accent`), and brand overrides. `Button.css` reads *only* semantics — it declares its own `--btn-*` variables and variant classes do nothing but re-point them. The whole 36-cell state matrix falls out of ~10 variables rather than one ruleset per combination.

**A second brand cost four lines.** The green "Dispatch" button is not a second component. It re-points four accent tokens:

```css
[data-brand='dispatch'] {
  --color-accent:       var(--color-green-500);
  --color-accent-hover: var(--color-green-400);
  --color-accent-wash:  var(--color-green-50);
  --color-focus-ring:   var(--color-green-500);
}
```

`Button.tsx` and `Button.css` were untouched. Verified by diffing computed styles across all 36 cells in both brands: **0 geometry differences, 0 typography differences** — the swap is purely chromatic. This is the main argument that the token layer is the right shape.

**`variant`, not `type`.** Figma names the axis `type`, but that collides with the native `<button type="button|submit">` attribute the component forwards. Renamed in code, mapping documented in the JSDoc and the Storybook control.

**Borders are `box-shadow: inset`, not `border`.** Figma draws frame strokes inside the box, so the bordered `secondary` measures 37px there. A real 1px CSS border would render it 39px while `primary` stayed 37. Inset shadow keeps all three types identically sized.

**`disabled` vs `loading` are different mechanisms.** `disabled` uses the real HTML attribute — it reliably blocks clicks, form submission and keyboard activation. `loading` uses `aria-disabled` + `aria-busy` *without* `disabled`, so the button **keeps focus** while an async action runs; losing focus mid-submit is a serious keyboard bug. Activation is blocked in the click handler, with `preventDefault()` covering `type="submit"`.

**Forced pseudo-states without a new dependency.** Hover/focus/clicked can't be triggered by story args. Rather than adding `@storybook/addon-pseudo-states`, the state selectors are written as `:where(:hover, [data-force-state='hover'])` — zero added specificity, no duplicated rules, and it makes the matrix story a deterministic snapshot target. It's a visual-testing affordance, not public API.

**Self-hosted font.** Work Sans via `@fontsource-variable/work-sans` rather than Google Fonts, so story snapshots render identically offline and in CI.

**`loading` hides the label visually, never from assistive tech.** Collapsing the button to a circle is tempting to implement with `display: none` — which removes the label from the accessibility tree and reduces the accessible name to just "Loading", so a screen-reader user can no longer tell which action is in flight. The content is clipped out of flow instead: the name stays `"Button Loading"`. There is a regression test for exactly this.

## Testing

`npm test` runs every story as a test in headless Chromium via `@storybook/addon-vitest`, with axe assertions on each. **22 tests, all passing.** The `play` functions cover behaviour a screenshot can't show:

- click fires `onClick`; **`disabled`** and **`loading`** both suppress it
- **keyboard**: `Tab` focuses, `:focus-visible` matches, `Enter` activates
- **`loading` keeps focus** (`aria-disabled`, not `disabled`) and sets `aria-busy`
- **`loading` retains its accessible name** — the regression test described above
- **icon-only** buttons expose an accessible name
- **long labels** truncate on one line instead of wrapping and breaking the pill

Verified separately against the browser: real mouse input on a loading button reaches none of `pointerdown` / `mousedown` / `mouseup` / `click`, while a resting button receives all four.

## Design fidelity

Every value was read from the Figma inspector, not eyeballed. Verified programmatically across all 36 buttons — **0 mismatches**:

| | spec | measured |
| --- | --- | --- |
| height | 37 / 45px | 37 / 45px |
| radius | 32px | 32px |
| padding | 8\|12px block, 20px inline | ✓ |
| gap | 8px | 8px |
| icons | 20px | 20px |
| type | Work Sans 700, 14px/21px | ✓ |
| width (hug) | 144px | 143.03px |

The 0.97px width delta is a text-shaping difference, not an error: Figma rounds each glyph advance to a whole pixel (summing to exactly 48px for "Button"), while the browser keeps subpixel advances and applies kerning (47.03px). Both widths are content-derived — nothing is pinned to 144px — so this is left alone rather than hard-coded.

## Accessibility

`@storybook/addon-a11y` runs axe on every story. The gate is set to `error` **scoped to this component only**, so the stock scaffold stories don't block it. The blue brand passes with **0 violations**.

Verified behaviourally, not just visually: keyboard focus shows a ring while mouse click does not (`:focus-visible`); loading blocks activation but retains focus; icon-only buttons without an accessible name warn in development and are caught by axe.

### ⚠️ Known defect: the Dispatch green fails WCAG AA

| pairing | contrast | required | |
| --- | --- | --- | --- |
| Default `#2052AA` on white | 7.37:1 | 4.5:1 | pass |
| Dispatch `#008E65` on white | **4.15:1** | 4.5:1 | **fail** |
| Dispatch `#33A584` on `#E6F4F0` (hover / clicked) | **2.70:1** | 4.5:1 | **fail** |

This affects all three variants. 14px Bold does not qualify as WCAG "large text" (that needs 18.66px bold), so the full 4.5:1 applies. **This is reproduced from Figma, not introduced here** — the implementation matches the design exactly. Darkening `green-500` to roughly `#00875F` clears the threshold on white with a barely perceptible shift; the hover pairing needs re-specifying separately. Both are decisions for whoever owns the green ramp.

The `Brands` story — the only one rendering Dispatch — carries a **scoped, commented waiver** disabling just the `color-contrast` rule, so the suite is green rather than permanently red. Every other axe rule still runs there, and `color-contrast` still runs on every other story, so a regression in the default brand will still fail the build. The waiver is written to be deleted the moment the ramp is fixed.

Separately, the disabled states are far below contrast in both brands (white on `#D7D7D7` ≈ 1.35:1). axe does not flag these because it skips disabled controls, so the automated gate will never catch them.

## Deliberately not done

- **Other components.** Scope was one component by design.
- **Forced pseudo-states use a CSS hook rather than `@storybook/addon-pseudo-states`.** The `data-force-state` attribute ships in production CSS for a test-only purpose. The addon is a devDependency with no runtime cost and would be the better choice; this is the decision in here I'd defend least.
- **Dark mode values are invented.** `tokens.css` carries a `prefers-color-scheme: dark` block whose hexes were derived, not designed. Treat as placeholder until the design system defines dark mode.
- **Chromatic.** `@chromatic-com/storybook` is installed but no project token is configured. The `Brands` matrix story is built to be the snapshot target when it is.
