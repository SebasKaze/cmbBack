import { Router } from "express";

import { 
    cargaMaterial ,
    verMateriales

} from "../controllers/MateProdu.controllers.js";

const router = Router();

router.post("/api/cargamateriales", cargaMaterial);

router.get("/api/verMateriales", verMateriales);

//Consulta a Apu se va de los Simpson, para fracciones 
router.get('/api/cargamateriales/fracciones', async (req, res) => {
    try {
        const { keyword } = req.query;  // Parámetro de búsqueda desde el frontend
        const response = await axios.get(`https://apisandbox.facturama.mx/catalogs/TariffFractions?keyword=${keyword}`);

        res.json(response.data);  // Enviar datos al frontend
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

export default router;

