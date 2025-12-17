# Xbox Clips & Screenshots Gallery

A modern web application built with Next.js that allows users to view and download their Xbox game clips and screenshots using Microsoft authentication.

## Features

### Core Gallery Features
- 🔐 **Microsoft Account Authentication** - Secure OAuth login using MSAL
- 📸 **Screenshots Gallery** - Browse and download your Xbox screenshots
- 🎬 **Video Clips Gallery** - View and download your recorded game clips
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- ⬇️ **Easy Downloads** - One-click download for any media
- 🎮 **Xbox Live Integration** - Direct integration with Xbox Live APIs

### AI-Powered Compilation Features
- 🤖 **AI Insights & Highlights** - Automatically analyze clips to identify best moments using Azure Video Indexer
- ✂️ **Smart Compilation Creation** - Generate highlight reels from selected clips with one click
- 📊 **Real-Time Status Tracking** - Monitor compilation progress with live status updates
- 🎥 **Compilations Gallery** - View, manage, and download all your generated compilations
- 🗑️ **Smart Deletion** - Delete single compilations or select multiple for batch deletion
- ☁️ **Azure Storage Integration** - Secure cloud storage for all compilation videos
- 🔒 **Secure Downloads** - Proxy-based downloads work seamlessly with Azure AD authentication

## Prerequisites

Before running this application, you need:

1. **Node.js** (v18 or higher)
2. **Microsoft Azure Account** - To create an app registration
3. **Xbox Live Account** - To access your media
4. **Azure Video Indexer** - For AI-powered compilation features (optional)
5. **Azure Storage Account** - For storing compilation videos (optional)

## Setup Instructions

### 1. Create Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App Registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: Xbox Clips Gallery
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: Select "Single-page application (SPA)" and enter `http://localhost:3000`
5. Click **Register**
6. Copy the **Application (client) ID** - you'll need this

### 2. Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph** > **Delegated permissions**
4. Add these permissions:
   - `User.Read`
   - `XboxLive.signin`
   - `XboxLive.offline_access`
5. Click **Add permissions**

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

1. # Authentication
   NEXT_PUBLIC_AZURE_CLIENT_ID=your_client_id_here
   NEXT_PUBLIC_AZURE_TENANT_ID=common
   NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
   
   # Video Indexer (Optional - for AI compilation features)
   VIDEO_INDEXER_ACCOUNT_ID=your_video_indexer_account_id
   VIDEO_INDEXER_RESOURCE_GROUP=your_resource_group
   VIDEO_INDEXER_SUBSCRIPTION_ID=your_subscription_id
   VIDEO_INDEXER_LOCATION=your_location
   
   # Azure Storage (Optional - for compilation storage)
   AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
   # Note: Uses Azure CLI credentials locally, managed identity in production
   
   # Video Compilation Service (Optional)
   VIDEO_COMPILATION_SERVICE_URL=your_compilation_service_urle
### Basic Gallery Usage

1. Click **Sign in with Microsoft** button
2. Authenticate with your Microsoft account that's linked to Xbox
3. Grant the requested permissions
4. View your screenshots and clips in the gallery
5. Click any media to view full size/play video
6. Use the **Download** button to save media to your device

### AI Compilation Features

#### Creating a Compilation
1. Navig├── xbox/              # Xbox Live API routes
│   │   │   ├── authenticate/  # Xbox authentication
│   │   │   ├── profile/       # User profile
│   │   │   ├── clips/         # Game clips
│   │   │   ├── screenshots/   # Screenshots
│   │   │   ├── compilations/  # List compilations
│   │   │   ├── compilation-status/  # Track compilation progress
│   │   │   ├── download-compilation/  # Proxy downloads
│   │   │   └── delete-compilation/    # Delete compilations
│   │   └── video-indexer/     # Video Indexer API routes
│   │       ├── analyze/       # Analyze clips
│   │       ├── insights/      # Get AI insights
│   │       └── create-compilation/  # Generate compilations
│   ├── layout.tsx         # Root layout with MSAL provider
│   └── page.tsx          # Main gallery page with tabs
├── components/
│   ├── AuthButton.tsx         # Sign in/out button
│   ├── ClipsGrid.tsx          # Video clips gallery
│   ├── ScreenshotGrid.tsx     # Screenshots gallery
│   ├── CompilationsGrid.tsx   # Compilations gallery with multi-select
### Frontend
- **Next.js 16** - React framework with App Router and Turbopack
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **React Hooks** - State management and effects

### Authentication & APIs
- **MSAL** - Microsoft Authentication Library
- **Xbox Live API** - Access to Xbox media
- **Azure Video Indexer** - AI-powered video analysis and insights
- **Azure Storage SDK** - Blob storage operations

### Azure Services
- **Azure AD** - Authentication and authorization
- **Azure Video Indexer** - Video analysis and compilation generation
- **Azure Blob Storage** - Secure compilation video storage
- **Azure App Service** - Production hosting
- **DefaultAzureCredential** - Unified authentication (Azure CLI + Managed Identity)

### Development Tools
- *Azure Storage Setup (For Compilation Features)

To enable compilation features, you need to set up Azure Storage and configure permissions:

