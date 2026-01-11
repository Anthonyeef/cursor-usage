#!/usr/bin/env python3
"""
Fetch Cursor usage information from the API using stored credentials.
"""

import sqlite3
import json
import requests
import sys
from pathlib import Path

def get_cursor_credentials():
    """Extract user ID and JWT token from Cursor's local database."""
    db_path = Path.home() / "Library/Application Support/Cursor/User/globalStorage/state.vscdb"
    
    if not db_path.exists():
        print(f"Error: Database not found at {db_path}")
        sys.exit(1)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get user ID from statsigBootstrap
        cursor.execute("SELECT value FROM ItemTable WHERE key = 'workbench.experiments.statsigBootstrap'")
        result = cursor.fetchone()
        user_id = None
        
        if result:
            try:
                data = json.loads(result[0])
                user_id = data.get('user', {}).get('userID')
            except:
                pass
        
        # Get access token
        cursor.execute("SELECT value FROM ItemTable WHERE key = 'cursorAuth/accessToken'")
        token_result = cursor.fetchone()
        token = token_result[0] if token_result else None
        
        conn.close()
        
        if not user_id:
            print("Error: Could not extract user ID from database")
            sys.exit(1)
        
        if not token:
            print("Error: Could not extract JWT token from database")
            sys.exit(1)
        
        return user_id, token
    
    except Exception as e:
        print(f"Error reading database: {e}")
        sys.exit(1)

def fetch_usage(user_id, token):
    """Fetch usage information from Cursor API."""
    url = "https://cursor.com/api/usage-summary"
    
    # Format the session token
    session_token = f"{user_id}::{token}"
    
    headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
    }
    
    cookies = {
        "WorkosCursorSessionToken": session_token
    }
    
    try:
        print(f"Fetching usage from {url}...")
        response = requests.get(url, headers=headers, cookies=cookies, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return None
    
    except Exception as e:
        print(f"Error making request: {e}")
        return None

def main():
    print("Cursor Usage Fetcher")
    print("-" * 40)
    
    # Get credentials
    user_id, token = get_cursor_credentials()
    print(f"✓ Found user ID: {user_id}")
    print(f"✓ Found JWT token (length: {len(token)})")
    print()
    
    # Fetch usage
    usage_data = fetch_usage(user_id, token)
    
    if usage_data:
        print("✓ Successfully fetched usage data!")
        print()
        print(json.dumps(usage_data, indent=2))
    else:
        print("✗ Failed to fetch usage data")
        sys.exit(1)

if __name__ == "__main__":
    main()
