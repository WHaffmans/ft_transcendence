# Database & Asset Dumps

This directory stores local database dumps and avatar backups for backup and restoration.

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

**Note:** Dumps are NOT committed to git. Each developer maintains their own local backups.
