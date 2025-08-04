package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.service.ReporteService;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.export.JRCsvExporter;
import net.sf.jasperreports.engine.export.JRRtfExporter;
import net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimpleWriterExporterOutput;
import net.sf.jasperreports.engine.fonts.FontUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.springframework.core.io.ByteArrayResource;

@Service
public class ReporteServiceImpl implements ReporteService {

    private static final Logger logger = Logger.getLogger(ReporteServiceImpl.class.getName());

    @Autowired
    private javax.sql.DataSource dataSource;

    @Override
    public ResponseEntity<Resource> generaReporte(String reporte, Map<String, Object> parametros, String tipo) throws IOException {
        try {
            // Validar tipo de exportación
            String tipoExport = tipo.toUpperCase();
            if (!Arrays.asList("PDF", "VPDF", "XLS", "CSV", "RTF").contains(tipoExport)) {
                throw new IllegalArgumentException("Tipo de exportación no soportado: " + tipo);
            }

            // Cargar el reporte desde classpath
            String reportePath = "/reports/" + reporte + ".jasper";
            InputStream reportStream = getClass().getResourceAsStream(reportePath);
            
            if (reportStream == null) {
                logger.severe("No se encontró el reporte: " + reportePath);
                throw new FileNotFoundException("No se encontró el reporte: " + reportePath);
            }

            // Cargar la imagen como InputStream - con manejo de errores mejorado
            InputStream imageStream = null;
            try {
                imageStream = getClass().getResourceAsStream("/static/img/escudo-barva.png");
                if (imageStream == null) {
                    logger.warning("No se encontró la imagen: /static/img/escudo-barva.png - usando imagen por defecto");
                    // Crear una imagen vacía en lugar de fallar
                    imageStream = getClass().getResourceAsStream("/static/img/default-logo.png");
                }
            } catch (Exception e) {
                logger.warning("Error cargando imagen: " + e.getMessage());
            }

            // Configurar parámetros con propiedades del sistema para fuentes
            parametros.put("ImagePath", "/static/img/escudo-barva.png");
            parametros.put("LOGO_EMPRESA", imageStream);
            
            // Configurar propiedades del sistema para manejar fuentes faltantes
            System.setProperty("net.sf.jasperreports.awt.ignore.missing.font", "true");
            System.setProperty("net.sf.jasperreports.default.font.name", "SansSerif");
            System.setProperty("net.sf.jasperreports.default.pdf.font.name", "SansSerif");
            System.setProperty("net.sf.jasperreports.default.pdf.encoding", "UTF-8");
            System.setProperty("net.sf.jasperreports.default.pdf.embedded", "false");

            JasperPrint jasperPrint = null;

            try {
                // Determinar la fuente de datos
                if (parametros.containsKey("TICKETS_DATA_SOURCE") 
                        && parametros.get("TICKETS_DATA_SOURCE") instanceof JRBeanCollectionDataSource) {
                    
                    logger.info("Generando reporte con JRBeanCollectionDataSource");
                    jasperPrint = JasperFillManager.fillReport(
                            reportStream,
                            parametros,
                            (JRBeanCollectionDataSource) parametros.get("TICKETS_DATA_SOURCE")
                    );
                } else {
                    logger.info("Generando reporte con conexión a base de datos");
                    try (Connection conn = dataSource.getConnection()) {
                        jasperPrint = JasperFillManager.fillReport(reportStream, parametros, conn);
                    } catch (SQLException ex) {
                        logger.log(Level.SEVERE, "Error de conexión a base de datos: " + ex.getMessage(), ex);
                        throw new IOException("Error de conexión a base de datos: " + ex.getMessage(), ex);
                    }
                }
            } catch (JRException ex) {
                logger.log(Level.SEVERE, "Error generando reporte JasperReports: " + ex.getMessage(), ex);
                
                // Si es un problema de fuentes, intentar con configuración alternativa
                if (ex.getMessage().contains("Font") || ex.getMessage().contains("font")) {
                    logger.info("Reintentando generación de reporte con configuración de fuentes alternativa...");
                    
                    // Configurar mapeo de fuentes alternativo
                    parametros.put("net.sf.jasperreports.awt.ignore.missing.font", "true");
                    parametros.put("net.sf.jasperreports.default.font.name", "SansSerif");
                    
                    // Reintentar con el stream original
                    reportStream.close();
                    reportStream = getClass().getResourceAsStream(reportePath);
                    
                    if (parametros.containsKey("TICKETS_DATA_SOURCE") 
                            && parametros.get("TICKETS_DATA_SOURCE") instanceof JRBeanCollectionDataSource) {
                        jasperPrint = JasperFillManager.fillReport(
                                reportStream,
                                parametros,
                                (JRBeanCollectionDataSource) parametros.get("TICKETS_DATA_SOURCE")
                        );
                    } else {
                        try (Connection conn = dataSource.getConnection()) {
                            jasperPrint = JasperFillManager.fillReport(reportStream, parametros, conn);
                        }
                    }
                } else {
                    throw new IOException("Error al generar el reporte: " + ex.getMessage(), ex);
                }
            } finally {
                // Cerrar streams
                if (reportStream != null) {
                    try {
                        reportStream.close();
                    } catch (IOException e) {
                        logger.warning("Error cerrando reportStream: " + e.getMessage());
                    }
                }
                if (imageStream != null) {
                    try {
                        imageStream.close();
                    } catch (IOException e) {
                        logger.warning("Error cerrando imageStream: " + e.getMessage());
                    }
                }
            }

            if (jasperPrint == null) {
                throw new IOException("No se pudo generar el reporte - jasperPrint es null");
            }

            // Configurar respuesta
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            String contentType;
            String fileExtension;
            String disposition = tipoExport.equals("VPDF") ? "inline" : "attachment";

            try {
                switch (tipoExport) {
                    case "PDF":
                    case "VPDF":
                        JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
                        contentType = MediaType.APPLICATION_PDF_VALUE;
                        fileExtension = "pdf";
                        logger.info("Reporte PDF generado exitosamente");
                        break;
                    case "XLS":
                        JRXlsxExporter exporterXLS = new JRXlsxExporter();
                        exporterXLS.setExporterInput(new SimpleExporterInput(jasperPrint));
                        exporterXLS.setExporterOutput(new SimpleOutputStreamExporterOutput(outputStream));
                        exporterXLS.exportReport();
                        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                        fileExtension = "xlsx";
                        logger.info("Reporte XLSX generado exitosamente");
                        break;
                    case "CSV":
                        JRCsvExporter exporterCSV = new JRCsvExporter();
                        exporterCSV.setExporterInput(new SimpleExporterInput(jasperPrint));
                        exporterCSV.setExporterOutput(new SimpleWriterExporterOutput(outputStream));
                        exporterCSV.exportReport();
                        contentType = "text/csv";
                        fileExtension = "csv";
                        logger.info("Reporte CSV generado exitosamente");
                        break;
                    case "RTF":
                        JRRtfExporter exporterRTF = new JRRtfExporter();
                        exporterRTF.setExporterInput(new SimpleExporterInput(jasperPrint));
                        exporterRTF.setExporterOutput(new SimpleWriterExporterOutput(outputStream));
                        exporterRTF.exportReport();
                        contentType = "application/rtf";
                        fileExtension = "rtf";
                        logger.info("Reporte RTF generado exitosamente");
                        break;
                    default:
                        throw new IllegalArgumentException("Tipo no soportado: " + tipo);
                }
            } catch (JRException e) {
                logger.log(Level.SEVERE, "Error en exportación: " + e.getMessage(), e);
                throw new IOException("Error al exportar el reporte: " + e.getMessage(), e);
            }

            byte[] reportBytes = outputStream.toByteArray();
            
            if (reportBytes.length == 0) {
                throw new IOException("El reporte generado está vacío");
            }
            
            ByteArrayResource resource = new ByteArrayResource(reportBytes);

            logger.info("Reporte generado exitosamente. Tamaño: " + reportBytes.length + " bytes");

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            disposition + "; filename=\"" + reporte + "." + fileExtension + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(reportBytes.length)
                    .body(resource);

        } catch (Exception e) {
            logger.log(Level.SEVERE, "Error general al generar reporte: " + e.getMessage(), e);
            throw new IOException("Error al generar el reporte: " + e.getMessage(), e);
        }
    }
}