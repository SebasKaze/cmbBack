import express from 'express';
import {PORT}from './config.js';
import cuentaRoutes from './routes/cuenta.routes.js';
import pedimentos from './routes/pedimento.routes.js';
import verPedimentos from './routes/verpedimento.routes.js';
import MateProductos from './routes/MateProdu.routes.js';
import morgan from 'morgan';
import cors from "cors";


const app = express();

// Configuración de CORS

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());  //middleware para procesar JSON
app.use(cuentaRoutes);  //Cuentas y login
app.use(pedimentos);     //Informacion sobre pedimentos
app.use(verPedimentos); //Pestaña de Pedimentos
app.use(MateProductos); //Materiales



app.listen(PORT);
console.log('Puerto escuchando en', PORT);


