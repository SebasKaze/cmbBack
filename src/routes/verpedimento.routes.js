import { Router } from "express";

import {
    verPedimento,
    entradaMercancia
} from '../controllers/verpedimento.controllers.js'

const router = Router();

router.get("/api/verpedimento", verPedimento); //Mostrar cosas en pedimentos

router.get("/api/entradamercancia", entradaMercancia ); //Mostrar Entrada de mercancia



export default router;

