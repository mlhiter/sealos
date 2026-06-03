# Information Architecture

## Workspace IA

- `desktop/`: desktop shell.
- `providers/`: provider apps.
- `packages/`: shared libraries.
- `scripts/`: workspace helper scripts.

## DevBox Provider IA

Primary pages:

- `/:lang`: DevBox home/list route.
- `/:lang/devbox/create`: create DevBox.
- `/:lang/devbox/detail/:name`: DevBox detail.
- `/:lang/template`: template repository surface.
- `/api-docs`: API docs page.

Important API groups:

- `/api/getDevboxList`, `/api/getDevboxByName`, `/api/getSSHConnectionInfo`: legacy UI-facing read routes.
- `/api/v1/devbox`, `/api/v1/devbox/:name`: v1 resource API routes.
- `/api/v2alpha/devbox`, `/api/v2alpha/devbox/:name`: v2alpha resource API routes.
- `/api/v1/devbox/:name/release/:tag/deploy` and `/api/v2alpha/devbox/:name/releases/:tag/deploy`: template-dependent release deployment.
- `/api/templateRepository/*`: template repository CRUD and conversion.

## Compatibility Note

When a DevBox has no valid template metadata, list and detail routes should still return the resource. Template-dependent routes should return a clear unsupported operation response.
