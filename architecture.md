# VoltConnect 2.0 — Architecture Specification & Technical Blueprint

## 1. Project Overview
VoltConnect 2.0 is a startup-level, unified Electric Vehicle (EV) ecosystem platform designed to seamlessly connect EV drivers across all vehicle form-factors (4-wheelers, 2-wheelers, 3-wheelers, commercial fleets, light EVs, and heavy transport) with charging infrastructure operators, service partners, field technicians, and platform administrators. Built for competition-grade demonstration (MSME Phase-2) and enterprise scalability, VoltConnect 2.0 replaces legacy fragmented EV utilities with an intelligent, connected mobility platform.

---

## 2. Product Vision
**Core Positioning**: "Electric mobility, connected."  
**Supporting Concept**: "Discover. Navigate. Charge. Maintain."  

VoltConnect 2.0 unifies the entire lifecycle of EV ownership and charging operations:
1. **Discover**: Real-time, location-aware charging station lookup with compatibility verification (VoltScore reliability engine).
2. **Navigate**: Smart energy-aware journey planning factoring in battery consumption, terrain, weather, and real-time charger availability.
3. **Charge**: Live status monitoring across multi-tier chargers, pricing breakdown, and home charging readiness (HomeCharge).
4. **Maintain**: Predictive battery health (VoltHealth), scheduled maintenance (VoltCare), low-battery SOS dispatch (VoltSOS), and real-time field issue resolution via assigned technicians.

---

## 3. Core User Types

### 3.1 Driver / User (`driver`)
- **Status**: `PLANNED`
- **Description**: EV owners across all categories (Cars, Scooters, Motorcycles, Autos, Vans, Heavy Commercial, E-Bikes).
- **Permissions**: Read-only public stations/chargers; Read/Write personal garage vehicles, personal trips, personal reviews, SOS requests, and home charge applications. Access to Driver Dashboard, VoltMap, Trip Planner, VoltHealth, VoltCare, VoltSOS, and VoltAI.

### 3.2 Partner (`partner`)
- **Status**: `PLANNED`
- **Description**: Station operators (CPOs), EV service center owners, home charger installers, and fleet managers.
- **Permissions**: Read/Write own station listings, charger configurations, real-time charger status overrides, service listings, and partner analytics. Restricted strictly to self-owned organizational records. Access to Partner Portal.

### 3.3 Technician (`technician`)
- **Status**: `PLANNED`
- **Description**: Field engineers and maintenance crews responsible for inspecting, repairing, and certifying charging hardware and station facilities.
- **Permissions**: Read assigned maintenance tasks; Write ticket status updates (e.g., `Travelling`, `Inspection`, `Repair`, `Resolved`), technical notes, and evidence attachments. Access to Technician Portal.

### 3.4 Admin (`admin`)
- **Status**: `PLANNED`
- **Description**: Platform operations team managing user verification, partner onboarding, station approvals, technician assignment, system announcements, content moderation, and operational oversight.
- **Permissions**: Full read/write access across all user accounts, vehicle catalog entries, station reviews, technician ticket assignments, and platform analytics. Access to Admin Command Center.

### 3.5 Super Admin (`super_admin`)
- **Status**: `PLANNED`
- **Description**: Platform system administrators with root authorization for role escalations, audit log inspections, security configuration, and Firestore index/schema management.

---

## 4. Application Architecture

### System Flow Diagrams

#### Diagram 1: Driver Ecosystem Flow
```
[ USER ]
   │
   ▼
[ AUTHENTICATION (Firebase Auth) ]
   │
   ▼
[ USER PROFILE & GARAGE ]
   │
   ▼
[ VEHICLE INTELLIGENCE ENGINE ]
   │
   ├──► [ VOLTMAP & CHARGER DISCOVERY ] ──► [ OpenChargeMap / Firestore ]
   ├──► [ SMART TRIP PLANNER ] ─────────► [ Routing API / Weather API ]
   ├──► [ VOLTHEALTH & BATTERY ] ───────► [ Telemetry / Practical Range ]
   └──► [ VOLTCARE & VOLTSOS ] ──────────► [ Technician / Service Network ]
```

