# YouTube Integration Setup Guide

This guide explains how to set up YouTube Data API v3 integration for the StoicPlay app to access user subscriptions.

## Prerequisites

- Google Cloud Platform account
- Firebase project with Authentication enabled
- YouTube Data API v3 enabled

## Step 1: Enable YouTube Data API v3

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** > **Library**
4. Search for "YouTube Data API v3"
5. Click on it and press **Enable**

## Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have Google Workspace)
3. Fill in the required information:
   - App name: `StoicPlay`
   - User support email: Your email
   - Developer contact information: Your email
4. Add the following scope:
   - `https://www.googleapis.com/auth/youtube.readonly`
5. Add test users (including your own email) for development

## Step 3: Configure Firebase Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Google** provider if not already enabled
3. Add your domain to **Authorized domains** if needed

## Step 4: Environment Variables

Ensure your `.env` file includes:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# YouTube API (Optional - for additional API calls)
VITE_YOUTUBE_API_KEY=your_youtube_api_key
```

## Step 5: Firestore Security Rules

Update your Firestore security rules to include the new collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...
    
    // YouTube subscriptions data
    match /userSubscriptions/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // YouTube OAuth tokens (sensitive data)
    match /userTokens/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 6: Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Login to the app
3. Navigate to **Subscriptions** in the sidebar
4. Click **Connect YouTube Account**
5. Grant permissions when prompted
6. Your subscriptions should load automatically

## Features Implemented

### ✅ OAuth Integration
- Secure YouTube OAuth 2.0 flow
- Token storage in Firestore
- Automatic token validation

### ✅ Subscriptions Management
- Fetch user's YouTube subscriptions
- Cache subscriptions in Firestore
- Refresh subscriptions on demand

### ✅ Channel Videos
- View latest videos from subscribed channels
- Direct links to YouTube videos
- Channel information display

### ✅ Error Handling
- Graceful error handling for API failures
- Fallback to cached data
- User-friendly error messages

### ✅ Performance
- In-memory caching (30-minute expiry)
- Firestore caching for offline support
- Optimized API calls

## Firestore Schema

### UserSubscriptions Collection
```javascript
{
  subscriptions: [
    {
      id: "channelId",
      title: "Channel Name",
      description: "Channel description",
      thumbnail: "https://...",
      publishedAt: "2023-01-01T00:00:00Z",
      channelId: "channelId"
    }
  ],
  lastUpdated: "2023-01-01T00:00:00Z",
  totalCount: 50
}
```

### UserTokens Collection
```javascript
{
  youtube: {
    accessToken: "ya29.a0...",
    refreshToken: "1//04...",
    expiresAt: 1641024000000,
    scope: "youtube"
  },
  updatedAt: "2023-01-01T00:00:00Z"
}
```

## Security Considerations

1. **OAuth Tokens**: Stored securely in Firestore with user-specific access rules
2. **Read-Only Access**: Only requests read-only YouTube permissions
3. **Token Expiry**: Automatic token validation and refresh handling
4. **User Consent**: Clear consent flow with scope explanation

## Troubleshooting

### Common Issues

1. **"Access blocked" error**
   - Ensure OAuth consent screen is configured
   - Add your email as a test user
   - Verify the correct scopes are added

2. **"Quota exceeded" error**
   - YouTube API has daily quota limits
   - Implement caching to reduce API calls
   - Consider using your own API key

3. **"Invalid credentials" error**
   - Check Firebase configuration
   - Verify authorized domains in Firebase
   - Ensure OAuth client is properly configured

4. **Subscriptions not loading**
   - Check browser console for errors
   - Verify Firestore security rules
   - Ensure user has YouTube subscriptions

### Debug Mode

Enable debug logging by adding to your component:

```javascript
// In your component
useEffect(() => {
  console.log('YouTube Access:', hasYouTubeAccess);
  console.log('User:', user);
}, [hasYouTubeAccess, user]);
```

## Production Deployment

1. **OAuth Verification**: Submit your app for OAuth verification if needed
2. **Quota Management**: Monitor API usage and implement rate limiting
3. **Error Monitoring**: Set up error tracking (Sentry, etc.)
4. **Performance Monitoring**: Monitor API response times

## API Limits

- **YouTube Data API v3**: 10,000 units per day (default)
- **Subscriptions list**: ~1 unit per request
- **Channel videos**: ~1 unit per request
- **Caching**: Reduces API calls significantly

## Next Steps

1. Implement token refresh mechanism
2. Add pagination for large subscription lists
3. Implement subscription-based video feed
4. Add subscription management features

For support or questions, contact the development team.