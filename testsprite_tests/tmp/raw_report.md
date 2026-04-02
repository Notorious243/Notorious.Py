
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** notorious-py
- **Date:** 2026-03-31
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Login with valid credentials from auth overlay returns to authenticated builder
- **Test Code:** [TC001_Login_with_valid_credentials_from_auth_overlay_returns_to_authenticated_builder.py](./TC001_Login_with_valid_credentials_from_auth_overlay_returns_to_authenticated_builder.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/0a97bd4f-b869-4e79-b771-ce2c5832ff3e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Login with invalid credentials shows an authentication error and remains unauthenticated
- **Test Code:** [TC002_Login_with_invalid_credentials_shows_an_authentication_error_and_remains_unauthenticated.py](./TC002_Login_with_invalid_credentials_shows_an_authentication_error_and_remains_unauthenticated.py)
- **Test Error:** The application did not load, so the login form could not be accessed and the test could not be completed.

Observations:
- The page at http://localhost:5173 appears blank (screenshot shows an empty/placeholder background).
- No interactive elements were found on the page (no login button, links, or form fields).
- Two waits were attempted (2s and 3s) but the SPA still did not render any UI.
- The auth overlay or builder controls could not be opened because nothing is clickable or visible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/ba479adb-0f16-4d12-9835-f1373e3910d4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Password recovery request flow can be initiated from auth overlay
- **Test Code:** [TC003_Password_recovery_request_flow_can_be_initiated_from_auth_overlay.py](./TC003_Password_recovery_request_flow_can_be_initiated_from_auth_overlay.py)
- **Test Error:** Password recovery could not be confirmed because the app returned an error when attempting to send the OTP while remaining in the builder.

Observations:
- The 'Réinitialiser le mot de passe' modal is open inside the builder.
- The email field is filled with 'admintest@test.com'.
- After clicking 'Envoyer le code OTP', a red error message is displayed: "Impossible d'envoyer le code OTP."
- No success/confirmation message or subsequent OTP input screen appeared.
- The send button ('Envoyer le code OTP') remains visible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/bc96e49e-00d2-4288-8f9d-1a885711639d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Switch between login and signup modes within the auth overlay
- **Test Code:** [TC004_Switch_between_login_and_signup_modes_within_the_auth_overlay.py](./TC004_Switch_between_login_and_signup_modes_within_the_auth_overlay.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/079b2e4a-db14-4923-b81a-cb5d15e459f5
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Auth overlay can be dismissed without authenticating
- **Test Code:** [TC005_Auth_overlay_can_be_dismissed_without_authenticating.py](./TC005_Auth_overlay_can_be_dismissed_without_authenticating.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/cbf0ad46-c29d-447a-93a9-6b0d337a6a98
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Login form validation prevents submitting with empty required fields
- **Test Code:** [TC006_Login_form_validation_prevents_submitting_with_empty_required_fields.py](./TC006_Login_form_validation_prevents_submitting_with_empty_required_fields.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/6c814bb6-2cf2-4fb9-96cc-32059896d765
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Visual builder workspace loads primary content on /
- **Test Code:** [TC007_Visual_builder_workspace_loads_primary_content_on_.py](./TC007_Visual_builder_workspace_loads_primary_content_on_.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/5ba67aea-74e7-4458-8969-8cc223e77b9c
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Add a widget to the canvas and edit its properties
- **Test Code:** [TC008_Add_a_widget_to_the_canvas_and_edit_its_properties.py](./TC008_Add_a_widget_to_the_canvas_and_edit_its_properties.py)
- **Test Error:** Creating a project did not work — the project could not be created and the canvas remained locked, preventing further testing.

Observations:
- The 'Nouveau projet' modal is visible with the project name input.
- Repeated attempts to enter a project name and submit did not result in a saved project (0 projects created).
- The main canvas still displays 'Créez un projet pour débloquer' and widgets/properties remain inaccessible.
- The Create action appears to be disabled or not persisting despite inputs and multiple attempts.
- Login credentials were entered earlier but the project creation flow remained blocked.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/0aa80f86-1afc-4f92-bdee-71ec6b0c39a8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Save project after making a change shows a save confirmation
- **Test Code:** [TC009_Save_project_after_making_a_change_shows_a_save_confirmation.py](./TC009_Save_project_after_making_a_change_shows_a_save_confirmation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/49257b81-9917-4b2c-a3c3-c4a559335392
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Validation error prevents saving until properties are corrected
- **Test Code:** [TC010_Validation_error_prevents_saving_until_properties_are_corrected.py](./TC010_Validation_error_prevents_saving_until_properties_are_corrected.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/59725227-1551-41b0-bb1e-a37079c7038d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Navigate builder tools and dialogs from the top bar and sidebars
- **Test Code:** [TC011_Navigate_builder_tools_and_dialogs_from_the_top_bar_and_sidebars.py](./TC011_Navigate_builder_tools_and_dialogs_from_the_top_bar_and_sidebars.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/01367718-82cb-4633-9778-75d994cb8e6d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Export action is available from workspace controls
- **Test Code:** [TC012_Export_action_is_available_from_workspace_controls.py](./TC012_Export_action_is_available_from_workspace_controls.py)
- **Test Error:** The workspace export action could not be located in the project workspace, so the export workflow could not be started.

Observations:
- The project 'ExportTestProject' was created and opened successfully.
- The canvas is empty (no widget was added) and workspace controls/settings were opened several times.
- Multiple searches for 'Exporter' / 'Export' returned no matching controls or visible export button.
- No export confirmation view, export modal, or non-download export action appeared in the UI.
- An 'Export Python' label is present in the UI, but no actionable export control or workflow was discoverable to initiate export without a file download.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/ebd629a8-b69d-4663-86aa-3aeb578a4259
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Add multiple widgets and switch selection updates the properties panel
- **Test Code:** [TC013_Add_multiple_widgets_and_switch_selection_updates_the_properties_panel.py](./TC013_Add_multiple_widgets_and_switch_selection_updates_the_properties_panel.py)
- **Test Error:** Widgets could not be added for verification because the Components panel contains no components. Therefore it was not possible to select widgets and confirm that the Properties panel updates when different widgets are selected.

Observations:
- The Components/Explorer shows "Aucun composant" (no components) in the UI.
- The canvas displays the placeholder text 'Déposez des widgets ici' but no add-widget controls were found or usable.
- The Properties panel still shows 'Sélectionnez un widget pour modifier ses propriétés' and has no widget-specific properties populated.
- The project 'Test Project' and a file entry are visible in the left panel, so the workspace is loaded.
- No visible buttons or labels for adding components (e.g., 'Ajouter', '+', 'Widget', 'Composant') were found in the Components area.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/a44729fb-02e7-40a3-843e-c62a585aaf39
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Shared project viewing routes are not directly navigable due to dynamic token
- **Test Code:** [TC014_Shared_project_viewing_routes_are_not_directly_navigable_due_to_dynamic_token.py](./TC014_Shared_project_viewing_routes_are_not_directly_navigable_due_to_dynamic_token.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/f8ddcdc4-3300-4baa-a9aa-bd6a5423456a/81ac7813-5ffc-4528-9294-664ee4816fa3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **64.29** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---