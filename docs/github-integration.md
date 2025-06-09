# GitHub Integration with API Harmony Lite

## Feature Overview

This document describes the integration between API Harmony Lite and GitHub. This integration allows API Harmony Lite to scan your GitHub repositories for API-related issues, providing feedback directly in your pull requests.

## Prerequisites

* An active API Harmony Lite account.
* Owner permissions for the GitHub organization or repository you want to integrate.
* Your API Harmony Lite instance must be publicly accessible for GitHub webhooks to function correctly.

## Setup and Configuration

### 1. Install the API Harmony Lite GitHub App

1.  Navigate to the API Harmony Lite GitHub App page (link to be provided).
2.  Click "Install" and choose the GitHub organization or specific repositories where you want to install the app.
3.  Authorize the app with the requested permissions.

### 2. Enable GitHub Integration in API Harmony Lite

1.  Log in to your API Harmony Lite instance.
2.  Navigate to "Settings" > "Integrations".
3.  Find the "GitHub" section and click "Enable".
4.  You will be prompted to provide your GitHub organization name.
5.  Follow the on-screen instructions to complete the connection. This may involve API Harmony Lite verifying its access.

### 3. Configure Webhook in GitHub (if not automatically configured by the App)

In most cases, the GitHub App installation handles webhook creation. However, if manual setup is needed:

1.  In your GitHub repository (or organization settings for all repositories), go to "Settings" > "Webhooks".
2.  Click "Add webhook".
3.  **Payload URL**: Enter the webhook URL provided by API Harmony Lite (e.g., `https://your-api-harmony-instance.com/webhook/github`).
4.  **Content type**: Select `application/json`.
5.  **Secret**: Enter the webhook secret provided by API Harmony Lite. This is crucial for securing your webhooks.
6.  **Which events would you like to trigger this webhook?**: Select "Pull requests" and "Pushes" (if you want scans on direct pushes to the default branch).
7.  Ensure "Active" is checked.
8.  Click "Add webhook".

## Using the Feature

Once configured, API Harmony Lite will automatically scan new pull requests and pushes to the default branch (if "Pushes" event is enabled).

*   **Pull Request Scans**: When a pull request is opened or updated (new commits are pushed), API Harmony Lite will initiate a scan.
*   **Commit Statuses**: API Harmony Lite will update the commit status in GitHub to reflect the scan progress (e.g., "pending", "success", "failure").
    *   **Pending**: Scan is in progress.
    *   **Success**: Scan completed, and no critical issues were found (configurable).
    *   **Failure**: Scan completed, and critical issues were found, or the scan itself failed.
    *   **Error**: The scan could not be performed due to a configuration or system error.
*   A comment may also be posted on the pull request with a summary of the findings and a link to the detailed report in API Harmony Lite.

## Viewing Scan Results

*   **GitHub Pull Request**: Check the "Checks" tab on the pull request page or the commit status indicators. Click on the "Details" link next to the API Harmony Lite status to go directly to the scan report.
*   **API Harmony Lite UI**: Log in to your API Harmony Lite instance. Navigate to the "Scans" or "Projects" section to view detailed reports, issue breakdowns, and remediation advice.

## Troubleshooting Common Issues

*   **No scans are triggered**:
    *   Verify the GitHub App is installed and has access to the repository.
    *   Check the webhook configuration in GitHub. Ensure the Payload URL is correct and the webhook is active.
    *   Look at the "Recent Deliveries" for the webhook in GitHub to see if events are being sent and if there are any errors.
    *   Ensure your API Harmony Lite instance is publicly accessible.
*   **Scan status remains "pending"**:
    *   Check the API Harmony Lite logs for any errors.
    *   There might be a queue of scans; allow some time for it to process.
*   **Webhook delivery errors in GitHub**:
    *   **403 Forbidden/Authentication failed**: Check the webhook secret in GitHub and API Harmony Lite.
    *   **404 Not Found**: The Payload URL might be incorrect.
    *   **Timeout errors**: Your API Harmony Lite instance might be slow to respond or down.
*   **"Error" status on commit**:
    *   This usually indicates a problem on the API Harmony Lite side or a fundamental misconfiguration. Check API Harmony Lite logs.

## Managing Repository Connections

*   **Adding/Removing Repositories**:
    *   To add new repositories, you can configure the installed GitHub App in your GitHub organization settings ("Installed GitHub Apps" > "API Harmony Lite" > "Configure") and grant it access to more repositories.
    *   To remove repositories, either revoke access for specific repositories in the GitHub App configuration or uninstall the App entirely from those repositories.
*   **Disconnecting Integration**:
    *   In API Harmony Lite: Navigate to "Settings" > "Integrations" and disable the GitHub integration.
    *   In GitHub: Uninstall the API Harmony Lite GitHub App from your organization or repositories.

## Permissions Used by the GitHub App

The API Harmony Lite GitHub App requires the following permissions:

*   **Read access to code**: To fetch and scan repository content.
*   **Read access to metadata**: To identify repositories and users.
*   **Read and write access to checks**: To create and update check runs (commit statuses).
*   **Read and write access to pull requests**: To post comments on pull requests with scan summaries.
*   **Read access to webhooks (if self-configuring)**: To manage its own webhook.
*   **Administration (repository webhooks)**: To create webhooks automatically.

It's important to review these permissions during the installation process. API Harmony Lite is designed to request the minimum permissions necessary for its functionality.
