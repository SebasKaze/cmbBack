import { Router } from "express";

import {
    entradaMercancia,
    salidaMercancias,
    salidaMercanciasFracciones,
    mateCargaProducto,
    mateCargaMeteriales,
    mateCargaGuardar,
    mateUtilizados,
    saldoMuestra


} from '../controllers/procesos.controllers.js'

const router = Router();

router.get("/api/procesos/emercancias", entradaMercancia); //Mostrar entrada de mercancias

router.get("/api/procesos/smercancias", salidaMercancias); //Mostrar entrada de mercancias

router.get("/api/procesos/smercancias/fracciones", salidaMercanciasFracciones); //Mostrar entrada de mercancias

router.get("/api/procesos/mateutili/cargaproducto", mateCargaProducto); //Cargar productos de materiales utilizados

router.get("/api/procesos/mateutili/cargamateriales", mateCargaMeteriales); //Hacer la consulta de materiales para materiales utilizados

router.post("/api/procesos/mateutili/guardar", mateCargaGuardar); //Guardar material utilizado

router.get("/api/procesos/mateutili", mateUtilizados); //Hacer la consulta de Materiales Utilizados

router.get("/api/procesos/saldoMuestra", saldoMuestra); //Mostrar el saldo actual

export default router;

