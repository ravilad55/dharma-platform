# Dharma Customer Design System

## Source tokens

Use the requirements tokens as the visual baseline:

| Token | Value | Usage |
|---|---|---|
| Primary | `#7A1F3D` | Primary CTA, active navigation, important headings |
| Saffron | `#F59E0B` | Spiritual accents, highlights, ratings |
| Warm cream | `#FFF9F0` | Main app background |
| Green | `#3F8F4F` | Success, pure-veg, verified states |
| Text | `#292524` | Primary text |
| Border | `#E7DED2` | Inputs, cards, separators |

Typography is Inter per the requirements, with Poppins as the stated alternative. The project should confirm font licensing/assets before implementation. Use an 8-point spacing scale, 12-16px card radius, restrained shadows, and large thumb-friendly CTAs.

## Component inventory

Create one shared component contract for Buttons, Inputs, App Bars, Bottom Navigation, Bottom Sheets, Dialogs, Loaders, Skeletons, Empty/Error states, Confirmation views, Lists, Avatars, Badges, Ratings, Cards, address pickers, money summaries, status timelines, and accessible map overlays. Features compose these components; screens do not contain business logic.

## Interaction states

Every actionable component has default, pressed, disabled, loading, validation-error, and success/confirmation behavior. Async mutations prevent duplicate taps and surface a retry path. Use bottom sheets for filters and secondary actions as specified.

## Content and errors

Use plain customer language and localize all user-visible strings. Map API ProblemDetails error codes to safe messages. Never render stack traces, provider errors, tokens, or internal identifiers. Display public booking/order references only where appropriate.

## Accessibility

- Minimum touch target and contrast must meet the mobile accessibility target selected for the app.
- Every icon-only action has a semantic label and tooltip/help where needed.
- Do not communicate status by color alone; combine label/icon/state.
- Support dynamic text sizing without clipping or changing control meaning.
- Ensure screen-reader order follows the visual task order.
- Provide reduced-motion behavior for countdowns, map updates, and transitions.

## Feature architecture mapping

```text
Screen -> feature view/hook -> TanStack Query or Zustand state
       -> repository -> Axios API client -> /api/v1 API
```

TanStack Query owns server state, caching, invalidation, pagination, and mutation status. Zustand owns small client-only state such as onboarding completion, transient navigation/filters, and cart UI state only where it is not duplicating server truth. React Hook Form plus Zod owns form interaction and client schema checks; the API remains authoritative.

## Testing expectations

Design-system components require unit/component tests for state and accessibility semantics. Critical journeys require integration/E2E coverage for authentication, booking/payment confirmation, ordering, and delivery tracking. Visual regression is recommended for tokens and core screens after a design system implementation exists.
