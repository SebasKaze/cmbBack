import { pool } from '../db.js';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';
import { notifyLogout } from '../socketManager.js';


const SECRET_KEY = "asdfgds";

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token no válido.' });
    }
};
// Middleware para verificar el tipo de usuario
export const allowOnlyTipo1 = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        if (decoded.tipo_de_cuenta !== 1) {
            return res.status(403).json({ message: "No tienes permisos para realizar esta acción." });
        }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token no válido.' });
    }
};

export const loginCuenta = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { rows } = await pool.query(
            `SELECT 
                u.id_usuario, 
                u.nombre AS nombre_usuario, 
                u.id_empresa, 
                e.nombre AS nombre_empresa, 
                u.contraseña,
                u.tipo_de_cuenta,
                u.id_domicilio
                FROM cuenta_usuario u
                JOIN info_empresa e ON u.id_empresa = e.id_empresa
            WHERE u.corrreo = $1`,
            [email]
        );

        if (rows.length === 0) return res.status(401).json({ message: "Credenciales inválidas" });

        const user = rows[0];
        if (user.contraseña !== password) return res.status(401).json({ message: "Credenciales inválidas" });

        delete user.contraseña;

        const token = jwt.sign({
            id_usuario: user.id_usuario,
            nombre_usuario: user.nombre_usuario,
            id_empresa: user.id_empresa,
            nombre_empresa: user.nombre_empresa,
            tipo_de_cuenta: user.tipo_de_cuenta,
            id_domicilio: user.id_domicilio,
        }, SECRET_KEY, { expiresIn: "2h" });

        // ⚠️ Notificar a través de WebSocket y cerrar sesión anterior
        notifyLogout(user.id_usuario);

        res.status(200).json({ token });
    } catch (error) {
        console.error("Error en la autenticación:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const EnvioContacto = async(req,res) =>{
    const datos = req.body
    console.log("Datos recibidos Envio materiales:", JSON.stringify(datos, null, 2));
    const { name, company, email, phone, message } = req.body;
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: '12sespinozagh@gmail.com',
            pass: 'vvyl ghnx npck vcqg', // O usa un App Password si tienes 2FA
        },
    });

    const mailOptions = {
        from: email,
        to: 'yaelgarciamoguel@gmail.com',
        subject: `Nuevo mensaje de contacto de ${name}`,
        text: `Nombre: ${name}\nEmpresa: ${company}\nCorreo: ${email}\nTeléfono: ${phone}\nMensaje: ${message}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send("Correo enviado");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al enviar el correo");
    }
}
export { verifyToken };