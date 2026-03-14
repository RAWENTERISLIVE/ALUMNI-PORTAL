import requests
import time

BASE_URL = "http://localhost:5000"
REGISTER_ENDPOINT = "/api/auth/register"
TIMEOUT = 30


def test_verify_user_registration_with_valid_and_invalid_data():
    headers = {
        "Content-Type": "application/json"
    }

    # Generate unique email using timestamp to avoid duplicate user errors
    timestamp = int(time.time() * 1000)  # Milliseconds for uniqueness
    unique_email = f"testuser_{timestamp}@example.com"
    
    # Valid user registration data with unique email
    valid_user_data = {
        "email": unique_email,
        "password": "ValidPass123!",
        "name": "Test User",
        "admissionNumber": f"TEST{timestamp}/2025",
        "graduationYear": "2025"
    }

    # Missing required fields
    missing_email_data = {
        "password": "ValidPass123!",
        "name": "Test User",
        "admissionNumber": "1234/2025",
        "graduationYear": "2025"
    }

    missing_password_data = {
        "email": f"testuser2_{timestamp}@example.com",
        "name": "Test User",
        "admissionNumber": "1234/2025",
        "graduationYear": "2025"
    }

    # Invalid formats
    invalid_email_data = {
        "email": "invalid-email-format",
        "password": "ValidPass123!",
        "name": "Test User",
        "admissionNumber": "1234/2025",
        "graduationYear": "2025"
    }

    invalid_graduation_year_data = {
        "email": f"testuser3_{timestamp}@example.com",
        "password": "ValidPass123!",
        "name": "Test User",
        "admissionNumber": "1234/2025",
        "graduationYear": "invalidyear"
    }

    # 1. Test valid registration
    try:
        response = requests.post(
            f"{BASE_URL}{REGISTER_ENDPOINT}",
            json=valid_user_data,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 201 or response.status_code == 200, f"Expected 200/201 but got {response.status_code}. Response: {response.text}"
        resp_json = response.json()
        # Expect response to contain user email matching input
        assert "email" in resp_json and resp_json["email"] == valid_user_data["email"]
    except requests.RequestException as e:
        assert False, f"RequestException during valid registration: {e}"

    # 2. Test missing email
    try:
        response = requests.post(
            f"{BASE_URL}{REGISTER_ENDPOINT}",
            json=missing_email_data,
            headers=headers,
            timeout=TIMEOUT
        )
        # Expect bad request status code and error about missing email
        assert response.status_code == 400, f"Expected 400 for missing email but got {response.status_code}"
        resp_json = response.json()
        assert "email" in str(resp_json).lower() or "missing" in str(resp_json).lower() or "required" in str(resp_json).lower()
    except requests.RequestException as e:
        assert False, f"RequestException during registration missing email: {e}"

    # 3. Test missing password
    try:
        response = requests.post(
            f"{BASE_URL}{REGISTER_ENDPOINT}",
            json=missing_password_data,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 400, f"Expected 400 for missing password but got {response.status_code}"
        resp_json = response.json()
        assert "password" in str(resp_json).lower() or "missing" in str(resp_json).lower() or "required" in str(resp_json).lower()
    except requests.RequestException as e:
        assert False, f"RequestException during registration missing password: {e}"

    # 4. Test invalid email format
    try:
        response = requests.post(
            f"{BASE_URL}{REGISTER_ENDPOINT}",
            json=invalid_email_data,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 400, f"Expected 400 for invalid email format but got {response.status_code}"
        resp_json = response.json()
        assert "email" in str(resp_json).lower() or "invalid" in str(resp_json).lower()
    except requests.RequestException as e:
        assert False, f"RequestException during registration invalid email: {e}"

    # 5. Test invalid graduation year format
    try:
        response = requests.post(
            f"{BASE_URL}{REGISTER_ENDPOINT}",
            json=invalid_graduation_year_data,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 400, f"Expected 400 for invalid graduation year but got {response.status_code}"
        resp_json = response.json()
        assert "graduationyear" in str(resp_json).lower() or "invalid" in str(resp_json).lower()
    except requests.RequestException as e:
        assert False, f"RequestException during registration invalid graduation year: {e}"


test_verify_user_registration_with_valid_and_invalid_data()
