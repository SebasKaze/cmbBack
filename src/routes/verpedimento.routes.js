import { Router } from "express";

import {
    verPedimento,
    activoFijo,
    verDomicilios,
    consultaPedimento,
    crearActivoFijo,
    pedimentoActivofijo,
} from '../controllers/verpedimento.controllers.js'

const router = Router();

router.get("/api/verpedimento", verPedimento); // Mostrar cosas en pedimentos

router.get("/api/activofijo",activoFijo);
router.get("/api/pedimentos/activofijo",pedimentoActivofijo);

router.post("/api/crearaf", crearActivoFijo);

router.get("/api/verDomicilios", verDomicilios ); //Mostrar domicilios

router.get("/api/consultaPedimento/:no_pedimento", consultaPedimento); // Consultar pedimento por no_pedimento

export default router;