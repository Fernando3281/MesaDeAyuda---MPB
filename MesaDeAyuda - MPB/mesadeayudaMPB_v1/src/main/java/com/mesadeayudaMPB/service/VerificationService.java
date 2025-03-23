package com.mesadeayudaMPB.service;

/**
 *
 * @author ferva
 */
public interface VerificationService {
    String generateVerificationCode();
    boolean verifyCode(String storedCode, String inputCode);
}