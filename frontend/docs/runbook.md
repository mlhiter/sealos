# Runbook

## Install

```bash
pnpm install
```

The workspace expects Node `20.4.0` and pnpm `8.9.0`.

## DevBox Verification

Generate the Prisma client before type checks if `providers/devbox/prisma/generated/` is missing.

```bash
pnpm -r --filter ./providers/devbox run gen-client
pnpm -r --filter ./providers/devbox run ts-lint
pnpm -r --filter ./providers/devbox run lint
pnpm -r --filter ./providers/devbox run build
```

`next build` may retry Google Fonts downloads. A transient socket error is not necessarily a build failure if the command eventually completes.

## Local Development

```bash
pnpm dev-devbox
```

For provider-local runs:

```bash
cd providers/devbox
pnpm dev
```

## Build Image

```bash
make image-build-providers/devbox DOCKER_USERNAME=<account> IMAGE_TAG=<tag>
```

The root `Makefile` and `Dockerfile` build `linux/amd64` images by default.

## External DevBox Smoke Checks

For a DevBox CR whose `spec.templateID` is missing, invalid, or absent from the template database:

- `/api/getDevboxList` should include the DevBox with a fallback custom runtime.
- `/api/getDevboxByName?devboxName=<name>` should return detail data instead of `template not found`.
- `/api/getSSHConnectionInfo?devboxName=<name>` should use `spec.config` and default SSH values where template config is unavailable.
- `/api/v1/devbox` and `/api/v2alpha/devbox` should include the DevBox.
- `/api/v1/devbox/<name>` and `/api/v2alpha/devbox/<name>` should return detail data.
- Template-dependent deployment/conversion routes should return an explicit unmanaged/unsupported response.
