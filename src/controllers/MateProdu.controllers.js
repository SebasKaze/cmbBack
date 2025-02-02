import { pool } from '../db.js';

export const cargaMaterial = async (req,res)=>{
    const { rows } = await pool.query("SELECT * FROM cuenta_usuario");
    res.json(rows);
};


export const verMateriales = async (req, res) =>{
    
};