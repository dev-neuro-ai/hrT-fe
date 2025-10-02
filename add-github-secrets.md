# Adding GitHub Secrets for Azure Static Web Apps

You need to add these secrets to your GitHub repository for the app to work in production.

## Option 1: Using GitHub CLI (if you have it installed)

```bash
# Install GitHub CLI if you don't have it
# macOS: brew install gh
# Then authenticate: gh auth login

# Add each secret (replace the values with your actual keys)
gh secret set VITE_FIREBASE_API_KEY --body "YOUR_VALUE"
gh secret set VITE_FIREBASE_AUTH_DOMAIN --body "YOUR_VALUE"
gh secret set VITE_FIREBASE_PROJECT_ID --body "YOUR_VALUE"
gh secret set VITE_FIREBASE_STORAGE_BUCKET --body "YOUR_VALUE"
gh secret set VITE_FIREBASE_MESSAGING_SENDER_ID --body "YOUR_VALUE"
gh secret set VITE_FIREBASE_APP_ID --body "YOUR_VALUE"
gh secret set VITE_OPENAI_API_KEY --body "YOUR_VALUE"
gh secret set VITE_OPENAI_API_KEY_ASSISTANT --body "YOUR_VALUE"
gh secret set VITE_BACKEND_URL --body "https://hrt-be.azurewebsites.net"
```

## Option 2: Using GitHub Web Interface (Easier)

1. Go to: https://github.com/dev-neuro-ai/hrT-fe/settings/secrets/actions
2. Click "New repository secret"
3. Add each of these secrets with their values from your .env file:

| Secret Name | Where to find the value |
|------------|-------------------------|
| VITE_FIREBASE_API_KEY | Your .env file |
| VITE_FIREBASE_AUTH_DOMAIN | Your .env file |
| VITE_FIREBASE_PROJECT_ID | Your .env file |
| VITE_FIREBASE_STORAGE_BUCKET | Your .env file |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Your .env file |
| VITE_FIREBASE_APP_ID | Your .env file |
| VITE_OPENAI_API_KEY | Your .env file |
| VITE_OPENAI_API_KEY_ASSISTANT | Your .env file |
| VITE_BACKEND_URL | https://hrt-be.azurewebsites.net |

## Why This is Required

Azure Static Web Apps doesn't inject environment variables during the build process. The variables you set in Azure Portal are only available at runtime for API functions, not during the Vite build process.

GitHub Secrets are the standard way to pass sensitive configuration to the build process in GitHub Actions.

## After Adding Secrets

Once you've added all the secrets, the next push to the repository will trigger a rebuild with the proper environment variables.