#### Diagram 2: Partner Ecosystem Flow
```
[ PARTNER ]
   │
   ▼
[ SECURE PARTNER PORTAL ]
   │
   ▼
[ STATION & CHARGER MANAGEMENT ]
   │
   ▼
[ FIRESTORE REAL-TIME DB ]
   │
   ├──► [ DRIVER EXPLORE / MAP (Live updates) ]
   └──► [ ADMIN COMMAND CENTER (Audit & Analytics) ]
```

#### Diagram 3: Admin Command Center Flow
```
[ ADMIN ]
   │
   ▼
[ ADMIN COMMAND CENTER ]
   │
   ├──► [ USER & PARTNER MANAGEMENT ]
   ├──► [ STATION APPROVAL & VERIFICATION ]
   ├──► [ TECHNICIAN WORKFLOW & DISPATCH ]
   ├──► [ CONTENT & ANNOUNCEMENTS ]
   └──► [ PLATFORM AUDIT LOGS & ANALYTICS ]
```

#### Diagram 4: Technician Issue Resolution Flow
```
[ CHARGER FAULT / REPORT ] ──► [ ADMIN DETECTS / ASSIGNS ]
                                     │
                                     ▼
                           [ TECHNICIAN PORTAL ]
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
        [ TRAVEL & INSPECTION ]                [ REPAIR & EVIDENCE ]
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     ▼
                           [ MARK RESOLVED ]
                                     │
                                     ▼
                       [ ADMIN VERIFIES & PUBLISHES ]
                                     │
                                     ▼
                      [ STATIONS / DRIVERS UPDATED ]
```

---

## 5. Frontend Architecture
- **Framework**: React 18+ with TypeScript (Strict Type Safety)
- **Build Tool**: Vite (Lightning fast HMR & optimized production bundling)
- **Styling**: Modern Vanilla CSS Design Tokens + Utility Styling (Light theme, custom HSL design variables, glassmorphism, responsive grid layout, micro-interactions)
- **Icons**: Lucide React
- **Charts**: Recharts (Platform analytics, range visualization, battery degradation metrics)
- **Maps**: Leaflet / React-Leaflet with custom vector marker layers and spatial clustering
- **State Management**: React Context + Custom Hooks + Firestore Subscriptions

---

## 6. Routing Architecture
React Router v6 with declarative, protected, role-based layout boundaries:

- `/` — Opening Brand Reveal & Landing Page (`PUBLIC`)
- `/login` — Secure Login Page (`PUBLIC`)
- `/signup` — Registration & Account Provisioning (`PUBLIC`)
- `/onboarding` — Multi-Step Vehicle & Profile Setup (`PROTECTED - ANY AUTH`)
- `/dashboard` — Driver Main Dashboard (`PROTECTED - DRIVER`)
- `/explore` — VoltMap Charging Station Discovery (`PUBLIC / DRIVER`)
- `/trips` — Smart Trip Planner (`PROTECTED - DRIVER`)
- `/garage` — My EV & Garage Management (`PROTECTED - DRIVER`)
- `/health` — VoltHealth Battery Intelligence (`PROTECTED - DRIVER`)
- `/care` — VoltCare Maintenance & Service Network (`PROTECTED - DRIVER`)
- `/homecharge` — HomeCharge Readiness & Installation (`PROTECTED - DRIVER`)
- `/sos` — VoltSOS Emergency Assistance (`PROTECTED - DRIVER`)
- `/ai` — VoltAI EV Copilot (`PROTECTED - DRIVER`)
- `/profile` — User Account & Notification Settings (`PROTECTED - DRIVER`)
- `/partner/*` — Partner Portal (`PROTECTED - ROLE: partner`)
  - `/partner/dashboard`
  - `/partner/stations`
  - `/partner/add-station`
  - `/partner/analytics`
