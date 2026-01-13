# Low-Level Design (LLD) - Al-Measure
## Detailed Component Specifications

---

## 1. Component Specifications

### 1.1 Authentication Components

#### LoginPage Component
**File**: `components/Auth/Login.tsx`

**State Management:**
```typescript
interface LoginData {
  email: string
  company: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  company: string
  password: string
}

const [currentView, setCurrentView] = useState<'login' | 'register'>('login')
const [loginData, setLoginData] = useState<LoginData>({...})
const [registerData, setRegisterData] = useState<RegisterData>({...})
const [showPassword, setShowPassword] = useState<boolean>(false)
const [isLoading, setIsLoading] = useState<boolean>(false)
```

**Methods:**
```typescript
// Handle login submission
handleLogin(): Promise<void>
  - Validate email format
  - Validate password length (min 6)
  - Call /api/auth/signin
  - Handle success/error
  - Navigate based on role

// Handle registration submission
handleRegister(): Promise<void>
  - Validate all fields
  - Check password strength
  - Call /api/auth/signup
  - Handle success/error
  - Navigate to client dashboard

// Toggle password visibility
togglePasswordVisibility(): void
  - Toggle showPassword state

// Switch between login/register views
switchView(view: 'login' | 'register'): void
  - Reset form data
  - Reset password visibility
  - Update currentView
```

**Validation Rules:**
```typescript
// Email validation
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Password validation
- Minimum length: 6 characters
- Required for both login and register

// Company validation
- Optional for login
- Required for registration
```

---

### 1.2 Dashboard Components

#### ClientDashboard Component
**File**: `components/client/client-dashboard.tsx`

**State:**
```typescript
const [view, setView] = useState<'dashboard' | 'request-detail'>('dashboard')
const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
```

**Computed Values:**
```typescript
stats = {
  total: requests.length,
  pending: requests.filter(r => r.status === 'pending').length,
  inProgress: requests.filter(r => r.status === 'in-progress').length,
  completed: requests.filter(r => r.status === 'completed').length
}

completionRate = (stats.completed / stats.total) * 100
```

**Methods:**
```typescript
handleSelectRequest(requestId: string): void
  - Set selectedRequestId
  - Switch view to 'request-detail'

handleBackToDashboard(): void
  - Clear selected request
  - Switch view to 'dashboard'

handleUpdateStatus(status: RequestStatus): void
  - Update request in store
  - Add status update record
  - Show success toast

handleRefresh(): void
  - Reinitialize mock data
  - Refresh component
```

---

### 1.3 Map Components

#### MapApp Component
**File**: `components/map-app.tsx`

**State Management:**
```typescript
// Map reference
const mapRef = useRef<Map | null>(null)
const mapElRef = useRef<HTMLDivElement>(null)

// Drawing state
const [tool, setTool] = useState<Tool | null>(null)
const [isDrawing, setIsDrawing] = useState<boolean>(false)
const [areaSqft, setAreaSqft] = useState<number>(0)

// Layer state
const [layers, setLayers] = useState<LayersState>({
  polygon: [...],
  line: [...],
  point: [...]
})

// History state
const [history, setHistory] = useState<HistoryItem[]>([])
const [historyPointer, setHistoryPointer] = useState<number>(-1)
```

**OpenLayers Integration:**
```typescript
// Map initialization
useEffect(() => {
  const map = new Map({
    target: mapElRef.current,
    layers: [
      new TileLayer({ source: new XYZ({ url: '...' }) }), // Base layer
      vectorLayersRef.current.polygon,                     // Polygon layer
      vectorLayersRef.current.line,                        // Line layer
      vectorLayersRef.current.point                        // Point layer
    ],
    view: new View({
      center: fromLonLat([0, 0]),
      zoom: 2
    })
  })
  mapRef.current = map
}, [])
```

**Measurement Calculations:**
```typescript
// Area calculation (Polygon)
const calculateArea = (geometry: Polygon): number => {
  const areaM2 = getArea(geometry)          // Square meters
  const areaSqFt = areaM2 * 10.764          // Convert to sq ft
  return Number.parseFloat(areaSqFt.toFixed(2))
}

// Length calculation (LineString)
const calculateLength = (geometry: LineString): number => {
  const lengthM = getLength(geometry)       // Meters
  const lengthFt = lengthM * 3.281          // Convert to feet
  return Number.parseFloat(lengthFt.toFixed(2))
}
```

