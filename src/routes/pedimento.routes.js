import { Router } from "express";
import {
    envioPedimento,
    editarPedimento  // Importamos el nuevo controlador
} from '../controllers/pedimento.controllers.js';

const router = Router();

// Ruta para enviar un pedimento
router.post("/api/cmpedimento", envioPedimento);

// Nueva ruta para editar un pedimento
router.post("/api/edicionPedimento", editarPedimento);

export default router;