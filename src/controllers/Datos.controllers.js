import { pool } from '../db.js';

export const DatosGenerales = async (req, res) => { 

const {id_usuario, id_empresa} = req.body;
    try {
        const { rows } = await pool.query(`
            SELECT 
                c.nombre, c.corrreo, c.telefono, 
                e.rfc_empresa, e.razon_social, e.no_immex, e.rfc_empresa
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

export const EnvioEmpresa = async(req,res) =>{
    try{
        const { rows } = await pool.query(`
            SELECT 
                id_empresa, nombre
            FROM 
                info_empresa   
            ;`);
        res.json(rows);
    }catch(error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }

};

export const RegistroDomi = async(req,res) =>{
    
    try{
        const envioDomicilio = req.body;
        const envioDomicilioQuery = `
            INSERT INTO domicilios
            (id_empresa,domicilio,tipo_de_domicilio)
            VALUES 
            ($1,$2,$3)
        `;
        const envioDomicilioValues = [
            envioDomicilio.empresaId,
            envioDomicilio.domicilio,
            envioDomicilio.tipo_domi,
        ];
        const envioDomicilioPush = await pool.query(envioDomicilioQuery,envioDomicilioValues);
    }catch(error){
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }

};

export const InfoDomi = async (req,res) =>{
    const { id_empresa } = req.params;

    try {
        const { rows } = await pool.query(
            `SELECT 
                id_domicilio, domicilio 
            FROM 
                domicilios 
            WHERE 
                id_empresa = $1`,
            [id_empresa]
        );
    
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener domicilios:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const RegistroUsuario = async (req,res) => {
    //const data = req.body;
    //console.log("Datos recibidos:", JSON.stringify(data, null, 2));

    try{
        const envioUsuario = req.body;
        const envioUsuarioQuery = `
            INSERT INTO cuenta_usuario
            (id_empresa,nombre,corrreo,telefono, contraseña,tipo_de_cuenta,id_domicilio)
            VALUES 
            ($1,$2,$3,$4,$5,$6,$7)
        `;
        const envioUsuarioValues = [
            envioUsuario.empresaId,
            envioUsuario.nombre,
            envioUsuario.correo,
            envioUsuario.telefono,
            envioUsuario.contraseña,
            envioUsuario.rol,
            envioUsuario.domicilioId,
        ];
        const envioUsuarioPush = await pool.query(envioUsuarioQuery,envioUsuarioValues);

    }catch (error) {
        console.error("Error al obtener domicilios:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const verDomi = async (req, res) => { 
    
    const {id_usuario, id_empresa} = req.body;
        try {
            const { rows } = await pool.query(`
                SELECT 
                    domicilio
                FROM
                    domicilios
                WHERE
                    id_empresa = $1
                ;`, [id_empresa]);
            res.json(rows);
        } catch (error) {
            console.error("Error al obtener datos:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    };