- `/technician/*` — Technician Portal (`PROTECTED - ROLE: technician`)
  - `/technician/dashboard`
  - `/technician/issues`
  - `/technician/history`
- `/admin/*` — Admin Command Center (`PROTECTED - ROLE: admin | super_admin`)
  - `/admin/dashboard`
  - `/admin/users`
  - `/admin/partners`
  - `/admin/stations`
  - `/admin/technicians`
  - `/admin/analytics`
  - `/admin/audit-logs`

---

## 7. Authentication Architecture
- **Provider**: Firebase Authentication (Email/Password + Session Persistence)
- **Flow**:
  1. User enters credentials at `/login` or `/signup`.
  2. Firebase Auth returns authenticated user credential.
  3. `AuthContext` fetches user document from `users/{uid}` in Firestore to resolve user role (`driver`, `partner`, `technician`, `admin`).
  4. Onboarding Status check: If `driver` has incomplete vehicle onboarding, redirect to `/onboarding`.
  5. Role-aware redirect: Drivers -> `/dashboard`, Partners -> `/partner/dashboard`, Technicians -> `/technician/dashboard`, Admins -> `/admin/dashboard`.

---

## 8. Role-Based Access Architecture
- Custom Auth Hook `useAuth()` exposes `user`, `role`, `loading`, `onboardingComplete`.
- Custom wrapper component `<ProtectedRoute allowedRoles={['admin']} />` enforces strict client-side checks and prevents unauthorized rendering.
- Server-side enforcement mirrored 1:1 via Firestore Security Rules.

---

## 9. Firebase Architecture
- **Auth**: User Identity & Authentication.
- **Cloud Firestore**: Primary NoSQL real-time document database.
- **Firebase Storage**: Avatar uploads, partner station documentation, technician repair photo evidence.
- **Firebase Cloud Functions** (Planned): Asynchronous audit logging, email alerts, background station status evaluation.

---

## 10. Firestore Collections

```
/users/{uid}
  - uid: string
  - name: string
  - email: string
  - role: 'driver' | 'partner' | 'technician' | 'admin' | 'super_admin'
  - activeVehicleId: string
  - createdAt: timestamp
  - updatedAt: timestamp

/vehicles/{vehicleId}
  - vehicleId: string
  - userId: string
  - category: '4-wheeler' | '2-wheeler' | '3-wheeler' | 'commercial' | 'heavy' | 'light'
  - manufacturer: string
  - model: string
  - variant: string
  - batteryCapacitykWh: number
  - estimatedRangeKm: number
  - connectorTypes: string[]
  - isDefault: boolean
  - createdAt: timestamp

/vehicleCatalog/{catalogId}
  - category: string
  - manufacturer: string
  - model: string
  - variant: string
  - batteryCapacity: number
  - estimatedRange: number
  - connectorTypes: string[]
  - maxChargingSpeedKW: number
  - active: boolean

/partners/{partnerId}
  - partnerId: string
  - userId: string
  - companyName: string
  - partnerType: 'cpo' | 'service' | 'home_charging' | 'fleet'
  - verificationStatus: 'pending' | 'verified' | 'rejected'
  - contactEmail: string
  - contactPhone: string
  - createdAt: timestamp

/stations/{stationId}
  - stationId: string
  - partnerId: string
  - name: string
  - description: string
  - address: string
  - latitude: number
  - longitude: number
  - operatingHours: string
  - amenities: string[]
  - voltScore: number
  - status: 'active' | 'maintenance' | 'offline'
  - verificationStatus: 'approved' | 'pending' | 'rejected'
  - dataSource: 'partner' | 'openchargemap' | 'simulated'
  - lastUpdated: timestamp

/chargers/{chargerId}
  - chargerId: string
  - stationId: string
  - connectorType: string (e.g., 'CCS2', 'Type2', 'CHAdeMO', 'GB/T', '15A Plug')
  - powerKW: number
  - pricingPerKWh: number
  - status: 'Available' | 'Charging' | 'Occupied' | 'Fault' | 'Maintenance' | 'Offline'
  - lastUpdated: timestamp

/maintenanceTickets/{ticketId}
  - ticketId: string
  - stationId: string
  - chargerId: string
  - reportedBy: string
  - assignedTechnicianId: string
  - issueDescription: string
  - priority: 'low' | 'medium' | 'high' | 'critical'
  - status: 'Created' | 'Assigned' | 'Travelling' | 'Inspection' | 'Repair' | 'Resolved'
  - notes: string[]
  - evidencePhotoUrls: string[]
  - createdAt: timestamp
  - resolvedAt: timestamp

/auditLogs/{logId}
  - logId: string
  - actorId: string
  - actorEmail: string
  - actorRole: string
  - action: string
  - targetCollection: string
  - targetId: string
  - details: map
  - timestamp: timestamp
```

