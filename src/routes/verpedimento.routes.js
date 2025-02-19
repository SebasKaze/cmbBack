import { Router } from "express";

import {
    verPedimento,
    entradaMercancia,
    verDomicilios
} from '../controllers/verpedimento.controllers.js'

const router = Router();

router.get("/api/verpedimento", verPedimento); //Mostrar cosas en pedimentos

router.get("/api/entradamercancia", entradaMercancia ); //Mostrar Entrada de mercancia

router.get("/api/verDomicilios", verDomicilios ); //Mostrar domicilios

export default router;

