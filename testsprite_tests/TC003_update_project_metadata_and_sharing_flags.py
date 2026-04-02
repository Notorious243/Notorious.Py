import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
AUTH_URL = f"{BASE_URL}/auth/v1/token"
PROJECTS_URL = f"{BASE_URL}/rest/v1/projects"
TIMEOUT = 30

username = "michel.maleka1@gmail.com"
password = "12345678"

def test_update_project_metadata_and_sharing_flags():
    # Authenticate and get JWT token
    auth_payload = {
        "email": username,
        "password": password
    }
    auth_response = requests.post(AUTH_URL, json=auth_payload, timeout=TIMEOUT)
    try:
        assert auth_response.status_code == 200, f"Authentication failed: {auth_response.text}"
        token = auth_response.json().get("access_token")
        assert token, "No access token received"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        # Create a new project to update later
        create_payload = {
            "name": "Test Project for Update",
            "canvas": {},
            "created_by": username
        }
        create_response = requests.post(PROJECTS_URL, headers=headers, json=create_payload, timeout=TIMEOUT)
        assert create_response.status_code == 201, f"Project creation failed: {create_response.text}"
        project_id = None
        project_data = create_response.json()
        if isinstance(project_data, list) and len(project_data) > 0:
            # Supabase sometimes returns list with inserted record
            project_id = project_data[0].get("id")
        elif isinstance(project_data, dict):
            project_id = project_data.get("id")
        assert project_id, "Project ID not returned after creation"

        try:
            patch_url = f"{PROJECTS_URL}?id=eq.{project_id}"
            update_payload = {
                "metadata": {
                    "meta": {
                        "project": "Notorious.PY Updated",
                        "date": "2026-03-30",
                        "prepared_by": "Test Engineer"
                    }
                },
                "is_public": True
            }
            patch_response = requests.patch(patch_url, headers=headers, json=update_payload, timeout=TIMEOUT)
            assert patch_response.status_code == 204, f"Expected 204 on update, got {patch_response.status_code}. Response: {patch_response.text}"

        finally:
            # Cleanup: delete the created project
            delete_url = f"{PROJECTS_URL}?id=eq.{project_id}"
            delete_response = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
            assert delete_response.status_code == 204, f"Failed to delete project in cleanup: {delete_response.text}"

    except Exception as e:
        raise e

test_update_project_metadata_and_sharing_flags()