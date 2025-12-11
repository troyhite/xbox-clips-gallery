# Xbox Clips & Screenshots Gallery

A modern web application built with Next.js that allows users to view and download their Xbox game clips and screenshots using Microsoft authentication.

## Features

- 🔐 **Microsoft Account Authentication** - Secure OAuth login using MSAL
- 📸 **Screenshots Gallery** - Browse and download your Xbox screenshots
- 🎬 **Video Clips Gallery** - View and download your recorded game clips
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- ⬇️ **Easy Downloads** - One-click download for any media
- 🎮 **Xbox Live Integration** - Direct integration with Xbox Live APIs

## Prerequisites

Before running this application, you need:

1. **Node.js** (v18 or higher)
2. **Microsoft Azure Account** - To create an app registration
3. **Xbox Live Account** - To access your media

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
   NEXT_PUBLIC_AZURE_CLIENT_ID=your_client_id_here
   NEXT_PUBLIC_AZURE_TENANT_ID=common
   NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
   ```

### 5. Run the Development Server

```bash
npm run dev
```

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
