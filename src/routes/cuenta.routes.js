import { Router } from "express";

import { 
    loginCuenta,
    EnvioContacto,
    verifyToken
} from '../controllers/cuenta.controllers.js'

const router = Router();
//Login
router.post("/login", loginCuenta);

router.post("/contacto",EnvioContacto)

export default router;