package com.mesadeayudaMPB.utils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import org.springframework.stereotype.Component;

@Component
public class VerificationCodeManager {
    private static final Duration EXPIRATION_DURATION = Duration.ofMinutes(10);
    private Map<String, VerificationCodeInfo> verificationCodes = new HashMap<>();

    private static class VerificationCodeInfo {
        private String code;
        private LocalDateTime expirationTime;

        public VerificationCodeInfo(String code) {
            this.code = code;
            this.expirationTime = LocalDateTime.now().plus(EXPIRATION_DURATION);
        }

        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expirationTime);
        }
    }

    public String generateVerificationCode(String email) {
        String code = generateRandomCode();
        verificationCodes.put(email, new VerificationCodeInfo(code));
        return code;
    }

    public boolean verifyCode(String email, String code) {
        VerificationCodeInfo codeInfo = verificationCodes.get(email);
        if (codeInfo != null && !codeInfo.isExpired() && codeInfo.code.equals(code)) {
            return true;  // El código es correcto y no ha expirado
        }
        return false;  // Código incorrecto o expirado
    }

    private String generateRandomCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }
}