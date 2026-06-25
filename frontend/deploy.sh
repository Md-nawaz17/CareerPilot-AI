#!/usr/bin/env bash
set -euo pipefail
npm --prefix frontend install
GITHUB_PAGES=true npm --prefix frontend run build
mkdir -p docs
cp -R frontend/dist/* docs/
