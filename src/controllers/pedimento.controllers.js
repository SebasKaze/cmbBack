import { pool } from '../db.js';

export const envioPedimento = async  (req, res) => {
    const data = req.body;
    console.log("Datos recibidos en el backend:", JSON.stringify(data, null, 2));

    
    try{
        const { seccion1 , seccion2 , seccion3 , seccion4 , seccion5 , seccion6 , contribuciones , CuadroLiquidacion} = req.body;
        const pedimentoQuery = `
                INSERT INTO pedimento (
                    no_pedimento, tipo_oper, clave_ped, id_empresa, id_user, nombre,fecha_hora)
                    VALUES (
                    $1, $2, $3, $4, $5, $6, $7)
                    RETURNING *;
                    `;
        const pedimentoValues = [
            seccion1.noPedimento,
            seccion1.tipoOperacion,
            seccion1.clavePedi,
            2,
            1,
            "sebas",
            new Date()
        ];
        
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
        const encaPValues = [
            seccion1.noPedimento,
            seccion1.regimen,
            seccion1.dest_ori,
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
            seccion1.transDecre, // Arreglar esto en los name del Frontend
            seccion1.cargaDecre,
            seccion1.descargaDecre,
            seccion1.otrosDecre,
            seccion1.acuseEle, //En el json llegan de manera direfente
            seccion1.codigoBarras,
            seccion1.claveSecAdu,
            seccion1.marcas, // En BD es total de bultos
            seccion1.fechaEntrada,
            seccion1.fechaSalida,
        ];
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
            seccion1.noPedimento,
        ];
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
            seccion1.noPedimento,
        ];
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
            seccion1.noPedimento
        ];
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
            seccion1.noPedimento
        ];
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
            seccion1.noPedimento
        ];

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
                    contribucion.tasa,
                    seccion1.noPedimento    // Relación con el pedimento
                ];
                await pool.query(contribucionQuery, contribucionValues);
            }
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
                    cuadroLi.formaPago,
                    cuadroLi.importe,
                    seccion1.noPedimento    // Relación con el pedimento
                ];
                await pool.query(cuadroLiQuery, cuadroLiValues);
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
            seccion1.noPedimento
        ];


        //const pedimentoPush = await pool.query(pedimentoQuery, pedimentoValues); //Envio a pedimento
        const encaPPush = await pool.query(encaPQuery, encaPValues); //Envio a encabezado_p_pedimento
        const encaSecPush = await pool.query(encaSecQuery, encaSecValues); //Envio a encabezado_sec_pedimento
        const datosProveComPush = await pool.query(datosProveComQuery, datosProveComValues); //Envio a datos_proveedor_comprador
        const datosDestiPush = await pool.query(datosDestiQuery, datosDestiValues); //Envio a datos_d
        const datosTransPush = await pool.query(datosTransQuery, datosTransValue); //Envio a datos_transport
        const candadosPush = await pool.query(candadosQuery, candadosValue); //Envio a candados
        const totalesPush = await pool.query(totalesQuery, totalesValues); //Envio a totales
        
        async function insertarSeccion7(pool, id_pedimento, seccion7Data) {
            for (const seccion of seccion7Data) {
                // 1️⃣ Insertar en `seccion7_pedimento`
                const seccion7Query = `
                    INSERT INTO partidas (
                        no_pedimento, sec, fraccion, subd, vinc, met_val, umc, cantidad_umc, umt, 
                        cantidad_umt, pvc, pod, descri, val_adu, imp_precio_pag, precio_unit, 
                        val_agreg, marca, modelo, codigo_produ, obser
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                    RETURNING id_partida;
                `;
        
                const seccion7Values = [
                    id_pedimento, seccion.sec, seccion.fraccion, seccion.Subd, seccion.vinc, seccion.MetS7P, 
                    seccion.UMCS7P, seccion.CantiUMCS7P, seccion.UMTS7P, seccion.CantiUMTS7P,
                    seccion.PVCS7P, seccion.PODS7P, seccion.DescS7P, seccion.VALADUS7P, 
                    seccion.IMPOPRES7P, seccion.PRECIOUNITS7P, seccion.VALAGRES7P, seccion.MarcaS7P, 
                    seccion.ModeloS7P, seccion.CodigoProS7P, seccion.ObserS7P
                ];
        
                const seccion7Result = await pool.query(seccion7Query, seccion7Values);
                const id_seccion7 = seccion7Result.rows[0].id; // Obtener el ID generado
        
                // 2️⃣ Insertar contribuciones asociadas a esta sección 7
                if (seccion.contributions && seccion.contributions.length > 0) {
                    const contribucionQuery = `
                        INSERT INTO parti_contr (
                            con, tasa, t_t, f_p, importe, id_partida
                        ) VALUES ($1, $2, $3, $4, $5, $6);
                    `;
        
                    for (const contribucion of seccion.contributions) {
                        const contribucionValues = [
                            contribucion.con, contribucion.tasa, 
                            contribucion.tt, contribucion.fp, contribucion.importe,
                            id_seccion7
                        ];
                        await pool.query(contribucionQuery, contribucionValues);
                    }
                }
            }
        }
        
        await insertarSeccion7(pool, seccion1.noPedimento, req.body.seccion7);
        
        
        /*
        return res.status(201).json({ 
            message: "Datos insertados correctamente", 
            data: pedimentoPush.rows[0] 
        });
        */
    }
    catch (error){
        console.error("Error al insertar datos:", error);

        if (!res.headersSent) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    

};