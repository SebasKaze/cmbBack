import { pool } from '../db.js';


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

export const verPedimento = async (req, res) => { // como odio JavaScript por cierto
    try {
        const { id_empresa, id_domicilio } = req.query;
        console.log(id_domicilio);
        console.log(id_empresa);
        const query = `
        SELECT 
            p.no_pedimento, 
            p.tipo_oper,
            TO_CHAR(e.fecha_en, 'YYYY-MM-DD') AS fecha_en
        FROM 
            pedimento p
        JOIN 
            encabezado_p_pedimento e ON p.no_pedimento = e.no_pedimento
        WHERE 
            p.id_empresa = $1 
        AND p.id_domicilio = $2;
        `;
        const values = [id_empresa, id_domicilio];
        const { rows } = await pool.query(query, values);

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

export const consultaPedimento = async (req, res) => {
    const { no_pedimento } = req.params;

    let client;
    try {
        client = await pool.connect();
        console.log("No_pedimento recibido",no_pedimento);
        // Obtener información del pedimento principal
        const pedimentoQuery = `SELECT * FROM pedimento WHERE no_pedimento = $1;`;
        const pedimentoResult = await client.query(pedimentoQuery, [no_pedimento]);

        if (pedimentoResult.rows.length === 0) {
            return res.status(404).json({ message: "No se encontró el pedimento" });
        }

        const pedimento = pedimentoResult.rows[0];

        // Obtener datos de encabezado_p_pedimento
        const encabezadoQuery = `SELECT * FROM encabezado_p_pedimento WHERE no_pedimento = $1;`;
        const encabezadoResult = await client.query(encabezadoQuery, [no_pedimento]);

        // Obtener datos de encabezado_sec_pedimento
        const encabezadoSecQuery = `SELECT * FROM encabezado_sec_pedimento WHERE no_pedimento = $1;`;
        const encabezadoSecResult = await client.query(encabezadoSecQuery, [no_pedimento]);

        // Obtener datos de datos_proveedor_comprador
        const proveedorQuery = `SELECT * FROM datos_proveedor_comprador WHERE no_pedimento = $1;`;
        const proveedorResult = await client.query(proveedorQuery, [no_pedimento]);

        // Obtener datos de datos_d (Destinatarios)
        const destinatariosQuery = `SELECT * FROM datos_d WHERE no_pedimento = $1;`;
        const destinatariosResult = await client.query(destinatariosQuery, [no_pedimento]);

        // Obtener datos de datos_transport
        const transportQuery = `SELECT * FROM datos_transport WHERE no_pedimento = $1;`;
        const transportResult = await client.query(transportQuery, [no_pedimento]);

        // Obtener datos de candados
        const candadosQuery = `SELECT * FROM candados WHERE no_pedimento = $1;`;
        const candadosResult = await client.query(candadosQuery, [no_pedimento]);

        // Obtener partidas
        const partidasQuery = `SELECT * FROM partidas WHERE no_pedimento = $1;`;
        const partidasResult = await client.query(partidasQuery, [no_pedimento]);

        // Obtener contribuciones de cada partida
        const partidasContribuciones = [];
        for (const partida of partidasResult.rows) {
            const contribucionQuery = `SELECT * FROM parti_contr WHERE id_partida = $1;`;
            const contribucionResult = await client.query(contribucionQuery, [partida.id_partida]);
            partidasContribuciones.push({ ...partida, contribuciones: contribucionResult.rows });
        }

        // Obtener tasas a nivel de pedimento
        const contribucionesQuery = `SELECT * FROM tasa_pedi WHERE no_pedimento = $1;`;
        const contribucionesResult = await client.query(contribucionesQuery, [no_pedimento]);

        // Obtener cuadros de liquidación
        const cuadroLiquidacionQuery = `SELECT * FROM cua_liqui WHERE no_pedimento = $1;`;
        const cuadroLiquidacionResult = await client.query(cuadroLiquidacionQuery, [no_pedimento]);

        // Obtener totales
        const totalesQuery = `SELECT * FROM totales WHERE no_pedimento = $1;`;
        const totalesResult = await client.query(totalesQuery, [no_pedimento]);

        // Construcción de respuesta
        const resultado = {
            pedimento,
            encabezado: encabezadoResult.rows[0] || null,
            encabezado_sec: encabezadoSecResult.rows[0] || null,
            proveedor: proveedorResult.rows[0] || null,
            destinatarios: destinatariosResult.rows[0],
            transportes: transportResult.rows[0],
            candados: candadosResult.rows[0],
            partidas: partidasContribuciones,
            contribuciones: contribucionesResult.rows,
            cuadroLiquidacion: cuadroLiquidacionResult.rows,
            totales: totalesResult.rows[0] || null
        };

        console.log("Consulta de pedimento:", JSON.stringify(resultado, null, 2));

        res.json(resultado);

    } catch (error) {
        console.error("Error al consultar el pedimento:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    } finally {
        if (client) client.release();
    }
};