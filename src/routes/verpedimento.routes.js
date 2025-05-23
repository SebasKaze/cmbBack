import { Router } from "express";

import {
    verPedimento,
    activoFijo,
    verDomicilios,
    consultaPedimento,
} from '../controllers/verpedimento.controllers.js'
import { verifyToken } from '../controllers/cuenta.controllers.js';
const router = Router();

router.get("/api/verpedimento", verPedimento); // Mostrar cosas en pedimentos

router.get("/api/activofijo",activoFijo);

router.get("/api/verDomicilios", verDomicilios ); //Mostrar domicilios

router.get("/api/consultaPedimento/:no_pedimento", consultaPedimento); // Consultar pedimento por no_pedimento

export default router;