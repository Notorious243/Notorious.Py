import requests

BASE_URL = "http://localhost:5173"
AUTH_URL = f"{BASE_URL}/auth/v1/token"
PROJECTS_URL = f"{BASE_URL}/rest/v1/projects"

USERNAME = "michel.maleka1@gmail.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_delete_existing_project():
    # Authenticate and get JWT token
    auth_response = requests.post(
        AUTH_URL,
        json={"email": USERNAME, "password": PASSWORD},
        timeout=TIMEOUT
    )
    assert auth_response.status_code == 200, f"Auth failed: {auth_response.text}"
    token = auth_response.json().get("access_token")
    assert token, "No access token in auth response"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # Create a project to delete
    project_payload = {
        "name": "Test Project Delete",
        "canvas": {"width": 640, "height": 480},
        "created_by": USERNAME
    }
    create_response = requests.post(
        PROJECTS_URL,
        json=project_payload,
        headers=headers,
        timeout=TIMEOUT
    )
    assert create_response.status_code == 201, f"Project creation failed: {create_response.text}"
    created_project = create_response.json()
    # The project ID is expected to be returned as part of the response body or location header
    # Assume JSON response contains 'id' field
    project_id = created_project.get("id")
    assert project_id is not None, f"Created project ID not found in response: {created_project}"

    try:
        # Delete the created project
        delete_params = {"id": f"eq.{project_id}"}
        delete_response = requests.delete(
            PROJECTS_URL,
            headers=headers,
            params=delete_params,
            timeout=TIMEOUT
        )
        assert delete_response.status_code == 204, f"Delete failed: {delete_response.text}"

        # Verify the project is deleted by fetching it
        get_response = requests.get(
            PROJECTS_URL,
            headers=headers,
            params=delete_params,
            timeout=TIMEOUT
        )
        # The response for non-existing resource should be an empty list or 404 based on API behavior
        # Assuming it returns empty list with 200 OK
        assert get_response.status_code == 200, f"Get after delete failed: {get_response.text}"
        projects = get_response.json()
        assert isinstance(projects, list), f"Unexpected get response format: {projects}"
        assert len(projects) == 0, "Deleted project still exists in the system"
    finally:
        # Cleanup: safe delete in case delete failed above or test interrupted
        requests.delete(
            PROJECTS_URL,
            headers=headers,
            params={"id": f"eq.{project_id}"},
            timeout=TIMEOUT
        )

test_delete_existing_project()