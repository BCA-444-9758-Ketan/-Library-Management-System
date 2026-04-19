const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Library API',
      version: '1.0.0',
      description: 'Distributed Library Management System - CIMAGE Hackathon 2026',
      contact: {
        name: 'CIMAGE College Patna',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
