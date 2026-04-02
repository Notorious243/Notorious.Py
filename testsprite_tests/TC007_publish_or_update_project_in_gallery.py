import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
AUTH_URL = f"{BASE_URL}/auth/v1/token"
PROJECTS_URL = f"{BASE_URL}/rest/v1/projects"
GALLERY_URL = f"{BASE_URL}/rest/v1/gallery_projects"
TIMEOUT = 30

auth_credentials = {
    "username": "michel.maleka1@gmail.com",
    "password": "12345678"
}

def test_publish_or_update_project_in_gallery():
    # Authenticate and get JWT token
    auth_response = requests.post(
        AUTH_URL,
        auth=HTTPBasicAuth(auth_credentials["username"], auth_credentials["password"]),
        timeout=TIMEOUT
    )
    assert auth_response.status_code == 200, f"Auth failed: {auth_response.text}"
    jwt_token = auth_response.json().get("access_token")
    assert jwt_token, "No JWT token received"

    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # Create a new project to use in gallery publishing
    project_payload = {
        "name": "Test Project for Gallery Publish",
        "canvas": {"width": 800, "height": 600, "background_color": "#FFFFFF"},
        "created_by": auth_credentials["username"]
    }
    create_project_resp = requests.post(PROJECTS_URL, json=project_payload, headers=headers, timeout=TIMEOUT)
    assert create_project_resp.status_code == 201, f"Project creation failed: {create_project_resp.text}"
    created_project = create_project_resp.json()
    project_id = created_project.get("id") or created_project.get("projectId")
    assert project_id, "No project ID returned on creation"

    try:
        # Publish (or update) project in gallery
        gallery_payload = {
            "project_id": project_id,
            "title": "Gallery Publish Test Project",
            "description": "Test project published to gallery via automated test."
        }
        gallery_resp = requests.post(GALLERY_URL, json=gallery_payload, headers=headers, timeout=TIMEOUT)
        assert gallery_resp.status_code == 200, f"Gallery publish failed: {gallery_resp.text}"
        gallery_record = gallery_resp.json()
        assert isinstance(gallery_record, dict), "Gallery record is not a dict"
        assert "id" in gallery_record or "galleryId" in gallery_record, "Gallery record missing ID"
        assert gallery_record.get("project_id") == project_id, "Gallery record project_id mismatch"

    finally:
        # Clean up: delete the project created
        del_resp = requests.delete(f"{PROJECTS_URL}?id=eq.{project_id}", headers=headers, timeout=TIMEOUT)
        assert del_resp.status_code == 204, f"Failed to delete project: {del_resp.text}"

test_publish_or_update_project_in_gallery()