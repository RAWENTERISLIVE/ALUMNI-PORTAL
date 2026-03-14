#!/usr/bin/env python3
"""
Test Data Cleanup Script
Cleans up test users from the database before running tests
"""
import requests
import sys

BASE_URL = "http://localhost:5000"
CLEANUP_ENDPOINT = "/api/test-utils/cleanup-test-users"
COUNT_ENDPOINT = "/api/test-utils/test-users-count"
TIMEOUT = 30


def cleanup_test_users():
    """Remove all test users from the database"""
    try:
        print("🧹 Cleaning up test users...")
        
        # Get count before cleanup
        count_response = requests.get(
            f"{BASE_URL}{COUNT_ENDPOINT}",
            timeout=TIMEOUT
        )
        
        if count_response.status_code == 200:
            count_data = count_response.json()
            print(f"   Found {count_data.get('count', 0)} test users")
        
        # Perform cleanup
        response = requests.delete(
            f"{BASE_URL}{CLEANUP_ENDPOINT}",
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Successfully deleted {data.get('deletedCount', 0)} test users")
            return True
        else:
            print(f"⚠️  Cleanup returned status {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the backend server.")
        print("   Make sure the server is running on http://localhost:5000")
        return False
    except requests.RequestException as e:
        print(f"❌ Error during cleanup: {e}")
        return False


if __name__ == "__main__":
    success = cleanup_test_users()
    sys.exit(0 if success else 1)
