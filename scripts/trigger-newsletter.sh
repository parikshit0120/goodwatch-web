#!/bin/bash

# GoodWatch Weekly Newsletter Trigger Script
# Run this every Sunday to send the weekly digest
#
# Usage: ./trigger-newsletter.sh
#
# Prerequisites:
# 1. Set NEWSLETTER_SECRET environment variable
# 2. Ensure Edge Functions are deployed

# Configuration
SUPABASE_PROJECT_REF="zaoihuwiovhakapdbhbi"
FUNCTION_URL="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/send-weekly-newsletter"

# Check for required environment variable
if [ -z "$NEWSLETTER_SECRET" ]; then
    echo "Error: NEWSLETTER_SECRET environment variable is not set"
    echo ""
    echo "Set it with: export NEWSLETTER_SECRET='your-secret-here'"
    exit 1
fi

echo "======================================"
echo "GoodWatch Weekly Newsletter Trigger"
echo "======================================"
echo ""
echo "Sending to: $FUNCTION_URL"
echo "Time: $(date)"
echo ""

# Make the request
response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "x-newsletter-secret: $NEWSLETTER_SECRET" \
    "$FUNCTION_URL")

# Extract body and status code
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo ""

# Pretty print JSON if jq is available
if command -v jq &> /dev/null; then
    echo "Response:"
    echo "$body" | jq .
else
    echo "Response:"
    echo "$body"
fi

echo ""

# Exit with appropriate code
if [ "$http_code" = "200" ]; then
    echo "Newsletter triggered successfully!"
    exit 0
else
    echo "Newsletter trigger failed!"
    exit 1
fi
