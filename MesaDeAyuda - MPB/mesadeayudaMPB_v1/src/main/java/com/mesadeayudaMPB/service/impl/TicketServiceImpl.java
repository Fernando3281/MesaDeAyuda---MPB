package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.TicketDao;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.TicketService;
import java.io.ByteArrayInputStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Random;

@Service
public class TicketServiceImpl implements TicketService {

    @Autowired
    private TicketDao ticketDao;
    
    private static final int MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    private static final String ENCRYPTION_ALGORITHM = "AES";
    private static final String ENCRYPTION_KEY = "YourSecretKey123"; // Change this to a secure key

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> getTickets() {
        return ticketDao.findAll(Sort.by("fechaApertura").descending());
    }

    @Override
    @Transactional(readOnly = true)
    public Ticket getTicket(Ticket ticket) {
        return ticketDao.findById(ticket.getIdTicket()).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Ticket getTicketPorCodigo(String codigo) {
        return ticketDao.findByCodigo(codigo);
    }

    @Override
    @Transactional
    public void save(Ticket ticket) {
        ticketDao.save(ticket);
    }

    @Override
    @Transactional
    public void delete(Ticket ticket) {
        ticketDao.delete(ticket);
    }

    @Override
    public String generarCodigoTicket() {
        Random random = new Random();
        String codigo;
        do {
            StringBuilder sb = new StringBuilder("TIC");
            for (int i = 0; i < 8; i++) {
                sb.append(random.nextInt(10));
            }
            codigo = sb.toString();
        } while (ticketDao.existsByCodigo(codigo));

        return codigo;
    }

    @Override
    public byte[] procesarImagenes(List<MultipartFile> imagenes) {
        try {
            if (imagenes == null || imagenes.isEmpty()) {
                return null;
            }

            // Validar número de imágenes
            if (imagenes.size() > 2) {
                throw new IllegalArgumentException("Maximum 2 images allowed");
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            SecretKey key = new SecretKeySpec(ENCRYPTION_KEY.getBytes(), ENCRYPTION_ALGORITHM);
            Cipher cipher = Cipher.getInstance(ENCRYPTION_ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key);

            for (MultipartFile imagen : imagenes) {
                if (!imagen.isEmpty()) {
                    // Validar tamaño
                    if (imagen.getSize() > MAX_FILE_SIZE) {
                        throw new IllegalArgumentException("Image size exceeds 5MB limit");
                    }

                    // Validar tipo de archivo
                    String contentType = imagen.getContentType();
                    if (contentType == null || !contentType.startsWith("image/")) {
                        throw new IllegalArgumentException("Invalid file type. Only images are allowed");
                    }

                    // Encriptar imagen
                    byte[] imageBytes = imagen.getBytes();
                    byte[] encryptedBytes = cipher.doFinal(imageBytes);

                    // Escribir bytes encriptados
                    outputStream.write(encryptedBytes);
                    outputStream.write(new byte[]{0, 0, 0, 0}); // Delimitador
                }
            }

            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error processing images: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Ticket> getTicketsPaginados(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("fechaApertura").descending());
        return ticketDao.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> getTicketsPorSolicitante(Usuario solicitante) {
        return ticketDao.findBySolicitanteOrderByFechaAperturaDesc(solicitante);
    }

    @Override
    public int contarImagenes(byte[] imagenesBytes) {
        if (imagenesBytes == null) {
            return 0;
        }

        int count = 0;
        ByteArrayInputStream bis = new ByteArrayInputStream(imagenesBytes);
        byte[] delimiter = new byte[4];

        try {
            while (bis.available() > 0) {
                count++;
                // Leer hasta encontrar el delimitador
                while (bis.available() > 0) {
                    bis.read(delimiter);
                    if (Arrays.equals(delimiter, new byte[]{0, 0, 0, 0})) {
                        break;
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return count;
    }

    @Override
    public byte[] obtenerImagenPorIndice(byte[] imagenesBytes, int index) {
        if (imagenesBytes == null) {
            return null;
        }

        try {
            SecretKey key = new SecretKeySpec(ENCRYPTION_KEY.getBytes(), ENCRYPTION_ALGORITHM);
            Cipher cipher = Cipher.getInstance(ENCRYPTION_ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key);

            ByteArrayInputStream bis = new ByteArrayInputStream(imagenesBytes);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] delimiter = new byte[4];
            int currentIndex = 0;

            while (bis.available() > 0 && currentIndex <= index) {
                if (currentIndex == index) {
                    // Leer la imagen encriptada
                    ByteArrayOutputStream imageBos = new ByteArrayOutputStream();
                    int b;
                    while ((b = bis.read()) != -1) {
                        byte[] temp = new byte[4];
                        temp[0] = (byte) b;
                        if (bis.read(temp, 1, 3) == 3) {
                            if (Arrays.equals(temp, new byte[]{0, 0, 0, 0})) {
                                break;
                            }
                            imageBos.write(temp);
                        } else {
                            imageBos.write(temp, 0, 1);
                        }
                    }

                    // Desencriptar la imagen
                    byte[] encryptedBytes = imageBos.toByteArray();
                    return cipher.doFinal(encryptedBytes);
                } else {
                    // Saltar hasta el siguiente delimitador
                    while (bis.available() > 0) {
                        bis.read(delimiter);
                        if (Arrays.equals(delimiter, new byte[]{0, 0, 0, 0})) {
                            break;
                        }
                    }
                    currentIndex++;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting image: " + e.getMessage());
        }
        return null;
    }
}