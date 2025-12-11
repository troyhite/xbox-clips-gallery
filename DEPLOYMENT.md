# DEPLOYMENT GUIDE: Xbox Clips Gallery to Azure App Service

## Prerequisites
- Azure subscription
- Azure CLI installed: `az login`

## Step 1: Create Azure Resources

### 1.1 Create Resource Group
```bash
az group create --name xbox-clips-rg --location eastus
```

### 1.2 Create Application Insights
```bash
az monitor app-insights component create \
  --app xbox-clips-insights \
  --location centralus \
  --resource-group xbox-clips-rg \
  --application-type web
```

**Copy the Connection String** from the output - you'll need this!

### 1.3 Create App Service Plan (Linux)
```bash
az appservice plan create \
  --name xbox-clips-plan \
  --resource-group xbox-clips-rg \
  --is-linux \
  --sku B1
```

### 1.4 Create Web App
```bash
az webapp create \
  --name xbox-clips-gallery \
  --resource-group xbox-clips-rg \
  --plan xbox-clips-plan \
  --runtime "NODE:20-lts"
```

**Your app URL will be:** `https://xbox-clips-gallery.azurewebsites.net`

## Step 2: Configure Environment Variables in Azure

```bash
az webapp config appsettings set \
  --name xbox-clips-gallery \
  --resource-group xbox-clips-rg \
  --settings \
  NEXT_PUBLIC_AZURE_CLIENT_ID="<YOUR_AZURE_CLIENT_ID>" \
  NEXT_PUBLIC_AZURE_TENANT_ID="consumers" \
  NEXT_PUBLIC_REDIRECT_URI="https://xbox-clips-gallery.azurewebsites.net" \
  NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING="<YOUR_CONNECTION_STRING_HERE>" \
  SCM_DO_BUILD_DURING_DEPLOYMENT=true \
  WEBSITE_NODE_DEFAULT_VERSION="20-lts"
```

**Important:** Replace `<YOUR_CONNECTION_STRING_HERE>` with the actual connection string from Step 1.2!

## Step 3: Update Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App Registrations**
3. Select your app: **Xbox Clips Gallery**
4. Go to **Authentication**
5. Under **Single-page application**, click **Add URI**
6. Add: `https://xbox-clips-gallery.azurewebsites.net`
7. Click **Save**

**CRITICAL:** Keep `http://localhost:3000` for local development!

## Step 4: Deploy to Azure

### Option A: Deploy with GitHub Actions (Recommended - Fastest)

**Setup once:**
1. Fork/push your code to GitHub
2. Get publish profile:
```bash
az webapp deployment list-publishing-profiles --name xbox-clips-gallery --resource-group xbox-clips-rg --xml
```
3. Copy the output and add as GitHub Secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Create `.github/workflows/azure-deploy.yml` (see Option E below)
5. Push to main branch - automatic deployment!

**Benefits:** Fast (2-3 min), automatic, reliable, CI/CD ready

### Option B: Deploy with az webapp up (Slower but simple)

```bash
# Deploy without building (let Azure build it)
az webapp up --name xbox-clips-gallery --resource-group xbox-clips-rg --runtime "NODE:20-lts"
```

**Note:** This uploads source files and Azure builds remotely. Can take 5-10 minutes.

### Option C: Deploy with ZIP file (Fast - 2-3 minutes)

```powershell
# Create deployment zip (excludes unnecessary files using .deployignore)
$excludes = @('node_modules', '.next', '.git', '.env.local', 'deploy.zip', '.vscode')
Get-ChildItem -Exclude $excludes | Compress-Archive -DestinationPath deploy.zip -Force

# Deploy the zip file
az webapp deployment source config-zip `
  --name xbox-clips-gallery `
  --resource-group xbox-clips-rg `
  --src deploy.zip
```

**Note:** Azure builds your app after upload. Much faster than uploading built files!

### Option D: Deploy with Git (Medium speed)

```bash
# Initialize git if needed
git init
git add .
git commit -m "Initial commit"

# Get deployment credentials
az webapp deployment source config-local-git `
  --name xbox-clips-gallery `
  --resource-group xbox-clips-rg

# Add Azure remote (use the URL from previous command)
git remote add azure <DEPLOYMENT_URL>

