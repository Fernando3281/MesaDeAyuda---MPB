/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mesadeayudaMPB.service;

/**
 *
 * @author ferva
 */
public interface VerificationService {
    String generateVerificationCode();
    boolean verifyCode(String storedCode, String inputCode);
}