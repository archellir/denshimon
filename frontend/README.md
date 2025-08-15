# Denshimon Frontend

Modern React SPA with cyberpunk aesthetics for Kubernetes and GitOps management.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7.1
- **Styling**: Tailwind CSS with cyberpunk theme
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **Package Manager**: pnpm

## Features

### Cyberpunk UI Design
- Black background with green/yellow/cyan accents
- Monospace fonts (terminal aesthetic)
- Matrix-style color scheme
- Responsive design

### Dashboard Views

#### Kubernetes Management
- **Pod List**: View, restart, delete pods
- **Deployments**: Scale and manage deployments  
- **Nodes**: Monitor node health and resources
- **Logs**: Real-time pod log viewing

#### GitOps Operations  
- **Repositories**: Connect and sync Git repos
- **Applications**: Deploy and manage applications
- **Sync Status**: Track deployment states

#### Monitoring & Metrics
- **Cluster Overview**: Resource usage charts
- **Node Metrics**: CPU, memory, storage per node
- **Historical Trends**: Time-series data visualization
- **Resource Analytics**: Detailed usage breakdowns

### Authentication
- Login/logout with role-based access
- Token-based authentication
- User profile management

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── gitops/         # GitOps management
│   ├── kubernetes/     # Kubernetes resources
│   ├── metrics/        # Monitoring dashboards
│   └── ui/             # Common UI components
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main application component
└── main.tsx           # Application entry point
```

## Development

### Prerequisites
- Node.js 22+
- pnpm 9+

### Setup
```bash
cd frontend
pnpm install
```

### Development Server
```bash
pnpm dev
```
Runs on http://localhost:5173

### Build
```bash
pnpm build
```
Outputs to `dist/` directory

### Preview Production Build
```bash
pnpm preview
```

## Path Aliases

Clean import paths using TypeScript path mapping:

```typescript
import Component from '@components/Component'
import { useStore } from '@stores/store'
import type { User } from '@types/auth'
import { formatDate } from '@utils/date'
```

Available aliases:
- `@/*` → `./src/*`
- `@components/*` → `./src/components/*`
- `@stores/*` → `./src/stores/*`
- `@types/*` → `./src/types/*`
- `@utils/*` → `./src/utils/*`

## State Management

Using Zustand for lightweight state management:

```typescript
// stores/authStore.ts
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}))
```

## Styling

### Tailwind Configuration
Custom cyberpunk color palette:
- **Primary**: Green (#00FF00)
- **Secondary**: Yellow (#FFFF00) 
- **Accent**: Cyan (#00FFFF)
- **Background**: Black (#000000)
- **Text**: White (#FFFFFF)

### Component Styling
```tsx
<div className="bg-black border border-white text-green-400 font-mono">
  <h1 className="text-lg font-bold">KUBERNETES CLUSTER</h1>
</div>
```

## Charts & Visualizations

Using Recharts for data visualization:
- Line charts for metrics trends
- Radial charts for resource usage
- Custom tooltips with cyberpunk styling
- Responsive containers

```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={metricsData}>
    <Line 
      dataKey="cpu" 
      stroke="#00FF00" 
      strokeWidth={2}
      name="CPU Usage"
    />
  </LineChart>
</ResponsiveContainer>
```

## API Integration

Fetch API for backend communication:

```typescript
// utils/api.ts
const api = {
  get: (url: string) => 
    fetch(`/api${url}`, { 
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  post: (url: string, data: any) =>
    fetch(`/api${url}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
}
```

## Type Safety

Full TypeScript coverage with strict mode:

```typescript
// types/kubernetes.ts
export interface Pod {
  name: string
  namespace: string
  status: PodStatus
  containers: Container[]
  createdAt: string
}

export interface ClusterMetrics {
  cpu_usage: ResourceUsage
  memory_usage: ResourceUsage
  storage_usage: ResourceUsage
  node_count: number
  pod_count: number
}
```

## Deployment

### Embedded in Go Binary
The frontend is built and embedded into the Go backend:
```bash
# Frontend dist/ copied to backend/cmd/server/spa/
# Go embed directive includes all assets
//go:embed all:spa
var frontendAssets embed.FS
```

### Standalone Serving
For development or separate deployment:
```bash
pnpm build
pnpm preview  # Serves dist/ on port 4173
```

## Environment Variables

Configure via `.env`:
```
VITE_API_URL=http://localhost:8080/api  # Backend API URL
VITE_WS_URL=ws://localhost:8080/ws      # WebSocket URL
```

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

Modern features used:
- ES2022 syntax
- CSS Grid & Flexbox
- Web APIs (Fetch, WebSocket)
- TypeScript 5.3
