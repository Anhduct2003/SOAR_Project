const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Security Incident Response API',
      version: '1.0.0',
      description: `
# Security Incident Response System API

Comprehensive API for managing security incidents, user authentication, and system monitoring.

## Features
- 🔐 JWT Authentication & Authorization
- 🚨 Security Incident Management  
- 👥 User & Role Management
- 📊 Dashboard Analytics
- 🔔 Alert System
- 🔍 Elasticsearch Integration

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## User Roles
- **admin**: Full system access
- **analyst**: Manage incidents and view analytics  
- **viewer**: Read-only access

## Test Credentials
- Email: \`admin@security.local\`
- Password: \`admin123\`
      `,
      contact: {
        name: 'Security Team',
        email: 'security@company.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server'
      },
      {
        url: 'https://api.security.company.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'password', 'firstName', 'lastName'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier'
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
              description: 'Username (unique)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address (unique)'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Password (hashed in database)'
            },
            firstName: {
              type: 'string',
              maxLength: 50,
              description: 'First name'
            },
            lastName: {
              type: 'string',
              maxLength: 50,
              description: 'Last name'
            },
            role: {
              type: 'string',
              enum: ['admin', 'analyst', 'viewer'],
              default: 'viewer',
              description: 'User role'
            },
            department: {
              type: 'string',
              maxLength: 100,
              description: 'Department'
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Account status'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            }
          }
        },
        Incident: {
          type: 'object',
          required: ['title', 'description', 'severity', 'category'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier'
            },
            title: {
              type: 'string',
              maxLength: 200,
              description: 'Incident title'
            },
            description: {
              type: 'string',
              description: 'Detailed incident description'
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              description: 'Incident severity level'
            },
            status: {
              type: 'string',
              enum: ['open', 'investigating', 'contained', 'resolved', 'closed'],
              default: 'open',
              description: 'Current incident status'
            },
            category: {
              type: 'string',
              enum: [
                'malware', 'phishing', 'data_breach', 'ddos', 
                'insider_threat', 'physical_security', 'network_intrusion',
                'web_application', 'social_engineering', 'other'
              ],
              description: 'Incident category'
            },
            source: {
              type: 'string',
              enum: ['manual', 'automated', 'external', 'user_report'],
              default: 'manual',
              description: 'How the incident was detected'
            },
            affectedSystems: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of affected systems'
            },
            affectedUsers: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of affected users'
            },
            ipAddresses: {
              type: 'array',
              items: {
                type: 'string',
                format: 'ipv4'
              },
              description: 'Related IP addresses'
            },
            detectedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the incident was detected'
            },
            reportedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the incident was reported'
            },
            resolvedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the incident was resolved'
            },
            assignedTo: {
              type: 'string',
              description: 'ID of assigned analyst'
            },
            createdBy: {
              type: 'string',
              description: 'ID of user who created the incident'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        },
        DashboardStats: {
          type: 'object',
          properties: {
            overview: {
              type: 'object',
              properties: {
                totalIncidents: {
                  type: 'integer',
                  description: 'Total number of incidents'
                },
                openIncidents: {
                  type: 'integer',
                  description: 'Number of open incidents'
                },
                investigatingIncidents: {
                  type: 'integer',
                  description: 'Number of incidents under investigation'
                },
                containedIncidents: {
                  type: 'integer',
                  description: 'Number of contained incidents'
                },
                resolvedIncidents: {
                  type: 'integer',
                  description: 'Number of resolved incidents'
                },
                closedIncidents: {
                  type: 'integer',
                  description: 'Number of closed incidents'
                },
                recentIncidents: {
                  type: 'integer',
                  description: 'Incidents in last 24 hours'
                },
                todayIncidents: {
                  type: 'integer',
                  description: 'Incidents created today'
                },
                avgResolutionTime: {
                  type: 'number',
                  description: 'Average resolution time in hours'
                }
              }
            },
            severity: {
              type: 'object',
              properties: {
                low: { type: 'integer' },
                medium: { type: 'integer' },
                high: { type: 'integer' },
                critical: { type: 'integer' }
              }
            },
            categories: {
              type: 'object',
              additionalProperties: {
                type: 'integer'
              },
              description: 'Incident counts by category'
            },
            trends: {
              type: 'object',
              properties: {
                last24Hours: {
                  type: 'integer',
                  description: 'Incidents in last 24 hours'
                },
                today: {
                  type: 'integer',
                  description: 'Incidents today'
                }
              }
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            token: {
              type: 'string',
              description: 'JWT authentication token'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object'
            },
            error: {
              type: 'string'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Detailed error information'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management (Admin only)'
      },
      {
        name: 'Incidents',
        description: 'Security incident management'
      },
      {
        name: 'Dashboard',
        description: 'Dashboard statistics and analytics'
      },
      {
        name: 'Alerts',
        description: 'Security alerts management'
      },
      {
        name: 'Elasticsearch',
        description: 'Elasticsearch integration'
      },
      {
        name: 'System',
        description: 'System health and monitoring'
      }
    ]
  },
  apis: [
    './routes/*.js', 
    './server.js',
    './docs/swagger-*.js'
  ], // Paths to files containing OpenAPI definitions
};

const specs = swaggerJSDoc(options);

module.exports = specs;
