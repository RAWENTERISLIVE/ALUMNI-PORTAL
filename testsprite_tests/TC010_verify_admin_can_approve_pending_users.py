import requests
import time

BASE_URL = "http://localhost:5000"
USERNAME = "mpsajmer123@gmail.com"
PASSWORD = "bajmav-1qojmu-qoKkod"
TIMEOUT = 30

def test_verify_admin_can_approve_pending_users():
    session = requests.Session()
    headers = {"Content-Type": "application/json"}

    # Step 0: Login to obtain JWT token
    login_payload = {"email": USERNAME, "password": PASSWORD}
    login_resp = session.post(f"{BASE_URL}/api/auth/login", json=login_payload, headers=headers, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Failed to login: {login_resp.text}"
    login_data = login_resp.json()
    assert "token" in login_data or "accessToken" in login_data, "No token found in login response"
    token = login_data.get("token") or login_data.get("accessToken")
    auth_headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

    user_id = None
    try:
        # Step 1: Get the list of pending users
        pending_resp = session.get(f"{BASE_URL}/api/users/pending", headers=auth_headers, timeout=TIMEOUT)
        assert pending_resp.status_code == 200, f"Failed to get pending users: {pending_resp.text}"
        pending_users = pending_resp.json()
        # Validate response is a list
        assert isinstance(pending_users, list), "Pending users response is not a list"

        # Try to find a pending user to approve
        if pending_users:
            user_id = pending_users[0].get("id") or pending_users[0].get("_id")
        else:
            # No pending user - create one via registration API with minimal required info
            # Use a unique email to avoid conflicts
            unique_email = f"testpendinguser_{int(time.time())}@example.com"
            register_payload = {
                "email": unique_email,
                "password": "TestPass123!",
                "name": "Pending User Test",
                "admissionNumber": "PND123456",
                "graduationYear": "2025"
            }
            register_resp = session.post(f"{BASE_URL}/api/auth/register", json=register_payload, headers=headers, timeout=TIMEOUT)
            assert register_resp.status_code in (200,201), f"Failed to register pending user: {register_resp.text}"

            # Confirm user appears in pending users list (wait and retry once)
            time.sleep(2)
            pending_resp = session.get(f"{BASE_URL}/api/users/pending", headers=auth_headers, timeout=TIMEOUT)
            assert pending_resp.status_code == 200, f"Failed to get pending users after creating one: {pending_resp.text}"
            pending_users = pending_resp.json()
            assert isinstance(pending_users, list), "Pending users response is not a list after creating user"
            # Find the newly created user by email
            user_found = None
            for u in pending_users:
                if u.get("email") == unique_email:
                    user_found = u
                    break
            assert user_found, "Newly registered user not found in pending list"
            user_id = user_found.get("id") or user_found.get("_id")

        assert user_id, "No user ID found to approve"

        # Step 2: Approve the pending user using PATCH /api/users/:id/approve
        approve_resp = session.patch(f"{BASE_URL}/api/users/{user_id}/approve", headers=auth_headers, timeout=TIMEOUT)
        assert approve_resp.status_code == 200, f"Failed to approve user: {approve_resp.text}"
        approve_data = approve_resp.json()
        # Validate response contains approval confirmation or user info with status approved
        # This might differ based on API implementation; at minimum, check for user id
        assert (approve_data.get("id") == user_id or approve_data.get("_id") == user_id), "Approved user ID mismatch"
        # Optionally check for a status field indicating approved
        if "status" in approve_data:
            assert approve_data["status"].lower() in ("approved", "active", "verified"), f"Unexpected user status after approval: {approve_data['status']}"

    finally:
        # Cleanup: If we created a test user, delete it to maintain test isolation
        if user_id:
            del_resp = session.delete(f"{BASE_URL}/api/users/{user_id}", headers=auth_headers, timeout=TIMEOUT)


test_verify_admin_can_approve_pending_users()
