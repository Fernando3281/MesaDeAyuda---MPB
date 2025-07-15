/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.service.VerificationService;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;

/**
 *
 * @author ferva
 */
@Service
public class VerificationServiceImpl implements VerificationService {

    private static final int CODE_LENGTH = 6;

    @Override
    public String generateVerificationCode() {
        SecureRandom random = new SecureRandom();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < CODE_LENGTH; i++) {
            code.append(random.nextInt(10)); // Solo números
        }
        return code.toString();
    }

    @Override
    public boolean verifyCode(String storedCode, String inputCode) {
        return storedCode != null && storedCode.equals(inputCode);
    }
}
