package com.heyganba.controller;
import com.heyganba.common.response.ApiResponse;
import com.heyganba.common.exception.TooManyRequestsException;
import com.heyganba.config.UserPrincipal;
import com.heyganba.dto.streak.WeeklyStreakResponse;
import com.heyganba.service.StreakRestorationService;
import com.heyganba.service.RateLimiterService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import java.time.Duration;

@RestController @RequestMapping("/streak") @RequiredArgsConstructor
public class StreakRestorationController {
    private final StreakRestorationService restoration;
    private final RateLimiterService limiter;
    public record RestoreRequest(@NotNull UUID requestId,@NotBlank @Pattern(regexp="[a-f0-9]{64}") String gapToken) {}
    @GetMapping("/week") public ApiResponse<WeeklyStreakResponse> week(@AuthenticationPrincipal UserPrincipal user){return ApiResponse.success(restoration.status(user.getId()));}
    @PostMapping("/restore") public ApiResponse<WeeklyStreakResponse> restore(@AuthenticationPrincipal UserPrincipal user,@Valid @RequestBody RestoreRequest request){
        if(!limiter.tryConsume("streak-restore:"+user.getId(),30,Duration.ofMinutes(1)))throw new TooManyRequestsException("Bạn thao tác quá nhanh. Vui lòng thử lại sau.");
        return ApiResponse.success(restoration.restore(user.getId(),request.requestId(),request.gapToken()));
    }
}
