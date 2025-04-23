import { pool } from '../db.js';
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";


export const entradaMercanciaReporteExcel = async (req, res) => {
    try {
        const { id_empresa, id_domicilio, fechaInicio, fechaFin } = req.query;
        if (!id_empresa || !id_domicilio) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }

        // Consultar datos generales de la empresa
        const queryDatosGenerales = `
            SELECT 
                razon_social, 
                rfc_empresa,
                no_immex
            FROM 
                info_empresa
            WHERE 
                id_empresa = $1;
        `;
        const valuesDatosGenerales = [id_empresa];
        const { rows: datosGenerales } = await pool.query(queryDatosGenerales, valuesDatosGenerales);
        
        // Consultar domicilio
        const queryDom = `
            SELECT 
                domicilio
            FROM 
                domicilios
            WHERE 
                id_empresa = $1 AND tipo_de_domicilio = 1;
        `;
        const valuesDom = [id_empresa];
        const { rows: domicilioData } = await pool.query(queryDom, valuesDom);

        // Construcción dinámica del query con JOIN a partidas
        let query = `
            SELECT 
                p.no_pedimento, 
                p.clave_ped,
                TO_CHAR(e.feca_sal, 'YYYY-MM-DD') AS fecha_en,
                pa.fraccion,
                pa.cantidad_umc,
                pa.descri
            FROM 
                pedimento p
            JOIN encabezado_p_pedimento e ON p.no_pedimento = e.no_pedimento
            LEFT JOIN partidas pa ON p.no_pedimento = pa.no_pedimento
            WHERE p.id_empresa = $1 
            AND p.id_domicilio = $2 
            AND p.tipo_oper = 'IMP'
        `;

        const values = [id_empresa, id_domicilio];
        // Agregar filtro de fechas si están presentes
        if (fechaInicio && fechaFin) {
            query += " AND e.fecha_en BETWEEN $3 AND $4";
            values.push(fechaInicio, fechaFin);
        }
        
        // Ordenar por número de pedimento para agrupar las partidas
        query += " ORDER BY p.no_pedimento, pa.fraccion";
        
        const { rows } = await pool.query(query, values);

        // Crear un libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("EntradaMercancias");

        // Agregar datos generales en las primeras filas
        worksheet.addRow(["Empresa:", datosGenerales[0]?.razon_social || "N/A"]);
        worksheet.addRow(["RFC:", datosGenerales[0]?.rfc_empresa || "N/A"]);
        worksheet.addRow(["Número IMMEX:", datosGenerales[0]?.no_immex || "N/A"]);
        worksheet.addRow(["Domicilio:", domicilioData[0]?.domicilio || "N/A"]);
        worksheet.addRow([]); // Fila en blanco para separación

        // Definir encabezados de la tabla
        const headers = ["Pedimento", "Clave de pedimento", "Fecha", "Fracción", "Cantidad UMC", "Descripcion"];
        worksheet.addRow(headers).font = { bold: true };

        // Agregar filas con los datos de la tabla
        let currentPedimento = null;
        
        rows.forEach((row) => {
            // Si es un nuevo pedimento, mostramos todos sus datos
            if (row.no_pedimento !== currentPedimento) {
                worksheet.addRow([
                    row.no_pedimento, 
                    row.clave_ped, 
                    row.fecha_en,
                    row.fraccion || "N/A",
                    row.cantidad_umc || "N/A",
                    row.descri || "N/A"
                ]);
                currentPedimento = row.no_pedimento;
            } else {
                // Si es la misma pedimento pero con otra partida, solo mostramos los datos de la partida
                worksheet.addRow([
                    "", "", "",
                    row.fraccion || "N/A",
                    row.cantidad_umc || "N/A",
                    row.descri || "N/A"
                ]);
            }
        });

        // Configurar la respuesta para descarga
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=EntradaMercancias.xlsx"
        );

        // Enviar el archivo al cliente
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error al generar el archivo Excel:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
export const entradaMercanciaReportePDF = async (req, res) => {
    try {
        const { id_empresa, id_domicilio } = req.query;
        if (!id_empresa || !id_domicilio) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }

        const query = `
            SELECT 
                p.no_pedimento, 
                p.clave_ped,
                TO_CHAR(e.fecha_en, 'YYYY-MM-DD') AS fecha_en
            FROM 
                pedimento p
            JOIN encabezado_p_pedimento e ON p.no_pedimento = e.no_pedimento
            WHERE p.id_empresa = $1 AND p.id_domicilio = $2 AND p.tipo_oper = 'IMP';
        `;
        const values = [id_empresa, id_domicilio];

        const { rows } = await pool.query(query, values);

        // Crear un nuevo documento PDF
        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=pedimentos.pdf");

        // Pipe del documento a la respuesta
        doc.pipe(res);

        doc.fontSize(16).text("Reporte de Pedimentos", { align: "center" });
        doc.moveDown();

        rows.forEach((row) => {
            doc.fontSize(12).text(`Pedimento: ${row.no_pedimento}`);
            doc.text(`Clave: ${row.clave_ped}`);
            doc.text(`Fecha: ${row.fecha_en}`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error("Error al generar el PDF:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
export const salidaMercanciaReporteExcel = async (req, res) => {
    try {
        const { id_empresa, id_domicilio , fechaInicio, fechaFin } = req.query;
        if (!id_empresa || !id_domicilio) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }
        // Consultar datos generales de la empresa
        const queryDatosGenerales = `
            SELECT 
                razon_social, 
                rfc_empresa,
                no_immex
            FROM 
                info_empresa
            WHERE 
                id_empresa = $1;
        `;
        const valuesDatosGenerales = [id_empresa];
        const { rows: datosGenerales } = await pool.query(queryDatosGenerales, valuesDatosGenerales);
        
        // Consultar domicilio
        const queryDom = `
            SELECT 
                domicilio
            FROM 
                domicilios
            WHERE 
                id_empresa = $1 AND tipo_de_domicilio = 1;
        `;
        const valuesDom = [id_empresa];
        const { rows: domicilioData } = await pool.query(queryDom, valuesDom);

        // Construcción dinámica del query
        let query = `
            SELECT 
                p.no_pedimento, 
                p.clave_ped,
                TO_CHAR(e.feca_sal, 'YYYY-MM-DD') AS fecha_en
            FROM 
                pedimento p
            JOIN encabezado_p_pedimento e ON p.no_pedimento = e.no_pedimento
            WHERE p.id_empresa = $1 
            AND p.id_domicilio = $2 
            AND p.tipo_oper = 'EXP'
        `;

        const values = [id_empresa, id_domicilio];
        // Agregar filtro de fechas si están presentes
        if (fechaInicio && fechaFin) {
            query += " AND e.fecha_en BETWEEN $3 AND $4";
            values.push(fechaInicio, fechaFin);
        }
        const { rows } = await pool.query(query, values);

        // Crear un libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("SalidaMercancias");

        // **Agregar datos generales en las primeras filas**
        worksheet.addRow(["Empresa:", datosGenerales[0]?.razon_social || "N/A"]);
        worksheet.addRow(["RFC:", datosGenerales[0]?.rfc_empresa || "N/A"]);
        worksheet.addRow(["Número IMMEX:", datosGenerales[0]?.no_immex || "N/A"]);
        worksheet.addRow(["Domicilio:", domicilioData[0]?.domicilio || "N/A"]);
        worksheet.addRow([]); // Fila en blanco para separación

        // **Definir encabezados de la tabla**
        worksheet.addRow(["Pedimento", "Clave de pedimento", "Fecha"]).font = { bold: true };

        // **Agregar filas con los datos de la tabla**
        rows.forEach((row) => {
            worksheet.addRow([row.no_pedimento, row.clave_ped, row.fecha_en]);
        });

        // Configurar la respuesta para descarga
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=SalidaMercancias.xlsx"
        );

        // Enviar el archivo al cliente
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error al generar el archivo Excel:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
export const saldoMuestraReporteExcel = async (req, res) => {
    try {
        const { id_empresa, id_domicilio, fechaInicio, fechaFin } = req.query;

        if (!id_empresa || !id_domicilio) {
            return res.status(400).json({ error: "Parámetros id_empresa e id_domicilio son obligatorios" });
        }

        // Consultar datos generales de la empresa
        const queryDatosGenerales = `
            SELECT razon_social, rfc_empresa, no_immex
            FROM info_empresa
            WHERE id_empresa = $1;
        `;
        const { rows: datosGenerales } = await pool.query(queryDatosGenerales, [id_empresa]);

        // Consultar domicilio
        const queryDom = `
            SELECT domicilio
            FROM domicilios
            WHERE id_empresa = $1 AND tipo_de_domicilio = 1;
        `;
        const { rows: domicilioData } = await pool.query(queryDom, [id_empresa]);

        // Consultar datos de pedimentos con JOIN y ordenamiento por fecha
        let query = `
            SELECT 
                p.no_pedimento, 
                p.clave_ped,
                s.fraccion,
                r.restante AS saldo_restante,
                TO_CHAR(e.feca_sal, 'YYYY-MM-DD') AS fecha_salida
            FROM pedimento p
            JOIN encabezado_p_pedimento e ON p.no_pedimento = e.no_pedimento
            JOIN saldo s ON p.no_pedimento = s.no_pedimento
            JOIN resta_saldo_mu r ON p.no_pedimento = r.no_pedimento
            WHERE p.id_empresa = $1 AND p.id_domicilio = $2
        `;
        const values = [id_empresa, id_domicilio];

        // Agregar filtro de fechas
        if (fechaInicio && fechaFin) {
            query += " AND e.feca_sal BETWEEN $3 AND $4";
            values.push(fechaInicio, fechaFin);
        }
        query += " ORDER BY e.feca_sal ASC";

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.json({ mensaje: "No se encontraron datos" });
        }

        // Crear archivo Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Saldo");

        // Agregar datos generales
        worksheet.addRow(["Empresa:", datosGenerales[0]?.razon_social || "N/A"]);
        worksheet.addRow(["RFC:", datosGenerales[0]?.rfc_empresa || "N/A"]);
        worksheet.addRow(["Número IMMEX:", datosGenerales[0]?.no_immex || "N/A"]);
        worksheet.addRow(["Domicilio:", domicilioData[0]?.domicilio || "N/A"]);
        worksheet.addRow([]); // Fila en blanco para separación

        // Agregar encabezados de la tabla
        worksheet.addRow(["No. Pedimento", "Clave Pedimento", "Fracción", "Saldo Restante", "Fecha Salida"]).font = { bold: true };

        // Agregar datos
        rows.forEach(row => {
            worksheet.addRow([row.no_pedimento, row.clave_ped, row.fraccion, row.saldo_restante, row.fecha_salida]);
        });

        // Configurar respuesta HTTP para la descarga
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=saldo.xlsx");

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error al generar el archivo Excel:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const mateUtilizadosReporteExcel = async (req, res) => { // como odio JavaScript por cierto
    try {
        const { id_empresa, id_domicilio , fechaInicio, fechaFin } = req.query;
        // Verificar que los parámetros sean proporcionados
        if (!id_empresa || !id_domicilio) {
            return res.status(400).json({ error: "Parámetros id_empresa e id_domicilio son obligatorios" });
        }

        // Consultar datos generales de la empresa
        const queryDatosGenerales = `
            SELECT 
                razon_social, 
                rfc_empresa,
                no_immex
            FROM 
                info_empresa
            WHERE 
                id_empresa = $1;
        `;
        const valuesDatosGenerales = [id_empresa];
        const { rows: datosGenerales } = await pool.query(queryDatosGenerales, valuesDatosGenerales);
        
        // Consultar domicilio
        const queryDom = `
            SELECT 
                domicilio
            FROM 
                domicilios
            WHERE 
                id_empresa = $1 AND tipo_de_domicilio = 1;
        `;
        const valuesDom = [id_empresa];
        const { rows: domicilioData } = await pool.query(queryDom, valuesDom);

        let query = `
            SELECT 
                nombre,
                cantidad,
                fecha_transformacion
            FROM 
                creacion_de_producto
            WHERE
                id_empresa = $1 AND id_domicilio = $2
            
            
        `;
        const values = [id_empresa, id_domicilio];
        // Agregar filtro de fechas si están presentes
        if (fechaInicio && fechaFin) {
            query += " AND fecha_transformacion BETWEEN $3 AND $4";
            values.push(fechaInicio, fechaFin);
        }
        query += " ORDER BY fecha_transformacion ASC";
        const { rows } = await pool.query(query, values);
        
        
        // Crear un libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("MaterialesUtilizados");

        // **Agregar datos generales en las primeras filas**
        worksheet.addRow(["Empresa:", datosGenerales[0]?.razon_social || "N/A"]);
        worksheet.addRow(["RFC:", datosGenerales[0]?.rfc_empresa || "N/A"]);
        worksheet.addRow(["Número IMMEX:", datosGenerales[0]?.no_immex || "N/A"]);
        worksheet.addRow(["Domicilio:", domicilioData[0]?.domicilio || "N/A"]);
        worksheet.addRow([]); // Fila en blanco para separación

        // **Definir encabezados de la tabla**
        worksheet.addRow(["Nombre", "Cantidad", "Fecha de transformacion"]).font = { bold: true };

        // **Agregar filas con los datos de la tabla**
        rows.forEach((row) => {
            worksheet.addRow([row.nombre, row.cantidad, row.fecha_transformacion]);
        });

        // Configurar la respuesta para descarga
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=MaterialesUtilizados.xlsx"
        );

        // Enviar el archivo al cliente
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error al obtener datos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
