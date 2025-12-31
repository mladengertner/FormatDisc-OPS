import { ArtifactType, OPSMapping } from './types';

export const STATUS_CONFIG = {
  Functional: { color: 'bg-green-500', pulse: false, label: 'Verified' },
  'In Progress': { color: 'bg-yellow-500', pulse: true, label: 'Staging' },
  Pending: { color: 'bg-zinc-700', pulse: false, label: 'Backlog' },
} as const;

export const INITIAL_MAPPINGS: OPSMapping[] = [
  {
    id: 'map-001',
    blueprintId: 'bp-checkout-01',
    artifact: {
      id: 'art-001',
      type: ArtifactType.USER_JOURNEY,
      title: 'E-commerce Checkout Flow',
      content: '1. Cart Review -> 2. Shipping Details -> 3. Payment Processing -> 4. Order Confirmation',
      status: 'Verified'
    },
    component: {
      id: 'sim-001',
      title: 'Interactive Checkout Stepper',
      description: 'A multi-step UI handling state transitions and data persistence.',
      technology: 'React Hooks + Tailwind',
      verificationCriteria: 'Korisnik može proći kroz sve korake bez praznina u logici.',
      simulationStatus: 'Functional',
      lastVerified: '2025-05-20T10:00:00Z',
      verifierId: 'slavko-auditor-01'
    },
    disclosureNote: 'UI state is managed in-memory; persistent database storage is simulated via localized state persistence.',
    selectedForAudit: true,
    complexityScore: 2,
    tags: ['ui', 'flow']
  },
  {
    id: 'map-002',
    blueprintId: 'bp-schema-01',
    artifact: {
      id: 'art-002',
      type: ArtifactType.DATA_MODEL,
      title: 'Order & Transaction Schema',
      content: 'Defines the relationship between User(UUID), Product(UUID), Order(UUID), and Transaction(UUID).',
      codeSnippet: `interface Order {\n  id: UUID;\n  userId: UUID;\n  items: OrderItem[];\n  total: number;\n  tax: number;\n  createdAt: ISOString;\n}`,
      status: 'Finalized'
    },
    component: {
      id: 'sim-002',
      title: 'UUID Data Generator',
      description: 'Generates mock relational data with persistent integrity.',
      technology: 'Crypto API / UUID v4',
      verificationCriteria: 'Svaki entitet ima jedinstven ID; relacijski integritet očuvan kroz korake.',
      simulationStatus: 'Functional'
    },
    disclosureNote: 'Schemas are validated against TypeScript interfaces, but no relational database (SQL) is used in this environment.',
    complexityScore: 3,
    tags: ['data', 'integrity']
  },
  {
    id: 'map-003',
    blueprintId: 'bp-logic-01',
    artifact: {
      id: 'art-003',
      type: ArtifactType.BUSINESS_RULES,
      title: 'Taxation & Discount Logic',
      content: 'Calculate 20% VAT on subtotal. Apply $10 coupon if subtotal > $100.',
      codeSnippet: `const calcTotal = (subtotal) => {\n  const tax = subtotal * 0.20;\n  const discount = subtotal > 100 ? 10 : 0;\n  return subtotal + tax - discount;\n}`,
      status: 'Verified'
    },
    component: {
      id: 'sim-003',
      title: 'Real-time Total Calculator',
      description: 'Dynamic arithmetic engine for VAT and discounts.',
      technology: 'JS Pure Functions',
      verificationCriteria: 'Promjena količine → automatski preračun ukupnog iznosa prema specifikaciji.',
      simulationStatus: 'Functional'
    },
    disclosureNote: 'Mathematical logic is production-ready pure functions; rounding edge cases are handled for demo purposes.',
    complexityScore: 1,
    tags: ['logic', 'math']
  },
  {
    id: 'map-004',
    blueprintId: 'bp-api-01',
    artifact: {
      id: 'art-004',
      type: ArtifactType.API_SPEC,
      title: 'Payment Gateway Integration',
      content: 'POST /api/v1/payments. Expected response: { transactionId: UUID, status: "success" | "failed" }',
      status: 'Finalized'
    },
    component: {
      id: 'sim-004',
      title: 'API Latency Simulator',
      description: 'Simulates network delay and server-side validation.',
      technology: 'Async/Await + Timeouts',
      verificationCriteria: 'Prikaz loading spinnera i simulirana latencija prije prikaza rezultata plaćanja.',
      simulationStatus: 'Functional'
    },
    disclosureNote: 'Real-world network jitter is simulated; however, no external 3rd party PSP is called.',
    complexityScore: 4,
    tags: ['api', 'network']
  },
  {
    id: 'map-005',
    blueprintId: 'bp-auth-01',
    artifact: {
      id: 'art-005',
      type: ArtifactType.API_SPEC,
      title: 'User Authentication API',
      content: 'Specification for Identity Management endpoints: POST /auth/login for credential exchange, POST /auth/logout for session termination, and POST /auth/refresh-token for access extension.',
      codeSnippet: `POST /api/v1/auth/login\nHeader: Content-Type: application/json\nBody: { "email": "user@ops.com", "password": "***" }\nResponse: 200 OK { "accessToken": "jwt.eyJ...", "expiresIn": 3600 }`,
      status: 'Finalized'
    },
    component: {
      id: 'sim-005',
      title: 'Identity Provider Mock',
      description: 'Simulates the issuing and verification of JWT bearer tokens.',
      technology: 'Express.js Mock',
      verificationCriteria: 'Uspješna prijava vraća validan JWT token; neuspješna vraća 401 Unauthorized.',
      simulationStatus: 'Pending'
    },
    disclosureNote: 'Authentication flow is fully simulated; tokens are structurally valid JWTs but not signed by a production CA.',
    complexityScore: 4,
    tags: ['api', 'security', 'auth']
  },
  {
    id: 'map-006',
    blueprintId: 'bp-auth-kernel-01',
    artifact: {
      id: 'art-006',
      type: ArtifactType.API_SPEC,
      title: 'User Authentication API',
      content: 'Endpoints for login (credential exchange), logout (session termination), and token refresh (access extension). Critical for Phase 3 kernel access.',
      codeSnippet: `POST /auth/login\nPayload: { "username": "admin", "secret": "***" }\nResponse: { "token": "jwt_v13", "expires": 3600 }`,
      status: 'Draft'
    },
    component: {
      id: 'sim-006',
      title: 'Kernel Auth Gateway',
      description: 'Orchestrates identity verification against the SlavkoKernel user registry.',
      technology: 'SlavkoKernel v13.0 / JWT',
      verificationCriteria: 'Validates cryptographic signatures on all issued tokens.',
      simulationStatus: 'Pending'
    },
    disclosureNote: 'Required for Phase 3: SlavkoKernel Orchestration.',
    complexityScore: 5,
    tags: ['kernel', 'auth', 'critical']
  }
];