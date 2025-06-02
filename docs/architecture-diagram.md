# Architecture Diagram - Calorie Tracking Application

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 USER INTERFACE                                  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        React Application                                │   │
│  │                     (Vite + TypeScript)                                │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │   Auth Hook     │  │  API Client     │  │  UI Components  │        │   │
│  │  │ (useEnhanced    │  │ (Error Handling │  │ (Form, Display) │        │   │
│  │  │     Auth)       │  │  & Retry Logic) │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTPS
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AWS AMPLIFY HOSTING                                │
│                          (Static Site + CI/CD)                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ API Calls
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            AUTHENTICATION LAYER                                │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        Amazon Cognito                                   │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │   User Pool     │  │  User Pool      │  │  JWT Tokens     │        │   │
│  │  │   (Users &      │  │   Client        │  │  (Access &      │        │   │
│  │  │  Passwords)     │  │ (Web Config)    │  │   Refresh)      │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Authenticated Requests
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                API GATEWAY                                      │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      Amazon API Gateway                                 │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │  REST API       │  │  CORS Config    │  │  Rate Limiting  │        │   │
│  │  │  Endpoints      │  │  (Cross-Origin  │  │  & Throttling   │        │   │
│  │  │  (/foods)       │  │   Requests)     │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Lambda Invocation
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              COMPUTE LAYER                                     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        AWS Lambda                                       │   │
│  │                     (Node.js 18.x)                                     │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │  API Handler    │  │  PostgreSQL     │  │  Error Handling │        │   │
│  │  │  (CRUD Ops)     │  │  Client (pg)    │  │  & Logging      │        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ VPC Connection
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NETWORK LAYER                                      │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           Amazon VPC                                    │    │
│  │                                                                         │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │    │
│  │  │  Public Subnet  │  │ Private Subnet  │  │ Isolated Subnet │          │    │
│  │  │  (NAT Gateway)  │  │  (Lambda Funcs) │  │  (RDS Database) │          │    │
│  │  │                 │  │                 │  │                 │          │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘          │    │
│  │                                                                         │    │
│  │  ┌─────────────────┐  ┌─────────────────┐                               │    │
│  │  │ Security Groups │  │  Network ACLs   │                               │    │
│  │  │ (Port 5432)     │  │ (Subnet Rules)  │                               │    │
│  │  └─────────────────┘  └─────────────────┘                               │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Database Connection
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               DATA LAYER                                       │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      Amazon RDS PostgreSQL                              │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │  food_items     │  │  Automated      │  │  Multi-AZ       │        │   │
│  │  │  Table          │  │  Backups        │  │  Deployment     │        │   │
│  │  │  (id, name,     │  │  (7 days)       │  │  (Optional)     │        │   │
│  │  │   calories)     │  │                 │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Credential Management
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             SECURITY LAYER                                     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      AWS Secrets Manager                                │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │  DB Credentials │  │  Connection     │  │  Automatic      │        │   │
│  │  │  (Username &    │  │  String         │  │  Rotation       │        │   │
│  │  │   Password)     │  │  (Full URI)     │  │  (Optional)     │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
User Action → React App → Cognito Auth → API Gateway → Lambda → RDS PostgreSQL
     ↑                                                              │
     └─────────────── Response Data ←─────────────────────────────────┘
```

## Component Interactions

### 1. User Authentication Flow
```
1. User enters credentials in React app
2. React app calls AWS Cognito via Amplify SDK
3. Cognito validates credentials and returns JWT tokens
4. Tokens are stored and managed by enhanced auth hook
5. Auto-refresh mechanism monitors token expiry
```

### 2. API Request Flow
```
1. User submits food search form
2. React app calls API client with search term
3. API client adds authentication headers (JWT token)
4. Request sent to API Gateway endpoint
5. API Gateway validates request and invokes Lambda
6. Lambda function connects to RDS via VPC
7. PostgreSQL query executed with search parameters
8. Results returned through the chain back to user
```

### 3. Error Handling Flow
```
1. Error occurs at any layer (Network, Auth, API, Database)
2. Error is caught and classified by type
3. Retry logic applied for retryable errors
4. User-friendly error message displayed
5. Fallback data provided when appropriate
```

## Security Architecture

### Network Security
- **VPC Isolation**: Database in isolated subnets with no internet access
- **Security Groups**: Restrictive rules allowing only necessary traffic
- **NAT Gateway**: Controlled internet access for Lambda functions

### Authentication & Authorization
- **Cognito User Pool**: Centralized user management
- **JWT Tokens**: Stateless authentication with automatic refresh
- **IAM Roles**: Least-privilege access for Lambda functions

### Data Security
- **Secrets Manager**: Encrypted storage of database credentials
- **TLS/SSL**: All communications encrypted in transit
- **VPC Endpoints**: Private communication between AWS services

## Scalability Considerations

### Auto-Scaling Components
- **Lambda Functions**: Automatic scaling based on request volume
- **API Gateway**: Built-in scaling and rate limiting
- **RDS**: Can be configured for read replicas and Multi-AZ

### Performance Optimizations
- **Connection Pooling**: Efficient database connections in Lambda
- **Caching**: Client-side caching with TTL
- **CDN**: Amplify hosting with global edge locations

## Monitoring & Observability

### AWS CloudWatch Integration
- **Lambda Logs**: Function execution logs and metrics
- **API Gateway Metrics**: Request/response times and error rates
- **RDS Monitoring**: Database performance and connection metrics

### Error Tracking
- **Structured Logging**: Consistent log format across services
- **Error Classification**: Categorized error types for better handling
- **Retry Metrics**: Success/failure rates for retry operations

## Cost Optimization

### Serverless Architecture Benefits
- **Pay-per-Use**: Lambda functions only charged for execution time
- **No Idle Costs**: No charges when application is not in use
- **Managed Services**: Reduced operational overhead

### Resource Sizing
- **t3.micro RDS**: Cost-effective for development/testing
- **Lambda Memory**: Optimized for performance vs. cost
- **Single NAT Gateway**: Balanced availability and cost

This architecture demonstrates modern cloud-native patterns with proper separation of concerns, security best practices, and scalability considerations. 