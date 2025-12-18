# Xbox Clips & Screenshots Gallery

A modern web application built with Next.js that allows users to view and download their Xbox game clips and screenshots using Microsoft authentication.

## Features

### Dashboard & Navigation
- 🎮 **Interactive Dashboard** - Modern landing page with quick access to all features
- 📊 **Game Stats Dashboard** - View detailed statistics for your 6 most recently played games
  - Achievement progress with visual progress bars
  - Gamerscore earned (current/total) per game
  - Completion percentage tracking
  - Game box art and metadata
- 🎯 **Recent Activity** - Quick view of your latest 2 screenshots and 2 clips with thumbnails
- ⚡ **Quick Actions** - One-click navigation to key features:
  - View Clips
  - Browse Screenshots
  - Create AI Compilations
  - View Achievements
- 📈 **Feature Cards** - At-a-glance counters for screenshots, clips, compilations, and achievements
- 👤 **Profile Display** - Large profile picture and gamertag with gamerscore tracking

### Core Gallery Features
- 🔐 **Microsoft Account Authentication** - Secure OAuth login using MSAL
- 📸 **Screenshots Gallery** - Browse and download your Xbox screenshots
- 🎬 **Video Clips Gallery** - View and download your recorded game clips
- 🏆 **Achievements Tracking** - View your Xbox achievements and progress
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- ⬇️ **Easy Downloads** - One-click download for any media
- 🎮 **Xbox Live Integration** - Direct integration with Xbox Live APIs
- 📊 **Statistics Dashboard** - Comprehensive gaming statistics and analytics

### AI-Powered Compilation Features
- 🤖 **AI Insights & Highlights** - Automatically analyze clips to identify best moments using Azure Video Indexer
- ✂️ **Smart Compilation Creation** - Generate highlight reels from selected clips with one click
- 📊 **Real-Time Status Tracking** - Monitor compilation progress with live status updates
- 🎥 **Compilations Gallery** - View, manage, and download all your generated compilations
- 🗑️ **Smart Deletion** - Delete single compilations or select multiple for batch deletion
- ☁️ **Azure Storage Integration** - Secure cloud storage for all compilation videos
- 🔒 **Secure Downloads** - Proxy-based downloads work seamlessly with Azure AD authentication

### Twitch Integration
- 🔐 **Twitch OAuth Authentication** - Connect your Twitch account with secure OAuth flow
- 🎬 **Twitch Clips Gallery** - Browse and download your Twitch clips with sort options (by date or views)
- 🔴 **Live Stream Monitor** - Real-time detection when you go live on Twitch
  - Automatic stream status checking (60-second polling)
  - Stream information display (game, title, viewers, uptime)
  - Live thumbnail preview
- ✂️ **Instant Highlight Clips** - Create clips from your live stream with one click (captures last 30 seconds)
- 📊 **Cross-Platform Analytics** - Compare your Xbox and Twitch statistics side-by-side
  - Total clips and views comparison
  - Top games across both platforms
  - Unified analytics dashboard
- 🎮 **Dashboard Integration** - Twitch connection status and clips counter on main dashboard

## Prerequisites

Before running this application, you need:

1. **Node.js** (v18 or higher)
2. **Microsoft Azure Account** - To create an app registration
3. **Xbox Live Account** - To access your media
4. **Twitch Account** - For Twitch integration features (optional)
5. **Azure Video Indexer** - For AI-powered compilation features (optional)
6. **Azure Storage Account** - For storing compilation videos (optional)

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

### 4. Create Twitch App (Optional)

To enable Twitch integration:

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Click **Register Your Application**
3. Fill in:
   - **Name**: Xbox Clips Gallery
   - **OAuth Redirect URLs**: `http://localhost:3000/twitch/callback` (add production URL later)
   - **Category**: Website Integration
4. Click **Create**
5. Copy the **Client ID** - you'll need this
6. Click **New Secret** to generate a Client Secret

### 5. Configure Environment Variables

