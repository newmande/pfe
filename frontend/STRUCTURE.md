# Frontend Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Alert.tsx
│   ├── Alert.css
│   ├── Button.tsx
│   ├── Button.css
│   ├── Card.tsx
│   ├── Card.css
│   ├── ErrorBoundary.tsx
│   ├── ErrorBoundary.css
│   ├── Loader.tsx
│   └── Loader.css
│
├── pages/               # Page/view components
│   ├── Home.tsx
│   ├── Home.css
│   ├── Dashboard.tsx
│   └── Dashboard.css
│
├── services/            # API and business logic services
│   ├── apiService.ts    # Main API service
│   └── authService.ts   # Authentication service
│
├── hooks/               # Custom React hooks
│   └── useApi.ts        # API fetching hook
│
├── config/              # Configuration files
│   └── api.ts           # API configuration
│
├── types/               # TypeScript type definitions
│   └── api.ts           # API types and interfaces
│
├── utils/               # Utility functions
│   ├── constants.ts     # Constants and enums
│   └── helpers.ts       # Helper functions
│
├── App.tsx              # Main App component
├── App.css
├── main.tsx             # React entry point
├── index.css            # Global styles
└── assets/              # Static assets
```

## Component Usage Examples

### Button Component
```tsx
import { Button } from './components/Button'

<Button variant="primary" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

### Card Component
```tsx
import { Card } from './components/Card'

<Card title="My Card" subtitle="Subtitle" hover>
  <p>Card content here</p>
</Card>
```

### useApi Hook
```tsx
import { useApi } from './hooks/useApi'

const { data, loading, error, execute } = useApi<User>()

const handleFetch = () => {
  execute('/users/1', 'GET')
}
```

### Alert Component
```tsx
import { Alert } from './components/Alert'

<Alert 
  type="success" 
  message="Operation successful!"
  onClose={() => setShowAlert(false)}
/>
```

### Loader Component
```tsx
import { Loader } from './components/Loader'

<Loader size="md" message="Loading..." />
```

## API Service Usage

### Making API Calls
```tsx
import { ApiService } from './services/apiService'

// GET request
const response = await ApiService.get('/users')

// POST request
const response = await ApiService.post('/users', { 
  name: 'John',
  email: 'john@example.com'
})

// PUT request
const response = await ApiService.put('/users/1', { name: 'Jane' })

// DELETE request
const response = await ApiService.delete('/users/1')
```

### Authentication
```tsx
import { AuthService } from './services/authService'

// Login
const token = await AuthService.login('user@example.com', 'password')

// Register
const user = await AuthService.register('user@example.com', 'password', 'John')

// Logout
await AuthService.logout()

// Check authentication
if (AuthService.isAuthenticated()) {
  // User is logged in
}

// Get current user
const user = await AuthService.getCurrentUser()
```

## Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Environment Variables

Create a `.env.local` file with:
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Your App Name
VITE_ENV=development
```

## Features

✅ Type-safe API calls with TypeScript
✅ Custom hooks for data fetching
✅ Reusable component library
✅ Error boundaries and error handling
✅ Authentication service
✅ Responsive design
✅ Production-ready build setup
✅ ESLint and Prettier configured

## Production Deployment

1. Update `.env` with production API URL
2. Run `npm run build`
3. Deploy the `dist/` folder to your hosting
4. Configure CORS on backend if needed
