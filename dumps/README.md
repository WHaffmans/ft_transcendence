# Database Dumps

This directory stores local database dumps for backup and restoration.

## Files
- `latest.sql` - Most recent database dump (gitignored)

## Usage
- `make down` - Automatically creates/updates `latest.sql`
- `make db-dump` - Manually create/update dump
- `make db-restore` - Restore from `latest.sql`
- `make db-clear-dump` - Delete dump file

**Note:** Dumps are NOT committed to git. Each developer maintains their own local backups.
