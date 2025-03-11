import { pool } from '../db.js';
export const envioPedimento = async (req, res) => {
    const data = req.body;
    console.log("Datos recibidos en el backend:", JSON.stringify(data, null, 2));

    let client;
    try {
        // Conectar con la base de datos y comenzar transacción
        client = await pool.connect();
        await client.query("BEGIN");

        // Desestructuración de datos recibidos
        const { id_usuario, id_empresa, nombre_usuario, id_domicilio, seccion1, seccion2, seccion3, seccion4, seccion5, seccion6, seccion7, contribuciones, CuadroLiquidacion, } = req.body;

        // **Insertar en pedimento (tabla principal)**
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
        // Se inserta el pedimento y se obtiene el no_pedimento insertado
        const { rows } = await client.query(pedimentoQuery, pedimentoValues);
        const insertedNoPedimento = rows[0].no_pedimento;

        // **Verificación del pedimento insertado**
        if (!insertedNoPedimento) {
            throw new Error("No se pudo obtener el no_pedimento. Cancelando transacción.");
        }

        // **Si el pedimento se insertó correctamente, se procede con el resto de tablas**
        console.log("Pedimento insertado correctamente con no_pedimento:", insertedNoPedimento);

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
                // Consulta para insertar en la tabla 'partidas'
                const seccion7Query = `
                    INSERT INTO partidas (
                        no_pedimento, sec, fraccion, subd, vinc, met_val, umc, cantidad_umc, umt, 
                        cantidad_umt, pvc, pod, descri, val_adu, imp_precio_pag, precio_unit, 
                        val_agreg, marca, modelo, codigo_produ, obser
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                    RETURNING id_partida;
                `;
        
                // Valores a insertar en 'partidas'
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
        
                // Verificar datos antes de la inserción
                console.log("Consulta INSERT partidas:", seccion7Query);
                console.log("Valores INSERT partidas:", seccion7Values);
        
                // Insertar la partida en la base de datos
                const seccion7Result = await client.query(seccion7Query, seccion7Values);
        
                // Verificar si se obtuvo un ID válido
                if (!seccion7Result.rows || seccion7Result.rows.length === 0) {
                    console.error("❌ Error: No se obtuvo un id_partida después de la inserción.");
                    continue; // Saltar esta iteración si no hay id_partida
                }
        
                const id_partida = seccion7Result.rows[0].id_partida;
                console.log("✅ ID de partida insertado:", id_partida);
        
                // Si hay contribuciones asociadas a esta partida
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
        
                    console.log("Consulta INSERT contribuciones:", contribucionesQuery);
                    console.log("Valores INSERT contribuciones:", contribucionesValues);
        
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
        //Cuadros de Liquidacion
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

        const encaPPush = await client.query(encaPQuery, encaPValues); 
        const encaSecPush = await client.query(encaSecQuery, encaSecValues);
        const datosProveComPush = await client.query(datosProveComQuery, datosProveComValues);
        const datosDestiPush = await client.query(datosDestiQuery, datosDestiValues);
        const datosTransPush = await client.query(datosTransQuery, datosTransValue);
        const candadosPush = await client.query(candadosQuery, candadosValue);
        const totalesPush = await client.query(totalesQuery, totalesValues);
        
        // **Confirmar la transacción**
        await client.query("COMMIT");
        console.log("Pedimento y datos relacionados insertados correctamente");
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
    console.log("Datos recibidos en el backend:", JSON.stringify(data, null, 2));
    const { no_pedimento } = req.body;
    console.log("Valor de no_pedimento:", no_pedimento); // Verifica si llega el valor

if (!no_pedimento) {
    return res.status(400).json({ error: "El número de pedimento es requerido" });
}

    let client;
    try {
        // Conectar con la base de datos y comenzar transacción
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

        // 2. Actualizar registros existentes en partidas
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
                        item.id_partida, id_pedimento
                    ]
                );
            }
        }

        // 3. Insertar nuevas partidas
        if (data.seccion7?.added?.length > 0) {
            for (const item of data.seccion7.added) {
                await client.query(
                    `INSERT INTO partidas (
                        no_pedimento, sec, fraccion, subd, vinc, met_val, umc, cantidad_umc, umt, 
                        cantidad_umt, pvc, pod, descri, val_adu, imp_precio_pag, precio_unit, 
                        val_agreg, marca, modelo, codigo_produ, obser
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
                    [
                        id_pedimento, item.sec, item.fraccion, item.subd, item.vinc, item.met_val, 
                        item.umc, item.cantidad_umc, item.umt, item.cantidad_umt, item.pvc, item.pod, 
                        item.descri, item.val_adu, item.imp_precio_pag, item.precio_unit, 
                        item.val_agreg, item.marca, item.modelo, item.codigo_produ, item.obser
                    ]
                );
            }
        }

        // 4. Eliminar partidas
        if (data.seccion7?.removed?.length > 0) {
            for (const idPartida of data.seccion7.removed) {
                await client.query(
                    "DELETE FROM partidas WHERE id_partida = $1 AND no_pedimento = $2",
                    [idPartida, id_pedimento]
                );
            }
        }

        // 5. Manejo de contribuciones
        if (data.contribuciones?.added?.length > 0) {
            for (const item of data.contribuciones.added) {
                await client.query(
                    `INSERT INTO tasa_pedi (contribucion, cv_t_tasa, tasa, no_pedimento) 
                    VALUES ($1, $2, $3, $4)`,
                    [item.contribucion, item.clave, item.tasa, id_pedimento]
                );
            }
        }

        if (data.contribuciones?.modified?.length > 0) {
            for (const item of data.contribuciones.modified) {
                await client.query(
                    `UPDATE tasa_pedi SET contribucion = $1, cv_t_tasa = $2, tasa = $3 
                    WHERE id_tasa = $4 AND no_pedimento = $5`,
                    [item.contribucion, item.clave, item.tasa, item.id_tasa, id_pedimento]
                );
            }
        }

        if (data.contribuciones?.removed?.length > 0) {
            for (const idTasa of data.contribuciones.removed) {
                await client.query(
                    "DELETE FROM tasa_pedi WHERE id_tasa = $1 AND no_pedimento = $2",
                    [idTasa, id_pedimento]
                );
            }
        }

        // 6. Manejo del cuadro de liquidación
        if (data.cuadroLiquidacion?.added?.length > 0) {
            for (const item of data.cuadroLiquidacion.added) {
                await client.query(
                    `INSERT INTO cua_liqui (concepto, forma_pago, importe, no_pedimento) 
                    VALUES ($1, $2, $3, $4)`,
                    [item.concepto, item.formaPago, item.importe, id_pedimento]
                );
            }
        }

        if (data.cuadroLiquidacion?.modified?.length > 0) {
            for (const item of data.cuadroLiquidacion.modified) {
                await client.query(
                    `UPDATE cua_liqui SET concepto = $1, forma_pago = $2, importe = $3 
                    WHERE id_cua = $4 AND no_pedimento = $5`,
                    [item.concepto, item.formaPago, item.importe, item.id_cua, id_pedimento]
                );
            }
        }

        if (data.cuadroLiquidacion?.removed?.length > 0) {
            for (const idCua of data.cuadroLiquidacion.removed) {
                await client.query(
                    "DELETE FROM cua_liqui WHERE id_cua = $1 AND no_pedimento = $2",
                    [idCua, id_pedimento]
                );
            }
        }

        await client.query("COMMIT"); // Confirmar la transacción

        return res.status(200).json({ message: "Pedimento actualizado exitosamente." });

    } catch (error) {
        await client.query("ROLLBACK"); // Revertir la transacción en caso de error
        console.error("Error al editar pedimento:", error);
        return res.status(500).json({ error: "Error al editar el pedimento" });
    } finally {
        client.release(); // Liberar el cliente de la base de datos
    }
};