import { pool } from '../db.js';


//Solicitud de datos generales
export const DatosGeneralesUsuario = async (req, res) => {
    console.log("Datos recibidos en el backend:", req.body); // 👈 Añade esta línea
    const { id_usuario } = req.body;

    try {
        
        const { rows } = await pool.query(`
            SELECT 
                nombre, corrreo, telefono 
            FROM 
                cuenta_usuario 
            WHERE 
                id_usuario = $1;`,
            [id_usuario]);
        res.json(rows);

    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
export const DatosGeneralesEmpresa = async (req, res) => {
    console.log("Datos recibidos en el backend:", req.body); // 👈 Añade esta línea
    const { id_empresa } = req.body;

    try {
        
        const { rows } = await pool.query(`
            SELECT 
                rfc_empresa, razon_social, no_immex, rfc_empresa
            FROM 
                info_empresa
            WHERE
                id_empresa = $1
            ;`, [id_empresa]);        
        res.json(rows);

    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};


//Registro de empresa
export const RegistroEmpresa = async (req, res) => {
    
    const fechaAhora = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const data = req.body;
    console.log("Datos recibidos Envio materiales:", JSON.stringify(data, null, 2));
    try {
        const envioEmpresa = req.body;

        // Verificar si ya existe una empresa con el mismo RFC
        const existeRFCQuery = `SELECT * FROM info_empresa WHERE rfc_empresa = $1`;
        const existeRFCResult = await pool.query(existeRFCQuery, [envioEmpresa.rfc]);

        if (existeRFCResult.rows.length > 0) {
            return res.status(400).json({ message: "Ya existe una empresa con ese RFC." });
        }

        // Verificar si ya existe una empresa con el mismo número IMMEX
        const existeIMMEXQuery = `SELECT * FROM info_empresa WHERE no_immex = $1`;
        const existeIMMEXResult = await pool.query(existeIMMEXQuery, [envioEmpresa.no_immex]);

        if (existeIMMEXResult.rows.length > 0) {
            return res.status(400).json({ message: "Ya existe una empresa con ese número IMMEX." });
        }

        // Insertar si no existen duplicados
        const envioEmpresaQuery = `
            INSERT INTO info_empresa 
            (rfc_empresa, razon_social, no_immex, fecha_registro, nombre)
            VALUES ($1, $2, $3, $4, $5)
        `;
        const envioEmpresaValues = [
            envioEmpresa.rfc,
            envioEmpresa.razonSocial,
            envioEmpresa.no_immex,
            fechaAhora,
            envioEmpresa.nombre,
        ];

        await pool.query(envioEmpresaQuery, envioEmpresaValues);
        res.status(200).json({ message: "Empresa registrada con éxito." });

    } catch (error) {
        console.error("Error al registrar la empresa:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};


//Enviar empresa
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

//Registrar Domicilio
export const RegistroDomi = async (req, res) => {
    try {
        const envioDomicilio = req.body;

        // Verificar si ya existe un domicilio con el mismo nombre para la misma empresa
        const checkDomicilioQuery = `
            SELECT * FROM domicilios 
            WHERE id_empresa = $1 AND domicilio = $2
        `;
        const checkDomicilioValues = [envioDomicilio.empresaId, envioDomicilio.domicilio];

        const checkResult = await pool.query(checkDomicilioQuery, checkDomicilioValues);

        // Si ya existe un domicilio, devolver un error
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: "Este domicilio ya está registrado para esta empresa." });
        }

        // Si no existe, proceder a insertar el nuevo domicilio
        const envioDomicilioQuery = `
            INSERT INTO domicilios
            (id_empresa, domicilio, tipo_de_domicilio)
            VALUES 
            ($1, $2, $3)
        `;
        const envioDomicilioValues = [
            envioDomicilio.empresaId,
            envioDomicilio.domicilio,
            envioDomicilio.tipo_domi,
        ];

        await pool.query(envioDomicilioQuery, envioDomicilioValues);

        res.status(201).json({ message: "Domicilio registrado exitosamente." });

    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

//Informacion de domicilio
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

//Registrar usuario
export const RegistroUsuario = async (req, res) => {
    try {
        const envioUsuario = req.body;

        // Verificar si ya existe un usuario con el mismo correo
        const correoExisteQuery = `SELECT 1 FROM cuenta_usuario WHERE corrreo = $1`;
        const { rows } = await pool.query(correoExisteQuery, [envioUsuario.correo]);

        if (rows.length > 0) {
            return res.status(400).json({ error: "El correo ya está registrado." });
        }

        const envioUsuarioQuery = `
            INSERT INTO cuenta_usuario
            (id_empresa, nombre, corrreo, telefono, contraseña, tipo_de_cuenta, id_domicilio)
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7)
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
        await pool.query(envioUsuarioQuery, envioUsuarioValues);

        res.status(200).json({ message: "Usuario registrado exitosamente" });
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};


//Ver Domicilios
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