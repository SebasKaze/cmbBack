import { Router } from "express";
import { verifyToken } from '../controllers/cuenta.controllers.js';
import {
    verPedimento,
    activoFijo,
    verDomicilios,
    consultaPedimento,
    pedimentoAf,
} from '../controllers/verpedimento.controllers.js'
const router = Router();

router.get("/api/verpedimento", verPedimento); // Mostrar cosas en pedimentos

router.get("/api/activofijo",activoFijo);

router.get("/api/verDomicilios", verDomicilios ); //Mostrar domicilios

router.get("/api/consultaPedimento/:no_pedimento", consultaPedimento); // Consultar pedimento por no_pedimento

router.get("/api/pedimentoAf/activofijo", pedimentoAf);
export default router;