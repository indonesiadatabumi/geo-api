require('dotenv').config(); //
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Task Management API',
            version: '1.0.0',
            description: 'API documentation for managing tasks and teams',
        },
        servers: [
            {
                url: `http://${process.env.SERVER}:${process.env.PORT}`,
            },
        ],
        // components: {
        //     securitySchemes: {
        //         bearerAuth: {
        //             type: 'http',
        //             scheme: 'bearer',
        //             bearerFormat: 'JWT',
        //             description: 'Enter your bearer token in the format `Bearer <token>`'
        //         }
        //     }
        // },
        // security: [
        //     {
        //         bearerAuth: []
        //     }
        // ]
    },
    apis: ['./routers/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);

const app = express();

app.use(
    cors({
        origin: "http://localhost:3000", // Replace with your frontend URL
    })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());


const landPlotsRouters = require('./routers/LandPlotsRouter');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api/land-plots/', landPlotsRouters);
app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocs);
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${process.env.SERVER}:${PORT}`);
});