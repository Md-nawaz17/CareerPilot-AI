# Deployment Guide

## GitHub Pages

The frontend deploys to [GitHub Pages](https://md-nawaz17.github.io/CareerPilot-AI/) through `.github/workflows/deploy-pages.yml`.

1. In **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**.
2. Push to `main`, or run **Deploy to GitHub Pages** manually from the Actions tab.
3. The workflow installs locked frontend dependencies with `npm ci`, builds with `GITHUB_PAGES=true`, and deploys `frontend/dist`.

The `GITHUB_PAGES` build flag sets Vite's base path to `/CareerPilot-AI/`, so JavaScript, CSS, and worker assets load correctly from the project site URL.

## Local development

Run the backend and frontend commands in the [README](README.md#local-development). The static GitHub Pages build falls back gracefully when a local API is unavailable.

## CI

[.github/workflows/ci.yml](.github/workflows/ci.yml) runs backend tests, frontend tests, and the production build on pushes and pull requests.
