# Roadmap

## Current Priorities

- Keep provider apps buildable and deployable from the frontend monorepo.
- Stabilize DevBox compatibility with live cluster data shapes, including external DevBoxes without template metadata.
- Maintain v1 and v2alpha API behavior together where both route families exist.
- Improve provider documentation so future changes can be verified without reconstructing commands from prior chats.

## Near-Term Work

- Add focused regression tests for DevBox template fallback behavior when a test harness is available.
- Continue consolidating DevBox API behavior between legacy endpoints and v1/v2alpha endpoints.
- Reduce build brittleness from external font/network fetches where practical.

## Out Of Scope For Small Fixes

- Do not rename DevBox route families or migrate API versions as part of narrow bug fixes.
- Do not change database schemas for frontend-only compatibility issues unless a backend contract explicitly requires it.
- Do not broaden provider-specific changes into shared packages without a shared contract review.
