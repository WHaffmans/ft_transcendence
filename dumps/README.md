# Database & Asset Dumps

This directory stores local database dumps and avatar backups for backup and restoration.

## First-Time Setup

For initial setup or clean reinstall:

```bash
make init
```

**Prerequisites:**
- `.env.key` file in project root (obtain from project maintainer)

**What `make init` does:**
1. Validates `.env.key` exists (fails immediately if missing)
2. Decrypts `.env.encrypted` files into `.env` files
3. Validates `.env` configuration (checks for password spaces)
4. Destroys existing environment (preserves this dumps directory)
5. Installs all dependencies
6. Prompts for environment mode selection (dev/prod)
7. Generates production certificates (if prod mode selected)
8. Shows database dump status

**After initialization:**
- Run `make up` to start the application
- In **prod mode** with existing dumps: database auto-restores on startup if database is empty
- In **dev mode**: fresh test data is seeded on each reset

---

## Distribution for Evaluators

When sharing the project for evaluation:

**Required files to share separately (not in repo):**
- `.env.key` - Decryption key for .env files
- `dumps/latest.sql` - Database backup (optional, for demo state)
- `dumps/avatars.tar.gz` - Avatar files backup (optional)

**Setup instructions for evaluators:**
```bash
git clone <repository>
cd ft_transcendence

# Place .env.key in project root (provided separately)
# Place dumps in dumps/ directory (if provided)

make init    # Choose: prod (if dumps provided) or dev (for fresh data)
make up      # Start the application
```

---

## Files
- `latest.sql` - Most recent database dump (gitignored)
- `avatars.tar.gz` - Avatar files backup (gitignored)

## Usage
- `make down` - Automatically creates/updates dumps (production mode only)
- `make db-dump` - Manually create/update dumps
- `make db-restore` - Restore database and avatars from dumps
- `make db-clear-dump` - Delete all dump files

## Behavior

**Production Mode:**
- `make down` automatically backs up database + avatars
- `make up/reset/re` automatically restores if database is empty
- Ensures database and avatar files are always in sync

**Development Mode:**
- No automatic dumps (re-seeds mock data instead)
- Manual dump/restore commands still work

**Note:** Dumps are NOT committed to git. In production mode, dumps preserve your database state between restarts. In development mode, developers can create manual backups if needed.
