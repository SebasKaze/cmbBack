import { pool } from '../db.js';
//GET Cuentas
export const getCuentas = async (req,res)=>{
    const { rows } = await pool.query("SELECT * FROM cuenta_usuario");
    res.json(rows);
};
//GET Cuenta especifica
export const getCuenta = async (req,res)=>{
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM cuenta_usuario WHERE id_usuario = $1", [id]);
    
    if(rows.length === 0){
        return res.status(404).json({ message: "User not found"});
    }
    res.json(rows[0]);
};
//POST Crear Cuenta
export const crearCuenta = async (req,res)=>{
    const data = req.body;
    const { rows } = await pool.query(
        "INSERT INTO cuenta_usuario (id_empresa,nombre,corrreo,telefono,contraseña,tipo_de_cuenta) VALUES ($1,$2,$3,$4,$5,$6) RETURNING * ",
        [data.id_empresa,data.nombre,data.corrreo,data.telefono,data.contraseña,data.tipo_de_cuenta]
    );
    return res.json(rows[0]);
};
//DELATE borrar cuenta
export const borrarCuenta = async (req,res)=>{
    const { id } = req.params;
    const { rowCount } = await pool.query(
        "DELETE FROM cuenta_usuario WHERE id_usuario = $1 RETURNING *",
        [id]
    );
    if(rowCount === 0){
        return res.status(404).json({message: "User not found"});
    }
    return res.sendStatus(204);
};
//PUT Cambiar cuenta
export const putCuenta = async (req,res)=>{
    const { id } = req.params;
    const data = req.body;

    const { rows } = await pool.query(
        "UPDATE cuenta_usuario SET id_empresa = $1,nombre = $2,corrreo = $3,telefono = $4,contraseña = $5,tipo_de_cuenta = $6 RETURNING *",
        [data.id_empresa,data.nombre,data.correo,data.telefono,data.contraseña,data.tipo_de_cuenta]
    );
    return res.json(rows[0]);
};


//Control para login 
export const loginCuenta = async (req, res) => {
    const data = req.body;

    console.log("Datos recibidos en el backend:", req.body);

    const { rows } = await pool.query(
        "SELECT * FROM cuenta_usuario WHERE corrreo = $1 AND contraseña = $2",
        [data.email, data.password]
    );

    console.log("Contenido de rows:", rows);

    if (rows.length > 0) {
        res.status(200).json({ message: "Login exitoso" });
    } else {
        res.status(401).json({ message: "Credenciales inválidas" });
    }
};