**Drawing Tools:**
```typescript
// Available tools
type Tool = 
  | 'select'     // Select features
  | 'polygon'    // Draw polygon
  | 'line'       // Draw line
  | 'point'      // Draw point
  | 'reshape'    // Modify features
  | 'delete'     // Delete features
  | 'split'      // Split features
  | 'clip'       // Clip features
  | 'merge'      // Merge features
  | 'measure'    // Measure distance/area
```

**Event Handlers:**
```typescript
// Draw end event
draw.on('drawend', (e: DrawEvent) => {
  const feature = e.feature
  const geometry = feature.getGeometry()
  
  // Calculate measurements
  if (geometry instanceof Polygon) {
    const area = calculateArea(geometry)
    updateLayerStats(selectedLayerId, area)
    emit onFeatureDrawn(toGeoJSON(feature))
  }
  
  // Add to history
  addToHistory({ action: 'draw', feature, layerType })
})

// Modify end event
modify.on('modifyend', (e: ModifyEvent) => {
  const features = e.features.getArray()
  features.forEach(feature => {
    const geometry = feature.getGeometry()
    const area = calculateArea(geometry)
    updateLayerStats(selectedLayerId, area)
  })
})
```

---

### 1.4 Request Components

#### RequestList Component
**File**: `components/request-list.tsx`

**State:**
```typescript
const [statusFilter, setStatusFilter] = useState<string>('all')
const [priorityFilter, setPriorityFilter] = useState<string>('all')
const [searchTerm, setSearchTerm] = useState<string>('')
```

**Filtering Logic:**
```typescript
const filteredRequests = useMemo(() => {
  return requests.filter(request => {
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      request.status === statusFilter
    
    // Priority filter
    const matchesPriority = 
      priorityFilter === 'all' || 
      request.priority === priorityFilter
    
    // Search filter
    const matchesSearch = 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesPriority && matchesSearch
  })
}, [requests, statusFilter, priorityFilter, searchTerm])
```

**Status Configuration:**
```typescript
const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    dotColor: 'bg-yellow-500'
  },
  'in-progress': {
    label: 'In Progress',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500'
  },
  // ... other statuses
}
```

---

## 2. API Specifications

### 2.1 Authentication APIs

#### POST /api/auth/signin

**Request:**
```typescript
interface SignInRequest {
  email: string        // Required, valid email format
  password: string     // Required, min 6 characters
  company?: string     // Optional
}
```

**Response (Success - 200):**
```typescript
interface SignInResponse {
  success: true
  user: {
    id: string
    name: string
    email: string
    role: 'client' | 'employee' | 'admin'
    company: string
  }
  message: string
}
```

**Response (Error - 400/401/500):**
```typescript
interface ErrorResponse {
  success: false
  message: string
  errors?: ZodError[]
}
```

**Validation Schema (Zod):**
```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  company: z.string().optional()
})
```

**Business Logic:**
```typescript
1. Validate request body with Zod
2. Connect to MongoDB
3. Find user by email
4. If not found → 401 Unauthorized
5. Compare password with bcrypt
6. If invalid → 401 Unauthorized
7. Generate JWT token
8. Set httpOnly cookie
9. Return user data (excluding password)
```

---

#### POST /api/auth/signup

**Request:**
```typescript
interface SignUpRequest {
  name: string         // Required, min 2 characters
  email: string        // Required, valid email, unique
  password: string     // Required, min 8 characters, strong
  company: string      // Required
}
```

**Validation Schema:**
```typescript
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  company: z.string().min(1, 'Company is required')
})
```

**Business Logic:**
```typescript
1. Validate request body
2. Check if email already exists
3. Hash password with bcryptjs
4. Create user document with default role 'client'
5. Save to MongoDB
6. Generate JWT token
7. Set httpOnly cookie
8. Return user data
```

---

### 2.2 Request APIs (Future Implementation)

#### GET /api/requests

**Query Parameters:**
```typescript
interface RequestQuery {
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  category?: RequestCategory
  clientId?: string
  page?: number
  limit?: number
}
```

