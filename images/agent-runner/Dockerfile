# Agent Runner
FROM --platform=$BUILDPLATFORM golang:1.25-alpine AS builder
ARG TARGETOS=linux
ARG TARGETARCH
RUN apk add --no-cache git ca-certificates
WORKDIR /workspace
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -mod=mod -ldflags="-s -w" -o /agent-runner ./cmd/agent-runner

FROM --platform=$BUILDPLATFORM alpine:3.20 AS rtk
ARG TARGETARCH
ARG RTK_VERSION=0.40.0
RUN apk add --no-cache ca-certificates curl findutils tar
COPY images/runtime-tools/install-rtk.sh /usr/local/bin/install-rtk.sh
RUN RTK_VERSION="${RTK_VERSION}" TARGETARCH="${TARGETARCH}" RTK_INSTALL_ROOT=/rtk-root /usr/local/bin/install-rtk.sh

FROM gcr.io/distroless/base-debian12:nonroot
COPY --from=builder /agent-runner /agent-runner
COPY --from=rtk /rtk-root/usr/local/bin/rtk /usr/local/bin/rtk
COPY --from=rtk /rtk-root/usr/share/doc/rtk/LICENSE /usr/share/doc/rtk/LICENSE
USER 65532:65532
ENTRYPOINT ["/agent-runner"]
