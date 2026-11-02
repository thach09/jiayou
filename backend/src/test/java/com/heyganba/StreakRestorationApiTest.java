package com.heyganba;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heyganba.config.UserPrincipal;
import com.heyganba.model.entity.*;
import com.heyganba.model.enums.RoleName;
import com.heyganba.repository.*;
import com.heyganba.service.*;
import com.heyganba.support.ContentApiTestBase;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class StreakRestorationApiTest extends ContentApiTestBase {
    @Autowired MockMvc mvc;@Autowired ObjectMapper json;
    @Autowired StreakRestorationService restoration;
    @Autowired StreakRestoredDayRepository days;
    @Autowired StreakRestorationRepository events;
    @Autowired StudyActivityService activity;
    @Autowired StreakService streak;
    @MockitoBean(name="streakClock") Clock clock;
    private static final LocalDate TODAY=LocalDate.of(2026,11,2);
    private static final Instant NOW=Instant.parse("2026-11-02T05:00:00Z");
    private User user;private String token;
    @BeforeEach void fixture(){
        when(clock.instant()).thenReturn(NOW);
        var role=roleRepository.save(Role.builder().name(RoleName.ROLE_USER).build());
        user=userRepository.save(User.builder().role(role).email("streak-local@jiayou.test").fullName("Nguyễn fixture").passwordHash(passwordEncoder.encode("TestOnly123!")).isActive(true).build());
        token=jwtTokenProvider.generateAccessToken(UserPrincipal.create(user));
    }
    private void qualify(LocalDate date,int count){studyActivityRepository.save(StudyActivity.builder().user(user).activityDate(date).source("FLASHCARD").itemCount(count).correctCount(count).build());}
    private void pending(int missed){
        LocalDate anchor=TODAY.minusDays(missed+1);
        qualify(anchor.minusDays(1),10);qualify(anchor,10);
        streakRepository.save(Streak.builder().user(user).currentStreak(2).longestStreak(8).lastActiveDate(anchor).build());
    }
    private String bearer(){return "Bearer "+token;}
    @Test void guestsCannotInspectOrRestoreAndInputsCannotSelectAnotherOwner() throws Exception {
        mvc.perform(get("/streak/week")).andExpect(status().isUnauthorized());
        mvc.perform(post("/streak/restore").contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
        pending(1);var before=restoration.status(user.getId());
        var other=userRepository.save(User.builder().role(user.getRole()).email("other-streak@jiayou.test").fullName("Other").passwordHash(user.getPasswordHash()).isActive(true).build());
        String otherToken=jwtTokenProvider.generateAccessToken(UserPrincipal.create(other));
        mvc.perform(post("/streak/restore").header("Authorization","Bearer "+otherToken).contentType("application/json")
                .content(json.writeValueAsBytes(Map.of("requestId",UUID.randomUUID(),"gapToken",before.gapToken(),"userId",user.getId())))).andExpect(status().isBadRequest());
        assertThat(days.count()).isZero();
        mvc.perform(post("/streak/restore").header("Authorization",bearer()).contentType("application/json").content("{}")).andExpect(status().isBadRequest());
    }
    @Test void sevenDatesAreMondayFirstAndOnlyRealQualificationCompletesToday() throws Exception {
        qualify(TODAY,9);
        mvc.perform(get("/streak/week").header("Authorization",bearer())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.days.length()").value(7)).andExpect(jsonPath("$.data.weekStart").value("2026-11-02"))
                .andExpect(jsonPath("$.data.todayQualified").value(false)).andExpect(jsonPath("$.data.currentStreak").value(0));
        var a=studyActivityRepository.findByUserIdAndActivityDateAndSource(user.getId(),TODAY,"FLASHCARD").orElseThrow();a.setItemCount(10);studyActivityRepository.save(a);
        assertThat(restoration.status(user.getId()).todayQualified()).isTrue();
        assertThat(restoration.status(user.getId()).days().getFirst().state()).isEqualTo("TODAY_COMPLETED");
    }
    @Test void completeGapRestoresExactlyOnceWithoutFabricatingLearningOrRewards() throws Exception {
        pending(2);long activityBefore=studyActivityRepository.count();
        var before=restoration.status(user.getId());assertThat(before.state()).isEqualTo("FROZEN_PENDING");assertThat(before.displayStreak()).isEqualTo(2);
        UUID request=UUID.randomUUID();var after=restoration.restore(user.getId(),request,before.gapToken());
        assertThat(after.remainingRestorations()).isEqualTo(3);assertThat(after.currentStreak()).isEqualTo(2);assertThat(after.longestStreak()).isEqualTo(8);
        assertThat(after.state()).isEqualTo("RESTORED");assertThat(days.count()).isEqualTo(2);assertThat(events.count()).isEqualTo(1);
        assertThat(studyActivityRepository.count()).isEqualTo(activityBefore);
        assertThat(activity.getHeatmap(user.getId(),7,NOW).stream().filter(d->d.date().equals(TODAY.minusDays(1))).findFirst().orElseThrow().itemCount()).isZero();
        assertThat(activity.getHeatmap(user.getId(),7,NOW).stream().filter(d->d.date().equals(TODAY.minusDays(1))).findFirst().orElseThrow().restored()).isTrue();
        assertThat(activity.getHeatmap(user.getId(),7,NOW).stream().filter(d->d.date().equals(TODAY.minusDays(1))).findFirst().orElseThrow().qualified()).isFalse();
        assertThat(restoration.restore(user.getId(),request,before.gapToken()).replayed()).isTrue();assertThat(days.count()).isEqualTo(2);
        assertThatThrownBy(()->restoration.restore(user.getId(),request,"a".repeat(64))).isInstanceOf(com.heyganba.common.exception.BadRequestException.class);
        // A later real study day extends the protected run once, not by the restored date count.
        var touched=streak.touch(user,NOW);assertThat(touched.getCurrentStreak()).isEqualTo(3);
    }
    private void spend(int amount){
        if(amount==0)return;
        var event=events.saveAndFlush(StreakRestoration.builder().user(user).requestKey(UUID.randomUUID().toString()).gapToken("b".repeat(64))
                .chargeMonth(TODAY.withDayOfMonth(1)).restoredCount(amount).createdAt(NOW).build());
        for(int i=1;i<=amount;i++)days.save(StreakRestoredDay.builder().user(user).restoration(event).chargeMonth(TODAY.withDayOfMonth(1)).creditSlot(i).restoredDate(TODAY.minusDays(20+i)).build());
        days.flush();
    }
    @Test void allowanceFiveFourOneZeroAndWholeGapAtomicity(){
        pending(2);assertThat(restoration.status(user.getId()).remainingRestorations()).isEqualTo(5);
        spend(1);assertThat(restoration.status(user.getId()).remainingRestorations()).isEqualTo(4);
        days.deleteAll();events.deleteAll();spend(4);
        var blocked=restoration.status(user.getId());assertThat(blocked.remainingRestorations()).isEqualTo(1);assertThat(blocked.canRestore()).isFalse();
        assertThat(blocked.reason()).isEqualTo("INSUFFICIENT_ALLOWANCE");
        assertThatThrownBy(()->restoration.restore(user.getId(),UUID.randomUUID(),"c".repeat(64))).isInstanceOf(com.heyganba.common.exception.BadRequestException.class);
        assertThat(days.count()).isEqualTo(4);
        days.deleteAll();events.deleteAll();spend(5);assertThat(restoration.status(user.getId()).remainingRestorations()).isZero();
    }
    @Test void monthAndVietnamMidnightResetCreditsWithoutDeletingAudit(){
        pending(1);spend(5);
        when(clock.instant()).thenReturn(Instant.parse("2026-11-30T16:59:59Z"));assertThat(restoration.status(user.getId()).remainingRestorations()).isZero();
        when(clock.instant()).thenReturn(Instant.parse("2026-11-30T17:00:00Z"));var next=restoration.status(user.getId());
        assertThat(next.today()).isEqualTo(LocalDate.of(2026,12,1));assertThat(next.remainingRestorations()).isEqualTo(5);assertThat(days.count()).isEqualTo(5);
    }
    @Test void duplicateConcurrentRequestsNeverSpendTwice() throws Exception {
        pending(1);var before=restoration.status(user.getId());UUID key=UUID.randomUUID();
        var pool=Executors.newFixedThreadPool(2);var start=new CountDownLatch(1);
        try {
            Callable<Boolean> task=()->{start.await();return restoration.restore(user.getId(),key,before.gapToken()).replayed();};
            var a=pool.submit(task);var b=pool.submit(task);start.countDown();
            assertThat(List.of(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS))).containsExactlyInAnyOrder(false,true);
            assertThat(days.count()).isEqualTo(1);assertThat(events.count()).isEqualTo(1);
        } finally {pool.shutdownNow();}
    }
    @Test void expiredGapBreaksAndANewRealDayRestarts(){
        pending(9);var old=restoration.status(user.getId());assertThat(old.state()).isEqualTo("BROKEN");assertThat(old.canRestore()).isFalse();
        qualify(TODAY,10);streak.touch(user,NOW);assertThat(restoration.status(user.getId()).currentStreak()).isEqualTo(1);
    }
    @Test void twoDifferentConcurrentKeysCannotSpendTheLastCreditTwice() throws Exception {
        pending(1);spend(4);var before=restoration.status(user.getId());
        var pool=Executors.newFixedThreadPool(2);var start=new CountDownLatch(1);
        try {
            Callable<Boolean> task=()->{start.await();try{restoration.restore(user.getId(),UUID.randomUUID(),before.gapToken());return true;}catch(com.heyganba.common.exception.BadRequestException e){return false;}};
            var a=pool.submit(task);var b=pool.submit(task);start.countDown();
            assertThat(List.of(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS))).containsExactlyInAnyOrder(true,false);
            assertThat(restoration.status(user.getId()).remainingRestorations()).isZero();assertThat(days.count()).isEqualTo(5);
        } finally {pool.shutdownNow();}
    }
    @Test void mondaySundayAndYearWeekTransitionsComeFromServerCalendar(){
        when(clock.instant()).thenReturn(Instant.parse("2026-11-08T05:00:00Z"));var sunday=restoration.status(user.getId());
        assertThat(sunday.weekStart()).isEqualTo(LocalDate.of(2026,11,2));assertThat(sunday.days().getLast().date()).isEqualTo(sunday.today());
        when(clock.instant()).thenReturn(Instant.parse("2026-11-08T17:00:00Z"));assertThat(restoration.status(user.getId()).weekStart()).isEqualTo(LocalDate.of(2026,11,9));
        when(clock.instant()).thenReturn(Instant.parse("2026-12-31T17:00:00Z"));assertThat(restoration.status(user.getId()).today()).isEqualTo(LocalDate.of(2027,1,1));
    }
}
