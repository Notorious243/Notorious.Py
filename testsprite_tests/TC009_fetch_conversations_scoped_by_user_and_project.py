import requests
import base64

BASE_URL = "http://localhost:5173"
AUTH_URL = f"{BASE_URL}/auth/v1/token"
AI_CONVERSATIONS_URL = f"{BASE_URL}/rest/v1/ai_conversations"
PROJECTS_URL = f"{BASE_URL}/rest/v1/projects"

USERNAME = "michel.maleka1@gmail.com"
PASSWORD = "12345678"


def get_jwt_token(username, password):
    auth_payload = {
        "username": username,
        "password": password
    }
    # Basic Token auth with POST /auth/v1/token returns JWT token
    response = requests.post(AUTH_URL, json=auth_payload, timeout=30)
    response.raise_for_status()
    token_json = response.json()
    jwt_token = token_json.get("access_token") or token_json.get("token") or token_json.get("accessToken") or token_json.get("jwt")
    if not jwt_token:
        # fallback: try to detect token keys if not direct
        keys = list(token_json.keys())
        if keys and isinstance(token_json[keys[0]], str):
            jwt_token = token_json[keys[0]]
    if not jwt_token:
        raise ValueError("JWT token not found in auth response")
    return jwt_token


def test_fetch_conversations_scoped_by_user_and_project():
    # Step 1: Authenticate and get JWT token
    jwt_token = get_jwt_token(USERNAME, PASSWORD)
    headers_auth = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # Step 2: Create a new project for scoped testing (required for user_id and project_id)
    # Project creation payload
    project_payload = {
        "name": "Test Project for AI Conversations",
        "canvas": {},
        "created_by": USERNAME
    }
    project_resp = requests.post(PROJECTS_URL, json=project_payload, headers=headers_auth, timeout=30)
    assert project_resp.status_code == 201, f"Failed to create project. Status: {project_resp.status_code}"
    project_data = project_resp.json()
    # extract project id - Supabase returns array with inserted record or dict with id
    if isinstance(project_data, list):
        project_id = project_data[0].get("id") or project_data[0].get("projectId") or project_data[0].get("id")
    else:
        project_id = project_data.get("id") or project_data.get("projectId")
    assert project_id is not None, "Project ID not found in project creation response."

    # Step 3: Create a dummy AI conversation for this user/project
    ai_conversation_payload = {
        "project_id": project_id,
        "user_id": USERNAME,
        "messages": [
            {"role": "system", "content": "You are a helpful AI assistant."},
            {"role": "user", "content": "Hello, AI!"}
        ]
    }
    ai_conv_resp = requests.post(AI_CONVERSATIONS_URL, json=ai_conversation_payload, headers=headers_auth, timeout=30)
    assert ai_conv_resp.status_code == 201, f"Failed to create AI conversation. Status: {ai_conv_resp.status_code}"
    ai_conv_data = ai_conv_resp.json()
    if isinstance(ai_conv_data, list):
        conversation_id = ai_conv_data[0].get("id") or ai_conv_data[0].get("conversationId")
    else:
        conversation_id = ai_conv_data.get("id") or ai_conv_data.get("conversationId")
    assert conversation_id is not None, "Conversation ID not found in conversation creation response."

    try:
        # Step 4: Fetch AI conversations scoped by user and project
        params = {
            "project_id": f"eq.{project_id}",
            "user_id": f"eq.{USERNAME}"
        }
        get_resp = requests.get(AI_CONVERSATIONS_URL, headers=headers_auth, params=params, timeout=30)
        assert get_resp.status_code == 200, f"Expected status 200 but got {get_resp.status_code}"
        conversations = get_resp.json()
        assert isinstance(conversations, list), "Response is not a list as expected."

        # The list should contain at least the conversation created
        found = any(
            (conv.get("id") == conversation_id or conv.get("conversationId") == conversation_id) and
            conv.get("project_id") == project_id and
            conv.get("user_id") == USERNAME
            for conv in conversations
        )
        assert found, "Created conversation not found in fetched conversation history."

    finally:
        # Cleanup: Delete the created AI conversation
        if conversation_id:
            delete_conv_url = f"{AI_CONVERSATIONS_URL}?id=eq.{conversation_id}"
            del_conv_resp = requests.delete(delete_conv_url, headers=headers_auth, timeout=30)
            assert del_conv_resp.status_code in [204, 200], f"Failed to delete AI conversation {conversation_id}"

        # Cleanup: Delete the created project
        if project_id:
            delete_proj_url = f"{PROJECTS_URL}?id=eq.{project_id}"
            del_proj_resp = requests.delete(delete_proj_url, headers=headers_auth, timeout=30)
            assert del_proj_resp.status_code in [204, 200], f"Failed to delete project {project_id}"


test_fetch_conversations_scoped_by_user_and_project()