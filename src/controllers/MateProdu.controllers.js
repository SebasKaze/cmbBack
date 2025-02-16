import { pool } from '../db.js';

//MATERIALES
export const cargaMaterial = async (req,res)=>{
    //const data = req.body;
    //console.log("Datos recibidos Envio materiales:", JSON.stringify(data, null, 2));

    try{
        const envioMaterial = req.body;
        const envioMaterialQuery = `
            INSERT INTO materiales_de_empresa
            (id_material_interno, fraccion_arancelaria, id_empresa, nombre_interno, descripcion_fraccion,
            unidad_medida)
            VALUES 
            ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `; 
        const envioMaterialValues = [
            envioMaterial.idInterno,
            envioMaterial.fraccion,
            envioMaterial.id_empresa,
            envioMaterial.nombreFracc,
            envioMaterial.descripcionFraccion,
            envioMaterial.unidadMedida
        ];
        const envioMaterialPush = await pool.query(envioMaterialQuery,envioMaterialValues);
        const data = "Datos Cargados";
        res.json(data);
    }catch(error){
        console.error("Error al insertar datos:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }
        
};
export const verMateriales = async (req, res) =>{
    try {
        const { rows } = await pool.query(`
            SELECT 
                id_material_interno, fraccion_arancelaria, nombre_interno, descripcion_fraccion, unidad_medida
            FROM 
                materiales_de_empresa
            `);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
export const editarMaterial = async (req,res) =>{
    const data = req.body;
    //console.log("Datos recibidos:", JSON.stringify(data, null, 2));

    const {rows} = await pool.query(
        `UPDATE materiales_de_empresa SET fraccion_arancelaria = $1,nombre_interno = $2,
        descripcion_fraccion = $3,unidad_medida = $4 WHERE id_material_interno=$5 RETURNING *`,
        [data.fraccion_arancelaria,data.nombre_interno,data.descripcion_fraccion,data.unidad_medida,
        data.id_material_interno]
    );
    return res.json(rows[0]);
}

//PRODUCTOS

export const cargaProducto = async (req,res)=>{
    const data = req.body;
    console.log("Datos recibidos Envio materiales:", JSON.stringify(data, null, 2));

    try{
        const envioProducto = req.body;
        const envioProductoQuery = `
            INSERT INTO productos_de_empresa
            (id_producto_interno, fraccion_arancelaria, id_empresa, nombre_interno, descripcion_fraccion,
            unidad_medida)
            VALUES 
            ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const envioProductoValues = [
            envioProducto.id,
            envioProducto.fraccion,
            envioProducto.id_empresa,
            envioProducto.nombre,
            envioProducto.descripcion,
            envioProducto.unidadMedida
        ];
        const envioProductoPush = await pool.query(envioProductoQuery,envioProductoValues);

        const id_producto = envioProductoPush.rows[0].id_producto; // ID generado del producto
        let billetesInsertados = []; // Para almacenar los registros insertados


         // 2. Insertar billetes por cada material en la lista
        for (const material of envioProducto.materiales) {
            // Obtener id_material desde la tabla materiales
            const materialQuery = `
                SELECT id_material FROM materiales_de_empresa WHERE id_material_interno = $1;
            `;
            const materialResult = await pool.query(materialQuery, [material.id_material_interno]);

            if (materialResult.rowCount === 0) {
                console.warn(`No se encontró material con id_material_interno: ${material.id_material_interno}`);
                continue; // Saltar este material si no se encuentra
            }

            const id_material = materialResult.rows[0].id_material; // ID real del material

            // Insertar en billete_de_materiales
            const envioBilleteQuery = `
                INSERT INTO billete_de_materiales
                (id_material, id_producto, id_material_interno, id_producto_interno, cantidad)
                VALUES 
                ($1, $2, $3, $4, $5)
                RETURNING *;
            `;

            const envioBilleteValues = [
                id_material,          // id_material obtenido de la consulta
                id_producto,          // id_producto del producto insertado
                material.id_material_interno, // id_material_interno desde JSON
                envioProducto.id,     // id_producto_interno desde JSON
                material.cantidad     // cantidad del material
            ];

            const envioBilletePush = await pool.query(envioBilleteQuery, envioBilleteValues);
            billetesInsertados.push(envioBilletePush.rows[0]);
        }

        res.json({
            mensaje: "Datos Cargados",
            producto: envioProductoPush.rows[0],
            billetes: billetesInsertados
        });


    }catch(error){
        console.error("Error al insertar datos:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

};

export const verProductos = async (req, res) =>{
    try {
        const { rows } = await pool.query(`
            SELECT 
                id_producto_interno, fraccion_arancelaria, nombre_interno, descripcion_fraccion, unidad_medida
            FROM 
                productos_de_empresa
            `);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const editarProducto = async (req,res) =>{
    const data = req.body;
    //console.log("Datos recibidos:", JSON.stringify(data, null, 2));

    const {rows} = await pool.query(
        `UPDATE productos_de_empresa SET fraccion_arancelaria = $1,nombre_interno = $2,
        descripcion_fraccion = $3,unidad_medida = $4 WHERE id_material_interno=$5 RETURNING *`,
        [data.fraccion_arancelaria,data.nombre_interno,data.descripcion_fraccion,data.unidad_medida,
        data.id_material_interno]
    );

    /*
        Agregar el apartado para hacer la edicion a el billete de materiales
        Podria utilizarse de nuevo el apartado de la tabla para la creacion, ya sea modificar un material
        o agregar o quitar alguno
    */
    return res.json(rows[0]);
};

//BIllete de materiales
export const verBillete = async (req,res) =>{
    const { id } = req.params;

    try {
        const { rows } = await pool.query(`
            SELECT 
                *
            FROM 
                billete_de_materiales
            WHERE 
                id_producto_interno = $1
            `,[id]);
        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};