# Deploy (uses .gitignore to exclude files)
git push azure main
```

### Option E: Deploy with VS Code

1. Install **Azure App Service** extension
2. Right-click on the app
3. Select **Deploy to Web App**
4. Choose your subscription and app

### Option F: Deploy from GitHub Actions (CI/CD - Fastest & Best)

**This is the FASTEST and most reliable method!** (2-3 minutes)

1. Get your publish profile:
```bash
az webapp deployment list-publishing-profiles --name xbox-clips-gallery --resource-group xbox-clips-rg --xml > publish-profile.xml
```

2. Add to GitHub:
   - Go to your repo → Settings → Secrets → New secret
   - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Value: Paste the XML content from publish-profile.xml

3. Create `.github/workflows/azure-deploy.yml`:
```yaml
name: Deploy to Azure
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Next.js app
        run: npm run build
      
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'xbox-clips-gallery'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
```

4. Push to GitHub and it deploys automatically!

## Step 5: Configure Startup Command (Important!)

```bash
az webapp config set \
  --name xbox-clips-gallery \
  --resource-group xbox-clips-rg \
  --startup-file "npm start"
```

## Step 6: Verify Deployment

1. Open: `https://xbox-clips-gallery.azurewebsites.net`
2. Click **Sign in with Microsoft**
3. Check Application Insights for telemetry data

## What Changes for Public Access?

### In Your Code:
✅ **ALREADY DONE** - Application Insights configured
✅ **ALREADY DONE** - Environment variables externalized

### In Azure Portal:

1. **Azure AD App Registration:**
   - Add production redirect URI: `https://xbox-clips-gallery.azurewebsites.net`
   - Keep localhost URI for dev

2. **App Service Configuration:**
   - Set all environment variables (Step 2)
   - Configure custom domain (optional)
   - Enable HTTPS only (recommended)

3. **Application Insights:**
   - Monitor performance and errors
   - Set up alerts for failures
   - View user analytics

### Security Recommendations:

```bash
# Enable HTTPS only
az webapp update \
  --name xbox-clips-gallery \
  --resource-group xbox-clips-rg \
  --https-only true

# Add custom domain (optional)
az webapp config hostname add \
  --webapp-name xbox-clips-gallery \
  --resource-group xbox-clips-rg \
  --hostname yourdomain.com
```

## Troubleshooting

### App won't start:
```bash
# Check logs
az webapp log tail \
  --name xbox-clips-gallery \
  --resource-group xbox-clips-rg
```

### Authentication issues:
- Verify redirect URI matches exactly
- Check environment variables are set
- Clear browser cache/localStorage

### Check deployment status:
```bash
az webapp show \
  --name xbox-clips-gallery \
  --resource-group xbox-clips-rg \
  --query state
```

## Cost Estimate

- **App Service (B1):** ~$13/month
- **Application Insights:** Free tier (1GB/month)
- **Total:** ~$13-20/month

## Scaling for Production

```bash
# Scale to S1 (better performance)
az appservice plan update \
  --name xbox-clips-plan \
  --resource-group xbox-clips-rg \
  --sku S1

# Enable auto-scaling
az monitor autoscale create \
  --resource-group xbox-clips-rg \
  --resource xbox-clips-gallery \
  --resource-type Microsoft.Web/sites \
  --name autoscale-settings \
  --min-count 1 \
  --max-count 3 \
  --count 1
```

## Quick Deploy Summary

```bash
# 1. Create resources
az group create --name xbox-clips-rg --location eastus
az monitor app-insights component create --app xbox-clips-insights --location eastus --resource-group xbox-clips-rg
az appservice plan create --name xbox-clips-plan --resource-group xbox-clips-rg --is-linux --sku B1
az webapp create --name xbox-clips-gallery --resource-group xbox-clips-rg --plan xbox-clips-plan --runtime "NODE:20-lts"

# 2. Configure settings (IMPORTANT: Replace with YOUR actual values!)
az webapp config appsettings set --name xbox-clips-gallery --resource-group xbox-clips-rg --settings NEXT_PUBLIC_AZURE_CLIENT_ID="<YOUR_AZURE_CLIENT_ID>" NEXT_PUBLIC_AZURE_TENANT_ID="consumers" NEXT_PUBLIC_REDIRECT_URI="https://xbox-clips-gallery.azurewebsites.net" NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING="<YOUR_CONNECTION_STRING>"

# 3. Deploy (Choose fastest method)

# Method 1: GitHub Actions (FASTEST - 2-3 min, recommended)
# Push to GitHub with the workflow file from Option F

# Method 2: ZIP deployment (Fast - 3-5 min)
Get-ChildItem -Exclude node_modules,.next,.git,.env.local,deploy.zip,.vscode | Compress-Archive -DestinationPath deploy.zip -Force
az webapp deployment source config-zip --name xbox-clips-gallery --resource-group xbox-clips-rg --src deploy.zip

# Method 3: az webapp up (Slow - 10-15 min)
az webapp up --name xbox-clips-gallery --resource-group xbox-clips-rg --runtime "NODE:20-lts"

# 4. Done! Visit https://xbox-clips-gallery.azurewebsites.net
```
