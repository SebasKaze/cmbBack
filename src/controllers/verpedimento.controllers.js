import { pool } from '../db.js';

export const verPedimento = async (req, res) => { // como odio JavaScript por cierto
    try {
        const { id_empresa, id_domicilio } = req.query;


        const query = `
            SELECT 
                p.no_pedimento, 
                p.tipo_oper,
                TO_CHAR(e.fecha_en, 'YYYY-MM-DD') AS fecha_en
            FROM 
                pedimento p
            JOIN encabezado_p_pedimento e ON p.no_pedimento = e.no_pedimento
            WHERE p.id_empresa = $1 AND p.id_domicilio = $2;
        `;
        const values = [id_empresa, id_domicilio];

        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const entradaMercancia = async (req, res) => { // como odio JavaScript por cierto
    try {
        const { id_empresa, id_domicilio } = req.query;

        // Verificar que los parámetros sean proporcionados
        if (!id_empresa || !id_domicilio) {
            return res.status(400).json({ error: "Parámetros id_empresa e id_domicilio son obligatorios" });
        }

        const query = `
            SELECT 
                p.no_pedimento, 
                p.clave_ped,
                TO_CHAR(e.fecha_en, 'YYYY-MM-DD') AS fecha_en
            FROM 
                pedimento p
            JOIN encabezado_p_pedimento e ON p.no_pedimento = e.no_pedimento
            WHERE p.id_empresa = $1 AND p.id_domicilio = $2;
        `;
        const values = [id_empresa, id_domicilio];

        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const activoFijo = async (req, res) => { //Ver Activo Fijo
    const { id_empresa, id_domicilio} = req.query;
    if (!id_empresa || !id_domicilio) {
        return res.status(400).json({ message: "Faltan parámetros requeridos." });
    }
    try {
        const { rows } = await pool.query(`
            SELECT 
                id_activo_fijo_interno, nombre_activofijo, fraccion_arancelaria, ubicacion_interna, descripcion
            FROM 
                activo_fijo
            WHERE 
                id_empresa = $1 
                AND 
                id_domicilio = $2
            `,[id_empresa,id_domicilio]);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const verDomicilios = async (req, res) => {
    try {
        const { id_empresa } = req.query;

        // Validar que se proporcione id_empresa
        if (!id_empresa) {
            return res.status(400).json({ error: "El parámetro id_empresa es obligatorio" });
        }

        const query = `
            SELECT 
                id_domicilio, 
                domicilio
            FROM domicilios
            WHERE id_empresa = $1;
        `;
        const values = [id_empresa];

        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener domicilios:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};