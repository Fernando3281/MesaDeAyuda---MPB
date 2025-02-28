package com.mesadeayudaMPB;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MesaDeAyudaApplication {

    public static void main(String[] args) {
        SpringApplication.run(MesaDeAyudaApplication.class, args);
    }
}