import { pool } from '../db.js';
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const verPedimentos = async (req, res) => {
    const { id_empresa, id_domicilio } = req.query;

    if (!id_empresa || !id_domicilio) {
        return res.status(400).json({ message: "Faltan parámetros requeridos." });
    }

    try {
        const { rows } = await pool.query(
            `SELECT no_pedimento FROM pedimento WHERE id_empresa = $1 AND id_domicilio = $2`,
            [id_empresa, id_domicilio]
        );
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const subirArchivos = async (req, res) => {
    res.json({ message: "Datos recibidos correctamente" });
};

export const envioPedimento = async (req, res) => {
    const data = req.body;
    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const { id_usuario, id_empresa, nombre_usuario, id_domicilio, seccion1, seccion2, seccion3, seccion4, seccion5, seccion6, seccion7, contribuciones, CuadroLiquidacion, } = req.body;
        const pedimentoQuery = `
            INSERT INTO pedimento (no_pedimento, tipo_oper, clave_ped, id_empresa, id_user, nombre, fecha_hora,id_domicilio)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(),$7)
            RETURNING no_pedimento;
        `;
        const pedimentoValues = [
            seccion1.noPedimento,
            seccion1.tipoOperacion,
            seccion1.clavePedi,
            id_empresa,
            id_usuario,
            nombre_usuario,
            id_domicilio
        ];
        const { rows } = await client.query(pedimentoQuery, pedimentoValues);
        const insertedNoPedimento = rows[0].no_pedimento;

        if (!insertedNoPedimento) {
            throw new Error("No se pudo obtener el no_pedimento. Cancelando transacción.");
        }

        const encaPQuery = `
                INSERT INTO encabezado_p_pedimento (
                no_pedimento, regimen, des_ori, tipo_cambio, peso_bruto, aduana_e_s, medio_transpo, 
                medio_transpo_arri, medio_transpo_sali, valor_dolares, valor_aduana, precio_pagado,
                rfc_import_export, curp_import_export, razon_so_im_ex, domicilio_im_ex, val_seguros,
                seguros, fletes, embalajes, otros_incremen, transpo_decremen, seguro_decremen, carga_decemen,
                desc_decremen, otro_decremen, acuse_electroni_val, codigo_barra, clv_sec_edu_despacho,
                total_bultos, fecha_en, feca_sal)
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 
                    $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
                    RETURNING *;
                `;
        //seccion 1
        const encaPValues = [
            insertedNoPedimento,
            seccion1.regimen,
            seccion1.dest_ori || 0,
            seccion1.tipoCambio,
            seccion1.pesoBruto,
            seccion1.aduanaES,
            seccion1.m_trans,
            seccion1.m_trans_arr,
            seccion1.m_trans_sa,
            seccion1.valorDolares,
            seccion1.valorAduana,
            seccion1.precioPagado,
            seccion1.rfc_impo_expo,
            seccion1.curp_impo_expo,
            seccion1.razonSocial,
            seccion1.domImpoExpo,
            seccion1.valSeguros,
            seccion1.seguros,
            seccion1.fletes,
            seccion1.embalajes,
            seccion1.otrosInc,
            seccion1.transDecre,
            seccion1.transDecre,
            seccion1.cargaDecre,
            seccion1.descargaDecre,
            seccion1.otrosDecre,
            seccion1.acuseEle,
            seccion1.codigoBarras,
            seccion1.claveSecAdu,
            seccion1.marcas,
            seccion1.fechaEntrada,
            seccion1.fechaSalida,
        ];
        //seccion 2
        const encaSecQuery = `
                INSERT INTO encabezado_sec_pedimento (
                    rfc_import_export, curp_import_export, no_pedimento)
                    VALUES (
                    $1, $2, $3)
                    RETURNING *;
                `;
        const encaSecValues = [
            seccion2.rfcImportador,
            seccion2.curpImpo,
            insertedNoPedimento,
        ];
        //seccion 3
        const datosProveComQuery = `
                INSERT INTO datos_proveedor_comprador (
                    id_fiscal, nom_razon_social, domicilio, vinculacion, no_cfdi, fecha_factu, incoterm, moneda_fact, val_mon_fact, factor_mon_fact, val_dolares, no_pedimento)
                    VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *;
                `;
        const datosProveComValues = [
            seccion3.idFiscalSec3,
            seccion3.razonSocialImpoExpo,
            seccion3.DomSec3,
            seccion3.Vinculacion,
            seccion3.numCDFI,
            seccion3.fechaSec3,
            seccion3.INCOTERM,
            seccion3.moneadaFact,
            seccion3.valMonFact,
            seccion3.factorMonFact,
            seccion3.valDolares,
            insertedNoPedimento,
        ];
        //seccion 4
        const datosDestiQuery = `
                INSERT INTO datos_d (
                    id_fiscal, nom_d_d, dom_d_d, no_pedimento)
                    VALUES (
                    $1, $2, $3, $4)
                    RETURNING *;
                `;
        const datosDestiValues = [
            seccion4.idFiscalSec4,
            seccion4.razonSocialImpoExpoSec4,
            seccion4.DomSec4,
            insertedNoPedimento
        ];
        //seccion 5
        const datosTransQuery = `
                INSERT INTO datos_transport (
                    identificacion, pais, transportista, rfc_transportista, curp_transportista, domicilio_transportista, no_pedimento)
                    VALUES (
                    $1, $2, $3, $4, $5, $6, $7)
                    RETURNING *;
                `;
        const datosTransValue = [
            seccion5.identifiSec5,
            seccion5.paisSec5,
            seccion5.transSec5,
            seccion5.rfcSec5,
            seccion5.curpSec5,
            seccion5.domSec5,
            insertedNoPedimento
        ];
        //seccion 6
        const candadosQuery = `
                INSERT INTO candados (
                    numero_candado, revision1, revision2, no_pedimento)
                    VALUES (
                    $1, $2, $3, $4)
                    RETURNING *;
                `;
        const candadosValue = [
            seccion6.numCandado,
            seccion6.rev1,
            seccion6.rev2,
            insertedNoPedimento
        ];
        //seccion 7
        if (seccion7 && seccion7.length > 0) {
            for (const seccion of seccion7) {
                const seccion7Query = `
                    INSERT INTO partidas (
                        no_pedimento, sec, fraccion, subd, vinc, met_val, umc, cantidad_umc, umt, 
                        cantidad_umt, pvc, pod, descri, val_adu, imp_precio_pag, precio_unit, 
                        val_agreg, marca, modelo, codigo_produ, obser
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                    RETURNING id_partida;
                `;
                const seccion7Values = [
                    insertedNoPedimento, 
                    seccion.sec, 
                    seccion.fraccion || null, 
                    seccion.subd || null, 
                    seccion.vinc || null, 
                    seccion.MetS7P || null, 
                    seccion.UMCS7P || null, 
                    seccion.CantiUMCS7P || null, 
                    seccion.UMTS7P || null, 
                    seccion.CantiUMTS7P || null,
                    seccion.PVCS7P || null, 
                    seccion.PODS7P || null, 
                    seccion.DescS7P || null, 
                    seccion.VALADUS7P || null, 
                    seccion.IMPOPRES7P || null, 
                    seccion.PRECIOUNITS7P || null, 
                    seccion.VALAGRES7P || null, 
                    seccion.MarcaS7P || null, 
                    seccion.ModeloS7P || null, 
                    seccion.CodigoProS7P || null, 
                    seccion.ObserS7P || null
                ];
                const seccion7Result = await client.query(seccion7Query, seccion7Values);
                const saldoQuery = `
                    INSERT INTO saldo (no_pedimento, cantidad, tipo_saldo, estado, fraccion, fecha_sal)
                    VALUES ($1,$2,$3,$4,$5,$6)
                    RETURNING id_saldo;
                `;
                const saldoValues = [
                    insertedNoPedimento,
                    seccion.CantiUMTS7P,
                    1,
                    1,  
                    seccion.fraccion,
                    seccion1.fechaSalida,
                ];
                const saldoResult = await client.query(saldoQuery,saldoValues);
                const idSaldo = saldoResult.rows[0].id_saldo; // Obtener el id_saldo
                const restaQuery = `
                    INSERT INTO resta_saldo_mu (id_saldo, no_pedimento,restante)
                    VALUES ($1, $2, $3)
                `; 
                const restaValues = [
                    idSaldo,
                    insertedNoPedimento,
                    seccion.CantiUMTS7P,
                ];
                await client.query(restaQuery,restaValues);

                if (!seccion7Result.rows || seccion7Result.rows.length === 0) {
                    console.error("Error: No se obtuvo un id_partida después de la inserción.");
                    continue;
                }
        
                const id_partida = seccion7Result.rows[0].id_partida;

                if (seccion.contributions && seccion.contributions.length > 0) {
                    const contribucionesValues = [];
                    const placeholders = [];
                    seccion.contributions.forEach((contribucion, index) => {
                        const offset = index * 6;
                        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
                        contribucionesValues.push(
                            contribucion.con || null, 
                            contribucion.tasa || 0, 
                            contribucion.tt || null, 
                            contribucion.fp || null, 
                            contribucion.importe || 0,
                            id_partida
                        );
                    });
                    const contribucionesQuery = `
                        INSERT INTO parti_contr (con, tasa, t_t, f_p, importe, id_partida)
                        VALUES ${placeholders.join(", ")};
                    `;
                    await client.query(contribucionesQuery, contribucionesValues);
                }
            }
        }
        
        //Tasas a nivel de pedimento
        if (contribuciones && contribuciones.length > 0) {
            const tasasValues = [];
            const placeholdersTasas = [];
            contribuciones.forEach((contribucion, index) => {
                const offset = index * 4;
                placeholdersTasas.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
                tasasValues.push(
                    contribucion.contribucion,              
                    contribucion.clave,
                    contribucion.tasa || 0,
                    insertedNoPedimento
                );
            });
            const tasasQuery = `
                INSERT INTO tasa_pedi (contribucion, cv_t_tasa, tasa, no_pedimento)
                VALUES ${placeholdersTasas.join(", ")};
            `;
            await client.query(tasasQuery, tasasValues);
        }

        if (CuadroLiquidacion && CuadroLiquidacion.length > 0) {
            const cuadroLiQuery = `
                INSERT INTO cua_liqui (
                    concepto, forma_pago, importe, no_pedimento
                ) VALUES ($1, $2, $3, $4);
            `;

            for (const cuadroLi of CuadroLiquidacion) {
                const cuadroLiValues = [
                    cuadroLi.concepto,             
                    cuadroLi.formaPago || 0,
                    cuadroLi.importe || 0,
                    insertedNoPedimento
                ];
                await client.query(cuadroLiQuery, cuadroLiValues);
            }
        }

        const totalesQuery = `
                INSERT INTO totales (
                    efectivo, otros, total, no_pedimento)
                    VALUES (
                    $1, $2, $3, $4)
                    RETURNING *;
                `;
        const totalesValues = [
            seccion1.efec,
            seccion1.otros,
            seccion1.total,
            insertedNoPedimento
        ];

        await client.query(encaPQuery, encaPValues); 
        await client.query(encaSecQuery, encaSecValues);
        await client.query(datosProveComQuery, datosProveComValues);
        await client.query(datosDestiQuery, datosDestiValues);
        await client.query(datosTransQuery, datosTransValue);
        await client.query(candadosQuery, candadosValue);
        await client.query(totalesQuery, totalesValues);
        await client.query("COMMIT");
        res.status(201).json({ message: "Pedimento insertado correctamente", no_pedimento: insertedNoPedimento });
    } catch (error) {

        if (client) await client.query("ROLLBACK");
        console.error("Error al insertar pedimento:", error);
        
        if (!res.headersSent) {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
};

export const editarPedimento = async (req, res) => {
    const data = req.body;
    const { no_pedimento } = req.body;

    if (!no_pedimento) {
        return res.status(400).json({ error: "El número de pedimento es requerido" });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const pedimento = await client.query(
            "SELECT * FROM pedimento WHERE no_pedimento = $1",
            [parseInt(no_pedimento, 10)]        
        );
        
        if (pedimento.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Pedimento no encontrado" });
        }

        // Actualizar partidas
        if (data.seccion7?.modified?.length > 0) {
            for (const item of data.seccion7.modified) {
                await client.query(
                    `UPDATE partidas SET 
                        sec = $1, fraccion = $2, subd = $3, vinc = $4, met_val = $5, umc = $6, cantidad_umc = $7, 
                        umt = $8, cantidad_umt = $9, pvc = $10, pod = $11, descri = $12, val_adu = $13, 
                        imp_precio_pag = $14, precio_unit = $15, val_agreg = $16, marca = $17, modelo = $18, 
                        codigo_produ = $19, obser = $20
                    WHERE id_partida = $21 AND no_pedimento = $22`,
                    [
                        item.sec, item.fraccion, item.subd, item.vinc, item.met_val, item.umc, 
                        item.cantidad_umc, item.umt, item.cantidad_umt, item.pvc, item.pod, 
                        item.descri, item.val_adu, item.imp_precio_pag, item.precio_unit, 
                        item.val_agreg, item.marca, item.modelo, item.codigo_produ, item.obser, 
                        item.id_partida, no_pedimento
                    ]
                );
            }
        }

        //Insertar nuevas partidas
        if (data.seccion7?.added?.length > 0) {
            for (const item of data.seccion7.added) {
                await client.query(
                    `INSERT INTO partidas (
                        no_pedimento, sec, fraccion, subd, vinc, met_val, umc, cantidad_umc, umt, 
                        cantidad_umt, pvc, pod, descri, val_adu, imp_precio_pag, precio_unit, 
                        val_agreg, marca, modelo, codigo_produ, obser
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
                    [
                        no_pedimento, item.sec, item.fraccion, item.subd, item.vinc, item.met_val, 
                        item.umc, item.cantidad_umc, item.umt, item.cantidad_umt, item.pvc, item.pod, 
                        item.descri, item.val_adu, item.imp_precio_pag, item.precio_unit, 
                        item.val_agreg, item.marca, item.modelo, item.codigo_produ, item.obser
                    ]
                );
            }
        }

        //Eliminar partidas
        if (data.seccion7?.removed?.length > 0) {
            for (const idPartida of data.seccion7.removed) {
                await client.query(
                    "DELETE FROM partidas WHERE id_partida = $1 AND no_pedimento = $2",
                    [idPartida, no_pedimento]
                );
            }
        }

        //Agregar contribuciones
        if (data.contribuciones?.added?.length > 0) {
            for (const item of data.contribuciones.added) {
                await client.query(
                    `INSERT INTO tasa_pedi (contribucion, cv_t_tasa, tasa, no_pedimento) 
                    VALUES ($1, $2, $3, $4)`,
                    [item.contribucion, item.clave, item.tasa, no_pedimento]
                );
            }
        }

        //Actualizar contribuciones
        if (data.contribuciones?.modified?.length > 0) {
            for (const item of data.contribuciones.modified) {
                await client.query(
                    `UPDATE tasa_pedi SET contribucion = $1, cv_t_tasa = $2, tasa = $3 
                    WHERE id_tasa = $4 AND no_pedimento = $5`,
                    [item.contribucion, item.clave, item.tasa, item.id_tasa, no_pedimento]
                );
            }
        }

        //Eliminar contribuciones
        if (data.contribuciones?.removed?.length > 0) {
            for (const idTasa of data.contribuciones.removed) {
                await client.query(
                    "DELETE FROM tasa_pedi WHERE id_tasa = $1 AND no_pedimento = $2",
                    [idTasa, no_pedimento]
                );
            }
        }

        // Agregar cuadros de liquidacion
        if (data.cuadroLiquidacion?.added?.length > 0) {
            for (const item of data.cuadroLiquidacion.added) {
                await client.query(
                    `INSERT INTO cua_liqui (concepto, forma_pago, importe, no_pedimento) 
                    VALUES ($1, $2, $3, $4)`,
                    [item.concepto, item.formaPago, item.importe, no_pedimento]
                );
            }
        }

        //Actualizar cuadros de liquidacion
        if (data.cuadroLiquidacion?.modified?.length > 0) {
            for (const item of data.cuadroLiquidacion.modified) {
                await client.query(
                    `UPDATE cua_liqui SET concepto = $1, forma_pago = $2, importe = $3 
                    WHERE id_cua = $4 AND no_pedimento = $5`,
                    [item.concepto, item.formaPago, item.importe, item.id_cua, no_pedimento]
                );
            }
        }

        //Eliminar cuadros de liquidacion
        if (data.cuadroLiquidacion?.removed?.length > 0) {
            for (const idCua of data.cuadroLiquidacion.removed) {
                await client.query(
                    "DELETE FROM cua_liqui WHERE id_cua = $1 AND no_pedimento = $2",
                    [idCua, no_pedimento]
                );
            }
        }

        //Actualizar seccion 1
        if (data.seccion1) {
            await client.query(
                `UPDATE encabezado_p_pedimento 
                 SET 
                     regimen = $1,
                     des_ori = $2,
                     tipo_cambio = $3,
                     peso_bruto = $4,
                     aduana_e_s = $5,
                     medio_transpo = $6,
                     medio_transpo_arri = $7,
                     medio_transpo_sali = $8,
                     valor_dolares = $9,
                     valor_aduana = $10,
                     precio_pagado = $11,
                     rfc_import_export = $12,
                     curp_import_export = $13,
                     razon_so_im_ex = $14,
                     domicilio_im_ex = $15,
                     val_seguros = $16,
                     seguros = $17,
                     fletes = $18,
                     embalajes = $19,
                     otros_incremen = $20,
                     transpo_decremen = $21,
                     seguro_decremen = $22,
                     carga_decemen = $23,
                     desc_decremen = $24,
                     otro_decremen = $25,
                     acuse_electroni_val = $26,
                     codigo_barra = $27,
                     clv_sec_edu_despacho = $28,
                     total_bultos = $29,
                     fecha_en = $30,
                     feca_sal = $31
                 WHERE no_pedimento = $32`,
                [
                    data.seccion1.regimen, data.seccion1.des_ori, data.seccion1.tipo_cambio, 
                    data.seccion1.peso_bruto, data.seccion1.aduana_e_s, data.seccion1.medio_transpo,
                    data.seccion1.medio_transpo_arri, data.seccion1.medio_transpo_sali, 
                    data.seccion1.valor_dolares, data.seccion1.valor_aduana, data.seccion1.precio_pagado,
                    data.seccion1.rfc_import_export, data.seccion1.curp_import_export, 
                    data.seccion1.razon_so_im_ex, data.seccion1.domicilio_im_ex, data.seccion1.val_seguros,
                    data.seccion1.seguros, data.seccion1.fletes, data.seccion1.embalajes, 
                    data.seccion1.otros_incremen, data.seccion1.transpo_decremen, 
                    data.seccion1.seguro_decremen, data.seccion1.carga_decemen, 
                    data.seccion1.desc_decremen, data.seccion1.otro_decremen, 
                    data.seccion1.acuse_electroni_val, data.seccion1.codigo_barra, 
                    data.seccion1.clv_sec_edu_despacho, data.seccion1.total_bultos, 
                    data.seccion1.fecha_en, data.seccion1.feca_sal, 
                    no_pedimento
                ]
            );
            
        }
        
        //Actualizar seccion 2
        if (data.seccion2) {
            await client.query(
                `UPDATE encabezado_sec_pedimento 
                 SET rfc_import_export = $1, curp_import_export = $2 
                 WHERE no_pedimento = $3`,
                [data.seccion2.rfc_import_export, data.seccion2.curp_import_export, no_pedimento]
            );
        }
        
        //Actualizar seccion 3
        if (data.seccion3) {
            await client.query(
                `UPDATE datos_proveedor_comprador 
                 SET id_fiscal = $1, nom_razon_social = $2, domicilio = $3, vinculacion = $4, 
                     no_cfdi = $5, fecha_factu = $6, incoterm = $7, moneda_fact = $8, val_mon_fact = $9, 
                     factor_mon_fact = $10, val_dolares = $11 
                 WHERE no_pedimento = $12`,
                [
                    data.seccion3.id_fiscal, data.seccion3.nom_razon_social, data.seccion3.domicilio, 
                    data.seccion3.vinculacion, data.seccion3.no_cfdi, data.seccion3.fecha_factu, 
                    data.seccion3.incoterm, data.seccion3.moneda_fact, data.seccion3.val_mon_fact, 
                    data.seccion3.factor_mon_fact, data.seccion3.val_dolares, no_pedimento
                ]
            );
        }
        
        //Actualizar seccion 4
        if (data.seccion4) {
            await client.query(
                `UPDATE datos_d 
                 SET id_fiscal = $1, nom_d_d = $2, dom_d_d = $3 
                 WHERE no_pedimento = $4`,
                [data.seccion4.id_fiscal, data.seccion4.nom_d_d, data.seccion4.dom_d_d, no_pedimento]
            );
        }
        
        //Actualizar seccion 5
        if (data.seccion5) {
            await client.query(
                `UPDATE datos_transport 
                 SET identificacion = $1, pais = $2, transportista = $3, rfc_transportista = $4, 
                     curp_transportista = $5, domicilio_transportista = $6 
                 WHERE no_pedimento = $7`,
                [
                    data.seccion5.identificacion, data.seccion5.pais, data.seccion5.transportista, 
                    data.seccion5.rfc_transportista, data.seccion5.curp_transportista, data.seccion5.domicilio_transportista, 
                    no_pedimento
                ]
            );
        }
        
        //Actualizar seccion 6
        if (data.seccion6) {
            await client.query(
                `UPDATE candados 
                 SET numero_candado = $1, revision1 = $2, revision2 = $3 
                 WHERE no_pedimento = $4`,
                [data.seccion6.numero_candado, data.seccion6.revision1, data.seccion6.revision2, no_pedimento]
            );
        }
        
        await client.query(
            `INSERT INTO historial_cambios (id_user,no_pedimento, des_ori, fecha_hora)
             VALUES ($1, $2, $3, $4)`,
            [data.id_usuario,no_pedimento, data.nombre_usuario , new Date()]
        );
        await client.query("COMMIT");
        return res.status(200).json({ message: "Pedimento actualizado exitosamente." });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al editar pedimento:", error);
        return res.status(500).json({ error: "Error al editar el pedimento" });
    } finally {
        client.release();
    }
};