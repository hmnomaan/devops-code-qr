**WSL / Windows shim (UNC) — Next.js startup issue**

Summary
- When running `npm run dev` from a shell that invokes the Windows wrapper, you may see:

```
CMD.EXE was started with the above path as the current directory. UNC paths are not supported. Defaulting to Windows directory.
Error: > Couldn't find any `pages` or `app` directory.
```

Cause
- `node_modules/.bin` contains both a POSIX `next` script and a Windows wrapper `next.cmd`. If the Windows `.cmd` is executed (via WSL/Windows interop or a Windows terminal), CMD receives a UNC-style WSL path (\\wsl.localhost\\...) and the process runs with the wrong CWD, so Next can't find `app` or `pages` under the project root.

Quick fixes
- Run the POSIX wrapper directly (from a WSL shell):

```bash
./node_modules/.bin/next dev
```

- Or run the Next CLI with Node explicitly:

```bash
node ./node_modules/next/dist/bin/next dev
```

- If binaries or wrappers are damaged, reinstall dependencies from WSL:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

Recommendations
- Run the dev server inside a WSL shell (or use VS Code Remote - WSL) so the process keeps the correct Linux CWD and the POSIX wrapper is used.
- Avoid launching the project from a Windows CMD/PowerShell that operates on UNC-mounted WSL paths.
- If you must run from Windows, operate on a Windows path (not a UNC WSL path) or use the Windows Node installation.

Verification
- Run `ls -l node_modules/.bin/next` — the POSIX script should be present and executable.
- Start with `./node_modules/.bin/next dev` and confirm the dev server finds `src/app` or `pages`.

Location
- This note documents an observed WSL/Windows interop startup issue and recommended fixes.
