# Chrome Extension Integration Guide

## Step 1: Update Your Manifest File

Replace or update your `manifest.json` with this configuration:

```json
{
  "manifest_version": 3,
  "name": "Guide Recorder - Step Guide Creator",
  "version": "1.0.0",
  "description": "Record user actions and create step-by-step guides with screenshots and meaningful descriptions",
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "sidePanel",
    "tabs",
    "desktopCapture"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "action": {
    "default_title": "Guide Recorder",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["*.png", "*.jpg", "*.gif"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

## Step 2: Create Required Files

Copy these files to your extension directory:

### Core Files:
- `background.js` - Service worker for handling messages and screenshots
- `content.js` - Content script for recording user actions
- `content.css` - Styles for real-time indicators and previews
- `sidepanel.html` - Side panel interface
- `realtime-sidepanel.js` - Side panel functionality with real-time features

### Icon Files (create these or use existing):
- `icons/icon16.png`
- `icons/icon32.png` 
- `icons/icon48.png`
- `icons/icon128.png`

## Step 3: File Structure

Your extension directory should look like this:

```
your-extension/
├── manifest.json
├── background.js
├── content.js
├── content.css
├── sidepanel.html
├── realtime-sidepanel.js
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Step 4: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select your extension directory
5. The extension should now appear in your extensions list

## Step 5: Test the Extension

1. Click the extension icon in Chrome toolbar
2. The side panel should open automatically
3. Click "Start Recording" 
4. Perform actions on any webpage
5. Watch real-time previews appear
6. Click "Stop Recording"
7. Export your guide as HTML or PDF

## Step 6: Key Features to Test

### Real-time Recording:
- ✅ Recording indicator appears when recording starts
- ✅ Action previews show immediately when you interact with elements
- ✅ Screenshots are captured with flash effects
- ✅ Side panel updates in real-time
- ✅ Meaningful descriptions (not just coordinates)

### Export Features:
- ✅ HTML export with professional styling
- ✅ PDF export with screenshots
- ✅ Customizable guide titles and descriptions

### Smart Descriptions:
- ✅ "Click 'Submit' button" instead of "Click at (146, 139)"
- ✅ "Enter email in login field" instead of generic input
- ✅ Context-aware action descriptions

## Troubleshooting

### Common Issues:

1. **Side panel not opening:**
   - Check if `sidePanel` permission is in manifest
   - Ensure `sidepanel.html` exists

2. **Screenshots not working:**
   - Verify `activeTab` and `desktopCapture` permissions
   - Check if background.js is properly configured

3. **Real-time updates not showing:**
   - Ensure content script is injected properly
   - Check browser console for JavaScript errors

4. **Export not working:**
   - Make sure jsPDF library is loaded in sidepanel.html
   - Check if storage permissions are granted

### Debug Steps:
1. Open Chrome DevTools on any page
2. Check Console tab for errors
3. Go to `chrome://extensions/` and click "Inspect views: service worker"
4. Test each feature individually

## Customization

### Modify Recording Behavior:
Edit `content.js` to change what actions are captured:
- Add new event listeners
- Modify description generation logic
- Customize screenshot timing

### Change UI Appearance:
Edit `content.css` and `sidepanel.html`:
- Modify colors and animations
- Adjust preview card styling
- Customize recording indicators

### Add New Export Formats:
Edit `realtime-sidepanel.js`:
- Add new export functions
- Integrate additional libraries
- Customize output formatting

## Security Notes

- Extension requests minimal required permissions
- Screenshots are processed locally (not sent to servers)
- All data stored locally in Chrome storage
- No external API calls for core functionality

## Next Steps

Once integrated, you can:
1. Publish to Chrome Web Store
2. Add more export formats
3. Implement video recording
4. Add annotation tools
5. Create team sharing features