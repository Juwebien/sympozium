# Tasks

## Task: Install RTK in Sympozium agent runtime images

Owner: Codex

Repo area: `repos/sympozium/sympozium`

Paths allowed:

- `images/runtime-tools/**`
- `images/agent-runner/**`
- `images/skill-k8s-ops/**`
- `images/skill-github-gitops/**`
- `images/skill-sre-observability/**`
- `images/skill-llmfit/**`
- `specs/sympozium-agent-runtime-rtk/**`

Paths forbidden:

- Kubernetes manifests outside this repo
- OpsClaw product implementation paths
- GitOps catalog or lock files
- SOPS or plaintext secret files

Acceptance command:

```bash
../../opsclaw-product/tools/specops/validate-spec.sh specs/sympozium-agent-runtime-rtk
sh -n images/runtime-tools/install-rtk.sh
make test-short
```

Evidence expected:

- Runtime image inventory and selected RTK-bearing images.
- RTK artifact version, checksum, and license proof.
- Local Docker build and smoke output for `rtk --version`, `rtk gain`, and `rtk proxy`.
- Post-merge `build.yaml` proof showing published images built on `sympozium-runners`.

Rollback:

- Revert the RTK install script, lock file, and Dockerfile install layers.
- Keep OpsClaw product RTK default-install evidence marked as blocked until replacement images publish.

Stop conditions:

- Stop if RTK artifacts cannot be checksum-pinned.
- Stop if RTK license or redistribution policy blocks image packaging.
- Stop if an image requires plaintext credentials or runtime secrets to install RTK.
- Stop if cross-architecture artifacts cannot be verified for the supported target platforms.

Runner impact:

- Uses the `sympozium-runners` homelab ARC label for build, test, and image publication.

Image impact:

- Rebuilds the Sympozium agent runner and command skill sidecar images with RTK installed by default.

GitOps impact:

- No direct GitOps manifest edit in this repo. Downstream consumption still goes through the normal image digest promotion and lock process.

SOPS/secret impact:

- None. RTK installation uses public release artifacts pinned by checksum and does not introduce secrets.
