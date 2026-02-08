# ⚡ Quick Start Guide

## 🎯 Get Started in 3 Steps

### Step 1: Setup Files
1. Download all files: `index.html`, `styles.css`, `script.js`
2. Put them in the same folder
3. Open `index.html` in Chrome, Firefox, or Safari

### Step 2: Add Your First Resource
1. Click the **"Add Resource"** button (top right)
2. Paste a URL (e.g., `https://github.com`)
3. Click the **✨ magic wand** button to auto-fill
4. Add tags by typing and pressing Enter
5. Click **"Add Resource"**

### Step 3: Organize & Explore
- **Search:** Type in the search bar to filter
- **Filter by Tag:** Click any tag to filter resources
- **Sort:** Use the sort dropdown for different orders
- **Change View:** Toggle between Grid/List/Compact views
- **Drag to Reorder:** Drag cards to rearrange them
- **Star Favorites:** Click the star to mark favorites

## 🎨 First-Time Tips

### Make It Yours
1. **Toggle Dark Mode:** Click the moon/sun icon (top right)
2. **Try Different Views:** Grid is default, but try List view for scanning
3. **Use Keyboard Shortcuts:**
   - `Cmd/Ctrl + K` → Focus search
   - `Cmd/Ctrl + N` → Add new resource
   - `Cmd/Ctrl + Z` → Undo

### Smart Organization
1. **Use Descriptive Tags:** Be consistent with tag names
2. **Star Favorites:** Important resources appear first
3. **Add Good Descriptions:** Helps with searching later
4. **Regular Exports:** Backup your data weekly

## 🔧 API Setup (Optional)

### Enable Auto-fill (FREE)
**Already enabled!** The app uses:
- **Icon Horse** for favicons (no setup needed)
- **Microlink** for metadata (free tier: 50 requests/day)

### Upgrade to Peekalink (Optional)
For better metadata fetching:

1. Go to [peekalink.io](https://peekalink.io) and sign up
2. Get your API key
3. Open `script.js` in a text editor
4. Find this line (around line 10):
```javascript
PEEKALINK_KEY: '',
```
5. Add your key:
```javascript
PEEKALINK_KEY: 'your-api-key-here',
```
6. Save and reload the page

## 📱 Deploy to Netlify (Optional)

### Method 1: Drag & Drop
1. Go to [netlify.com](https://netlify.com) (free account)
2. Click "Add new site" → "Deploy manually"
3. Drag your folder into the upload zone
4. Done! You get a live URL

### Method 2: GitHub (Recommended)
1. Create a GitHub repository
2. Upload all files
3. Connect to Netlify
4. Auto-deploy on every change

### Add Peekalink to Netlify
1. In Netlify, go to Site Settings → Environment Variables
2. Add variable: `PEEKALINK_API_KEY` = `your-key`
3. Update `script.js` to read from environment:
```javascript
PEEKALINK_KEY: process.env.PEEKALINK_API_KEY || '',
```
4. Redeploy

## 🎓 Usage Examples

### Example 1: Research Library
```
Resource: "React Documentation"
URL: https://react.dev
Tags: Code, Tutorial, Frontend
Favorite: Yes
```

### Example 2: Design Inspiration
```
Resource: "Awwwards - Site of the Day"
URL: https://awwwards.com
Tags: Design, Inspiration
Favorite: Yes
```

### Example 3: Typography Resource
```
Resource: "Google Fonts"
URL: https://fonts.google.com
Tags: Typography, Tools, Design
Favorite: No
```

## 🔄 Daily Workflow

### Morning Routine
1. Open Resource Bank
2. Check favorites for daily reading
3. Add new resources discovered yesterday

### Weekly Maintenance
1. Review and tag untagged resources
2. Remove outdated links
3. Export backup (click Export button)
4. Clean up duplicate tags

### Monthly Review
1. Sort by "Recently Edited" to find unused resources
2. Archive or delete old resources
3. Reorganize tags if needed
4. Update descriptions for clarity

## 🎯 Pro Tips

### Search Like a Pro
- **Partial matching:** Type "reac" to find "React"
- **Tag search:** Type tag names to filter
- **URL search:** Search by domain name
- **Description search:** Finds keywords in descriptions

### Keyboard Power User
```
Cmd/Ctrl + K     → Focus search
Cmd/Ctrl + N     → New resource
Cmd/Ctrl + Z     → Undo last action
Cmd/Ctrl + Enter → Submit form
ESC              → Close modals
```

### Bulk Operations
1. **Select Mode:** Shift-click first item
2. **Select Multiple:** Click additional items
3. **Actions:** Use bulk action bar (bottom)
4. **Export Selected:** Download just selected items
5. **Delete Selected:** Remove multiple at once

### Sharing Resources
1. **Individual Share:** Click share icon on any card
2. **Copy Link:** Automatically copies to clipboard
3. **Native Share:** Uses system share sheet on mobile
4. **Export & Share:** Export JSON and share file

## 📊 Data Management

### Export Your Data
**When:** Before major changes or weekly backup
**How:** Click "Export" button → Saves JSON file
**Result:** `resource-bank-[timestamp].json`

### Import Data
**When:** Restore backup or merge collections
**How:** Click "Import" button → Select JSON file
**Result:** Resources merge with existing (no duplicates)

### Undo Actions
**What:** Last 10 actions are saved
**How:** 
- Press `Cmd/Ctrl + Z`
- Or click "Undo" in toast notification
**Works for:** Add, Edit, Delete, Reorder, Bulk operations

## 🐛 Common Issues

### "Auto-fill not working"
**Solution:** Microlink has 50 requests/day limit. Wait or add Peekalink API key.

### "Tags not saving"
**Solution:** Press Enter after typing tag name. Click away doesn't save.

### "Search not finding results"
**Solution:** Check spelling. Search is case-insensitive but exact match.

### "Drag & drop not working"
**Solution:** Make sure you're in Grid or Compact view (not List view).

### "Data disappeared"
**Solution:** 
1. Check if you're in the same browser
2. Check if you cleared browser data
3. Restore from last export

## 🎨 Customization Quick Guide

### Change Theme
- **Light/Dark Toggle:** Click moon/sun icon (saves preference)

### Change Colors
Edit `styles.css`:
```css
:root {
    --color-primary: #YourColor;
    --color-accent: #YourColor;
}
```

### Change Layout
Edit `styles.css`:
```css
.items-section {
    /* Change 320px to your preferred min-width */
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}
```

## 📱 Mobile Usage

### Touch Gestures
- **Tap:** Open link
- **Long Press:** Select item (for bulk operations)
- **Drag:** Reorder cards
- **Swipe:** No special swipe actions (use buttons)

### Mobile Tips
- Use **List View** for easier scrolling
- **Search** is your best friend on mobile
- **Favorites** keep important items at top
- Use **native share** to share resources

## 🚀 Next Steps

After getting comfortable:

1. **Star this project** if you find it useful
2. **Export regularly** to backup your data
3. **Try bulk operations** to manage many resources
4. **Explore keyboard shortcuts** for efficiency
5. **Customize colors** to match your brand
6. **Deploy to Netlify** for access anywhere

## 🆘 Need Help?

1. **Check README.md** for detailed documentation
2. **Console Log:** Open browser DevTools → Console
3. **Check Browser:** Use latest Chrome/Firefox/Safari
4. **Clear Cache:** Hard refresh (Cmd/Ctrl + Shift + R)
5. **Start Fresh:** Clear localStorage in DevTools

---

**Ready to organize like a pro? Start adding resources! 🚀**