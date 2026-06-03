# Product Context

## Product Definition

Sealos Frontend is the web application workspace for Sealos Desktop and the provider apps that users open from the desktop shell. It includes operational product surfaces for app launch, databases, cost center, templates, object storage, DevBox, terminal, cron jobs, license, and related cluster workflows.

## Users

- Sealos users who create and operate cloud resources from Desktop provider apps.
- Developers using DevBox for cloud development environments, releases, SSH access, networking, and runtime configuration.
- Operators and maintainers who ship provider frontend images into Sealos clusters.

## Core Scenarios

- Run Desktop or a provider app locally for development.
- Build provider frontend images from the monorepo Dockerfile.
- Operate DevBox lists, details, networking, release history, SSH connection information, and template conversion.
- Maintain compatibility with live clusters where existing resources may have been created by older flows or external controllers.

## Product Principles

- Keep operational workflows visible and recoverable. A resource with partial metadata should not disappear from the UI.
- Make unsupported operations explicit. If a DevBox is external and lacks template lineage, template-dependent actions should explain that boundary.
- Prefer small compatibility fixes over broad frontend state machinery when the issue is a backend data-shape mismatch.
- Keep provider-specific behavior local to the provider unless a shared package contract is truly affected.

## Register

Product. The UI should feel like a quiet operational console: dense enough for repeated work, clear about resource status, and restrained in decoration.
