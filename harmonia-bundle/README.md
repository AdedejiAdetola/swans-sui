# 🦢 Harmonia Swan UI Components

A complete UI package for the Harmonia Suite - The Trustless Marketplace for Creators & Brands. This bundle includes all necessary components, design system, and assets to integrate the Swan/Harmonia ecosystem into any React application.

## 🚀 Features

- **Complete Design System** - Consistent dark theme with modern glassmorphism effects
- **React Components** - Fully functional header, hero, features, CTA, and footer components
- **Responsive Design** - Mobile-first approach with beautiful animations
- **Self-Contained** - All dependencies and UI components included
- **Easy Integration** - Ready to drop into any React codebase

## 📦 What's Included

```
harmonia-bundle/
├── components/          # Main Harmonia components
│   ├── HarmoniaHeader.jsx      # Swan-branded header with Connect Wallet
│   ├── HarmoniaHero.jsx        # Hero section with trustless marketplace messaging
│   ├── HarmoniaFeatures.jsx    # 3-feature showcase (Payments, Auctions, Automation)
│   ├── HarmoniaCTA.jsx         # Creator conversion section
│   ├── HarmoniaFooter.jsx      # Swan-branded footer
│   └── HarmoniaBackgroundFX.jsx # Background effects
├── ui/                  # Reusable UI components
│   ├── dotted-surface.jsx      # Animated dotted background
│   └── moving-border.jsx       # Animated border button component
├── pages/              # Complete page implementation
│   └── Harmonia.jsx            # Full page layout
├── lib/                # Utilities
├── styles/             # Additional styles (if needed)
├── package.json        # Dependencies and setup
└── README.md          # This file
```

## 🛠 Installation

### 1. Copy the Bundle
Copy the entire `harmonia-bundle` folder into your project:

```bash
cp -r harmonia-bundle/ your-project/src/harmonia/
```

### 2. Install Dependencies
Navigate to your project root and install the required dependencies:

```bash
npm install react react-dom react-router-dom
```

### 3. Install TailwindCSS (if not already installed)
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 4. Configure Tailwind
Update your `tailwind.config.js` to include the Harmonia components:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/harmonia/**/*.{js,ts,jsx,tsx}", // Add this line
  ],
  theme: {
    extend: {
      fontFamily: {
        'manrope': ['Manrope', 'ui-sans-serif', 'system-ui'],
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
```

### 5. Add Required Fonts
Add these font imports to your main CSS file or index.html:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap');
```

## 🎯 Usage

### Option 1: Use the Complete Page
```jsx
import HarmoniaPage from './harmonia/pages/Harmonia'

// In your router
<Route path="/harmonia" element={<HarmoniaPage />} />
```

### Option 2: Use Individual Components
```jsx
import HarmoniaHeader from './harmonia/components/HarmoniaHeader'
import HarmoniaHero from './harmonia/components/HarmoniaHero'
import HarmoniaFeatures from './harmonia/components/HarmoniaFeatures'

function MyPage() {
  return (
    <div className="bg-neutral-950 text-neutral-200">
      <HarmoniaHeader />
      <HarmoniaHero />
      <HarmoniaFeatures />
    </div>
  )
}
```

## 🎨 Design System

### Colors
- **Background**: `bg-neutral-950` (very dark)
- **Text Primary**: `text-white`
- **Text Secondary**: `text-neutral-400`
- **Glass Effects**: `bg-white/5`, `bg-white/10`
- **Borders**: `ring-white/10`, `border-white/10`

### Typography
- **Headlines**: `font-manrope` (light weight for large text)
- **Body Text**: `font-sans` (Inter)

### Components
- **Buttons**: Glass morphism with hover effects
- **Cards**: Rounded corners with subtle borders and backdrop blur
- **Animations**: Smooth transitions and hover states

## 🔧 Customization

### Branding
- **Company Name**: Currently set to "Swan" (can be changed in HarmoniaHeader.jsx)
- **Email**: hello@swan.com (update in HarmoniaFooter.jsx)
- **Colors**: Easily customizable through Tailwind classes

### Content
- **Hero Message**: Edit in `HarmoniaHero.jsx`
- **Features**: Modify the features array in `HarmoniaFeatures.jsx`
- **CTAs**: Update button links and text throughout components

## 📱 Responsive Design

All components are fully responsive with:
- Mobile-first approach
- Flexible grid layouts
- Responsive typography
- Touch-friendly interactions

## 🚧 Requirements

- React 18+
- TailwindCSS 3+
- Modern browser with CSS Grid support

## 🌟 Key Features Highlights

1. **Connect Wallet Integration** - Ready for blockchain wallet connections
2. **Trustless Marketplace Messaging** - Content focused on creator-brand relationships
3. **Modern Design** - Dark theme with glassmorphism effects
4. **Performance Optimized** - Minimal dependencies, efficient rendering
5. **Accessibility** - Semantic HTML and proper contrast ratios

## 📞 Support

This is a self-contained UI bundle. For customization help or questions about implementation, refer to the individual component files which include clear, commented code.

## 📄 License

MIT License - Feel free to use in your projects!

---

**Ready to revolutionize creator payments? 🚀**