# Sympozium Agent Runtime RTK Tasks

## Task 1 - Runtime image inventory

- Status: Done
- Task: Identify the Sympozium images that execute agent commands and must contain RTK.
- Owner: runtime-platform
- Repo area: `images/**`, `cmd/agent-runner/**`, `specs/sympozium-agent-runtime-rtk/**`
- Acceptance command: `rg -n "execute_command|tool-executor|agent-runner" cmd images internal`
- Evidence expected: Decision table in `evidence.md`.
- Rollback: Mark Sympozium RTK as pending in the OpsClaw product spec.

## Task 2 - Shared RTK installer

- Status: Done
- Task: Add a checksum-verifying install script and lock file.
- Owner: runtime-platform
- Repo area: `images/runtime-tools/**`
- Acceptance command: `sh -n images/runtime-tools/install-rtk.sh`
- Evidence expected: Version, artifact URLs, checksums, and license policy.
- Rollback: Remove `images/runtime-tools/**`.

## Task 3 - Agent runner image

- Status: Done
- Task: Install RTK in `images/agent-runner/Dockerfile`.
- Owner: runtime-platform
- Repo area: `images/agent-runner/**`
- Acceptance command: `docker buildx build --load --build-arg TARGETARCH=amd64 -t sympozium-agent-runner:rtk-smoke -f images/agent-runner/Dockerfile .`
- Evidence expected: `rtk --version`, `rtk gain`, and `rtk proxy /agent-runner` dry-run smoke.
- Rollback: Revert the image stage and return to distroless static.

## Task 4 - Command skill sidecars

- Status: Done
- Task: Install RTK in command-executing sidecars.
- Owner: runtime-platform
- Repo area: `images/skill-*`
- Acceptance command: image builds plus `rtk proxy echo ok` smoke.
- Evidence expected: Build and smoke output for each modified sidecar.
- Rollback: Revert the install layer for affected sidecars.

## Task 5 - Validation and evidence

- Status: Done
- Task: Run tests, format checks, and record evidence.
- Owner: runtime-platform
- Repo area: `specs/sympozium-agent-runtime-rtk/**`
- Acceptance command: `make test-short`
- Evidence expected: Test output, smoke commands, and any remaining GitOps promotion follow-up.
- Rollback: Keep the branch unmerged.
