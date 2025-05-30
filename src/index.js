import express from 'express';
import {PORT}from './config.js';
import xlsx from "xlsx";
import { pool } from './db.js';
import cuentaRoutes from './routes/cuenta.routes.js';
import pedimentos from './routes/pedimento.routes.js';
import verPedimentos from './routes/verpedimento.routes.js';
import MateProductos from './routes/MateProdu.routes.js';
import Datos from './routes/Datos.routes.js';
import Procesos from './routes/procesos.routes.js';
import Reportes from './routes/reportes.routes.js';
import http from 'http'; // 🧩
import { initWebSocket } from './socketManager.js';


import morgan from 'morgan';
import cors from "cors";
import multer from "multer";
import fs from 'node:fs';



export const upload = multer({dest: 'uploads/'});
const app = express();

const server = http.createServer(app);

initWebSocket(server); 


// Configuración de CORS
app.use(cors({
    origin: 'https://smcontrollerff.onrender.com', // O '*', solo para pruebas
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // solo si usas cookies o headers de auth
}));
app.options('*', cors());
app.get('/', (req, res) => {
    res.json({ status: 'running', message: 'Backend service is up' });
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});
app.use(morgan('dev'));
app.use(express.json());  //middleware para procesar JSON
app.use(cuentaRoutes);  //Cuentas y login
app.use(pedimentos);     //Informacion sobre pedimentos
app.use(verPedimentos); //Pestaña de Pedimentos
app.use(MateProductos); //Materiales
app.use(Datos); // Ver datos Generales y domicilios
app.use(Procesos);// Pestaña de procesos
app.use(Reportes);//Generar los reportes
/*
// Cargar y leer el archivo XLSX
let tigieData = [];
const cargarExcel = () => {
    const workbook = xlsx.readFile("./src/docs/TIGIE.xlsx"); // Cargar el archivo Excel
    const sheetName = workbook.SheetNames[0]; // Seleccionar la primera hoja
    const sheet = workbook.Sheets[sheetName]; // Obtener los datos de la hoja

    // Convertir la hoja a JSON
    const data = xlsx.utils.sheet_to_json(sheet);

    // Extraer solo las columnas necesarias (Código TIGIE y Descripción TIGIE)
    tigieData = data.map(entry => ({
        codigo: entry["Código TIGIE"], 
        descripcion: entry["Descripción TIGIE"]
    }));
};
// Cargar los datos al iniciar el servidor
cargarExcel();
// Ruta para buscar por código TIGIE o descripción
app.get("/api/cargamateriales/fracciones", (req, res) => {
    console.log("Petición recibida:", req.query); // Depuración
    const { query } = req.query;
    if (!query) return res.json({ error: "Debe proporcionar un término de búsqueda" });

    const resultado = tigieData.filter(item =>
        (item.codigo && item.codigo.toString().includes(query)) || 
        (item.descripcion && item.descripcion.toLowerCase().includes(query.toLowerCase()))
    );

    res.json(resultado);
});
ENVIO DE DOCUMENTOS
*/

//Ruta para subir imagenes 
app.post('/api/pedimentos/subirarc/subir',upload.array('documentos',10), (req,res) => {
    req.files.map(nombreDoc);
    res.send('Si efectivamente')
})
function nombreDoc(file){
    const newPath = `uploads/${file.originalname}`;
    fs.renameSync(file.path, newPath);
    return newPath;
}
app.get('/test-db', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW()');
      res.json({ success: true, time: result.rows[0] });
    } catch (err) {
      console.error('Fallo de conexión a la BD:', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });
const PORT_ENV = process.env.PORT || PORT;
app.listen(PORT_ENV, () => {
    console.log(`Servidor escuchando en el puerto ${PORT_ENV}`);
});



