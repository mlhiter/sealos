# Sealos Frontend Agent Guide

## Project Scope

This workspace contains the Sealos desktop frontend and provider apps. Use `/Users/mlhiter/labring/sealos/frontend` as the frontend workspace root.

- Desktop app: `desktop/`
- Provider apps: `providers/<name>/`
- Shared packages: `packages/*`
- DevBox provider: `providers/devbox`

## Operating Rules

- Preserve workspace boundaries. Changes inside one provider should not alter another provider unless the same contract is shared.
- Do not run database write operations unless the user explicitly asks for database mutation.
- For production or remote image builds, default Docker builds to `linux/amd64`.
- Prefer provider-scoped verification first, then broader workspace commands when the change touches shared packages.
- Generated and dependency folders such as `node_modules/` and `providers/devbox/prisma/generated/` are not commit targets.

## Common Commands

```bash
pnpm install
pnpm -r --filter ./providers/devbox run gen-client
pnpm -r --filter ./providers/devbox run ts-lint
pnpm -r --filter ./providers/devbox run lint
pnpm -r --filter ./providers/devbox run build
```

The workspace expects Node `20.4.0` and pnpm `8.9.0`. Running on newer local Node versions may print engine warnings even when verification passes.

## DevBox Template Compatibility

Existing DevBox custom resources may be created outside the template flow. Treat missing, invalid, or database-unresolvable `spec.templateID` as an external or unmanaged DevBox case on read paths.

Read paths should keep those DevBoxes visible with a `custom` runtime fallback. Template-dependent operations such as deploying a release to an app or creating a template from a DevBox should return a clear unsupported/unmanaged response instead of failing with `template not found`.

The shared helper for this behavior is `providers/devbox/utils/devboxTemplate.ts`.
