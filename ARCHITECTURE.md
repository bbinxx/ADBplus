# DroidOps - Modular Architecture Guide

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── DeviceSelector.jsx
│   ├── FileExplorer.jsx  
│   ├── Gallery.jsx
│   └── Sidebar.jsx
├── pages/             # Page-level components
│   ├── Dashboard.jsx
│   ├── AppManager.jsx
│   ├── ShellPage.jsx
│   ├── FastbootPage.jsx
│   └── SideloadPage.jsx
├── lib/               # Core functionality
│   ├── adb.js         # ADB command wrappers
│   └── cache.js       # File caching utilities
├── data/              # Configuration & strings
│   ├── strings.js     # All UI text/labels
│   └── config.js      # App configuration
├── hooks/             # Custom React hooks
│   └── useStrings.js  # String management hook
├── utils/             # Utility functions
│   └── dialog.js      # Dialog helpers
└── App.jsx           # Main application

```

## 🔧 Data-Driven Design

### Strings Management (`src/data/strings.js`)

All UI text, labels, and messages are centralized in the `STRINGS` object:

```javascript
import { STRINGS, formatString } from '../data/strings';

// Direct access
const title = STRINGS.dashboard.title;

// With placeholders
const message = formatString(STRINGS.apps.confirmUninstall, { app: 'MyApp' });
```

**Categories:**
- `app` - Application metadata
- `navigation` - Menu labels
- `device` - Device-related strings
- `dashboard`, `apps`, `files`, `gallery`, etc. - Page-specific strings
- `errors` - Error messages
- `common` - Common UI strings

### Configuration (`src/data/config.js`)

App-wide settings and constants:

```javascript
import { APP_CONFIG, ROUTES, DEVICE_STATES } from '../data/config';

// Configuration
const theme = APP_CONFIG.ui.defaultTheme;

// Routes
navigate(ROUTES.DASHBOARD);

// Constants
if (device.state === DEVICE_STATES.OFFLINE) { ... }
```

## 🎣 Custom Hooks

### useStrings Hook

```javascript
import { useStrings } from '../hooks/useStrings';

const MyComponent = () => {
  const { strings, format } = useStrings();
  
  return <h1>{strings.app.title}</h1>;
};
```

## 🔔 Dialog System

Centralized dialog handling with i18n support:

```javascript
import { confirmDelete, confirmUninstall, alertDialog } from '../utils/dialog';

// Confirm deletion
if (confirmDel ete(fileName)) {
  deleteFile();
}

// Custom alerts
alertDialog(STRINGS.files.uploadSuccess);
```

## 📦 Component Guidelines

### 1. Import Order
```javascript
// 1. React & third-party
import React, { useState } from 'react';
import { Icon } from 'lucide-react';

// 2. Data & config
import { STRINGS } from '../data/strings';
import { APP_CONFIG } from '../data/config';

// 3. Utilities & hooks
import { useStrings } from '../hooks/useStrings';
import { confirmDialog } from '../utils/dialog';

// 4. Local imports
import { myFunction } from '../lib/myLib';
```

### 2. Use Constants
```javascript
// ❌ Bad
if (activeTab === "dashboard") { ... }

// ✅ Good
import { ROUTES } from '../data/config';
if (activeTab === ROUTES.DASHBOARD) { ... }
```

### 3. Use Centralized Strings
```javascript
// ❌ Bad
<button>Delete</button>

// ✅ Good
<button>{STRINGS.files.delete}</button>
```

## 🌐 Adding New Features

### Adding a New Page

1. **Create page component** in `src/pages/`
2. **Add route** to `ROUTES` in `config.js`
3. **Add strings** to appropriate section in `strings.js`
4. **Register route** in `App.jsx`
5. **Add navigation** item to `Sidebar.jsx`

### Adding New Strings

1. Add to appropriate category in `src/data/strings.js`:
```javascript
export const STRINGS = {
  myFeature: {
    title: "My Feature",
    description: "Description here",
    action: "Action button label"
  }
};
```

2. Use in component:
```javascript
import { STRINGS } from '../data/strings';
<h1>{STRINGS.myFeature.title}</h1>
```

### Adding Configuration

1. Add to `src/data/config.js`:
```javascript
export const APP_CONFIG = {
  myFeature: {
    setting1: true,
    setting2: "value"
  }
};
```

2. Use in code:
```javascript
import { APP_CONFIG } from '../data/config';
if (APP_CONFIG.myFeature.setting1) { ... }
```

## 🎨 Styling Conventions

- Use Tailwind CSS classes
- Dark theme by default
- Color palette:
  - Primary: `#2ca9bc`
  - Background: `#0f0f12`
  - Surface: `#1a1a1f`
  - Border: `#27272a`

## 📝 Best Practices

1. **Keep components focused** - Single responsibility
2. **Use data files** - No hardcoded strings/config
3. **Leverage hooks** - Extract reusable logic
4. **Handle errors gracefully** - Use standardized dialogs
5. **Document new features** - Update this README

## 🔄 Migration Checklist

When updating existing code:
- [ ] Replace hardcoded strings with `STRINGS` references
- [ ] Replace magic values with `APP_CONFIG` constants
- [ ] Use `ROUTES` for navigation logic
- [ ] Use dialog utilities instead of raw `window.confirm/alert`
- [ ] Extract reusable logic into hooks

## 🚀 Development Workflow

```bash
# Start development server
npm run tauri dev

# Build for production
npm run tauri build
```

## 📚 Additional Resources

- [Tauri Documentation](https://tauri.app/)
- [React Hooks](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/)
