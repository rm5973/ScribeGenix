# Quick Setup Instructions

## 🚀 Fast Integration (5 minutes)

### 1. Copy Files
Copy these files from the project to your Chrome extension folder:

**Required Files:**
```
✅ manifest.json (update your existing one)
✅ background.js
✅ content.js  
✅ content.css
✅ sidepanel.html
✅ realtime-sidepanel.js
```

### 2. Update Manifest
Replace your `manifest.json` with the one provided, or add these key sections:

```json
{
  "permissions": ["activeTab", "scripting", "storage", "sidePanel", "tabs", "desktopCapture"],
  "host_permissions": ["<all_urls>"],
  "side_panel": { "default_path": "sidepanel.html" },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["content.css"]
  }]
}
```

### 3. Add Icons (Optional)
Create simple 16x16, 32x32, 48x48, 128x128 PNG icons or use placeholder images.

### 4. Load Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select your extension folder

### 5. Test
1. Click extension icon → Side panel opens
2. Click "Start Recording" → Recording indicator appears
3. Interact with webpage → See real-time previews
4. Click "Stop Recording" → Export your guide

## ✨ That's it! Your extension now has real-time recording capabilities.

### Key Features Working:
- ✅ Real-time action previews
- ✅ Smart meaningful descriptions  
- ✅ Screenshot capture with effects
- ✅ HTML/PDF export
- ✅ Professional side panel UI

### Need Help?
Check the full INTEGRATION_GUIDE.md for detailed troubleshooting and customization options.