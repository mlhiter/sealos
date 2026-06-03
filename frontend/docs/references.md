# References

## Internal References

- `README.md`: workspace setup, development, build, and image publishing commands.
- `providers/devbox/README.md`: DevBox local development notes.
- `providers/devbox/package.json`: provider scripts and dependency versions.
- `providers/devbox/utils/devboxTemplate.ts`: external DevBox template fallback helpers.
- `providers/devbox/utils/adapt.ts`: UI response adaptation for DevBox list/detail.
- `providers/devbox/app/api/v2alpha/api-error.ts`: v2alpha error response helpers.
- `Dockerfile`: monorepo build image contract.
- `Makefile`: image build and push targets.

## External References

- Next.js: provider app framework.
- pnpm workspaces: package management.
- Prisma: template metadata client generation.
- Kubernetes client-node: cluster and CR access.

## Verification References

Use these provider-scoped checks for DevBox changes:

```bash
pnpm -r --filter ./providers/devbox run gen-client
pnpm -r --filter ./providers/devbox run ts-lint
pnpm -r --filter ./providers/devbox run lint
pnpm -r --filter ./providers/devbox run build
```
