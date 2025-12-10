# Contributing to ft_transcendence

## Commit Messages

We use [Commitlint](https://commitlint.js.org/) to enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification. This ensures a clean and readable commit history.

### Format

Each commit message consists of a **header**, a **body** and a **footer**. The header has a special format that includes a **type**, a **scope**, a **subject** and a **reference**:

```
<type>(<scope>): <subject> #<issue-number>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Types

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
- **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Examples

```
feat(user-service): add login endpoint #42
fix(frontend): resolve layout issue on mobile #12
docs: update contributing guidelines #7
```

## Code Style & Linting

We use **ESLint** to maintain code quality and consistency.

### Running the Linter

Each service may have its own linting configuration. To run the linter for a specific service, navigate to the service directory and run:

```bash
npm run lint
```

### Configuration

- **TypeScript**: We use `typescript-eslint` with recommended rules.
- **Rules**: We follow standard recommended rules to ensure best practices.

Please ensure your code passes all linting checks before submitting a pull request.
