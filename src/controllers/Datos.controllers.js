import { pool } from '../db.js';

export const DatosGenerales = async (req, res) => { 

const {id_usuario, id_empresa} = req.body;
    try {
        const { rows } = await pool.query(`
            SELECT 
                c.nombre, c.corrreo, c.telefono, 
                e.rfc_empresa, e.razon_social, e.no_immex, e.rfc_empresa, e.dom_fiscal
            FROM 
                cuenta_usuario c
            JOIN 
                info_empresa e 
            ON  
                c.id_empresa = e.id_empresa
            WHERE
                c.id_usuario = $1 
                AND
                e.id_empresa = $2   
            ;`, [id_usuario, id_empresa]);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const RegistroEmpresa = async (req, res) =>{
    //const data = req.body;
    //console.log("Datos recibidos Envio materiales:", JSON.stringify(data, null, 2));
    const fechaAhora = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    try{
        const envioEmpresa = req.body;
        const envioEmpresaQuery = `
            INSERT INTO info_empresa 
            (rfc_empresa,razon_social,no_immex,fecha_registro,nombre)
            VALUES
            ($1,$2,$3,$4,$5)
        `;
        const envioEmpresaValues = [
            envioEmpresa.rfc,
            envioEmpresa.razonSocial,
            envioEmpresa.no_immex,
            fechaAhora,
            envioEmpresa.nombre,
        ];
        const envioEmpresaPush = await pool.query(envioEmpresaQuery,envioEmpresaValues);
        const data = "Datos Cargados"; // creo que eso no hace nada pero bueno
        res.json(data);

    }catch (error){
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};