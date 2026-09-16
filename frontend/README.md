# Job Queue Dashboard - Frontend

Modern React dashboard for managing job queues with real-time status updates.

## Features

- View all jobs with filtering by status
- Create new jobs with validation
- Update job status with proper state transitions
- Delete jobs with confirmation
- Real-time status counts
- Loading and error states
- Responsive design
- Conflict detection and handling

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **CSS Modules** - Component styling

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_URL=http://localhost:3000
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── api/
│   └── jobsApi.ts           # API client for backend
├── components/
│   ├── CreateJobForm.tsx    # Job creation form
│   ├── JobTable.tsx         # Jobs display table
│   └── StatusCard.tsx       # Status filter cards
├── hooks/
│   └── useJobs.ts           # Custom hook for job state
├── styles/
│   ├── CreateJobForm.css
│   ├── JobTable.css
│   └── StatusCard.css
├── types/
│   └── job.ts               # TypeScript interfaces
├── App.tsx                  # Main application component
├── App.css                  # Global styles
└── main.tsx                 # Application entry point
```

## Features Explained

### Status Filtering

Click any status card to filter jobs:
- **All**: Shows all jobs
- **Pending**: Jobs waiting to run
- **Running**: Jobs currently executing
- **Completed**: Successfully finished jobs
- **Failed**: Jobs that encountered errors

### Job Creation

1. Enter a descriptive title
2. Specify the job type
3. Click "Create Job"
4. The new job appears at the top with "pending" status

### Status Updates

Available actions depend on current status:

**Pending jobs:**
- Run → Changes to "running"
- Fail → Changes to "failed"

**Running jobs:**
- Complete → Changes to "completed"
- Fail → Changes to "failed"

**Completed/Failed jobs:**
- No status changes allowed (terminal states)
- Can only be deleted

### Concurrency Handling

When two users try to update the same job simultaneously:

1. Only one request succeeds
2. The other receives a conflict error
3. Jobs are automatically refreshed
4. User sees the latest state

This prevents race conditions and ensures data consistency.

### Error Handling

The UI handles various errors:

- **Network errors**: "Failed to fetch jobs"
- **Validation errors**: Field-specific messages
- **Conflict errors**: Auto-refresh after concurrent updates
- **Not found errors**: Job was already deleted

Errors are displayed at the top of the dashboard and clear automatically when operations succeed.

## State Management

The app uses React's built-in state management:

- `useState` for component-level state
- `useEffect` for data fetching
- Custom `useJobs` hook for job operations
- No external state libraries needed

## API Integration

All API calls go through `src/api/jobsApi.ts`:

```typescript
jobsApi.getJobs()
jobsApi.createJob(data)
jobsApi.updateJobStatus(id, status)
jobsApi.deleteJob(id)
```

The API client:
- Uses Axios for HTTP requests
- Reads API URL from environment
- Returns typed responses
- Throws errors for failed requests

## Deployment

### Vercel / Netlify

1. Connect your Git repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL` (your backend URL)

### Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Static Hosting

Build the app and upload the `dist/` folder to any static hosting:
- AWS S3 + CloudFront
- GitHub Pages
- Firebase Hosting
- Cloudflare Pages

**Important**: Set the `VITE_API_URL` environment variable to your production API URL before building.

## Environment Variables

- `VITE_API_URL` - Backend API base URL (default: http://localhost:3000)

Vite exposes environment variables prefixed with `VITE_` to the client bundle.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Accessibility

The app follows basic accessibility practices:

- Semantic HTML elements
- Proper button labels
- Form labels associated with inputs
- Keyboard navigation support
- Focus indicators

## Performance

- Code splitting via Vite
- Optimized re-renders with useMemo
- Lazy loading of components (can be added)
- Minimal dependencies

## License

MIT
