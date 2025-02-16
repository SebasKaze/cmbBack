import { pool } from '../db.js';

export const verPedimento = async (req, res) => { // como odio JavaScript por cierto
    
    try {
        const { rows } = await pool.query(`
            SELECT 
                p.no_pedimento, p.tipo_oper,
                TO_CHAR(e.fecha_en, 'YYYY-MM-DD') AS fecha_en
            FROM 
                pedimento p
            JOIN encabezado_p_pedimento e ON p.no_pedimento = e.no_pedimento;

            `);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
        
};

export const entradaMercancia = async (req, res) => { // como odio JavaScript por cierto
    
    try {
        const { rows } = await pool.query(`
            SELECT 
                p.no_pedimento, p.clave_ped,
                TO_CHAR(e.fecha_en, 'YYYY-MM-DD') AS fecha_en
            FROM 
                pedimento p
            JOIN encabezado_p_pedimento e ON p.no_pedimento = e.no_pedimento;

            `);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
        
};

export const activoFijo = async (req, res) => { //Ver Activo Fijo
    const {id_empresa} = req.body;
    try {
        const { rows } = await pool.query(`
            SELECT 
                id_activo_fijo_interno, fraccion_arancelaria, nombre_activofijo, ubicacion_interna, descripcion
            FROM 
                activo_fijo 
            WHERE 
                id_empresa = $1
            `,[id_empresa]);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
        
};