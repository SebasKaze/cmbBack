import { pool } from '../db.js';

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
        const { no_pedimento } = req.query;  // ← Corregido: ahora toma el parámetro del query string

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

        // Verificar que los parámetros sean proporcionados
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

        // Primera consulta: obtener id_material e id_meterial_interno
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

        // Si no hay materiales, devolver un array vacío
        if (materiales.length === 0) {
            return res.json([]);
        }

        // Segunda consulta: obtener nombre_interno para cada id_material
        const materialIds = materiales.map(m => m.id_material); // Extraer todos los id_material
        const query2 = `
            SELECT id_material, nombre_interno 
            FROM materiales_de_empresa
            WHERE id_material = ANY($1)
        `;
        const values2 = [materialIds];
        const { rows: nombres } = await pool.query(query2, values2);

        // Crear un objeto de búsqueda rápida para asociar los nombres internos
        const nombreMap = {};
        nombres.forEach(({ id_material, nombre_interno }) => {
            nombreMap[id_material] = nombre_interno;
        });

        // Combinar los resultados de ambas consultas
        const resultado = materiales.map(mat => ({
            id_material: mat.id_material,
            id_meterial_interno: mat.id_meterial_interno,
            nombre_interno: nombreMap[mat.id_material] || null // Si no hay coincidencia, devuelve null
        }));

        res.json(resultado);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
/*
CORREGIR
    La parte de carga en materiales utilizados no hace el descargo ni tiene la condicion por si se acaba materiales de
    un pedimento
    Checar si ponemos un select con los pedimentos o que se tome automaticamente el ultimo para sacar las mermas

*/
    export const mateCargaGuardar = async (req, res) => {
        const data = req.body;
        //console.log("Datos recibidos en el backend:", JSON.stringify(data, null, 2));

        try {
            const id_producto = data.id_producto;
            const id_domicilio = data.id_domicilio;

            // Primera consulta: obtener nombre del producto
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

            // Verificar si se encontró el producto
            if (resultadoNombre.rows.length === 0) {
                return res.status(404).json({ error: "Producto no encontrado" });
            }

            const nombre_interno = resultadoNombre.rows[0].nombre_interno;

            // Insert en creacion de producto
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

            //Obtener el id_transformacion
            const id_trans = PoolCreacionP.rows[0].id_transformacion;
            
            await cargaMaterialUtilizado(id_trans, data.materiales,id_domicilio);//Utilizar otra funcion para registrar MU
            
            
            
            // Enviar respuesta exitosa al frontend
            res.json({
                message: "Información enviada correctamente",
                data: PoolCreacionP.rows[0],
            });

        } catch (error) {
            console.error("Error al procesar la solicitud:", error);
            res.status(500).json({ error: "Error interno del servidor" });
            
        }
    };
    // Función para meter los datos en materiales utilizados 
    const cargaMaterialUtilizado = async (id, materiales,id_domicilio) => {    
        // Insertar materiales en la base de datos
        if (Array.isArray(materiales) && materiales.length > 0) {
            for (const material of materiales) {
                try {                    
                    // Consultar la fracción arancelaria
                    const queryConsultaFracc = `
                        SELECT fraccion_arancelaria
                        FROM materiales_de_empresa
                        WHERE id_material = $1;
                    `;
                    const valuesConsultaFracc = [material.id_material];
                    const poolConsultaFracc = await pool.query(queryConsultaFracc, valuesConsultaFracc);

                    if (poolConsultaFracc.rows.length === 0 || !poolConsultaFracc.rows[0].fraccion_arancelaria) {
                        console.warn(`No se encontró fracción arancelaria para el material ${material.id_material}`);
                        continue; // Pasar al siguiente material
                    }

                    const fraccion_arancelaria = poolConsultaFracc.rows[0].fraccion_arancelaria;

                    // Obtener los no_pedimento de la tabla partidas
                    const querySelectFraccion = `
                        SELECT no_pedimento
                        FROM partidas
                        WHERE fraccion = $1;
                    `;
                    const valuesSelectFraccion = [fraccion_arancelaria];
                    const pedimento_fraccion = await pool.query(querySelectFraccion, valuesSelectFraccion);

                    if (pedimento_fraccion.rows.length === 0) {
                        console.warn(`No se encontraron pedimentos para la fracción ${fraccion_arancelaria}`);
                        continue; // Pasar al siguiente material
                    }

                    // Extraer los no_pedimento obtenidos
                    const lista_pedimentos = pedimento_fraccion.rows.map(row => row.no_pedimento);

                    // Buscar la fecha más antigua de estos pedimentos
                    const queryFechaMasAntigua = `
                        SELECT no_pedimento, feca_sal
                        FROM encabezado_p_pedimento
                        WHERE no_pedimento = ANY($1)
                        ORDER BY feca_sal ASC
                        LIMIT 1;
                    `;
                    const valuesFechaMasAntigua = [lista_pedimentos];
                    const resultadoFechaAntigua = await pool.query(queryFechaMasAntigua, valuesFechaMasAntigua);

                    if (resultadoFechaAntigua.rows.length === 0) {
                        console.warn(`No se encontró información en encabezado_p_pedimento para los pedimentos ${lista_pedimentos}`);
                        continue;
                    }

                    const pedimento_mas_viejo = resultadoFechaAntigua.rows[0];
        
                    // Buscar la fecha más antigua de estos pedimentos
                    const queryInsertarMU = `
                        INSERT INTO material_utilizado (id_transformacion, id_material, cantidad,no_pedimento,id_domicilio)
                        VALUES ($1, $2, $3,$4,$5)
                        RETURNING *;
                    `;
                    const valuesInsertarMU = [id, material.id_material, material.cantidad, pedimento_mas_viejo.no_pedimento,id_domicilio];
                    const resultadoMaterial = await pool.query(queryInsertarMU, valuesInsertarMU);

                } catch (error) {
                    console.error(`Error al procesar el material ${material.id_material}:`, error);
                }
            }
        }
    };

export const mateUtilizados = async (req, res) => { // como odio JavaScript por cierto
    try {
        const { id_empresa, id_domicilio } = req.query;

        // Verificar que los parámetros sean proporcionados
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
