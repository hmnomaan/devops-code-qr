**Permission Denied: `next` binary prevented `npm run dev`**

**Summary**
- `npm run dev` failed with: `sh: 1: next: Permission denied`.
- The non-executable, root-owned file was: `node_modules/.bin/next`.

**Cause**
- `node_modules/.bin/next` was owned by `root` and lacked the executable bit (`-rw-r--r--`). This often happens when dependencies were installed with `sudo` or files were extracted/restored as root.

**Fix**
1. Restore ownership to your user and make the binary executable:

```bash
sudo chown -R $(id -u):$(id -g) node_modules
chmod +x node_modules/.bin/next
npm run dev
```

2. (Preferred) Reinstall dependencies as your user to avoid root-owned files:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Verification**
- Run `ls -l node_modules/.bin/next` and confirm it's executable (e.g. `-rwxr-xr-x`).
- `npm run dev` should start the Next.js dev server.

**Prevention / Recommendations**
- Do not run `npm install` with `sudo` inside project directories.
- Use a Node version manager such as `nvm` or `volta` to avoid permission issues.
- If you encounter similar permission errors, inspect `node_modules/.bin/*` permissions first.

**Location**
- This note documents the frontend issue encountered on project startup.





============================================

```
./node_modules/.bin/next dev
```

```
node ./node_modules/next/dist/bin/next dev
```

```
rm -rf node_modules package-lock.json
npm install
npm run dev
```