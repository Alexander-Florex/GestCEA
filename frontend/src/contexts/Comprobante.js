const PDFDocument = require("pdfkit");
const fs = require("fs");

/**
 * Genera un comprobante de pago en formato PDF
 *
 * @param {Object} datos - Objeto con los datos del comprobante
 * @param {string} datos.numeroRecibo - ID del recibo
 * @param {string} datos.fecha - Fecha del comprobante (formato DD/MM/YYYY)
 * @param {string} datos.operador - Nombre del usuario que registra el pago
 * @param {string} datos.nombreAlumno - Nombre completo del alumno (Apellido y Nombre)
 * @param {string} datos.operacion - Tipo de operación (Efectivo, Transferencia, Tarjeta)
 * @param {string} datos.descripcion - Descripción del pago
 * @param {number} datos.valorCuota - Valor de la cuota o matrícula
 * @param {number} datos.recargo - Monto del recargo (0 si no hay)
 * @param {string} [datos.nombreArchivo] - Nombre del archivo PDF (opcional)
 * @returns {Promise<string>} - Ruta del archivo generado
 */
function generarComprobante(datos) {
    return new Promise((resolve, reject) => {
        try {
            // Validar datos obligatorios
            if (!datos.numeroRecibo || !datos.fecha || !datos.operador || !datos.nombreAlumno ||
                !datos.operacion || !datos.descripcion || datos.valorCuota === undefined) {
                throw new Error('Faltan datos obligatorios para generar el comprobante');
            }

            // Calcular total
            const valorCuota = Number(datos.valorCuota) || 0;
            const recargo = Number(datos.recargo) || 0;
            const total = valorCuota + recargo;

            // Formatear valores monetarios
            const formatMoney = (valor) => {
                return `$ ${Number(valor).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;
            };

            // Determinar color de fondo según tipo de operación
            let operacionColor = "#C6EFCE"; // Verde claro por defecto (Efectivo)
            if (datos.operacion === "Transferencia") {
                operacionColor = "#BDD7EE"; // Azul claro
            } else if (datos.operacion === "Tarjeta") {
                operacionColor = "#FFE699"; // Amarillo claro
            }

            // Nombre del archivo
            const nombreArchivo = datos.nombreArchivo ||
                `comprobante_${datos.numeroRecibo}_${datos.nombreAlumno.replace(/\s+/g, '_')}.pdf`;

            const doc = new PDFDocument({
                size: [595, 280], // 1/3 hoja A4
                margin: 20,
                info: {
                    Title: "Comprobante de Pago - CURSOS CEA",
                    Author: "CURSOS CEA",
                    Subject: `Recibo #${datos.numeroRecibo}`,
                    Keywords: "recibo, pago, comprobante, CEA"
                }
            });

            const stream = doc.pipe(fs.createWriteStream(nombreArchivo));

            const PAGE_WIDTH = 595;
            const MARGIN = 20;
            const WIDTH = PAGE_WIDTH - MARGIN * 2;

            let y = MARGIN;

            /* =========================
               HEADER
            ========================= */
            // Logo
            doc.rect(MARGIN, y, 120, 70).stroke();
            try {
                doc.image("logo.png", MARGIN + 15, y + 15, { width: 90 });
            } catch {
                doc.font("Helvetica-Bold").fontSize(14)
                    .text("CEA", MARGIN + 35, y + 28);
            }

            // Datos empresa
            doc.rect(MARGIN + 120, y, WIDTH - 120, 70).stroke();

            doc.font("Helvetica-Bold").fontSize(12)
                .text("CURSOS CEA", MARGIN + 120, y + 6, {
                    width: WIDTH - 120,
                    align: "center"
                });

            doc.font("Helvetica").fontSize(8)
                .text(
                    "Buenaventura 407. Turdera TE: 4298-0737 / 2065-6006",
                    MARGIN + 120,
                    y + 24,
                    { width: WIDTH - 120, align: "center" }
                )
                .text(
                    "www.cursocea.com.ar / informes@cursocea.com.ar",
                    MARGIN + 120,
                    y + 36,
                    { width: WIDTH - 120, align: "center" }
                )
                .text(
                    "Horario: Lun a Vie 9 a 21 hs. Sab: 9 a 18 hs.",
                    MARGIN + 120,
                    y + 48,
                    { width: WIDTH - 120, align: "center" }
                );

            /* =========================
               FILA RECIBO
            ========================= */
            y += 70;

            const cols = [140, 110, 80, 100, 45, 80];
            const values = [
                "Número de Recibo",
                datos.numeroRecibo,
                "Fecha",
                datos.fecha,
                "Op",
                datos.operador
            ];

            let x = MARGIN;
            values.forEach((v, i) => {
                doc.rect(x, y, cols[i], 22).stroke();
                doc.font("Helvetica").fontSize(8).text(v, x + 5, y + 7);
                x += cols[i];
            });

            /* =========================
               ALUMNO
            ========================= */
            y += 22;

            doc.rect(MARGIN, y, WIDTH, 20).stroke();
            doc.font("Helvetica-Bold").fontSize(8).text("Alumno", MARGIN + 5, y + 6);

            y += 20;

            doc.rect(MARGIN, y, WIDTH - 160, 26).stroke();
            doc.font("Helvetica").fontSize(9)
                .text(datos.nombreAlumno, MARGIN + 5, y + 8);

            doc.rect(MARGIN + WIDTH - 160, y, 80, 26).stroke();
            doc.font("Helvetica-Bold").fontSize(8)
                .text("OPERACIÓN", MARGIN + WIDTH - 155, y + 8);

            doc.rect(MARGIN + WIDTH - 80, y, 80, 26)
                .fillAndStroke(operacionColor, "black");

            doc.fillColor("black").font("Helvetica-Bold").fontSize(9)
                .text(datos.operacion, MARGIN + WIDTH - 75, y + 8);

            /* =========================
               DESCRIPCIÓN + IMPORTES
            ========================= */
            y += 26;

            // Descripción
            doc.rect(MARGIN, y, WIDTH - 160, 55).stroke();
            doc.font("Helvetica-Bold").fontSize(8)
                .text("Descripción del pago", MARGIN + 5, y + 5);

            doc.font("Helvetica").fontSize(9)
                .text(
                    datos.descripcion,
                    MARGIN + 5,
                    y + 22,
                    { width: WIDTH - 170 }
                );

            // Importes
            const impX = MARGIN + WIDTH - 160;
            const impW = 160;
            const rowH = 18;

            const rows = [
                ["Valor de Cuota", formatMoney(valorCuota)],
                ["Recargo", formatMoney(recargo)],
                ["Total", formatMoney(total)]
            ];

            rows.forEach((r, i) => {
                doc.rect(impX, y + i * rowH, impW, rowH).stroke();
                doc.font(i === 2 ? "Helvetica-Bold" : "Helvetica")
                    .fontSize(8)
                    .text(r[0], impX + 5, y + i * rowH + 6);

                doc.text(r[1], impX + 95, y + i * rowH + 6, {
                    width: 55,
                    align: "right"
                });
            });

            /* =========================
               TEXTO LEGAL
            ========================= */
            y += 60;

            doc.font("Helvetica-Bold").fontSize(7)
                .text(
                    "SE RECUERDA QUE LOS DESCUENTOS SE EFECTÚAN RESPETANDO EL CRONOGRAMA DE PAGOS",
                    MARGIN,
                    y,
                    { width: WIDTH }
                );

            doc.end();

            // Resolver la promesa cuando el archivo se haya escrito completamente
            stream.on('finish', () => {
                resolve(nombreArchivo);
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
}

// Exportar la función para uso en otros módulos
module.exports = { generarComprobante };

// Si se ejecuta directamente desde la línea de comandos
if (require.main === module) {
    // Ejemplo de uso
    const datosEjemplo = {
        numeroRecibo: "59235",
        fecha: "04/10/2025",
        operador: "Enrique",
        nombreAlumno: "Alexander Marcelo Flores Ramirez",
        operacion: "Efectivo",
        descripcion: "Curso de Electricidad Automotriz",
        valorCuota: 80000,
        recargo: 0
    };

    generarComprobante(datosEjemplo)
        .then(archivo => {
            console.log(`✅ Comprobante generado exitosamente: ${archivo}`);
        })
        .catch(error => {
            console.error('❌ Error al generar comprobante:', error.message);
        });
}