---

## 11. Firestore Relationships
- `users` (1) ──► (N) `vehicles` (via `vehicles.userId`)
- `partners` (1) ──► (N) `stations` (via `stations.partnerId`)
- `stations` (1) ──► (N) `chargers` (via `chargers.stationId`)
- `stations` (1) ──► (N) `maintenanceTickets` (via `maintenanceTickets.stationId`)
- `technicians` (1) ──► (N) `maintenanceTickets` (via `maintenanceTickets.assignedTechnicianId`)

---

## 12. Firestore Security Rules Strategy
- `users`: Users can read/write their own document; Admins can read all.
- `vehicles`: Users can read/write their own vehicles.
- `vehicleCatalog`: Public read; Admin write.
- `stations` & `chargers`: Public read for `approved` stations; Partners can write only to stations matching their `partnerId`; Admins have full access.
- `maintenanceTickets`: Assigned technicians can read and update status/notes; Admins create and manage assignments.
- `auditLogs`: Read/Write restricted exclusively to `admin` and `super_admin`.

---

## 13. Vehicle Catalog Architecture
- **Purpose**: Dynamic repository of supported EV categories, manufacturers, models, variants, battery capacity, connector types, and charging capabilities.
- **Where it lives**: `src/features/vehicles/` and Firestore collection `vehicleCatalog`.
- **Implementation Note**: Eliminates hardcoded React component vehicle options. Fallback seed catalog provided for offline/demo operation.

---

## 14. Charging Station Architecture
- **Purpose**: Represents physical EV charging hubs.
- **Where it lives**: `src/features/charging/` and Firestore collection `stations`.
- **Data**: Geospatial coordinates, amenities, operational state, VoltScore reliability rating, partner ownership metadata.

---

## 15. Charger Architecture
- **Purpose**: Individual charging ports/connectors within a station.
- **Where it lives**: Firestore collection `chargers`.
- **Data**: Connector standard, power speed (kW), tariff rate (₹/kWh), real-time availability status.

---

## 16. Real-Time Data Architecture
- Uses Firestore `onSnapshot` real-time listeners for live updates on charger availability, technician ticket updates, and admin dashboard metrics.
- Built-in fallback gracefully handles offline network states without UI disruption.

---

## 17. Partner Portal Architecture
- **Purpose**: Allows CPOs and service providers to manage stations, track usage, update charger tariffs, and report maintenance issues.
- **Where it lives**: `src/pages/partner/` and `src/features/partner/`.

---

## 18. Technician Portal Architecture
- **Purpose**: Dedicated workflow mobile/desktop dashboard for field service technicians to view assigned repair orders, update status, record notes, and attach resolution photos.
- **Where it lives**: `src/pages/technician/` and `src/features/technician/`.

---

## 19. Admin Command Center Architecture
- **Purpose**: Comprehensive platform operational monitoring control center for user management, partner approvals, station catalog curation, technician dispatching, audit logging, and platform metrics.
- **Where it lives**: `src/pages/admin/` and `src/features/admin/`.

---

## 20. Driver Application Architecture
- **Purpose**: Unified mobile and desktop web app for EV drivers, offering personalized dashboard summaries, range estimations, nearby charger alerts, and service access.
- **Where it lives**: `src/pages/driver/` and `src/features/driver/`.

