# Architecture

## Workspace Shape

The frontend workspace is a pnpm monorepo.

- `desktop/`: Sealos Desktop frontend.
- `providers/*`: provider apps opened from Desktop.
- `packages/*`: shared UI, SDK, and utility packages.
- `Dockerfile`: monorepo image build path for providers and Desktop.

Provider apps are Next.js applications. DevBox lives at `providers/devbox`.

## DevBox Provider

DevBox combines App Router pages, API routes, Zustand stores, Prisma-backed template metadata, and Kubernetes custom resources.

Important DevBox surfaces:

- UI routes under `providers/devbox/app/[lang]/(platform)`.
- Legacy API routes under `providers/devbox/app/api/*`.
- v1 API routes under `providers/devbox/app/api/v1/devbox`.
- v2alpha API routes under `providers/devbox/app/api/v2alpha/devbox`.
- Shared API response adaptation in `providers/devbox/utils/adapt.ts`.
- DevBox template fallback helpers in `providers/devbox/utils/devboxTemplate.ts`.

## Data Flow

DevBox read paths generally combine:

1. User auth from the incoming request.
2. Kubernetes DevBox CR data from the user's namespace.
3. Template metadata from Prisma, when `spec.templateID` is valid and resolvable.
4. UI response adapters or API response builders.

External DevBoxes may not have a valid template binding. Read paths should degrade to fallback template metadata rather than hiding the DevBox or returning a template lookup failure.

Template-dependent operations still need template lineage. Those paths should return an explicit unsupported/unmanaged response for external DevBoxes.

## Build Path

The main provider image path is the workspace root `Dockerfile` with provider build args:

```bash
docker build --platform=linux/amd64 \
  --build-arg name=devbox \
  --build-arg path=providers/devbox \
  -t <image> .
```

Provider-local Dockerfiles may exist for local workflows, but live provider image builds often use the monorepo Dockerfile.
