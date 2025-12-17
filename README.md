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

1. Edit `.env.local` and add your Azure credentials:
   ```
   # Authentication
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
   VIDEO_COMPILATION_SERVICE_URL=your_compilation_service_url
   ```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Basic Gallery Usage

1. Click **Sign in with Microsoft** button
2. Authenticate with your Microsoft account that's linked to Xbox
3. Grant the requested permissions
4. View your screenshots and clips in the gallery
5. Click any media to view full size/play video
6. Use the **Download** button to save media to your device

### AI Compilation Features

#### Creating a Compilation
1. Navigate to the **Clips** tab
2. Click **View AI Insights** to analyze a clip with Video Indexer
3. Review the AI-generated insights and detected highlights
4. Select specific clips or moments you want to include
5. Click **Create Compilation** to generate a highlight reel
6. Monitor the real-time progress in the status modal
7. Once complete, view your compilation in the **Compilations** tab

#### Managing Compilations
1. Navigate to the **Compilations** tab to see all generated videos
2. **Download**: Click the download button to save any compilation
3. **Delete Single**: Click the trash icon to delete one compilation
4. **Delete Multiple**:
   - Click the **Select** button to enter selection mode
   - Check the boxes or click on videos to select them
   - Use **Select All** to select all compilations at once
   - Click **Delete (X)** to remove all selected compilations
   - Confirm deletion in the modal dialog
5. **Refresh**: Click the refresh button to reload the list

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── xbox/              # Xbox Live API routes
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
│   ├── HighlightsPanel.tsx    # AI insights and compilation creation
│   ├── CompilationStatusModal.tsx  # Real-time compilation progress
│   ├── DeleteConfirmationModal.tsx # Custom delete confirmation
│   └── MsalProviderWrapper.tsx
├── lib/
│   ├── msalConfig.ts     # MSAL authentication config
│   ├── xboxApi.ts        # Xbox API client functions
│   └── appInsights.ts    # Application Insights telemetry
└── .env.local            # Environment variables (not in git)
```

## Technologies Used

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
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Azure CLI** - Local development authentication

## Azure Storage Setup (For Compilation Features)

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