---

## 21. VoltMap Architecture
- **Purpose**: Interactive, high-performance charging station map explorer with intelligent filters (Compatibility, Speed, VoltScore, Open Status, Connector Type).
- **Where it lives**: `src/features/charging/components/VoltMap.tsx`.

---

## 22. Trip Planner Architecture
- **Purpose**: Route planning engine calculating energy consumption based on battery capacity, vehicle weight, speed, terrain, ambient temperature, and recommending optimal charging stops along the journey.
- **Where it lives**: `src/features/trips/`.

---

## 23. VoltHealth Architecture
- **Purpose**: Battery intelligence dashboard offering estimated state of health (SOH), degradation trend modeling, fast charging frequency analysis, and battery longevity advice.
- **Where it lives**: `src/features/battery/`.

---

## 24. VoltCare Architecture
- **Purpose**: Ecosystem for scheduling EV periodic maintenance, brake inspections, tire checks, and discovering certified service centers.
- **Where it lives**: `src/features/maintenance/`.

---

## 25. HomeCharge Architecture
- **Purpose**: Assessment tool for residential AC charger installation readiness, electrical load feasibility, apartment permission guidelines, and contractor pairing.
- **Where it lives**: `src/features/homecharge/`.

---

## 26. VoltSOS Architecture
- **Purpose**: Emergency dispatch assistant activated when battery drops below critical threshold (<10%), providing nearest reachable charging points, emergency contact sharing, and mobile roadside support.
- **Where it lives**: `src/features/sos/`.

---

## 27. VoltAI Architecture
- **Purpose**: Context-aware AI Copilot providing voice/text query answers tailored to the driver's specific EV model, remaining battery, location, and weather conditions.
- **Where it lives**: `src/features/ai/` via abstracted `aiService`.

---

## 28. Notification Architecture
- **Purpose**: Real-time toast alerts and notification center for charger status updates, trip milestones, maintenance alerts, and partner approvals.
- **Where it lives**: `src/features/notifications/`.

---

## 29. API Integration Architecture
- Abstraction layer for third-party service integration (`src/services/`):
  - `mapsService.ts`: Geocoding & Map rendering (OpenStreetMap / Leaflet)
  - `routingService.ts`: OSRM / Routing engine calculations
  - `weatherService.ts`: Open-Meteo / Weather temperature API for range adjustment
  - `chargingDataService.ts`: OpenChargeMap fallback integration + Firestore sync
  - `aiService.ts`: LLM abstraction for VoltAI

---

## 30. External Services
- **Firebase**: Auth, Firestore, Storage
- **OpenChargeMap API**: Public EV charging data fallback
- **Open-Meteo API**: Temperature & climate range factors
- **OSRM (Open Source Routing Machine)**: Distance & route geometry

---

## 31. Environment Variables
Stored securely in `.env.local` (never committed to source control):
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENCHARGEMAP_API_KEY=your_ocm_key
VITE_AI_SERVICE_URL=your_ai_endpoint
```

---

## 32. Component Architecture
Atomic, reusable UI system:
- **Atoms**: `Button`, `Input`, `Select`, `Badge`, `StatusIndicator`, `Spinner`
- **Molecules**: `StationCard`, `VehicleCard`, `ChargerRow`, `MetricTile`, `FilterChip`
- **Organisms**: `VoltMap`, `StationDetailModal`, `TripPlannerForm`, `Navbar`, `Sidebar`
- **Templates**: `PublicLayout`, `DriverLayout`, `PartnerLayout`, `AdminLayout`

---

## 33. Feature-Based Folder Structure
```
src/
  assets/          # Logos, vector icons, SVG illustrations
  components/      # Shared UI design system components
  config/          # Firebase config, system constants, color tokens
  contexts/        # AuthContext, NotificationContext, ThemeContext
  features/
    admin/         # Admin management, audit logs, approvals
    ai/            # VoltAI copilot service & chat view
    battery/       # VoltHealth state of health calculations
    charging/      # VoltMap, station details, compatibility engine
    homecharge/    # Residential charger installation flow
    maintenance/   # VoltCare service network
    notifications/ # System notifications & banner alerts
    partner/       # Partner station & charger dashboard
    sos/           # VoltSOS emergency assistance
    technician/    # Technician ticket workflow
    trips/         # Smart trip planning & range calculations
    vehicles/      # Garage, active vehicle switcher, catalog
  hooks/           # Custom React hooks (useAuth, useStations, useVehicle)
  layouts/         # Layout components for public, driver, partner, admin
  lib/             # Utility helpers, date formatters, calculations
  pages/           # Top-level page views mapping to routes
  services/        # External API abstractions (Maps, Routing, Weather, AI)
  types/           # TypeScript interfaces & types
