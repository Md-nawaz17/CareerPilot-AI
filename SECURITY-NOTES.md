# Security Notes

## Known, deferred

- **DOMPurify via jsPDF:** Resolving the remaining DOMPurify findings requires the breaking upgrade to `jspdf@4.2.1`. The current export implementation uses `jsPDF` text APIs only; source contains no `doc.html()` or direct DOMPurify use, so this dependency path is not currently reachable.
- **esbuild via Vite:** The remaining esbuild/Vite finding is a development-server exposure. Resolving it requires the breaking Vite upgrade proposed by `npm audit fix --force` and is deferred for a tested frontend-toolchain upgrade.
