# Deployment Setup Requirements

To set up the CI/CD pipeline for Hostinger, I need the following information and you will need to set up some secrets in your GitHub repository.

## Information Needed from You:

1. **Hostinger SSH Details**:
   - **Host**: The IP address or domain of your Hostinger server (e.g., `212.1.208.xxx` or `ssh.example.com`).
   - **Username**: Your SSH username (usually something like `u12345678`).
   - **Port**: Usually `22`, but let me know if it's different.
2. **Deployment Path**: The absolute path where the application should be deployed on the server (e.g., `/home/u12345678/domains/opticore.com/public_html`).
3. **PHP Binary Path**: (Optional) In some Hostinger shared plans, you might need to use a specific PHP path like `/usr/local/bin/php8.3`. If you're not sure, I'll assume the default `php`.

## What You Need to Do in GitHub:

Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** and add the following **New repository secrets**:

1. `SSH_HOST`: The server IP/Domain.
2. `SSH_USER`: The SSH username.
3. `SSH_PRIVATE_KEY`: The content of your SSH private key (ensure the public key is added to `authorized_keys` on Hostinger).
4. `SSH_PORT`: (Optional, default 22).
5. `DEPLOY_PATH`: The destination directory on the server.

Once you provide these details, I will configure the `deploy.yml` file for you.
