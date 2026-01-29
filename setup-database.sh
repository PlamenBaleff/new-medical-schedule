#!/bin/bash
# Supabase Setup Script
# This script helps you set up the database for the Medical Schedule application

echo "========================================"
echo "Medical Schedule - Database Setup"
echo "========================================"
echo ""

# Check if SQL file exists
if [ ! -f "supabase-setup.sql" ]; then
    echo "Error: supabase-setup.sql not found!"
    exit 1
fi

echo "IMPORTANT SETUP INSTRUCTIONS:"
echo "================================"
echo ""
echo "1. Go to https://supabase.com and log in to your project"
echo ""
echo "2. Navigate to 'SQL Editor'"
echo ""
echo "3. Copy ALL the SQL from 'supabase-setup.sql' file"
echo ""
echo "4. Paste it into the SQL Editor and execute it"
echo ""
echo "5. Create the admin user in Supabase Auth:"
echo "   - Go to Authentication → Users"
echo "   - Click 'Add user'"
echo "   - Email: ufopjb@abv.bg"
echo "   - Password: 850524Plamen1024"
echo "   - Click 'Create user'"
echo ""
echo "6. The admin will automatically have access to all data"
echo ""
echo "Done! Your database is now set up and ready to use."
echo ""
