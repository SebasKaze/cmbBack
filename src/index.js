import express from 'express';
import {PORT}from './config.js';
import xlsx from "xlsx";
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

app.listen(PORT);
console.log('Puerto escuchando en', PORT);


