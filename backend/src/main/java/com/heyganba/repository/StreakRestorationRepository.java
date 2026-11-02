package com.heyganba.repository;
import com.heyganba.model.entity.StreakRestoration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface StreakRestorationRepository extends JpaRepository<StreakRestoration,Long> {
    Optional<StreakRestoration> findByUserIdAndRequestKey(Long userId,String requestKey);
}
