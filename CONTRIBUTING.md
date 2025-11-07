# Contributing to Docker Registry UI

Thank you for your interest in contributing to Docker Registry UI! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style](#code-style)
- [Git Workflow](#git-workflow)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- **Node.js** 22.x or later (tested on 22.20.0)
- **Bun** 1.x or later (recommended) or npm/yarn
- **Git** 2.x or later
- **Docker** (optional, for testing with real registry)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

```bash
git clone https://github.com/chichi13/registry-ui.git
cd registry-ui
```

3. **Add upstream remote**:

```bash
git remote add upstream https://github.com/chichi13/registry-ui.git
```

## Development Setup

### Initial Setup

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Edit .env with your test registry configuration
vim .env

# Start development server
bun run dev
```

The application will be available at `http://localhost:3000`.

## Code Style

This project enforces strict code quality standards automatically.

### TypeScript

- **Strict mode** enabled with additional checks
- Use explicit types for function parameters and return values
- Avoid `any` - use `unknown` or specific types
- Follow existing patterns in the codebase

### Vue 3

- Use **Composition API** with `<script setup>` syntax
- Component naming: PascalCase in templates
- Props: Use `defineProps<T>()` with TypeScript
- Emits: Use `defineEmits<T>()` and declare all events
- Avoid `v-html` (XSS risk) - use `v-text` instead

### Styling

- **Tailwind CSS** for all styling
- **Mobile-first** approach: write mobile styles first, then use responsive modifiers
- Use Tailwind's design tokens (colors, spacing, etc.)
- Avoid custom CSS unless absolutely necessary
- Dark mode: use `dark:` modifier for dark mode styles

### Code Formatting

Code is automatically formatted with Prettier on commit:

```bash
# Check formatting
bun run prettier:check

# Fix formatting
bun run prettier:fix
```

### Linting

ESLint runs automatically on commit:

```bash
# Run linter
bun run lint

# Lint with autofix
bun run lint:fix
```

### Commit Message Format

We follow **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `build` - Build system or dependency changes
- `ci` - CI configuration changes
- `chore` - Other changes (maintenance tasks)
- `revert` - Revert a previous commit

#### Scope (optional)

Component or area affected: `ui`, `api`, `server`, `i18n`, `docs`, etc.

#### Examples

```bash
# Good commit messages
feat(ui): add repository deletion confirmation dialog
fix(api): handle 404 errors from Docker Registry
docs(readme): add deployment examples for Traefik
refactor(server): extract token caching logic
perf(ui): lazy load repository images

# Bad commit messages
update stuff
fixed bug
WIP
```

### Commit Messages are Validated

Git hooks will validate your commit messages automatically. If validation fails:

```bash
# Check your commit message format
# Fix and commit again
git commit --amend
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your branch on upstream/main
git rebase upstream/main

# Force push to your fork (if already pushed)
git push origin your-branch --force-with-lease
```

### Creating a Pull Request

1. **Push your branch** to your fork:

```bash
git push origin feat/your-feature
```

2. **Create Pull Request** on GitHub
3. **Fill in the PR template** completely:
   - Description of changes
   - Related issues (if any)
   - Testing performed
   - Screenshots (for UI changes)
   - Breaking changes (if any)

4. **Link related issues**:

```markdown
Closes #123
Fixes #456
```

### PR Requirements

Your PR must:

- ✅ Pass all automated checks (linting, type checking, tests)
- ✅ Have clear, descriptive commits following Conventional Commits
- ✅ Include tests for new functionality
- ✅ Update documentation if needed
- ✅ Be reviewed and approved by at least one maintainer
- ✅ Be rebased on latest `main` branch

### Review Process

1. **Automated checks** run automatically
2. **Code review** by maintainers
3. **Requested changes** addressed by you
4. **Approval** and merge by maintainers

### After Merge

1. **Delete your branch**:

```bash
git branch -d feat/your-feature
git push origin --delete feat/your-feature
```

2. **Update your fork**:

```bash
git checkout main
git pull upstream main
git push origin main
```

## Reporting Bugs

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Test with latest version** to ensure bug still exists
3. **Verify configuration** is correct

### Bug Report Template

When creating a bug report, include:

- **Description** - Clear description of the bug
- **Steps to Reproduce** - Detailed steps to reproduce
- **Expected Behavior** - What should happen
- **Actual Behavior** - What actually happens
- **Environment**:
  - OS and version
  - Node.js and Bun version
  - Docker Registry version
  - Browser (if UI bug)
- **Screenshots** - If applicable
- **Logs** - Relevant error messages or logs
- **Configuration** - `.env` variables (redact sensitive data)

### Security Vulnerabilities

**DO NOT** report security vulnerabilities as public issues. Follow our [Security Policy](SECURITY.md).

## Suggesting Features

We welcome feature suggestions! To suggest a feature:

1. **Check existing feature requests** to avoid duplicates
2. **Open a discussion** in GitHub Discussions
3. **Describe the feature**:
   - What problem does it solve?
   - How should it work?
   - Why is it valuable?
   - Are there alternatives?
4. **Wait for feedback** before implementing

## Documentation

Good documentation is crucial! When contributing:

### Code Documentation

- **JSDoc comments** for functions and classes
- **Type definitions** for all TypeScript code
- **Inline comments** for complex logic only

### Translation

Help translate the UI:

1. Copy `i18n/locales/en-US.json`
2. Create `i18n/locales/{locale}.json`
3. Translate all strings
4. Update `nuxt.config.ts` to include new locale
5. Test the UI in your locale

## Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and general discussion
- **Pull Requests** - Code contributions

### Getting Help

- Read the [README.md](README.md) and [CLAUDE.md](CLAUDE.md)
- Check existing issues and discussions
- Ask questions in GitHub Discussions
- Be patient and respectful

### Code Review

When reviewing others' PRs:

- Be constructive and respectful
- Explain why you're suggesting changes
- Appreciate the contribution
- Test the changes if possible

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Docker Registry UI! 🎉
