import { Router } from "express";

import {
    DatosGenerales,
    RegistroEmpresa,
    EnvioEmpresa,
    RegistroDomi,
    InfoDomi,
    RegistroUsuario,
    verDomi,
} from '../controllers/Datos.controllers.js';

import { verifyToken } from '../controllers/cuenta.controllers.js';
import { allowOnlyTipo1 } from '../controllers/cuenta.controllers.js';

const router = Router();

// Rutas protegidas con verificación de token
router.post("/api/registros", verifyToken, allowOnlyTipo1, RegistroEmpresa);
router.post("/api/registrosdomi", verifyToken, allowOnlyTipo1, RegistroDomi);
router.post("/api/registrousuario", verifyToken, allowOnlyTipo1, RegistroUsuario);

// Rutas públicas o de consulta
router.post("/api/datosGenerales", DatosGenerales); // Ver datos generales
router.get("/api/infoempre", EnvioEmpresa); // Ver empresas
router.get("/api/infodomi/:id_empresa", InfoDomi); // Ver información de domicilios
router.post("/api/domicilios/verdomi", verDomi); // Ver domicilios

export default router;
