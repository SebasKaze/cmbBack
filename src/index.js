import express from 'express';
import http from 'http'; // 🧩
import { PORT } from './config.js';
import xlsx from "xlsx";
import cuentaRoutes from './routes/cuenta.routes.js';
import pedimentos from './routes/pedimento.routes.js';
import verPedimentos from './routes/verpedimento.routes.js';
import MateProductos from './routes/MateProdu.routes.js';
import Datos from './routes/Datos.routes.js';
import Procesos from './routes/procesos.routes.js';
import { initWebSocket } from './socketManager.js';
import morgan from 'morgan';
import cors from "cors";
import multer from "multer";

const app = express();
const server = http.createServer(app);

initWebSocket(server); 

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(cuentaRoutes);
app.use(pedimentos);
app.use(verPedimentos);
app.use(MateProductos);
app.use(Datos);
app.use(Procesos);

let tigieData = [];

const cargarExcel = () => {
    const workbook = xlsx.readFile("./src/docs/TIGIE.xlsx");
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    tigieData = data.map(entry => ({
        codigo: entry["Código TIGIE"], 
        descripcion: entry["Descripción TIGIE"]
    }));
};

cargarExcel();

app.get("/api/cargamateriales/fracciones", (req, res) => {
    console.log("Petición recibida:", req.query);
    const { query } = req.query;
    if (!query) return res.json({ error: "Debe proporcionar un término de búsqueda" });

    const resultado = tigieData.filter(item =>
        (item.codigo && item.codigo.toString().includes(query)) || 
        (item.descripcion && item.descripcion.toLowerCase().includes(query.toLowerCase()))
    );

    res.json(resultado);
});

server.listen(PORT, () => {
    console.log('Servidor HTTP + WebSocket escuchando en', PORT);
});
