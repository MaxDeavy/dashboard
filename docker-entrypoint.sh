#!/bin/sh
set -e

mkdir -p /app/data
mkdir -p /app/data/uploads
mkdir -p /app/data/uploads/icons
mkdir -p /app/data/uploads/custom-icons
chown -R nextjs:nodejs /app/data

exec runuser -u nextjs -- "$@"
