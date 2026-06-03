# Design Context

## Design Register

This workspace is product UI. Design choices should serve scanning, comparison, repeated actions, and error recovery.

## Visual Language

- Use compact layouts, predictable navigation, and information-dense tables or split panes.
- Keep cards reserved for repeated items, dialogs, and framed tools. Avoid wrapping full pages in decorative cards.
- Use icon buttons for common actions when the action is familiar, with tooltips where needed.
- Error states should name the failure and offer the next useful action, such as retrying a request.

## DevBox UI Notes

- DevBox list and detail surfaces must tolerate externally created resources. Use a neutral `custom` runtime fallback when template metadata is missing.
- Avoid hiding resources because optional metadata is absent. Missing metadata should degrade the label/icon, not remove the row.
- Keep release/template limitations explicit: external DevBoxes can be visible and inspectable while still being blocked from template-dependent operations.

## Interaction Tone

- Prefer short, concrete labels.
- Do not add instructional prose to normal working screens unless the user is in an error, empty, or onboarding state.
- Keep loading states bounded. If loading fails, show a readable error and a retry action instead of an endless spinner.