**Response:**
```typescript
interface RequestListResponse {
  success: true
  data: ServiceRequest[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

---

## 3. Database Schema Details

### 3.1 User Schema (Mongoose)

```typescript
const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  company: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['client', 'employee', 'admin'],
    default: 'client'
  }
}, {
  timestamps: true
})

// Index
UserSchema.index({ email: 1 }, { unique: true })
```

### 3.2 Request Schema (Future)

```typescript
const RequestSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['landscape-measurement', 'property-assessment', 'maintenance-request', 'consultation', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  geometry: {
    type: Object,  // GeoJSON
    required: true
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  propertyAddress: String,
  propertySize: Number,
  propertyFeatures: [String],
  notes: String,
  attachments: [String]
}, {
  timestamps: true
})

// Indexes
RequestSchema.index({ clientId: 1, status: 1 })
RequestSchema.index({ createdAt: -1 })
```

---

## 4. State Management

### 4.1 Zustand Store Structure

```typescript
interface AppState {
  // Requests
  requests: ServiceRequest[]
  addRequest: (request: ServiceRequest) => void
  updateRequest: (id: string, updates: Partial<ServiceRequest>) => void
  deleteRequest: (id: string) => void
  
 // Request Updates
  requestUpdates: Record<string, RequestUpdate[]>
  addRequestUpdate: (requestId: string, update: RequestUpdate) => void
  
  // Users
  users: User[]
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  
  // Initialization
  initializeMockData: () => void
}

const useStore = create<AppState>((set) => ({
  requests: [],
  requestUpdates: {},
  users: [],
  currentUser: null,
  
  addRequest: (request) => set((state) => ({
    requests: [...state.requests, request]
  })),
  
  updateRequest: (id, updates) => set((state) => ({
    requests: state.requests.map(r => 
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    )
  })),
  
  // ... other methods
}))
```

### 4.2 Client Store (Features)

```typescript
interface FeatureStore {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const useFeatureStore = create<FeatureStore>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false })
}))
```

---

## 5. Algorithms & Logic

### 5.1 Area Calculation Algorithm

```typescript
/**
 * Calculate area of a polygon in square feet
 * Uses Turf.js getArea() which implements spherical geometry
 */
function calculatePolygonArea(geometry: Polygon): number {
  // Get area in square meters (Turf.js uses spherical calculation)
  const areaSquareMeters = getArea(geometry)
  
  // Conversion factor: 1 m² = 10.764 ft²
  const SQUARE_METERS_TO_SQUARE_FEET = 10.764
  
  // Convert to square feet
  const areaSquareFeet = areaSquareMeters * SQUARE_METERS_TO_SQUARE_FEET
  
  // Round to 2 decimal places
  return Number.parseFloat(areaSquareFeet.toFixed(2))
}

/**
 * Example:
 * Input: Polygon with vertices [(0,0), (0,100), (100,100), (100,0)]
 * Area: 10,000 m² = 107,640 ft²
 */
```

### 5.2 Coordinate Transformation

```typescript
/**
 * Transform coordinates from WGS84 (lon/lat) to Web Mercator (EPSG:3857)
 */
function transformCoordinates(lon: number, lat: number): [number, number] {
  const EARTH_RADIUS = 6378137  // meters
  
  // Convert longitude
  const x = lon * (Math.PI / 180) * EARTH_RADIUS
  
  // Convert latitude
  const y = Math.log(
    Math.tan(Math.PI / 4 + lat * (Math.PI / 180) / 2)
  ) * EARTH_RADIUS
  
  return [x, y]
}

// OpenLayers helper
import { fromLonLat } from 'ol/proj'
const [x, y] = fromLonLat([longitude, latitude])
```

### 5.3 Feature Serialization

```typescript
/**
 * Convert OpenLayers feature to GeoJSON
 */
function serializeFeature(feature: Feature): GeoJSON.Feature {
  const format = new GeoJSON()
  
  // Write feature as GeoJSON object
  const geoJson = format.writeFeatureObject(feature, {
    dataProjection: 'EPSG:4326',    // Output projection
    featureProjection: 'EPSG:3857'  // Input projection
  })
  
  return geoJson
}

