# Jira Codex Workflow Setup

This guide explains how to configure Jira to trigger the Codex workflow when a "codex" label is added to an issue.

## Prerequisites

### Creating a GitHub Personal Access Token (PAT)

You need a GitHub Personal Access Token for Jira to authenticate and trigger the workflow. Follow these steps:

1. **Go to GitHub Settings**

   - Click your profile picture in the top right → **Settings**
   - Or go directly to: `https://github.com/settings/profile`

2. **Navigate to Developer Settings**

   - Scroll down in the left sidebar
   - Click **Developer settings** (at the bottom)

3. **Create a Personal Access Token**

   - Click **Personal access tokens** → **Tokens (classic)**
   - Click **Generate new token** → **Generate new token (classic)**

4. **Configure the Token**

   - **Note**: Give it a descriptive name (e.g., "Jira Codex Workflow")
   - **Expiration**: Choose an expiration period (recommended: 90 days or custom)
   - **Scopes**: Select the following permissions:
     - ✅ `repo` (Full control of private repositories)
       - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`
     - ✅ `workflow` (Update GitHub Action workflows)

5. **Generate and Copy the Token**

   - Click **Generate token** at the bottom
   - **IMPORTANT**: Copy the token immediately - you won't be able to see it again!
   - The token will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

6. **Store the Token Securely**
   - Save it in a password manager or secure location
   - You'll use this token in Jira as the password for Basic Authentication

### Using the Token in Jira

When configuring the web request in Jira:

- **Authentication Type**: Basic Auth
- **Username**: Your GitHub username
- **Password**: The GitHub Personal Access Token (PAT) you just created

### Creating a Fine-Grained Personal Access Token (Recommended for Organizations)

If you're using a GitHub organization or want more granular control, use a **Fine-grained Personal Access Token**:

1. **Go to Fine-grained Tokens**

   - **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
   - Click **Generate new token**

2. **Configure Repository Access**

   - Select **"Only select repositories"**
   - Choose your repository (e.g., `doc-chat-app` or `Doc-rag-agent`)

3. **Add Required Permissions**
   Click **"+ Add permissions"** and add the following **Repository permissions**:

   - ✅ **Actions**: `Write` (Required to trigger workflow_dispatch via API)
   - ✅ **Metadata**: `Read-only` (Always required, automatically added)

   > **Note**: According to [GitHub's fine-grained PAT documentation](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens), the **Actions** repository permission (write) is required to trigger workflows via the API endpoint `/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches`.
   >
   > **Important**: The Jira token only needs Actions permission to trigger the workflow. Once triggered, the workflow uses the `GITHUB_TOKEN` (which has `contents: write` and `pull-requests: write` permissions) to perform commits, pushes, and create pull requests.

4. **Generate the Token**
   - Give it a descriptive name (e.g., "Jira Codex Workflow")
   - Set expiration if desired
   - Click **Generate token**
   - **IMPORTANT**: Copy the token immediately!

> **Note**: Fine-grained tokens are more secure as they can be scoped to specific repositories and have minimal required permissions.

### Security Best Practices

- ✅ **Never commit the token to your repository**
- ✅ **Use the token only in Jira's secure credential storage** (not in plain text)
- ✅ **Set an expiration date** and rotate tokens regularly
- ✅ **Use fine-grained tokens** if you want to limit access to specific repositories
- ✅ **Revoke the token immediately** if it's compromised or no longer needed

## Jira Webhook Configuration

### Option 1: Using Jira Automation (Recommended)

1. Go to **Project Settings** → **Automation** in your Jira project
2. Create a new automation rule
3. Set the trigger: **Issue updated** → When **Label** is added → Select **codex**
4. Add an action: **Send web request**
5. Configure the web request:
   - **URL**: `https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches`
     - Replace `{owner}` with your GitHub username/organization
     - Replace `{repo}` with your repository name
     - Replace `{workflow_id}` with `jira-codex.yml` (the workflow filename) or the numeric workflow ID
     - Example: `https://api.github.com/repos/diedrickngendahayo/doc-chat-app/actions/workflows/jira-codex.yml/dispatches`
   - **Method**: POST
   - **Authentication**: Basic Auth
     - Username: Your GitHub username
     - Password: Your GitHub Personal Access Token (PAT)
   - **Headers**:
     - `Accept: application/vnd.github.v3+json`
   - **Body** (JSON):
     ```json
     {
       "ref": "main",
       "inputs": {
         "issue_key": "{{issue.key}}",
         "issue_summary": "{{issue.summary}}",
         "issue_description": "{{issue.description}}"
       }
     }
     ```

### Option 2: Using Jira Webhooks

1. Go to **Project Settings** → **Webhooks**
2. Create a new webhook
3. Set the URL: `https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches`
4. Configure the webhook to trigger on issue updates
5. Use a Jira automation rule to filter for the "codex" label and send the webhook

## GitHub Workflow Dispatch API

The workflow uses GitHub's `workflow_dispatch` event, which requires:

- **Endpoint**: `POST https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches`
- **Workflow ID**: Can be the workflow filename (e.g., `jira-codex.yml`) or the numeric workflow ID
- **Request Body**: Must include `ref` (branch name) and `inputs`:
  ```json
  {
    "ref": "main",
    "inputs": {
      "issue_key": "PROJ-123",
      "issue_summary": "Issue title",
      "issue_description": "Issue description"
    }
  }
  ```

## Testing the Workflow

1. Create a test issue in Jira
2. Add the "codex" label to the issue
3. Check the GitHub Actions tab to see if the workflow runs
4. The workflow will:
   - Create a branch named `codex-{issue-key}` (e.g., `codex-proj-123`)
   - Install codex and run `codexg`
   - Commit changes and push the branch
   - Create a pull request automatically

## Troubleshooting

- **Workflow not triggering**:
  - Verify the workflow filename matches in the URL (`jira-codex.yml`)
  - Check that the `ref` in the request body matches your default branch (usually `main` or `master`)
  - Ensure all required inputs are provided
- **Authentication errors**: Verify your GitHub PAT has the correct permissions (`repo` and `workflow`)
- **Branch creation fails**: Ensure the issue key doesn't contain invalid characters (they'll be sanitized)
- **Codexg not found**: The workflow installs codex using `npm i -g @openai/codex`. If codex installation fails, verify the package name and npm access.

## Workflow Behavior

- The workflow creates branches with the pattern: `codex-{issue-key}`
- If no changes are made by codexg, no commit or PR will be created
- The PR title format: `[{ISSUE_KEY}] {ISSUE_SUMMARY}`
- The PR includes the issue description in the body
