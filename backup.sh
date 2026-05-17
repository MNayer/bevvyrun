#!/bin/bash
# BevvyRun Backup Script

BACKUP_DIR="./backups"
DATA_DIR="./app/data"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/bevvyrun_backup_$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

if [ -d "$DATA_DIR" ]; then
    echo "Creating backup of $DATA_DIR..."
    tar -czf "$BACKUP_FILE" "$DATA_DIR"
    echo "Backup created successfully at $BACKUP_FILE"
else
    echo "Error: Data directory ($DATA_DIR) not found. Is the app running from this directory?"
    exit 1
fi