/**
 * Example Output:
 * {
 *   "type": "Feature",
 *   "geometry": {
 *     "type": "Polygon",
 *     "coordinates": [[[lon1, lat1], [lon2, lat2], ...]]
 *   },
 *   "properties": {}
 * }
 */
```

---

## 6. UI Component Patterns

### 6.1 Theme Toggle Pattern

```typescript
/**
 * Theme toggle with dropdown
 * Uses next-themes for theme management
 */
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
          <Moon className="rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 6.2 Toast Notification Pattern

```typescript
/**
 * Toast notifications for user feedback
 * Uses sonner library
 */
import { toast } from 'sonner'

// Success toast
toast.success('Request created successfully!', {
  description: 'Your landscape measurement request has been submitted.'
})

// Error toast
toast.error('Failed to create request', {
  description: error.message
})

// Loading toast
const toastId = toast.loading('Creating request...')
// Later update
toast.success('Request created!', { id: toastId })
```

---

## 7. Performance Optimizations

### 7.1 React Optimizations

```typescript
// Use useMemo for expensive calculations
const filteredRequests = useMemo(() => {
  return requests.filter(/* ... */)
}, [requests, filters])

// Use useCallback for stable function references
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies])

// Lazy load heavy components
const MapApp = dynamic(() => import('@/components/map-app'), {
  loading: () => <Spinner />,
  ssr: false  // Client-side only
})
```

### 7.2 Database Query Optimization

```typescript
// Use lean() for read-only queries
const users = await User.find({}).lean()

// Use select() to limit fields
const users = await User.find({}).select('name email role')

// Use pagination
const requests = await Request
  .find({ clientId })
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ createdAt: -1 })
```

---

## 8. Error Handling

### 8.1 API Error Handling

```typescript
try {
  // API call
  const response = await axios.post('/api/auth/signin', data)
  
  if (response.data.success) {
    // Success handling
    toast.success('Login successful!')
    router.push(`/${response.data.user.role}`)
  }
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Axios error
    const message = error.response?.data?.message || 'Login failed'
    toast.error(message)
  } else {
    // Unknown error
    toast.error('An unexpected error occurred')
  }
}
```

### 8.2 Form Validation Error Handling

```typescript
// Manual validation
if (!email || !email.includes('@')) {
  toast.error('Please enter a valid email address')
  return
}

if (!password || password.length < 6) {
  toast.error('Password must be at least 6 characters')
  return
}

// Backend Zod validation
try {
  const validated = loginSchema.parse(body)
} catch (error extend extends ZodError) {
  return NextResponse.json({
    success: false,
    message: 'Validation failed',
    errors: error.errors
  }, { status: 400 })
}
```

---

## 9. Security Implementation

### 9.1 Password Hashing

```typescript
import bcrypt from 'bcryptjs'

// Hash password (registration)
const saltRounds = 10
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds)

// Verify password (login)
const isValid = await bcrypt.compare(plainPassword, hashedPassword)
```

### 9.2 JWT Token Generation

```typescript
import jwt from 'jsonwebtoken'

// Generate token
const token = jwt.sign(
  {
    userId: user._id,
    email: user.email,
    role: user.role
  },
  process.env.JWT_SECRET!,
  {
    expiresIn: '7d'
  }
)

// Set cookie
cookies().set('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60  // 7 days
})
```

---

## 10. Testing Strategy

### 10.1 Unit Test Examples

```typescript
describe('calculatePolygonArea', () => {
  it('should calculate area of a square correctly', () => {
    const square = createSquarePolygon(100)  // 100m x 100m
    const area = calculatePolygonArea(square)
    expect(area).toBeCloseTo(107640, 0)  // 10,000 m² = 107,640 ft²
  })
})

describe('loginSchema', () => {
  it('should validate correct login data', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123'
    }
    expect(() => loginSchema.parse(data)).not.toThrow()
  })
  
  it('should reject invalid email', () => {
    const data = {
      email: 'invalid-email',
      password: 'password123'
    }
    expect(() => loginSchema.parse(data)).toThrow()
  })
})
```

---

## 11. Conclusion

This Low-Level Design provides detailed specifications for implementing the Al-Measure platform, including component structures, API contracts, database schemas, algorithms, and best practices for maintainable, scalable code.
