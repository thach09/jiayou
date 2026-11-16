package com.heyganba.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.annotation.Import;

import java.util.Map;

/** One-shot pinned bootstrap. No HTTP listener, component scan, accounts or curriculum. */
public final class JiayouBootstrapCommand {
    private JiayouBootstrapCommand() {}

    public static void run() {
        var app = new SpringApplication(BootstrapOnly.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setDefaultProperties(Map.of("spring.main.banner-mode", "off", "logging.level.root", "OFF"));
        try (var context = app.run()) {
            // FlywayMigrationInitializer already ran the unchanged target-bound guard.
            context.getBean(Flyway.class);
            System.out.println("Jiayou target-bound bootstrap command completed; no web service started.");
        } catch (RuntimeException error) {
            throw new IllegalStateException("Jiayou bootstrap command blocked; verify target, authorization and pinned schema.");
        }
    }

    @ImportAutoConfiguration({DataSourceAutoConfiguration.class, FlywayAutoConfiguration.class})
    @Import(JiayouBootstrapConfiguration.class)
    static class BootstrapOnly {}
}
