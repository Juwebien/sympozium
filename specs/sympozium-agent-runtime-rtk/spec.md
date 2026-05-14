# Sympozium Agent Runtime RTK Spec

## Objective

Install RTK by default in the Sympozium execution images that participate in agent command execution, so OpsClaw `sympozium-base` run-on-demand agents have the same compact tool-output runtime capability as Hermes, OpenClaw, and NanoClaw.

## User Request Mapping

- Covers the remaining Sympozium part of OpsClaw request 5: install RTK by default for each agent.
- Supports OpsClaw request 12/13 by aligning Sympozium runtime behavior with the OpsClaw runtime contract instead of leaving Sympozium as a separate exception.

## Scope

In scope:

1. Add an auditable RTK version/checksum lock for Sympozium runtime packaging.
2. Install RTK in the `agent-runner` image.
3. Install RTK in command-executing skill sidecars:
   - `skill-k8s-ops`
   - `skill-github-gitops`
   - `skill-sre-observability`
   - `skill-llmfit`
4. Preserve the upstream license file in each image.
5. Add smoke commands proving `rtk --version`, `rtk gain`, and command proxy behavior.

Out of scope:

1. Installing RTK into control-plane-only images that do not execute agent commands.
2. Editing OpsClaw product runtime contracts, which live in `repos/opsclaw-product`.
3. Publishing or promoting image digests to GitOps in this slice.
4. Live cluster proof; this slice is image-build proof only.

## Acceptance Criteria

1. RTK install is pinned to an explicit upstream version and SHA256.
2. `agent-runner` contains `/usr/local/bin/rtk` and `/usr/share/doc/rtk/LICENSE`.
3. Command skill sidecars contain `/usr/local/bin/rtk` and `/usr/share/doc/rtk/LICENSE`.
4. Local image smoke proves the RTK binary is callable.
5. `make test-short` or the narrow relevant Go tests pass.
6. Evidence is recorded in `specs/sympozium-agent-runtime-rtk/evidence.md`.

## Non-Goals and Safety

- Do not rewrite shell commands automatically in this slice.
- Do not route every tool call through RTK until command semantics are explicitly tested.
- Do not store credentials in image layers.
- Do not remove existing direct command execution behavior.
