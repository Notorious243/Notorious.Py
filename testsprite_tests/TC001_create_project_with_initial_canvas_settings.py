import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
AUTH_URL = f"{BASE_URL}/auth/v1/token"
PROJECTS_URL = f"{BASE_URL}/rest/v1/projects"
USERNAME = "michel.maleka1@gmail.com"
PASSWORD = "12345678"
TIMEOUT = 30


def test_create_project_with_initial_canvas_settings():
    # Authenticate to get JWT token
    auth_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        auth_response = requests.post(
            AUTH_URL,
            json=auth_payload,
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        assert auth_response.status_code == 200, f"Auth failed: {auth_response.text}"
        auth_data = auth_response.json()
        assert "access_token" in auth_data, "No access_token in auth response"
        token = auth_data["access_token"]
    except Exception as e:
        raise AssertionError(f"Authentication step failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # Define valid initial canvas settings and project data
    project_payload = {
        "name": "Test Project Initial Canvas",
        "canvas": {
            "width": 800,
            "height": 600,
            "background_color": "#ffffff",
            "grid_enabled": True,
            "grid_size": 20
        },
        "created_by": USERNAME
    }

    project_id = None
    try:
        # Create a new project
        create_response = requests.post(
            PROJECTS_URL,
            headers=headers,
            json=project_payload,
            timeout=TIMEOUT
        )
        assert create_response.status_code == 201, f"Expected 201 Created, got {create_response.status_code}: {create_response.text}"
        create_data = create_response.json()
        assert isinstance(create_data, dict), "Create response is not a JSON object"
        assert "projectId" in create_data, "Response missing 'projectId'"
        project_id = create_data["projectId"]
        assert isinstance(project_id, (str, int)), "projectId is not string or int"
    finally:
        # Cleanup created project if created
        if project_id:
            try:
                delete_response = requests.delete(
                    f"{PROJECTS_URL}?id=eq.{project_id}",
                    headers=headers,
                    timeout=TIMEOUT
                )
                assert delete_response.status_code == 204, f"Failed to delete project {project_id}, status: {delete_response.status_code}"
            except Exception as e:
                # Log or raise error on cleanup failure
                raise AssertionError(f"Cleanup failed for project {project_id}: {e}")


test_create_project_with_initial_canvas_settings()
