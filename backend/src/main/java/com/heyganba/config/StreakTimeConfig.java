package com.heyganba.config;
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class StreakTimeConfig {
    @Bean("streakClock") public Clock streakClock(){return Clock.systemUTC();}
}
