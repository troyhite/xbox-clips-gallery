# Deployment Optimization Notes

## What Changed

The deployment has been optimized for speed using Azure's **Run from Package** mode.

### Key Optimizations:

1. **Run from Package Mode** (`WEBSITE_RUN_FROM_PACKAGE=1`)
   - App runs directly from the deployment zip
   - No file extraction on Azure (saves 10-15 minutes)
   - Faster startup times
   - No file locking issues

2. **Build on GitHub, Not Azure**
   - `SCM_DO_BUILD_DURING_DEPLOYMENT=false`
   - All building happens in GitHub Actions
   - Azure just receives and runs the pre-built package

3. **Selective Packaging**
   - Only deploy necessary runtime files
   - Exclude source files, tests, and dev dependencies

## Expected Deployment Times

- **Before optimization:** 15-20 minutes
- **After optimization:** 2-4 minutes

### Breakdown:
- Build in GitHub Actions: 2-3 min
- Upload to Azure: 30-60 sec
- Azure startup: 30 sec

## What Gets Deployed

✅ **Included:**
- `.next/` (built Next.js app)
- `public/` (static assets)
- `node_modules/` (runtime dependencies)
- `package.json` & `package-lock.json`
- `next.config.ts`
- `app/`, `lib/`, `components/` (for server components)

❌ **Excluded:**
- `.git/` (version control)
- `.github/` (CI/CD configs)
- `.vscode/` (editor settings)
- `scripts/` (deployment scripts)
- Source TypeScript files (already compiled)
- Dev dependencies
- Test files

## Future Improvements

If you want even faster deployments:
1. Use a build cache in GitHub Actions
2. Consider Azure CDN for static assets
3. Use incremental builds for unchanged files
