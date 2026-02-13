# Synapse OS - Digital Marketing Analytics Dashboard

A modern, AI-powered digital marketing analytics dashboard built for EduGen AI. This application provides comprehensive competitive intelligence analysis, trend monitoring, content management, and AI-assisted marketing tools across multiple social media platforms.

## 🚀 Features

### Core Functionality
- **📊 Dashboard**: Real-time KPI monitoring with momentum scores, engagement trends, and topic velocity
- **📈 Trends Analysis**: Competitive intelligence tracking across platforms (Instagram, LinkedIn, YouTube, TikTok, Twitter)
- **📝 Content Management**: Content planning, creation, and scheduling tools
- **📅 Calendar**: Visual content calendar with scheduling capabilities
- **✅ Approvals**: Content approval workflow management
- **🤖 AI Tools**: AI-powered content suggestions and marketing insights
- **🔗 Sources**: Multi-platform data source integration
- **👤 Profile**: User profile and account management
- **⚙️ Settings**: Application configuration and preferences

### Key Highlights
- **Dark Theme UI**: Modern glassmorphism design with purple and neon gradients
- **Responsive Design**: Fully responsive across desktop, tablet, and mobile devices
- **Real-time Analytics**: Live data visualization with interactive charts
- **AI-Powered Insights**: Smart recommendations for content strategy
- **Competitor Tracking**: Monitor Byju's, Google Classroom, Unacademy, and more

## 🛠️ Tech Stack

### Frontend Framework
- **React 19.2.0** - Modern UI library with latest features
- **Vite 7.3.1** - Lightning-fast build tool and dev server
- **React Router DOM 7.13.0** - Client-side routing

### Styling & UI
- **TailwindCSS 3.4.19** - Utility-first CSS framework
- **PostCSS 8.5.6** - CSS processing
- **Autoprefixer 10.4.24** - Vendor prefix automation
- **Lucide React 0.564.0** - Beautiful icon library
- **clsx 2.1.1** & **tailwind-merge 3.4.0** - Conditional class utilities

### Data Visualization
- **Recharts 3.7.0** - Composable charting library for React

### Development Tools
- **ESLint 9.39.1** - Code linting and quality
- **@vitejs/plugin-react 5.1.1** - Fast Refresh support

## 📁 Project Structure

```
synapse_os/
├── .gitignore                  # Git ignore configuration
├── .vercelignore              # Vercel deployment ignore rules
├── README.md                  # Project documentation
├── eslint.config.js           # ESLint configuration
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
├── package-lock.json          # Locked dependency versions
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # TailwindCSS configuration
├── vercel.json                # Vercel deployment config
├── vite.config.js             # Vite build configuration
│
├── public/                    # Static assets
│   └── vite.svg              # Vite logo
│
├── dist/                      # Production build output (generated)
│
├── node_modules/              # Dependencies (generated)
│
└── src/                       # Source code
    ├── main.jsx              # Application entry point
    ├── App.jsx               # Root component with routing
    ├── App.css               # App-specific styles
    ├── index.css             # Global styles and Tailwind directives
    │
    ├── assets/               # Static assets
    │   └── react.svg        # React logo
    │
    ├── components/           # Reusable UI components
    │   └── ui/              # UI component library
    │       ├── Badge.jsx    # Badge component
    │       ├── Button.jsx   # Button component
    │       ├── Card.jsx     # Card container component
    │       ├── Input.jsx    # Input field component
    │       ├── Select.jsx   # Select dropdown component
    │       ├── Table.jsx    # Table component
    │       └── Tabs.jsx     # Tabs navigation component
    │
    ├── layout/               # Layout components
    │   ├── MainLayout.jsx   # Main application layout wrapper
    │   └── Sidebar.jsx      # Navigation sidebar
    │
    ├── lib/                  # Utility libraries
    │   └── utils.js         # Helper functions (cn utility)
    │
    └── pages/                # Page components (routes)
        ├── Dashboard.jsx    # Main dashboard with KPIs and charts
        ├── Trends.jsx       # Trends analysis page
        ├── Content.jsx      # Content management page
        ├── Calendar.jsx     # Content calendar page
        ├── Approvals.jsx    # Approval workflow page
        ├── AITools.jsx      # AI-powered tools page
        ├── Sources.jsx      # Data sources page
        ├── Profile.jsx      # User profile page
        └── Settings.jsx     # Settings page
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd synapse_os
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173` (or the port shown in terminal)

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint for code quality
npm run lint
```

## 🎨 Design System

### Color Palette
- **Primary**: Purple gradients (`#8b5cf6`)
- **Secondary**: Cyan/Neon blue (`#22d3ee`)
- **Accent**: Pink (`#ec4899`)
- **Background**: Dark slate (`#0f172a`, `#1e293b`)
- **Text**: White and slate variations

### Component Architecture
- **Atomic Design**: Components are built following atomic design principles
- **Reusability**: All UI components are highly reusable and composable
- **Consistency**: Unified design tokens across all components

## 📊 Features Breakdown

### Dashboard Page
- **KPI Cards**: Momentum Score, Engagement Trend, Topic Velocity, Publish Readiness
- **Trends Chart**: Multi-line chart showing competitive analysis
- **Emerging Topics**: Real-time trending topics with velocity indicators
- **AI Suggestions**: Next best actions powered by AI

### Trends Page
- Competitor performance tracking
- Platform-wise analytics
- Historical trend analysis

### Content Page
- Content creation tools
- Draft management
- Publishing workflow

### Calendar Page
- Visual content calendar
- Scheduling interface
- Timeline view

### Approvals Page
- Pending approvals queue
- Review workflow
- Approval history

### AI Tools Page
- Content generation
- Caption suggestions
- Hashtag recommendations
- Performance predictions

## 🌐 Deployment

### Vercel (Recommended)
This project is optimized for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Build
```bash
# Create production build
npm run build

# The dist/ folder contains the production-ready files
```

## 🔧 Configuration

### Tailwind Configuration
Custom configuration in `tailwind.config.js` includes:
- Extended color palette
- Custom animations
- Responsive breakpoints
- Dark mode support

### Vite Configuration
Optimized build settings in `vite.config.js`:
- React plugin with Fast Refresh
- Build optimization
- Path aliases

## 📝 Code Quality

### ESLint Rules
- React Hooks rules enforced
- React Refresh patterns
- Modern JavaScript standards

### Best Practices
- Component-based architecture
- Separation of concerns
- Reusable utility functions
- Consistent naming conventions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary to EduGen AI.

## 👥 Team

Developed for **EduGen AI** - Digital Marketing Analytics Platform

## 🐛 Known Issues

None at the moment. Please report any issues you encounter.

## 🔮 Future Enhancements

- [ ] Real-time data integration with social media APIs
- [ ] Advanced AI content generation
- [ ] Multi-user collaboration features
- [ ] Export reports functionality
- [ ] Mobile app version
- [ ] Advanced analytics dashboards
- [ ] Integration with more platforms

## 📞 Support

For support and questions, please contact the development team.

---

**Built with ❤️ using React + Vite + TailwindCSS**
