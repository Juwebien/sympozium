# Sympozium Agent Runtime RTK Plan

## Current System

Sympozium agent execution is split between the `agent-runner` container and skill sidecars. The LLM loop lives in `cmd/agent-runner`, while the `execute_command` tool writes IPC requests that command skill sidecars execute through `tool-executor.sh`.

The command-executing sidecars are Alpine based and already include shell tools. The `agent-runner` image is distroless and currently contains only the Go binary.

## Implementation Plan

1. Add `images/runtime-tools/rtk.lock.yaml` with the selected RTK release, artifact names, checksums, and smoke commands.
2. Add `images/runtime-tools/install-rtk.sh` to install the selected RTK artifact into either the live image root or a staged root for distroless copy.
3. Update `images/agent-runner/Dockerfile`:
   - Add an RTK download stage.
   - Copy `/usr/local/bin/rtk` and the license into the runtime image.
   - Use `gcr.io/distroless/base-debian12:nonroot` instead of `distroless/static:nonroot` so GNU-linked RTK artifacts have a glibc-compatible base.
4. Update command skill sidecar Dockerfiles to run the shared install script after package installation.
   - Add Alpine `gcompat` for sidecars so the arm64 GNU-linked RTK artifact can run.
5. Add evidence with image inventory, smoke commands, and validation output.

## Validation

Local:

```bash
make test-short
docker buildx build --load --build-arg TARGETARCH=amd64 -t sympozium-agent-runner:rtk-smoke -f images/agent-runner/Dockerfile .
docker buildx build --load --build-arg TARGETARCH=amd64 -t sympozium-skill-k8s-ops:rtk-smoke -f images/skill-k8s-ops/Dockerfile .
docker buildx build --load --build-arg TARGETARCH=amd64 -t sympozium-skill-github-gitops:rtk-smoke -f images/skill-github-gitops/Dockerfile .
docker buildx build --load --build-arg TARGETARCH=amd64 -t sympozium-skill-sre-observability:rtk-smoke -f images/skill-sre-observability/Dockerfile .
docker buildx build --load --build-arg TARGETARCH=amd64 -t sympozium-skill-llmfit:rtk-smoke -f images/skill-llmfit/Dockerfile .
```

Smoke:

```bash
docker run --rm --entrypoint /usr/local/bin/rtk sympozium-agent-runner:rtk-smoke --version
docker run --rm --entrypoint /usr/local/bin/rtk sympozium-agent-runner:rtk-smoke gain
docker run --rm --tmpfs /ipc:rw,mode=1777 -e DRY_RUN=true -e TASK=rtk-smoke --entrypoint /usr/local/bin/rtk sympozium-agent-runner:rtk-smoke proxy /agent-runner
docker run --rm --entrypoint rtk sympozium-skill-k8s-ops:rtk-smoke proxy echo ok
```

## Rollback

Revert the Dockerfile layers and the shared install script. Images continue to execute direct commands without RTK.
