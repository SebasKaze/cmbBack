import { Router } from "express";

import {
    entradaMercancia,
    salidaMercancias,


} from '../controllers/procesos.controllers.js'

const router = Router();

router.get("/api/procesos/emercancias", entradaMercancia); //Mostrar entrada de mercancias

//router.get("/api/procesos/smercancias", salidaMercancias); //Mostrar entrada de mercancias

export default router;

