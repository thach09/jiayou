package com.heyganba.repository;
import com.heyganba.model.entity.StreakRestoredDay;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
public interface StreakRestoredDayRepository extends JpaRepository<StreakRestoredDay,Long> {
    List<StreakRestoredDay> findByUserId(Long userId);
    long countByUserIdAndChargeMonth(Long userId,LocalDate month);
    long countByUserIdAndRestoredDateBetween(Long userId,LocalDate from,LocalDate to);
}
