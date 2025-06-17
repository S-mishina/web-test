#!/bin/sh

set -eu

if [ -z "${WASME_VERSION:-}" ]; then
  # Requires 'packaging' module: pip install packaging
  WASME_VERSIONS=$(curl -sH"Accept: application/vnd.github.v3+json" https://api.github.com/repos/solo-io/wasm/releases | python3 -c "
import sys
import re
from packaging.version import Version, InvalidVersion
from json import loads as l

releases = l(sys.stdin.read())

def normalize(tag):
    # 'v0.0.27-patch1' → '0.0.27'
    tag_clean = tag.lstrip('v')  # remove leading 'v'
    tag_clean = re.sub(r'[-+].*$', '', tag_clean)  # remove '-patch1' or '+build123'
    return tag_clean

# フィルタ & ソート（無効な version は除外）
valid_versions = []
for release in releases:
    if release.get('prerelease'):
        continue
    tag = release['tag_name']
    try:
        v = Version(normalize(tag))
        valid_versions.append((v, tag))
    except InvalidVersion:
        continue

# ソート（本当のバージョン順）→ 元の tag に戻す
valid_versions.sort(key=lambda x: x[0], reverse=True)
print('\n'.join(tag for _, tag in valid_versions))
")
else
  WASME_VERSIONS="${WASME_VERSION}"
fi

if [ "$(uname -s)" = "Darwin" ]; then
  OS=darwin
else
  OS=linux
fi

for WASME_VERSION in $WASME_VERSIONS; do
  tmp=$(mktemp -d /tmp/wasme.XXXXXX)
  filename="wasme-${OS}-amd64"
  url="https://github.com/solo-io/wasm/releases/download/${WASME_VERSION}/${filename}"

  if curl -f "${url}" -v > /dev/null 2>&1; then
    echo "Attempting to download Wasme CLI version ${WASME_VERSION}"
  else
    continue
  fi

  (
    cd "$tmp"
    echo "Downloading ${filename}..."
    SHA=$(curl -sL "${url}.sha256" | cut -d' ' -f1)
    curl -sLO "${url}"
    echo "Download complete!, validating checksum..."
    checksum=$(openssl dgst -sha256 "${filename}" | awk '{ print $2 }')
    if [ "$checksum" != "$SHA" ]; then
      echo "Checksum validation failed." >&2
      exit 1
    fi
    echo "Checksum valid."
  )

  (
    cd "$HOME"
    mkdir -p ".wasme/bin"
    mv "${tmp}/${filename}" ".wasme/bin/wasme"
    chmod +x ".wasme/bin/wasme"
  )

  rm -r "$tmp"

  echo "Wasme CLI was successfully installed 🎉"
  echo ""
  echo "Add the Wasme CLI to your path with:"
  echo "  export PATH=\$HOME/.wasme/bin:\$PATH"
  echo ""
  echo "Now run:"
  echo "  wasme init myfilter     # generate a new filter directory"
  echo "Please see the WebAssembly Hub guides for more:  https://docs.solo.io/web-assembly-hub/latest"
  exit 0
done

echo "No versions of wasme found."
exit 1
