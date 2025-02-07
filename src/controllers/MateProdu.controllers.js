import { pool } from '../db.js';

//MATERIALES
export const cargaMaterial = async (req,res)=>{
    const data = req.body;
    console.log("Datos recibidos Envio materiales:", JSON.stringify(data, null, 2));
/*
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
            2,
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
        */
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
    //const data = req.body;
    //console.log("Datos recibidos Envio materiales:", JSON.stringify(data, null, 2));

    try{
        const envioProducto = req.body;
        const envioProductoQuery = `
            INSERT INTO productos_de_empresa
            (id_material_interno, fraccion_arancelaria, id_empresa, nombre_interno, descripcion_fraccion,
            unidad_medida)
            VALUES 
            ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `; 
        const envioProductoValues = [
            envioProducto.idInterno,
            envioProducto.fraccion,
            2,
            envioProducto.nombreFracc,
            envioProducto.descripcionFraccion,
            envioProducto.unidadMedida
        ];
        /*
            Agregar la parte de incluir el billete de materiales 
            Se tomara de la tabla de materiales el id interno y el nombre desde el front
            Sera una tabla con los materiales con casillas marcables para seleccionar
        */
        const envioProductoPush = await pool.query(envioProductoQuery,envioProductoValues);
        const data = "Datos Cargados";
        res.json(data);
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
}
