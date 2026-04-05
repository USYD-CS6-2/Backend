#!/usr/bin/env bash
set -e

echo "[restart] restarting comments-backend service..."
sudo systemctl restart comments-backend
sudo systemctl status comments-backend --no-pager