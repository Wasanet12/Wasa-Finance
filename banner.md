# Banner Issue Report

## Issue Description
The banner you're experiencing is a **PWA (Progressive Web App) install prompt** that appears at the bottom of mobile screens when the app meets installability criteria. This explains why:
- It's not visible during development on desktop
- It appears when deployed on mobile devices
- It has the color `#1b2336` which matches your PWA theme color

## Root Cause
The application has PWA functionality enabled despite the comment in `next.config.js` that says "Temporarily disable PWA completely". The following evidence confirms this:

1. The `next-pwa` package is still installed in `package.json`
2. The application has a `manifest.json` file in the public directory
3. The main layout (`src/app/layout.tsx`) references the manifest file
4. A service worker (`sw.js`) is present in the public directory

## Why this happens
Modern mobile browsers automatically display a PWA install banner when a web app meets these criteria:
- Has a valid web app manifest file
- Has a service worker
- Meets other PWA installability requirements
- Is served over HTTPS (in production)

## Solution
To remove the banner, you have several options:

### Option 1: Completely remove PWA functionality (Recommended)
1. Remove `next-pwa` from dependencies:
   ```bash
   npm uninstall next-pwa
   ```

2. Remove the manifest reference from `src/app/layout.tsx`:
   ```jsx
   export const metadata: Metadata = {
     // Remove this line:
     // manifest: "/manifest.json",
     // Keep other metadata...
   }
   ```

3. Remove the service worker file (`public/sw.js`) and workbox files

### Option 2: Programmatically hide the install prompt
Add this JavaScript code to suppress the install prompt:
```javascript
// This prevents the default install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the default install prompt
  e.preventDefault();
  // Optionally store the event for later use
  // const deferredPrompt = e;
});
```

### Option 3: Modify PWA configuration
Update the PWA configuration in `next.config.js` to ensure it's properly disabled, or modify the manifest file to control how the install prompt appears.

## Important Note
If you're using PWA functionality in production and want to keep it but hide the install banner, Option 2 is the best approach. If you don't need PWA features at all, Option 1 is the cleanest solution.

The banner appears only on mobile because desktop browsers typically have different PWA installation mechanisms or don't show this type of banner at all.