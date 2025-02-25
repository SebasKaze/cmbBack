import { Router } from "express";

import {
    DatosGenerales,
    RegistroEmpresa,
    EnvioEmpresa,
    RegistroDomi,
    InfoDomi,
    RegistroUsuario,
    verDomi,
} from '../controllers/Datos.controllers.js'

const router = Router();

router.post("/api/datosGenerales", DatosGenerales); //Ver datos generales

router.post("/api/registros",RegistroEmpresa);//Registrar

router.get("/api/infoempre",EnvioEmpresa);//Ver Empresa

router.post("/api/registrosdomi",RegistroDomi);//Registrar Domicilio

router.get("/api/infodomi/:id_empresa",InfoDomi);//Informacion de domicilios

router.post("/api/registrousuario",RegistroUsuario);

router.post("/api/domicilios/verdomi",verDomi);



export default router;

