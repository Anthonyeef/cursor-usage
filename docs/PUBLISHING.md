# Publishing Guide

This guide explains how to publish the `cursor-usage` package to npm so users can run it with `bunx cursor-usage@latest` or `npx cursor-usage@latest`.

## Prerequisites

1. **npm account**: Create one at https://www.npmjs.com/signup
2. **npm login**: Run `npm login` in your terminal and enter your credentials
3. **Package name availability**: Check if `cursor-usage` is available on npm

## Pre-Publishing Checklist

Before publishing, ensure:

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Version number is updated in `package.json`
- [ ] README.md is up to date
- [ ] CHANGELOG documented (if applicable)

## Publishing Steps

### 1. Check Package Contents

Verify what will be published:

```bash
npm pack --dry-run
```

This shows which files will be included in the package based on `.npmignore` and `package.json`'s `files` field.

### 2. Test Locally

Test the package locally before publishing:

```bash
# Build the package
npm run build

# Link it globally
npm link

# Test it
cursor-usage
cursor-usage daily
```

### 3. Version Update

Update the version number following [Semantic Versioning](https://semver.org/):

```bash
# Patch release (0.1.0 -> 0.1.1) - bug fixes
npm version patch

# Minor release (0.1.0 -> 0.2.0) - new features
npm version minor

# Major release (0.1.0 -> 1.0.0) - breaking changes
npm version major
```

This automatically:
- Updates `package.json`
- Creates a git commit
- Creates a git tag

### 4. Publish to npm

```bash
# Publish to npm registry
npm publish

# For scoped packages (if you rename to @username/cursor-usage)
npm publish --access public
```

### 5. Push to GitHub

```bash
# Push code and tags
git push && git push --tags
```

## After Publishing

Users can now run your package with:

```bash
# Using npx (npm 5.2+)
npx cursor-usage@latest

# Using bunx (Bun runtime)
bunx cursor-usage@latest

# Or install globally
npm install -g cursor-usage
cursor-usage
```

## Package Name Availability

If `cursor-usage` is already taken on npm, you have options:

1. **Use a scoped package**: Rename to `@anthonyeef/cursor-usage` (requires updating `package.json`)
2. **Choose a different name**: Like `cursor-usage-cli`, `cursor-analytics`, etc.

To check availability:
```bash
npm search cursor-usage
```

## Updating the Package

For future updates:

```bash
# 1. Make your changes
# 2. Build and test
npm run build
npm test

# 3. Update version
npm version patch  # or minor/major

# 4. Publish
npm publish

# 5. Push to GitHub
git push && git push --tags
```

## Best Practices

1. **Always test before publishing**: Use `npm link` to test locally
2. **Follow semantic versioning**: Breaking changes = major, new features = minor, bug fixes = patch
3. **Keep README updated**: Users see this on npm
4. **Use git tags**: `npm version` automatically creates tags for releases
5. **Check package size**: Keep it small by excluding unnecessary files via `.npmignore`

## Troubleshooting

### "Package name already exists"
- Choose a different name or use a scoped package (@username/package-name)

### "You must be logged in to publish"
- Run `npm login` first

### "Permission denied"
- Make sure you own the package name or use a scoped package

### Package doesn't work after install
- Ensure `bin` field in package.json points to correct file
- Verify the shebang line in `dist/index.js`: `#!/usr/bin/env node`

## Additional Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [package.json Documentation](https://docs.npmjs.com/cli/v8/configuring-npm/package-json)
