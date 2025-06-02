# Full-Stack Calorie Tracking Application

A comprehensive calorie tracking application built with React.js and AWS services, demonstrating modern cloud architecture patterns and best practices.

## 🏗️ Architecture Overview

This project consists of two main components:

1. **React Application** (root directory) - Built with AWS Amplify
2. **Infrastructure Code** (`infrastructure/`) - Separate AWS CDK project

### AWS Services Used

- **AWS Amplify** - Frontend hosting and backend orchestration
- **Amazon Cognito** - User authentication and session management
- **AWS Lambda** - Serverless API functions
- **Amazon API Gateway** - RESTful API endpoints
- **Amazon RDS (PostgreSQL)** - Relational database for food data
- **AWS Secrets Manager** - Secure credential storage
- **Amazon VPC** - Network isolation and security

## 🚀 Features

### Authentication & Session Management
- ✅ **AWS Cognito Integration** - Secure user authentication
- ✅ **Enhanced Session Management** - Auto-refresh and expiry monitoring
- ✅ **Error Handling** - Comprehensive authentication error management
- ✅ **User Session Indicators** - Real-time session status display

### API & Data Management
- ✅ **RESTful API** - Lambda functions with API Gateway
- ✅ **PostgreSQL Database** - RDS integration with connection pooling
- ✅ **Dynamic Data Fetching** - Real-time food calorie lookup
- ✅ **Error Recovery** - Retry logic and fallback mechanisms

### User Interface
- ✅ **Modern React UI** - Built with Vite for optimal performance
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **Real-time Feedback** - Loading states and error messages
- ✅ **Calorie Calculator** - Per-portion calorie calculations

## 📁 Project Structure

```
full-calorie-tracking-app/
├── src/                           # React application source code
│   ├── components/                # React components
│   ├── hooks/                     # Custom React hooks
│   ├── services/                  # API client and services
│   └── contexts/                  # React context providers
├── amplify/                       # Amplify backend configuration
│   ├── auth/                      # Cognito authentication setup
│   ├── data/                      # Database schema and configuration
│   └── functions/                 # Lambda function code
├── public/                        # Static assets
├── infrastructure/                # Separate CDK infrastructure codebase
│   ├── lib/                       # CDK stack definitions
│   ├── bin/                       # CDK app entry point
│   └── README.md                  # Infrastructure documentation
├── docs/                          # Project documentation
│   ├── architecture-diagram.md    # System architecture
│   └── code-snippets.md          # Key implementation examples
├── package.json                   # React app dependencies
└── README.md                      # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- Git

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Cole-Sathngam/full-calorie-tracking-app.git
   cd full-calorie-tracking-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Deploy the Amplify backend:**
   ```bash
   npx amplify sandbox
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:5173](http://localhost:5173) in your browser

### Infrastructure Deployment (Optional)

The separate CDK infrastructure is provided for demonstration purposes:

```bash
cd infrastructure
npm install
npm run build
cdk deploy
```

## 🔧 Configuration

### Environment Variables

The application uses AWS Amplify configuration files:

- `amplify_outputs.json` - Generated automatically by Amplify
- Environment variables are managed through AWS Secrets Manager

### Database Setup

The PostgreSQL database is automatically configured with the following schema:

```sql
CREATE TABLE food_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  calories INTEGER NOT NULL
);
```

## 📊 Key Implementation Highlights

### 1. AWS Cognito Authentication

```typescript
// Enhanced authentication hook with session management
export const useEnhancedAuth = () => {
  const amplifyAuth = useAuthenticator();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isValid: false,
    expiresAt: null,
    timeUntilExpiry: null,
    isExpiringSoon: false
  });
  
  // Auto-refresh logic and session monitoring
  // ... implementation details
};
```

### 2. RESTful API with Lambda

```typescript
// Lambda function handler with PostgreSQL integration
export const handler: APIGatewayProxyHandler = async (event) => {
  const client = await initializePostgreSQLClient();
  
  if (method === 'GET' && path === '/foods') {
    const result = await client.query('SELECT * FROM food_items');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, data: result.rows })
    };
  }
  // ... additional endpoints
};
```

### 3. API Client with Error Handling

```typescript
// Robust API client with retry logic
export class ApiClient {
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const apiError = this.handleApiError(error, operationName);
      
      if (apiError.retryable && retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.executeWithRetry(operation, operationName, retryCount + 1);
      }
      
      throw apiError;
    }
  }
}
```

## 🔒 Security Features

- **Authentication**: AWS Cognito with email verification
- **Authorization**: JWT tokens with automatic refresh
- **Database Security**: RDS in private subnets with security groups
- **API Security**: CORS configuration and input validation
- **Secrets Management**: AWS Secrets Manager for database credentials

## 🎯 Assessment Requirements Compliance

### ✅ Core Requirements Met

1. **AWS Amplify Integration** - React app with Amplify backend
2. **AWS Cognito Authentication** - User authentication and session management
3. **RESTful API** - Lambda functions with API Gateway
4. **PostgreSQL Database** - RDS integration with proper schema
5. **Form-based Calorie Lookup** - Interactive UI for food search
6. **Error Handling** - Comprehensive error management and recovery

### ✅ Additional Requirements Met

1. **Separate CDK Codebase** - Independent infrastructure project
2. **GitHub Repository** - Well-documented with clear instructions
3. **Infrastructure Diagram** - Visual architecture representation
4. **Code Snippets** - Demonstrating AWS service integration

## 📈 Performance & Scalability

- **Serverless Architecture** - Auto-scaling Lambda functions
- **Connection Pooling** - Efficient database connections
- **Caching Strategy** - Client-side caching with retry logic
- **Error Recovery** - Graceful degradation and fallback mechanisms

## 🧪 Testing

Run the test suite:

```bash
cd calorie-tracking-app
npm test
```

## 📚 Documentation

- [Architecture Diagram](docs/architecture-diagram.md)
- [Code Snippets](docs/code-snippets.md)
- [Infrastructure README](calorie-api-infrastructure/README.md)
- [API Documentation](calorie-tracking-app/docs/api.md)

## 🚀 Deployment

### Production Deployment

1. **Amplify Hosting:**
   ```bash
   npx amplify add hosting
   npx amplify publish
   ```

2. **Custom Domain (Optional):**
   Configure through AWS Amplify Console

### Infrastructure as Code

The CDK infrastructure can be deployed independently:

```bash
cd calorie-api-infrastructure
cdk deploy --all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For questions or issues:

1. Check the [documentation](docs/)
2. Review existing [issues](https://github.com/your-username/full-calorie-tracking-app/issues)
3. Create a new issue with detailed information

## 🎬 Demo Video

[Link to Loom video explaining the project, design choices, and implementation details]

---

**Built with ❤️ using AWS Amplify, React, and modern cloud architecture patterns.** 