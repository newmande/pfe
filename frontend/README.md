# Frontend Setup

This is a React + Vite + TypeScript frontend application that connects to your Symfony backend.

## Setup Instructions

### Prerequisites
- Node.js 16.x or higher
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173/`

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Frontend App
```

### Backend Connection

The API configuration is located in `src/config/api.ts`. It provides:

- **apiConfig**: Base configuration for API calls
- **apiCall()**: Generic function for making API requests

Example usage:

```typescript
import { apiCall } from './config/api'

const data = await apiCall('/users', 'GET')
const newUser = await apiCall('/users', 'POST', { name: 'John' })
```

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Project Structure

```
src/
├── config/
│   └── api.ts          # API configuration and utilities
├── App.tsx             # Main App component
├── App.css             # App styles
├── main.tsx            # React entry point
├── index.css           # Global styles
└── assets/             # Static assets
```

### Connecting to Backend

Make sure your Symfony backend is running on `http://localhost:8000` and has the following configured:

1. **CORS Headers**: Allow requests from `http://localhost:5173`
2. **API Routes**: Your API endpoints should be under `/api/` prefix

Example Symfony CORS configuration:

```yaml
# config/packages/nelmio_cors.yaml
nelmio_cors:
  defaults:
    allow_credentials: true
    allow_origin: ["'http://localhost:5173'"]
    allow_headers: ["'*'"]
    allow_methods: ["'GET'", "'POST'", "'PUT'", "'DELETE'", "'OPTIONS'"]
```

## Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technologies Used

- **React 19** - UI library
- **Vite 8** - Build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React 19 JSX Transform** - Modern JSX without import

## Notes

- The dev server includes a proxy for `/api` routes to avoid CORS issues during development
- Make sure CORS is properly configured on your backend for production deployments
