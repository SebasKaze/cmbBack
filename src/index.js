import express from 'express';
import {PORT}from './config.js';
import cuentaRoutes from './routes/cuenta.routes.js';
import morgan from 'morgan';
import cors from "cors";


const app = express();

// Configuración de CORS
/*
const corsOptions = {
    origin: "http://localhost:4000", // Cambia esto a la URL de tu frontend
    methods: ["GET", "POST"],
    credentials: true, // Permite el uso de cookies o autenticación
};
*/
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());  //middleware para procesar JSON
app.use(cuentaRoutes);





app.listen(PORT);
console.log('Puerto escuchando en', PORT);


