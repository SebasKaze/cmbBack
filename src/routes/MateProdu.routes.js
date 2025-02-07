import { Router } from "express";

import { 
    cargaMaterial ,
    verMateriales,
    editarMaterial,
    cargaProducto,
    verProductos,
    editarProducto
} from "../controllers/MateProdu.controllers.js";

const router = Router();
// MATERIALS
router.post("/api/cargamateriales", cargaMaterial);
router.get("/api/verMateriales", verMateriales);
router.put("/api/editarmaterial/:id",editarMaterial);

//PRODUCTO
router.post("/api/cargaproducto", cargaProducto);
router.get("/api/verproductos", verProductos);
router.put("/api/editarproducto/:id",editarProducto);

export default router;

