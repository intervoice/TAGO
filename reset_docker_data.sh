#!/bin/bash
# Safety script to reset Docker state for Tago
echo "1. Stopping all containers..."
docker-compose down

echo "2. Removing old images to force rebuild..."
docker system prune -af --volumes

echo "3. Rebuilding application from fresh code..."
docker-compose up --build -d

echo "---------------------------------------------------"
echo "Done! Access Tago at http://localhost:8080"
echo "Login: admin / TalTeufa"
echo "Please wait 10-20 seconds before logging in."
echo "---------------------------------------------------"
