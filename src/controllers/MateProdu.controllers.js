import { pool } from '../db.js';

//MATERIALES
export const cargaMaterial = async (req,res)=>{
    try{
        const envioMaterial = req.body;
        const envioMaterialQuery = `
            INSERT INTO materiales_de_empresa
            (id_material_interno, fraccion_arancelaria, id_empresa, nombre_interno, descripcion_fraccion,
            unidad_medida,id_domicilio)
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `; 
        const envioMaterialValues = [
            envioMaterial.idInterno,
            envioMaterial.fraccion,
            envioMaterial.id_empresa,
            envioMaterial.nombreFracc,
            envioMaterial.descripcionFraccion,
            envioMaterial.unidadMedida,
            envioMaterial.id_domicilio,
        ];
        await pool.query(envioMaterialQuery,envioMaterialValues);
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
    const { id_empresa, id_domicilio} = req.query;

    if (!id_empresa || !id_domicilio) {
        return res.status(400).json({ message: "Faltan parámetros requeridos." });
    }

    try {
        const { rows } = await pool.query(`
            SELECT 
                id_material_interno, fraccion_arancelaria, nombre_interno, descripcion_fraccion, unidad_medida
            FROM 
                materiales_de_empresa
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

export const editarMaterial = async (req,res) =>{
    const data = req.body;
    try{
        const { rows: MaterialID } = await pool.query(
            'SELECT id_material FROM materiales_de_empresa WHERE id_material_interno = $1 AND id_domicilio =$2',
            [data.id_material_interno, data.id_domicilio] 
        );

        if(MaterialID.length === 0){
            return res.status(404).json({ message: "No se encontró el Producto." });
        }

        const id_material = MaterialID[0].id_material;
        const { rowCount } = await pool.query(
            `SELECT 1 FROM billete_de_materiales WHERE id_material = $1`,
            [id_material]
        );

        if (rowCount > 0) {
            return res.status(400).json({ message: "No es posible actualizar. El material ya está registrado en Productos." });
        }

        const {rows} = await pool.query(
            `UPDATE materiales_de_empresa SET fraccion_arancelaria = $1,nombre_interno = $2,
            descripcion_fraccion = $3,unidad_medida = $4 WHERE id_material_interno=$5 AND id_domicilio=$6
            RETURNING *`,
            [data.fraccion_arancelaria,data.nombre_interno,data.descripcion_fraccion,data.unidad_medida,
            data.id_material_interno, data.id_domicilio]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontró el producto a actualizar." });
        }

        return res.json(rows[0]);
    }catch (error) {
        console.error("Error al actualizar producto:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
};

export const eliminarMaterial = async (req, res) => {
    const data = req.body;
    try{
        const { rows: MaterialID } = await pool.query(
            'SELECT id_material FROM materiales_de_empresa WHERE id_material_interno = $1 AND id_domicilio =$2',
            [data.id_material_interno, data.id_domicilio] 
        );

        if(MaterialID.length === 0){
            return res.status(404).json({ message: "No se encontró el Material." });
        }

        const id_material = MaterialID[0].id_material;
        const { rowCount } = await pool.query(
            `SELECT 1 FROM billete_de_materiales WHERE id_material = $1`,
            [id_material]
        );

        if (rowCount > 0) {
            return res.status(400).json({ message: "No es posible eliminar. El material ya está registrado en Productos." });
        }
        
        const { row } = await pool.query(
            `DELETE FROM materiales_de_empresa WHERE id_material=$1`,
            [id_material]
        );
        
        if (row === 0) {
            return res.status(404).json({ message: "No se pudo eliminar." });
        }
        
        return res.json({ message: "Material eliminado exitosamente." });
    }catch (error) {
        console.error("Error al eliminar producto:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
    
};

//PRODUCTOS
export const cargaProducto = async (req,res)=>{
    const data = req.body;
    console.log("Datos recibidos Envio materiales:", JSON.stringify(data, null, 2));
    try{
        const envioProducto = req.body;
        const envioProductoQuery = `
            INSERT INTO productos_de_empresa
            (id_producto_interno, fraccion_arancelaria, id_empresa, nombre_interno, descripcion_fraccion,
            unidad_medida, id_domicilio)
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const envioProductoValues = [
            envioProducto.id,
            envioProducto.fraccion,
            envioProducto.id_empresa,
            envioProducto.nombre,
            envioProducto.descripcion,
            envioProducto.unidadMedida,
            envioProducto.id_domicilio,
        ];
        const envioProductoPush = await pool.query(envioProductoQuery,envioProductoValues);
        const id_producto = envioProductoPush.rows[0].id_producto;
        let billetesInsertados = [];

        for (const material of envioProducto.materiales) {
            const materialQuery = `
                SELECT id_material FROM materiales_de_empresa WHERE id_material_interno = $1;
            `;
            const materialResult = await pool.query(materialQuery, [material.id_material_interno]);

            if (materialResult.rowCount === 0) {
                console.warn(`No se encontró material con id_material_interno: ${material.id_material_interno}`);
                continue;
            }

            const id_material = materialResult.rows[0].id_material; // ID real del material
            const envioBilleteQuery = `
                INSERT INTO billete_de_materiales
                (id_material, id_producto, id_material_interno, id_producto_interno, cantidad)
                VALUES 
                ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const envioBilleteValues = [
                id_material,
                id_producto,
                material.id_material_interno,
                envioProducto.id,
                material.cantidad
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
    const { id_empresa, id_domicilio} = req.query;
    if (!id_empresa || !id_domicilio) {
        return res.status(400).json({ message: "Faltan parámetros requeridos." });
    }
    try {
        const { rows } = await pool.query(`
            SELECT 
                id_producto_interno, fraccion_arancelaria, nombre_interno, descripcion_fraccion, unidad_medida
            FROM 
                productos_de_empresa
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

export const editarProducto = async (req, res) => {
    const data = req.body;
    try {
        const { rows: ProductoID } = await pool.query(
            `SELECT id_producto FROM productos_de_empresa WHERE id_producto_interno = $1 AND id_domicilio = $2`,
            [data.id_producto_interno, data.id_domicilio]
        );

        if (ProductoID.length === 0) {
            return res.status(404).json({ message: "No se encontró el Producto." });
        }

        const id_producto = ProductoID[0].id_producto;
        const { rowCount } = await pool.query(
            `SELECT 1 FROM creacion_de_producto WHERE id_producto = $1`,
            [id_producto]
        );

        if (rowCount > 0) {
            return res.status(400).json({ message: "No es posible actualizar. El material ya está registrado en Materiales utilizados." });
        }

        const { rows } = await pool.query(
            `UPDATE productos_de_empresa 
            SET fraccion_arancelaria = $1, nombre_interno = $2, 
                descripcion_fraccion = $3, unidad_medida = $4 
            WHERE id_producto = $5
            RETURNING *`,
            [
                data.fraccion_arancelaria,
                data.nombre_interno,
                data.descripcion_fraccion,
                data.unidad_medida,
                id_producto
            ]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontró el producto a actualizar." });
        }

        return res.json(rows[0]);
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
        
};

//Billete de materiales
export const verBillete = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(`
            SELECT 
                id_material_interno, cantidad
            FROM 
                billete_de_materiales
            WHERE 
                id_producto_interno = $1
        `, [id]);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
