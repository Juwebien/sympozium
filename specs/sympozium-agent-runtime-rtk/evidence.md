# Sympozium Agent Runtime RTK Evidence

## Status

- Implemented and locally verified on 2026-05-14.
- This slice targets local image-build proof only; digest promotion and live cluster proof remain follow-ups.

## Existing System Analysis

- `cmd/agent-runner/tools.go` exposes `execute_command` as an LLM tool and delegates command execution to skill sidecars through `/ipc/tools`.
- `images/agent-runner/Dockerfile` currently builds a Go binary into a distroless image with no RTK binary.
- `images/skill-k8s-ops/Dockerfile`, `images/skill-github-gitops/Dockerfile`, `images/skill-sre-observability/Dockerfile`, and `images/skill-llmfit/Dockerfile` are command-executing sidecars that run `tool-executor.sh`.
- `images/skill-memory/Dockerfile` is a memory service, not a shell command executor, so it is out of scope for this RTK slice.

## Runtime Image Decision Table

| Image | Decision | Reason |
|---|---|---|
| `agent-runner` | required | Owns LLM tool loop and native file/fetch tools; should expose RTK capability to the agent runtime. |
| `skill-k8s-ops` | required | Executes shell commands for Kubernetes operations. |
| `skill-github-gitops` | required | Executes shell commands for Git/GitHub GitOps operations. |
| `skill-sre-observability` | required | Executes shell commands for observability workflows. |
| `skill-llmfit` | required | Executes shell commands for llmfit and Kubernetes model-fit probes. |
| `skill-memory` | out of scope | Runs a service binary, not arbitrary command output. |
| controller/apiserver/webhook/channels/web-proxy/mcp-bridge | out of scope | Control-plane or integration services, not agent command execution environments. |

## Implementation Evidence

### Changed paths

- `images/runtime-tools/rtk.lock.yaml`
- `images/runtime-tools/install-rtk.sh`
- `images/agent-runner/Dockerfile`
- `images/skill-k8s-ops/Dockerfile`
- `images/skill-github-gitops/Dockerfile`
- `images/skill-sre-observability/Dockerfile`
- `images/skill-llmfit/Dockerfile`
- `specs/sympozium-agent-runtime-rtk/{spec.md,plan.md,tasks.md,evidence.md}`

### RTK version and integrity

- Version: `0.40.0`
- Source: `https://github.com/rtk-ai/rtk/releases/download/v0.40.0/`
- `amd64` artifact: `rtk-x86_64-unknown-linux-musl.tar.gz`
- `amd64` sha256: `a75d210a445874106bc16da2b4efba01d36d297afa33ec134728f2d5f42ef5af`
- `arm64` artifact: `rtk-aarch64-unknown-linux-gnu.tar.gz`
- `arm64` sha256: `1d0087ad62a182c0833c2251ac678b5e05356418d91aa57305ac51a126c9b102`
- License is copied to `/usr/share/doc/rtk/LICENSE`.

### Agent runner image

Command:

```bash
docker buildx build --load --build-arg TARGETARCH=amd64 \
  -t sympozium-agent-runner:rtk-smoke \
  -f images/agent-runner/Dockerfile .
```

Result:

- Build succeeded.
- Image includes `/usr/local/bin/rtk`.
- Final base is `gcr.io/distroless/base-debian12:nonroot` so GNU-linked RTK artifacts can run when required.

Smoke commands:

```bash
docker run --rm --entrypoint /usr/local/bin/rtk sympozium-agent-runner:rtk-smoke --version
docker run --rm --entrypoint /usr/local/bin/rtk sympozium-agent-runner:rtk-smoke gain
docker run --rm --tmpfs /ipc:rw,mode=1777 \
  --entrypoint /usr/local/bin/rtk \
  -e DRY_RUN=true \
  -e TASK=rtk-smoke \
  sympozium-agent-runner:rtk-smoke proxy /agent-runner
```

Observed:

- `rtk 0.40.0`
- `rtk gain` completed with no tracking data yet.
- `rtk proxy /agent-runner` returned `__SYMPOZIUM_RESULT__{"status":"success"...}` in dry-run mode.

### Command skill sidecars

Build commands:

```bash
docker buildx build --load --build-arg TARGETARCH=amd64 -t sympozium-skill-k8s-ops:rtk-smoke -f images/skill-k8s-ops/Dockerfile .
docker buildx build --load --build-arg TARGETARCH=amd64 -t sympozium-skill-github-gitops:rtk-smoke -f images/skill-github-gitops/Dockerfile .
docker buildx build --load --build-arg TARGETARCH=amd64 -t sympozium-skill-sre-observability:rtk-smoke -f images/skill-sre-observability/Dockerfile .
docker buildx build --load --build-arg TARGETARCH=amd64 -t sympozium-skill-llmfit:rtk-smoke -f images/skill-llmfit/Dockerfile .
```

Result:

- All four builds succeeded.
- Alpine sidecars install `gcompat` because the `arm64` RTK artifact is GNU-linked.

Smoke loop:

```bash
for img in \
  sympozium-skill-k8s-ops:rtk-smoke \
  sympozium-skill-github-gitops:rtk-smoke \
  sympozium-skill-sre-observability:rtk-smoke \
  sympozium-skill-llmfit:rtk-smoke
do
  docker run --rm --entrypoint rtk "$img" --version
  docker run --rm --entrypoint rtk "$img" gain
  docker run --rm --entrypoint rtk "$img" proxy echo ok
  docker run --rm --entrypoint sh "$img" -lc 'test -s /usr/share/doc/rtk/LICENSE && echo license-ok'
done
```

Observed for each sidecar:

- `rtk 0.40.0`
- `rtk gain` completed with no tracking data yet.
- `rtk proxy echo ok` printed `ok`.
- License check printed `license-ok`.

### ARM64 artifact proof

Command:

```bash
root="$(mktemp -d)"
TARGETARCH=arm64 RTK_VERSION=0.40.0 RTK_INSTALL_ROOT="$root" images/runtime-tools/install-rtk.sh
file "$root/usr/local/bin/rtk"
test -s "$root/usr/share/doc/rtk/LICENSE"
```

Observed:

- Checksum verification succeeded.
- Extracted binary is `ELF 64-bit LSB pie executable, ARM aarch64`.
- The binary is dynamically linked with interpreter `/lib/ld-linux-aarch64.so.1`.

### Repository validation

Commands:

```bash
sh -n images/runtime-tools/install-rtk.sh
git diff --check
make test-short
```

Result:

- Shell syntax check passed.
- Diff whitespace check passed.
- `make test-short` passed, including `cmd/agent-runner` and all short Go packages.

## Remaining Follow-Ups

- Promote rebuilt images through the image catalog and GitOps digest lock.
- Run live cluster proof after Flux applies the promoted digests.
