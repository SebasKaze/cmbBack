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
        const { id_usuario, id_empresa, nombre_usuario, seccion1, seccion2, seccion3, seccion4, seccion5, seccion6, seccion7, contribuciones, CuadroLiquidacion, } = req.body;

        // **Insertar en pedimento (tabla principal)**
        const pedimentoQuery = `
            INSERT INTO pedimento (no_pedimento, tipo_oper, clave_ped, id_empresa, id_user, nombre, fecha_hora)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING no_pedimento;
        `;
        const pedimentoValues = [
            seccion1.noPedimento,
            seccion1.tipoOperacion,
            seccion1.clavePedi,
            id_empresa,
            id_usuario,
            nombre_usuario
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
                    seccion7.sec, 
                    seccion7.fraccion, 
                    seccion7.Subd, 
                    seccion7.vinc, 
                    seccion7.MetS7P, 
                    seccion7.UMCS7P, 
                    seccion7.CantiUMCS7P, 
                    seccion7.UMTS7P, 
                    seccion7.CantiUMTS7P,
                    seccion7.PVCS7P, 
                    seccion7.PODS7P, 
                    seccion7.DescS7P, 
                    seccion7.VALADUS7P, 
                    seccion7.IMPOPRES7P, 
                    seccion7.PRECIOUNITS7P, 
                    seccion7.VALAGRES7P, 
                    seccion7.MarcaS7P, 
                    seccion7.ModeloS7P, 
                    seccion7.CodigoProS7P, 
                    seccion7.ObserS7P
                ];
            
                const seccion7Result = await client.query(seccion7Query, seccion7Values);
                const id_partida = seccion7Result.rows[0].id_partida; // Obtener el ID generado
            
                if (seccion7.contributions && seccion7.contributions.length > 0) {
                    const contribucionQuery = `
                        INSERT INTO parti_contr (
                            con, tasa, t_t, f_p, importe, id_partida
                        ) VALUES ($1, $2, $3, $4, $5, $6);
                    `;
            
                    for (const contribucion of seccion7.contributions) {
                        const contribucionValues = [
                            contribucion.con, 
                            contribucion.tasa, 
                            contribucion.tt, 
                            contribucion.fp, 
                            contribucion.importe,
                            id_partida
                        ];
                        await client.query(contribucionQuery, contribucionValues);
                    }
                }
            }
        }
        
        //Tasas a nivel de pedimento
        if (contribuciones && contribuciones.length > 0) {
            const contribucionQuery = `
                INSERT INTO tasa_pedi (
                    contribucion, cv_t_tasa, tasa, no_pedimento
                ) VALUES ($1, $2, $3, $4);
            `;

            for (const contribucion of contribuciones) {
                const contribucionValues = [
                    contribucion.contribucion,             
                    contribucion.clave,
                    contribucion.tasa || 0,
                    insertedNoPedimento
                ];
                await client.query(contribucionQuery, contribucionValues);
            }
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