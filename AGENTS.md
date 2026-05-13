# AGENTS.md - Sympozium engine

## Mission

Go-based Kubernetes-native agent orchestration engine. Sympozium owns the
operator, API server, web proxy, agent runner, channel sidecars, CLI/TUI, CRDs,
container images, and Helm charts consumed by the Sympozium GitOps repos.

Core API group: `sympozium.ai/v1alpha1`.

## Boundaries

- Owns: Go source for all binaries, CRD definitions in `api/v1alpha1/`, Helm
  charts in `charts/`, Dockerfiles in `images/`, integration tests, and the web
  UI under `web/`.
- Does not own: Alibaba cluster provisioning (`../sympoali-iac/`), production
  cluster state (`../sympoali-gitops/`), OpsClaw product/control-plane code
  (`../../opsclaw-product/`), or first-party MCP servers (`../../mcps/`).
- Treat this repo as upstream engine material until the OpsClaw/Sympozium fork
  strategy is explicitly decided.

## Entrypoints

- `api/v1alpha1/` - CRD type definitions: `Agent`, `AgentRun`, `Ensemble`,
  `MCPServer`, `Model`, `SkillPack`, `SympoziumPolicy`, `SympoziumSchedule`.
- `cmd/controller/` - controller manager and reconcilers.
- `cmd/apiserver/` - HTTP and WebSocket API server.
- `cmd/agent-runner/` - agent pod LLM loop and tools.
- `cmd/ipc-bridge/` - filesystem IPC bridge.
- `cmd/web-proxy/` - OpenAI-compatible web proxy and MCP gateway.
- `cmd/webhook/` - admission webhook server.
- `cmd/sympozium/` - CLI/TUI.
- `channels/{slack,telegram,whatsapp,discord}/` - channel sidecars.
- `internal/controller/` - reconcilers, routers, density logic, channel logic.
- `internal/orchestrator/` - pod builder and Job spawner.
- `charts/sympozium-crds/`, `charts/sympozium/` - Helm charts.
- `web/` - React UI and Cypress tests.

## Build Outputs

| Source | Output | Consumer |
|---|---|---|
| `cmd/<binary>/` + `images/<binary>/Dockerfile` | `ghcr.io/sympozium-ai/sympozium/<binary>:<tag>` | Kind clusters and GitOps HelmRelease |
| `channels/<name>/` + `images/channel-<name>/` | `ghcr.io/sympozium-ai/sympozium/channel-<name>:<tag>` | Channel deployments stamped by controller |
| `api/v1alpha1/` + `make manifests` | `config/crd/bases/*.yaml` | Helm chart `sympozium-crds` |
| `charts/sympozium-crds/`, `charts/sympozium/` | Helm charts | `../sympoali-gitops/` |
| `web/` | Web UI bundle | `web-proxy`/frontend runtime |

## Rules

- Use Go 1.25+.
- Do not break `sympozium.ai/v1alpha1` without a documented migration.
- Agent execution is pod/Job based; do not introduce long-lived agent daemons
  without an explicit design decision.
- IPC flow is filesystem plus fsnotify to NATS; do not bypass it casually.
- Secrets stay in Kubernetes Secrets, never CRDs or ConfigMaps.
- New CRD fields require `make generate` and `make manifests`.
- Breaking Helm template changes require a chart version bump.
- Keep changes scoped. Do not fold OpsClaw product concerns into this repo
  until the fork/vendor strategy is decided.

## Useful Commands

```bash
make build
make test
make test-short
make test-integration
make vet
make fmt
make tidy
make generate
make manifests
make docker-build TAG=v0.1.0
make docker-build-<name> TAG=v0.1.0
```

## Cross-refs

- Platform map: `../../../docs/PLATFORM-MAP.md`
- Image flow: `../../../docs/IMAGE-FLOW.md`
- Deployment flow: `../../../docs/DEPLOYMENT-FLOW.md`
- Sibling repos: `../sympoali-iac/AGENTS.md`, `../sympoali-gitops/AGENTS.md`
