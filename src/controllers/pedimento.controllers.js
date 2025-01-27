import { pool } from '../db.js';

export const envioPedimento = async  (req, res) => {
    const data = req.body;
    console.log("Datos recibidos en el backend:", req.body); // Aquí procesas los datos
    res.status(200).send({ message: "Datos recibidos correctamente" });
};