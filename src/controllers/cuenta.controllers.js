import { pool } from '../db.js';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

// POST Login y generación de token
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

        // Si no se encuentra el usuario
        if (rows.length === 0) {
            console.log(`Usuario con correo ${email} no encontrado.`);
            return res.status(401).json({ message: "Credenciales inválidas" });
        }
        const user = rows[0];
        if (user.contraseña !== password) {
            console.log("Contraseña incorrecta para el usuario:", email);
            return res.status(401).json({ message: "Credenciales inválidas" });
        }
        delete user.contraseña;
        const token = jwt.sign(
            {
                id_usuario: user.id_usuario,
                nombre_usuario: user.nombre_usuario,
                id_empresa: user.id_empresa,
                nombre_empresa: user.nombre_empresa,
                tipo_de_cuenta: user.tipo_de_cuenta,
                id_domicilio: user.id_domicilio,
            },
            SECRET_KEY,
            { expiresIn: "2h" }
        );
        // Enviar el token
        res.status(200).json({ token });
    } catch (error) {
        console.error("Error en la autenticación:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
export { verifyToken };