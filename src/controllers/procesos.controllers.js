import { pool } from '../db.js';

export const entradaMercancia = async (req, res) => {
    try {
        const { id_empresa, id_domicilio } = req.query;

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
            WHERE p.id_empresa = $1 AND p.id_domicilio = $2 AND p.tipo_oper = 'IMP';
        `;
        const values = [id_empresa, id_domicilio];
        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const salidaMercancias = async (req, res) => { // como odio JavaScript por cierto
    try {
        const { id_empresa, id_domicilio } = req.query;

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
            WHERE p.id_empresa = $1 AND p.id_domicilio = $2 AND p.tipo_oper = 'EXP';
        `;
        const values = [id_empresa, id_domicilio];
        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const salidaMercanciasFracciones = async (req, res) => {
    try {
        const { no_pedimento } = req.query;

        if (!no_pedimento) {
            return res.status(400).json({ error: "El parámetro no_pedimento es obligatorio" });
        }

        const query = `
            SELECT 
                fraccion,
                cantidad_umt 
            FROM 
                partidas
            WHERE 
                no_pedimento = $1;
        `;
        const values = [no_pedimento];
        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const mateCargaProducto = async (req, res) => {
    try {
        const { id_empresa, id_domicilio } = req.query;

        if (!id_empresa || !id_domicilio) {
            return res.status(400).json({ error: "Parámetros id_empresa e id_domicilio son obligatorios" });
        }

        const query = `
            SELECT 
                id_producto,
                id_producto_interno,
                nombre_interno
            FROM 
                productos_de_empresa
            WHERE 
                id_empresa = $1 AND id_domicilio = $2
        `;
        const values = [id_empresa, id_domicilio];
        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }

};

export const mateCargaMeteriales = async (req, res) => {
    try {
        const id_producto = req.query.id_producto || req.query.producto;
        
        if (!id_producto) {
            return res.status(400).json({ error: "El parámetro id_producto es obligatorio" });
        }

        const query1 = `
            SELECT 
                id_material,
                id_material_interno
            FROM 
                billete_de_materiales
            WHERE 
                id_producto = $1
        `;
        const values1 = [id_producto];
        const { rows: materiales } = await pool.query(query1, values1);

        if (materiales.length === 0) {
            return res.json([]);
        }

        const materialIds = materiales.map(m => m.id_material);
        const query2 = `
            SELECT id_material, nombre_interno 
            FROM materiales_de_empresa
            WHERE id_material = ANY($1)
        `;
        const values2 = [materialIds];
        const { rows: nombres } = await pool.query(query2, values2);
        const nombreMap = {};
        nombres.forEach(({ id_material, nombre_interno }) => {
            nombreMap[id_material] = nombre_interno;
        });
        const resultado = materiales.map(mat => ({
            id_material: mat.id_material,
            id_meterial_interno: mat.id_meterial_interno,
            nombre_interno: nombreMap[mat.id_material] || null
        }));
        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

    export const mateCargaGuardar = async (req, res) => {
        const data = req.body;
        try {
            const id_producto = data.id_producto;
            const id_domicilio = data.id_domicilio;
            const query1 = `
                SELECT 
                    nombre_interno
                FROM 
                    productos_de_empresa
                WHERE 
                    id_producto = $1
            `;
            const values1 = [id_producto];
            const resultadoNombre = await pool.query(query1, values1);

            if (resultadoNombre.rows.length === 0) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }

            const nombre_interno = resultadoNombre.rows[0].nombre_interno;
            const QueryinsertCreacionP = `
                INSERT INTO creacion_de_producto
                    (id_producto, cantidad, fecha_transformacion, id_usuario, nombre, fecha_registro, id_domicilio, id_empresa) 
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id_transformacion;
            `;
            const ValuesinsertCreacionP = [
                id_producto,
                data.cantidad_producto,
                data.fecha_creacion,
                data.id_usuario,
                nombre_interno,
                data.fecha_reg,
                data.id_domicilio,
                data.id_empresa
            ];
            const PoolCreacionP = await pool.query(QueryinsertCreacionP, ValuesinsertCreacionP);
            const id_trans = PoolCreacionP.rows[0].id_transformacion;
            await cargaMaterialUtilizado(id_trans, data.materiales,id_domicilio);
            res.json({
                message: "Información enviada correctamente",
                data: PoolCreacionP.rows[0],
            });
        } catch (error) {
            console.error("Error al procesar la solicitud:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    const cargaMaterialUtilizado = async (id, materiales, id_domicilio) => {
        const client = await pool.connect(); // Usar transacción para consistencia
        try {
            await client.query('BEGIN');
            
            if (Array.isArray(materiales) && materiales.length > 0) {
                
                for (const material of materiales) {
                    let cantidadPendiente = material.cantidad;
                    const resMU = await client.query(
                        `INSERT INTO material_utilizado 
                        (id_transformacion, id_material, cantidad, id_domicilio)
                        VALUES ($1, $2, $3, $4) RETURNING id_uso`,
                        [id, material.id_material, material.cantidad, id_domicilio]
                    );
                    const id_uso = resMU.rows[0].id_uso;
                    const resFracc = await client.query(
                        `SELECT fraccion_arancelaria 
                         FROM materiales_de_empresa 
                         WHERE id_material = $1`,
                        [material.id_material]
                    );
                    
                    if (!resFracc.rows[0]?.fraccion_arancelaria) {
                        throw new Error(`Fracción no encontrada para material ${material.id_material}`);
                    }

                    const fraccion = resFracc.rows[0].fraccion_arancelaria;

                    while (cantidadPendiente > 0) {
                        const saldo = await client.query(`
                            SELECT s.id_saldo, s.cantidad, s.no_pedimento,
                                COALESCE(
                                    (SELECT restante 
                                     FROM resta_saldo_mu 
                                     WHERE id_saldo = s.id_saldo 
                                     ORDER BY id_resta_saldo_mu DESC 
                                     LIMIT 1),
                                    s.cantidad
                                ) as restante_actual
                            FROM saldo s
                            WHERE s.fraccion = $1
                              AND s.estado = 1
                              AND ( -- Filtrar saldos con disponibilidad
                                EXISTS (
                                    SELECT 1 FROM resta_saldo_mu 
                                    WHERE id_saldo = s.id_saldo 
                                    AND restante > 0
                                ) OR NOT EXISTS (
                                    SELECT 1 FROM resta_saldo_mu 
                                    WHERE id_saldo = s.id_saldo
                                )
                              )
                            ORDER BY s.fecha_sal ASC
                            LIMIT 1
                        `, [fraccion]);
    
                        if (saldo.rows.length === 0) {
                            await client.query('ROLLBACK');
                            throw new Error(`Saldo insuficiente para fracción ${fraccion}`);
                        }
    
                        const { 
                            id_saldo, 
                            no_pedimento, 
                            restante_actual, 
                            cantidad: saldo_original 
                        } = saldo.rows[0];
                        const consumo = Math.min(cantidadPendiente, restante_actual);
                        const nuevo_restante = restante_actual - consumo;
                        await client.query(
                            `INSERT INTO resta_saldo_mu 
                            (id_saldo, id_uso, restante, no_pedimento)
                            VALUES ($1, $2, $3, $4)`,
                            [id_saldo, id_uso, nuevo_restante, no_pedimento]
                        );

                        if (nuevo_restante <= 0) {
                            await client.query(
                                `UPDATE saldo SET estado = 2 WHERE id_saldo = $1`,
                                [id_saldo]
                            );

                        }
                        cantidadPendiente -= consumo;
                    }
                }
            }
            
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error en transacción:', error.message);
            throw error;
        } finally {
            client.release();
        }
    };
    
    
export const mateUtilizados = async (req, res) => {
    try {
        const { id_empresa, id_domicilio } = req.query;

        if (!id_empresa || !id_domicilio) {
            return res.status(400).json({ error: "Parámetros id_empresa e id_domicilio son obligatorios" });
        }

        const query = `
            SELECT 
                nombre,
                cantidad,
                fecha_transformacion
            FROM 
                creacion_de_producto
            WHERE
                id_empresa = $1 AND id_domicilio = $2
            ;
        `;
        const values = [id_empresa, id_domicilio];
        const { rows } = await pool.query(query, values);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
export const saldoMuestra = async (req, res) => {
    try {
        const { id_empresa, id_domicilio } = req.query;

        if (!id_empresa || !id_domicilio) {
            return res.status(400).json({ error: "Parámetros id_empresa e id_domicilio son obligatorios" });
        }

        const queryPedimentos = `
            SELECT no_pedimento
            FROM pedimento
            WHERE id_empresa = $1 AND id_domicilio = $2;
        `;
        const values = [id_empresa, id_domicilio];
        const resultPedimentos = await pool.query(queryPedimentos, values);

        if (resultPedimentos.rows.length === 0) {
            return res.json({ mensaje: "No se encontraron pedimentos" });
        }

        let resultados = [];

        for (const row of resultPedimentos.rows) {
            const no_pedimento = row.no_pedimento;

            const queryFraccion = `
                SELECT fraccion
                FROM saldo
                WHERE no_pedimento = $1;
            `;
            const fraccionResult = await pool.query(queryFraccion, [no_pedimento]);

            if (fraccionResult.rows.length === 0) {
                continue;
            }

            const fraccion = fraccionResult.rows[0].fraccion;
            const queryRestaSaldo = `
                SELECT restante
                FROM resta_saldo_mu
                WHERE no_pedimento = $1
                ORDER BY id_resta_saldo_mu DESC
                LIMIT 1;
            `;
            const resultRestaSaldo = await pool.query(queryRestaSaldo, [no_pedimento]);

            if (resultRestaSaldo.rows.length > 0) {
                let resta = parseFloat(resultRestaSaldo.rows[0].restante) || 0;
                resultados.push({ no_pedimento, fraccion, resta });
            }
        }

        console.log("Resultados enviados al frontend:", resultados);
        res.json(resultados);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};