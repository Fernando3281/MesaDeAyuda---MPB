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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import java.util.logging.Level;
import java.util.logging.Logger;
import net.sf.jasperreports.engine.JRParameter;
import net.sf.jasperreports.engine.base.JRBaseFont;
import org.springframework.core.io.ByteArrayResource;

@Service
public class ReporteServiceImpl implements ReporteService {

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

        // Configuración de fuentes para evitar errores en entornos sin GUI
        parametros.put(JRParameter.IS_IGNORE_PAGINATION, Boolean.TRUE);
        parametros.put("REPORT_LOCALE", Locale.getDefault());
        parametros.put("REPORT_TIME_ZONE", TimeZone.getDefault());

        // Cargar el reporte desde classpath
        String reportePath = "/reports/" + reporte + ".jasper";
        InputStream reportStream = getClass().getResourceAsStream(reportePath);
        
        if (reportStream == null) {
            throw new FileNotFoundException("No se encontró el reporte: " + reportePath);
        }

        // Cargar la imagen como InputStream
        InputStream imageStream = getClass().getResourceAsStream("/static/img/escudo-barva.png");
        if (imageStream == null) {
            throw new FileNotFoundException("No se encontró la imagen: /static/img/escudo-barva.png");
        }

        // Configurar parámetros de imagen
        parametros.put("ImagePath", "/static/img/escudo-barva.png"); // Ruta relativa
        parametros.put("LOGO_EMPRESA", imageStream); // InputStream de la imagen

        JasperPrint jasperPrint = null;

        // Determinar la fuente de datos
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
            } catch (SQLException ex) {
                Logger.getLogger(ReporteServiceImpl.class.getName()).log(Level.SEVERE, null, ex);
                throw new IOException("Error al conectar con la base de datos", ex);
            }
        }

        // Cerrar streams
        imageStream.close();
        reportStream.close();

        // Configurar respuesta
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        String contentType;
        String fileExtension;
        String disposition = tipoExport.equals("VPDF") ? "inline" : "attachment";

        switch (tipoExport) {
            case "PDF":
            case "VPDF":
                try {
                    JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
                } catch (JRException e) {
                    throw new IOException("Error al exportar a PDF: " + e.getMessage(), e);
                }
                contentType = MediaType.APPLICATION_PDF_VALUE;
                fileExtension = "pdf";
                break;
            case "XLS":
                JRXlsxExporter exporterXLS = new JRXlsxExporter();
                exporterXLS.setExporterInput(new SimpleExporterInput(jasperPrint));
                exporterXLS.setExporterOutput(new SimpleOutputStreamExporterOutput(outputStream));
                try {
                    exporterXLS.exportReport();
                } catch (JRException e) {
                    throw new IOException("Error al exportar a Excel: " + e.getMessage(), e);
                }
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                fileExtension = "xlsx";
                break;
            case "CSV":
                JRCsvExporter exporterCSV = new JRCsvExporter();
                exporterCSV.setExporterInput(new SimpleExporterInput(jasperPrint));
                exporterCSV.setExporterOutput(new SimpleWriterExporterOutput(outputStream));
                try {
                    exporterCSV.exportReport();
                } catch (JRException e) {
                    throw new IOException("Error al exportar a CSV: " + e.getMessage(), e);
                }
                contentType = "text/csv";
                fileExtension = "csv";
                break;
            case "RTF":
                JRRtfExporter exporterRTF = new JRRtfExporter();
                exporterRTF.setExporterInput(new SimpleExporterInput(jasperPrint));
                exporterRTF.setExporterOutput(new SimpleWriterExporterOutput(outputStream));
                try {
                    exporterRTF.exportReport();
                } catch (JRException e) {
                    throw new IOException("Error al exportar a RTF: " + e.getMessage(), e);
                }
                contentType = "application/rtf";
                fileExtension = "rtf";
                break;
            default:
                throw new IllegalArgumentException("Tipo no soportado: " + tipo);
        }

        byte[] reportBytes = outputStream.toByteArray();
        ByteArrayResource resource = new ByteArrayResource(reportBytes);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        disposition + "; filename=\"" + reporte + "." + fileExtension + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(reportBytes.length)
                .body(resource);

    } catch (Exception e) {
        throw new IOException("Error al generar el reporte: " + e.getMessage(), e);
    }
}
}