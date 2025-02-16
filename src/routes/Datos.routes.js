import { Router } from "express";

import {
    DatosGenerales,
    RegistroEmpresa,
} from '../controllers/Datos.controllers.js'

const router = Router();

router.post("/api/datosGenerales", DatosGenerales); //Ver datos generales

router.post("/api/registros",RegistroEmpresa);//Registrar empresa


export default router;