```

---

## 34. State Management Strategy
- **Global Auth & Role State**: React Context (`AuthContext`)
- **Server Data & Real-time Feeds**: Custom hooks with Firestore `onSnapshot`
- **UI State (Modals, Filters, Tabs)**: Local React component state (`useState`, `useReducer`)

---

## 35. Error Handling Strategy
- React Error Boundaries wrap layout roots to prevent white-screen crashes.
- API service layers catch network failures and supply gracefully labeled fallbacks.
- User-facing Toast notifications report explicit actionable feedback.

---

## 36. Loading / Empty / Error States
- Every feature module implements dedicated skeleton loaders (`<LoadingState />`), clean illustration empty prompts (`<EmptyState />`), and retryable error cards (`<ErrorState />`).

---

## 37. Security Architecture
- Client-side route guards combined with Firestore Security Rules.
- Strict environment variable protection (no exposed secrets).
- Complete payload validation before Firestore write operations.

---

## 38. Performance Strategy
- Dynamic `React.lazy()` route splitting for Admin, Partner, and Technician portals.
- Debounced map bounds fetching and spatial marker clustering for high station counts.
- Optimized bundle sizes with Vite.

---

## 39. Accessibility Strategy
- WAI-ARIA labels on interactive icons and dynamic status indicators.
- Full keyboard tab-navigation support.
- WCAG AA compliant color contrast across light mode themes.
- Support for `prefers-reduced-motion`.

---

## 40. Testing Strategy
- Manual end-to-end integration walkthrough covering all user roles (Driver, Partner, Technician, Admin).
- Browser console zero-error audit.
- TypeScript static type checking.

---

## 41. Deployment Architecture
- **Frontend**: Firebase Hosting or Vercel with automated build pipelines.
- **Backend**: Firebase Cloud Infrastructure (Firestore & Auth).

---

## 42. Current Development Status
- **Phase**: VoltConnect 2.0 Final Logo Sizing Fix (`COMPLETE`)
- **Implemented**: Reduced cinematic intro logo width to `clamp(260px, 25vw, 360px)` (280–360px max width) with substantial negative space and 100% transparent background in `VoltConnectLogo.tsx`, increased navbar brand logo width to `clamp(120px, 10vw, 150px)` (145px width) in `Navbar.tsx`, eliminated all rectangular containers, zero-error production build (`npm run build`).
- **Next**: Ready for Next Phase Instructions.

---

## 43. Known Issues
- None.

---

## 44. Future Architecture / Planned Integrations
- Direct OCPP 1.6/2.0.1 Charging Station WebSockets gateway integration.
- Hardware OBD-II / CAN-bus live vehicle telemetry integration.
- Payment gateway integration for live charging session billing.

---

## LAST ARCHITECTURE UPDATE
- **Date**: 2026-08-23
- **Major Change**: VoltConnect 2.0 Final Logo Sizing Fix Complete.
- **Reason**: Distinct sizing contexts for IntroLogo (280-360px max width) and NavbarLogo (145px width).
- **Affected Modules**: `src/components/common/VoltConnectLogo.tsx`, `src/components/layout/Navbar.tsx`.


















































