package com.heyganba;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HeyGanbaApplication {

    public static void main(String[] args) {
        if (java.util.Arrays.asList(args).contains("--jiayou-bootstrap-only")) {
            if (args.length != 1) throw new IllegalArgumentException("Bootstrap-only accepts no other command-line overrides");
            com.heyganba.config.JiayouBootstrapCommand.run();
            return;
        }
        SpringApplication.run(HeyGanbaApplication.class, args);
    }
}
