import { Router } from "express";

import {
    envioPedimento
} from '../controllers/pedimento.controllers.js'

const router = Router();

router.post("/api/cmpedimento", envioPedimento);

export default router;

