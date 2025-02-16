import { Router } from "express";

import {
    verPedimento,
    entradaMercancia,
    activoFijo
} from '../controllers/verpedimento.controllers.js'

const router = Router();

router.get("/api/verpedimento", verPedimento); //Mostrar cosas en pedimentos

router.get("/api/entradamercancia", entradaMercancia ); //Mostrar Entrada de mercancia

router.post("/api/activofijo",activoFijo);

export default router;

