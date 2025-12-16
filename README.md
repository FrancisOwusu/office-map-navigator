# Office Navigator - MUC21-B1

An indoor navigation system for the Munich office building basement level 1 (MUC21-B1). This application uses GPS and browser geolocation to help users navigate to various facilities like gyms, restrooms, prayer rooms, and other amenities.

## Features

- 🗺️ Interactive floor map with real-time GPS positioning
- 🔍 Search functionality for locations
- 📍 Turn-by-turn navigation directions
- 🎯 Real-time distance calculations
- 📱 Responsive design for desktop and mobile
- 🔄 Live location tracking

## Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 18 or higher recommended)
- **npm** (comes with Node.js) or **yarn** or **pnpm**

To check if you have Node.js installed, run:
```bash
node --version
npm --version
```

If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/)

## Installation

1. **Clone or download the project**
   ```bash
   # If using git
   git clone <repository-url>
   cd office-navigator
   
   # Or extract the project folder if downloaded as ZIP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   This will install all required packages listed in `package.json`.

## Running the Project

### Development Mode

To start the development server:

```bash
npm run dev
```

The application will start and you'll see output like:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and navigate to `http://localhost:5173/`

The development server includes:
- Hot Module Replacement (HMR) - changes reflect immediately
- Fast refresh for React components
- Error overlay in the browser

### Production Build

To create a production build:

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

To preview the production build locally:

```bash
npm run preview
```

## Location Permissions

**Important:** This application requires location access to function properly.

### Browser Permissions
- When you first open the app, your browser will prompt you for location permission
- Click "Allow" to enable location tracking

### macOS Users
If you encounter location errors:

1. Go to **System Settings** → **Privacy & Security** → **Location Services**
2. Enable **Location Services** (toggle at the top)
3. Scroll down and enable location access for your browser (Chrome, Safari, Firefox, etc.)
4. Refresh the page and allow location access when prompted

### Troubleshooting
- Ensure WiFi is enabled (helps with indoor positioning)
- Try moving near a window for better GPS signal
- Check that your browser has location permissions enabled
- Refresh the page if location doesn't load initially

## Project Structure

```
office-navigator/
├── src/
│   ├── components/
│   │   └── OfficeNavigator.tsx  # Main navigation component
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── package.json                 # Dependencies and scripts
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Browser Geolocation API** - Location tracking

## Sharing the Project

To share this project with someone:

### Option 1: Share the entire folder
1. Zip the entire project folder (excluding `node_modules` and `dist`)
2. Send the ZIP file
3. The recipient should:
   - Extract the folder
   - Run `npm install`
   - Run `npm run dev`

### Option 2: Use Git
1. Push to a Git repository (GitHub, GitLab, etc.)
2. Share the repository URL
3. The recipient should:
   ```bash
   git clone <repository-url>
   cd office-navigator
   npm install
   npm run dev
   ```

### What NOT to include
- `node_modules/` folder (will be regenerated with `npm install`)
- `dist/` folder (build output)
- `.DS_Store` files (already in `.gitignore`)

## Browser Compatibility

This application works best in modern browsers that support:
- Geolocation API
- ES6+ JavaScript
- CSS Grid and Flexbox

Tested browsers:
- Chrome (recommended)
- Firefox
- Safari (macOS)
- Edge

## License

This project is private and for internal use.

## Support

If you encounter issues:
1. Check that Node.js and npm are installed correctly
2. Ensure all dependencies are installed (`npm install`)
3. Check browser console for errors
4. Verify location permissions are enabled
