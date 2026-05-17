# BevvyRun Update Procedure

To update BevvyRun to a newer version while preserving your existing data, please follow these steps carefully:

## 1. Create a Backup
Before performing any updates, you should **always** create a backup of your data. This ensures that you can restore your data if the update fails.
1. From the project root, run the backup script:
   ```bash
   bash backup.sh
   ```
2. Alternatively, create a physical printed backup by visiting the `Accounting Dashboard` and clicking `Print Backup`. Save it as a PDF or print it.

## 2. Pull the Latest Code
If you are using Git, you can pull the latest changes:
```bash
git pull origin main
```
If you are downloading a new release archive, extract it over the existing files.

## 3. Rebuild and Restart
If you are running the application via Docker:
```bash
docker-compose down
docker-compose up --build -d
```

If you are running it manually using Node:
```bash
cd app
npm install
npm run build
npm run start:server
```

## 4. Verify the Update
Open the application in your browser and log in as the host. Verify that:
- Your past sessions are still listed.
- User accounts and balances are intact.
- Your accounting and register cash match the backup values.

## Restoring from a Backup
If anything goes wrong, you can restore your data from the backup created in Step 1:
1. Stop the application.
2. Extract the backup archive:
   ```bash
   tar -xzf backups/bevvyrun_backup_<timestamp>.tar.gz
   ```
3. Restart the application.