1. Edit `.env.local` and add your credentials:
   ```
   # Microsoft Authentication
   NEXT_PUBLIC_AZURE_CLIENT_ID=your_client_id_here
   NEXT_PUBLIC_AZURE_TENANT_ID=common
   NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
   
   # Twitch Integration (Optional)
   NEXT_PUBLIC_TWITCH_CLIENT_ID=your_twitch_client_id
   TWITCH_CLIENT_SECRET=your_twitch_client_secret
   NEXT_PUBLIC_TWITCH_REDIRECT_URI=http://localhost:3000/twitch/callback
   
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

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Getting Started

1. Click **Sign in with Microsoft** button
2. Authenticate with your Microsoft account that's linked to Xbox
3. Grant the requested permissions
4. You'll be taken to the interactive dashboard

### Dashboard Features

The dashboard is your central hub with:
- **Game Stats Dashboard** - Left sidebar showing your 6 most recently played games with:
  - Achievement progress bars
  - Current/total achievements and gamerscore
  - Completion percentage
  - Game box art
- **Recent Activity** - Latest 2 screenshots and 2 clips with clickable thumbnails
- **Quick Actions** - Four buttons for quick navigation:
  - 🎬 View Clips
  - 📸 Browse Screenshots
  - 🤖 Create AI Compilation
  - 🏆 View Achievements
- **Feature Cards** - Overview cards showing:
  - Total screenshots (with count badge)
  - Total clips (with count badge)
  - AI compilations created (with count badge)
  - Achievement stats
  - Twitch integration (with connection status and clips counter)

### Basic Gallery Usage

1. Use Quick Actions buttons or feature cards to navigate
2. **Screenshots Tab**: Browse all your Xbox screenshots
   - Click any screenshot to view full size
   - Use the **Download** button to save to your device
3. **Clips Tab**: View all your recorded game clips
   - Click any clip to watch the video
   - Use the **Download** button to save the clip
4. **Achievements Tab**: View your Xbox achievements and progress

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

### Twitch Features

#### Connecting Your Twitch Account
1. Click the **Connect Twitch** button in the header
2. Authenticate with your Twitch account
3. Authorize the requested permissions
4. You'll be redirected back to the app with Twitch connected
5. Your Twitch profile picture will appear in the header next to the Connect button

#### Viewing Twitch Clips
1. Navigate to the **Twitch Clips** tab
2. Browse all your Twitch clips with thumbnails and metadata
3. Sort clips by:
   - **Date** - Most recent clips first
   - **Views** - Most popular clips first
4. Click any clip thumbnail to open it in a new tab on Twitch
5. View count displayed on each clip

#### Live Stream Monitoring
1. Navigate to the **🔴 Live Stream** tab
2. When offline, you'll see instructions on how the feature works
3. When you go live on Twitch:
   - The app automatically detects your stream (checks every 60 seconds)
   - Stream information displays:
     - Live thumbnail preview
     - Red "LIVE" badge
     - Current viewer count
     - Game being played
     - Stream uptime
     - Stream tags
4. Click **Create Highlight Clip** to capture the last 30 seconds of your stream
5. Created clips will appear in your Twitch Clips tab

#### Cross-Platform Analytics
1. Navigate to the **Analytics** tab
2. View side-by-side comparison:
   - **Xbox Stats**: Total clips, views, and top games
   - **Twitch Stats**: Total clips, views, and top games
   - **Combined Stats**: Overall metrics across both platforms
3. See which games you've created the most content for
4. Track total views and engagement across platforms

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── xbox/              # Xbox Live API routes
│   │   │   ├── authenticate/  # Xbox authentication
│   │   │   ├── profile/       # User profile
│   │   │   ├── clips/         # Game clips
│   │   │   ├── screenshots/   # Screenshots
│   │   │   ├── achievements/  # Xbox achievements
│   │   │   ├── titlehistory/  # Recently played games with stats
│   │   │   ├── compilations/  # List compilations
│   │   │   ├── compilation-status/  # Track compilation progress
│   │   │   ├── download-compilation/  # Proxy downloads
│   │   │   └── delete-compilation/    # Delete compilations
│   │   ├── twitch/            # Twitch API routes
│   │   │   ├── authenticate/  # Twitch OAuth
│   │   │   ├── profile/       # Twitch user profile
│   │   │   ├── clips/         # Twitch clips
│   │   │   ├── analytics/     # Twitch analytics
│   │   │   ├── stream-status/ # Check if live streaming
│   │   │   └── create-clip/   # Create highlight clip
│   │   └── video-indexer/     # Video Indexer API routes
│   │       ├── analyze/       # Analyze clips
│   │       ├── insights/      # Get AI insights
│   │       └── create-compilation/  # Generate compilations
│   ├── twitch/
│   │   └── callback/          # Twitch OAuth callback page
│   ├── layout.tsx             # Root layout with MSAL provider
│   └── page.tsx               # Main dashboard with tabs and Game Stats
├── components/
│   ├── AuthButton.tsx         # Xbox sign in/out button with profile
│   ├── TwitchAuthButton.tsx   # Twitch sign in button with profile
│   ├── ClipsGrid.tsx          # Xbox video clips gallery
│   ├── TwitchClipsGrid.tsx    # Twitch clips gallery with sorting
│   ├── ScreenshotGrid.tsx     # Screenshots gallery
│   ├── CompilationsGrid.tsx   # Compilations gallery with multi-select
│   ├── AchievementsGrid.tsx   # Xbox achievements display
│   ├── StatisticsDashboard.tsx # Gaming statistics overview
│   ├── TwitchAnalyticsDashboard.tsx # Cross-platform analytics
│   ├── LiveStreamMonitor.tsx  # Twitch live stream monitoring
│   ├── HighlightsPanel.tsx    # AI insights and compilation creation
│   ├── CompilationStatusModal.tsx  # Real-time compilation progress
│   ├── DeleteConfirmationModal.tsx # Custom delete confirmation
│   └── MsalProviderWrapper.tsx
├── lib/
│   ├── msalConfig.ts     # MSAL authentication config
│   ├── xboxApi.ts        # Xbox API client functions
│   ├── twitchConfig.ts   # Twitch configuration
│   ├── twitchApi.ts      # Twitch API client class
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
