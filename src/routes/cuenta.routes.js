import { Router } from "express";

import { 
    loginCuenta,
    verifyToken
} from '../controllers/cuenta.controllers.js'

const router = Router();
//Login
router.post("/login", loginCuenta);

export default router;