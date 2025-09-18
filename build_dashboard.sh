#!/bin/bash

# Build script for FastAPI Radar dashboard

echo "Building FastAPI Radar Dashboard..."

# Navigate to dashboard directory
cd fastapi_radar/dashboard

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the dashboard
echo "Building production bundle..."
npm run build

echo "Dashboard build complete!"
echo "The built files are in fastapi_radar/dashboard/dist/"
