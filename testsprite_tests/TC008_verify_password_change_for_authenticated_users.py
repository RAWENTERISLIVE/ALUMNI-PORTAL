import requests

BASE_URL = "http://localhost:5000"
USERNAME = "mpsajmer123@gmail.com"
PASSWORD = "bajmav-1qojmu-qoKkod"
TIMEOUT = 30

def test_verify_password_change_for_authenticated_users():
    session = requests.Session()
    try:
        # Step 1: Log in to get authentication token or session cookies (assuming token returned)
        login_url = f"{BASE_URL}/api/auth/login"
        login_payload = {
            "email": USERNAME,
            "password": PASSWORD
        }
        login_resp = session.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        token = login_data.get("token") or login_data.get("accessToken")
        assert token, "Login response does not contain access token"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Step 2: Attempt to change password with correct current password and new password
        change_password_url = f"{BASE_URL}/api/auth/change-password"
        new_password = PASSWORD + "New1!"  # new password different from current one

        change_pwd_payload = {
            "currentPassword": PASSWORD,
            "newPassword": new_password
        }
        change_resp = session.patch(change_password_url, json=change_pwd_payload, headers=headers, timeout=TIMEOUT)
        assert change_resp.status_code == 200, f"Password change failed: {change_resp.text}"

        resp_json = change_resp.json()
        assert isinstance(resp_json, dict), "Password change response is not JSON object"

        # Step 3: Verify that login with old password fails. Use a new session to avoid stale auth
        with requests.Session() as old_session:
            login_old_resp = old_session.post(login_url, json=login_payload, timeout=TIMEOUT)
            assert login_old_resp.status_code == 401 or login_old_resp.status_code == 400, "Old password should not work after change"

        # Step 4: Verify login with new password succeeds
        new_login_payload = {
            "email": USERNAME,
            "password": new_password
        }
        login_new_resp = session.post(login_url, json=new_login_payload, timeout=TIMEOUT)
        assert login_new_resp.status_code == 200, f"Login with new password failed: {login_new_resp.text}"

        new_token = login_new_resp.json().get("token") or login_new_resp.json().get("accessToken")
        assert new_token, "New login response does not contain access token"
        new_headers = {
            "Authorization": f"Bearer {new_token}",
            "Content-Type": "application/json"
        }
        restore_pwd_payload = {
            "currentPassword": new_password,
            "newPassword": PASSWORD
        }
        restore_resp = session.patch(change_password_url, json=restore_pwd_payload, headers=new_headers, timeout=TIMEOUT)
        assert restore_resp.status_code == 200, f"Restoring original password failed: {restore_resp.text}"

    finally:
        session.close()

test_verify_password_change_for_authenticated_users()
