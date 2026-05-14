#!/usr/bin/env sh
set -eu

rtk_version="${RTK_VERSION:-0.40.0}"
target_arch="${TARGETARCH:-$(uname -m)}"
install_root="${RTK_INSTALL_ROOT:-}"
base_url="https://github.com/rtk-ai/rtk/releases/download/v${rtk_version}"

case "$target_arch" in
  amd64 | x86_64)
    artifact="rtk-x86_64-unknown-linux-musl.tar.gz"
    sha256="a75d210a445874106bc16da2b4efba01d36d297afa33ec134728f2d5f42ef5af"
    ;;
  arm64 | aarch64)
    artifact="rtk-aarch64-unknown-linux-gnu.tar.gz"
    sha256="1d0087ad62a182c0833c2251ac678b5e05356418d91aa57305ac51a126c9b102"
    ;;
  *)
    echo "unsupported TARGETARCH for RTK install: $target_arch" >&2
    exit 1
    ;;
esac

bin_dir="${install_root}/usr/local/bin"
license_dir="${install_root}/usr/share/doc/rtk"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

mkdir -p "$bin_dir" "$license_dir"
curl -fsSL "${base_url}/${artifact}" -o "${tmp_dir}/rtk.tar.gz"
printf '%s  %s\n' "$sha256" "${tmp_dir}/rtk.tar.gz" | sha256sum -c -
tar -xzf "${tmp_dir}/rtk.tar.gz" -C "$tmp_dir"

rtk_bin="$(find "$tmp_dir" -type f -name rtk | head -n 1)"
if [ -z "$rtk_bin" ]; then
  echo "rtk binary not found in ${artifact}" >&2
  exit 1
fi

cp "$rtk_bin" "${bin_dir}/rtk"
chmod 0755 "${bin_dir}/rtk"
curl -fsSL "https://raw.githubusercontent.com/rtk-ai/rtk/v${rtk_version}/LICENSE" -o "${license_dir}/LICENSE"
chmod 0644 "${license_dir}/LICENSE"
