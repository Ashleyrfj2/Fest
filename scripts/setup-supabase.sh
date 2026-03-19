#!/bin/bash

# FestNest Supabase Setup Script
# This script will login to Supabase CLI and push migrations to your remote database

set -e  # Exit on error

echo "🚀 FestNest Supabase Setup"
echo "================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "📦 Install it with: brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI installed"
echo ""

# Login to Supabase
echo "🔐 Step 1: Login to Supabase"
echo "This will open your browser for authentication..."
echo ""
supabase login

echo ""
echo "✅ Logged in to Supabase"
echo ""

# Link to remote project
echo "🔗 Step 2: Link to your Supabase project"
echo ""
supabase link --project-ref tumtuhzrgczhkiirdpqt

echo ""
echo "✅ Linked to project: tumtuhzrgczhkiirdpqt"
echo ""

# Push migrations
echo "📤 Step 3: Push migrations to remote database"
echo "This will create all 17 tables with RLS policies..."
echo ""
supabase db push

echo ""
echo "✅ Migrations pushed successfully!"
echo ""
echo "🎉 Supabase setup complete!"
echo ""
echo "Your database is ready at:"
echo "https://tumtuhzrgczhkiirdpqt.supabase.co"
echo ""
echo "Next steps:"
echo "1. Run 'npm start' to start the Expo app"
echo "2. The app is already configured to connect to your database"
echo ""