### 1. Create Storage Account
```bash
az storage account create \
  --name <your-storage-account-name> \
  --resource-group <your-resource-group> \
  --location <your-location> \
  --sku Standard_LRS
```

### 2. Create Compilations Container
```bash
az storage container create \
  --name compilations \
  --account-name <your-storage-account-name> \
  --auth-mode login
```

### 3. Configure RBAC Permissions

For **local development** (using Azure CLI):
```bash
# Get your user ID
USER_ID=$(az ad signed-in-user show --query id -o tsv)

# Assign Storage Blob Data Reader (for viewing/downloading)
az role assignment create \
  --assignee $USER_ID \
  --role "Storage Blob Data Reader" \
  --scope "/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.Storage/storageAccounts/<storage-account-name>"

# Assign Storage Blob Data Contributor (for deleting)
az role assignment create \
  --assignee $USER_ID \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.Storage/storageAccounts/<storage-account-name>"
```

For **production** (using Managed Identity):
```bash
# Get your Web App's managed identity principal ID
APP_IDENTITY=$(az webapp identity show \
  --name <your-webapp-name> \
  --resource-group <your-resource-group> \
  --query principalId -o tsv)

# Assign Storage Blob Data Reader
az role assignment create \
  --assignee $APP_IDENTITY \
  --role "Storage Blob Data Reader" \
  --scope "/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.Storage/storageAccounts/<storage-account-name>"
```

### 4. Local Development Authentication
Make sure you're logged in with Azure CLI:
```bash
az login
```

The app uses `DefaultAzureCredential` which automatically uses:
- Azure CLI credentials in local development
- Managed Identity in production (Azure App Service)

## Troubleshooting

### Authentication Issues

**"Failed to authenticate with Xbox Live"**
- Ensure your Microsoft account is linked to an Xbox account
- Check that you've granted all required permissions in the Azure portal
- Try signing out and signing in again

**"No clips/screenshots found"**
- Make sure you have recorded clips or taken screenshots on your Xbox
- Check that your media privacy settings allow access

**Images not loading**
- Verify that `next.config.ts` includes Xbox Live domains in `remotePatterns`
- Check browser console for CORS errors

### Compilation Feature Issues

**"Failed to load compilations" / Authorization errors**
- Ensure Storage Blob Data Reader role is assigned to your account/managed identity
- Wait 5-10 minutes for RBAC permissions to propagate
- Verify you're logged in with Azure CLI (`az login`) for local development
- Check that `AZURE_STORAGE_ACCOUNT_NAME` is set in `.env.local`

**"Failed to delete compilation" / Authorization errors**
- Ensure Storage Blob Data Contributor role is assigned
- Permissions can take several minutes to propagate after assignment
- Try restarting the development server after assigning roles

**Download button not working**
- The app uses a proxy download pattern that works with Azure AD authentication
- Ensure you have the Storage Blob Data Reader role assigned
- Check browser console for specific error messages

**Compilation status stuck on "Processing"**
- Status is stored in memory and resets on server restart
- Check the Video Indexer portal to see if the compilation actually completed
- Refresh the Compilations tab to see if the video was successfully created

**Videos not appearing in Compilations tab**
- Click the Refresh button to reload the list
- Verify videos exist in the Azure Storage container
- Check that the container name is "compilations" (lowercase)

### Development Issues

**Build errors after editing files**
- Restart the dev server: `npm run dev`
- Clear Next.js cache: `rm -rf .next`
- If syntax errors persist, check for corrupted JSX/TypeScript syntax

**Port already in use**
- Kill existing Node processes: `Get-Process -Name node | Stop-Process -Force` (Windows)
- Or use a different port: `npm run dev -- -p 3001`
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click **Sign in with Microsoft** button
2. Authenticate with your Microsoft account that's linked to Xbox
3. Grant the requested permissions
4. View your screenshots and clips in the gallery
5. Click any media to view full size/play video
6. Use the **Download** button to save media to your device

## Project Structure

```
├── app/
│   ├── api/
│   │   └── xbox/          # Xbox Live API routes
│   │       ├── authenticate/
│   │       ├── profile/
│   │       ├── clips/
│   │       └── screenshots/
│   ├── layout.tsx         # Root layout with MSAL provider
│   └── page.tsx          # Main gallery page
├── components/
│   ├── AuthButton.tsx    # Sign in/out button
│   ├── ClipsGrid.tsx     # Video clips gallery
│   ├── MsalProviderWrapper.tsx
│   └── ScreenshotGrid.tsx # Screenshots gallery
├── lib/
│   ├── msalConfig.ts     # MSAL authentication config
│   └── xboxApi.ts        # Xbox API client functions
└── .env.local            # Environment variables (not in git)
```

## Technologies Used

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **MSAL** - Microsoft Authentication Library
- **Xbox Live API** - Access to Xbox media

## Troubleshooting

### "Failed to authenticate with Xbox Live"
- Ensure your Microsoft account is linked to an Xbox account
- Check that you've granted all required permissions in the Azure portal
- Try signing out and signing in again

### "No clips/screenshots found"
- Make sure you have recorded clips or taken screenshots on your Xbox
- Check that your media privacy settings allow access

### Images not loading
- Verify that `next.config.ts` includes Xbox Live domains in `remotePatterns`
- Check browser console for CORS errors
