package com.heyganba;
import com.heyganba.service.StreakContinuity;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.Set;
import static org.assertj.core.api.Assertions.assertThat;

class StreakContinuityTest {
    private static final LocalDate TODAY=LocalDate.of(2026,11,2);
    @Test void emptyAndFutureCannotEarnAStreak(){
        var empty=StreakContinuity.evaluate(Set.of(),Set.of(),TODAY,null,0);
        assertThat(empty.current()).isZero();assertThat(empty.gap()).isEmpty();
        assertThat(StreakContinuity.evaluate(Set.of(TODAY.plusDays(1)),Set.of(),TODAY,null,0).current()).isZero();
        assertThat(StreakContinuity.evaluate(Set.of(),Set.of(TODAY.minusDays(1)),TODAY,null,0).current()).isZero();
    }
    @Test void missingDaysRemainPendingAndFreezeDoesNotEarnStudyDays(){
        Set<LocalDate> real=Set.of(TODAY.minusDays(4),TODAY.minusDays(3));
        var before=StreakContinuity.evaluate(real,Set.of(),TODAY,null,0);
        assertThat(before.current()).isZero();assertThat(before.preserved()).isEqualTo(2);
        assertThat(before.gap()).containsExactly(TODAY.minusDays(2),TODAY.minusDays(1));
        var after=StreakContinuity.evaluate(real,Set.copyOf(before.gap()),TODAY,null,0);
        assertThat(after.current()).isEqualTo(2);assertThat(after.longest()).isEqualTo(2);assertThat(after.protectedRun()).isTrue();
        assertThat(after.gap()).isEmpty();
    }
    @Test void newlyQualifiedRunCanReconnectToPreviousRun(){
        Set<LocalDate> real=Set.of(TODAY.minusDays(4),TODAY.minusDays(3),TODAY);
        var pending=StreakContinuity.evaluate(real,Set.of(),TODAY,TODAY,1);
        assertThat(pending.current()).isEqualTo(1);assertThat(pending.preserved()).isEqualTo(2);
        assertThat(StreakContinuity.evaluate(real,Set.copyOf(pending.gap()),TODAY,TODAY,1).current()).isEqualTo(3);
    }
    @Test void eligibilityIsCalendarBoundedAndOldGapsCannotAllocateUnboundedLists(){
        var seven=StreakContinuity.evaluate(Set.of(TODAY.minusDays(8)),Set.of(),TODAY,null,0);
        assertThat(seven.gap()).hasSize(7);assertThat(seven.withinWindow()).isTrue();
        var old=StreakContinuity.evaluate(Set.of(TODAY.minusYears(12)),Set.of(),TODAY,null,0);
        assertThat(old.withinWindow()).isFalse();assertThat(old.gap()).isEmpty();assertThat(old.current()).isZero();
        var restarted=StreakContinuity.evaluate(Set.of(TODAY.minusYears(12),TODAY),Set.of(),TODAY,TODAY,1);
        assertThat(restarted.current()).isEqualTo(1);assertThat(restarted.withinWindow()).isFalse();
    }
    @Test void trustedSummaryPreservesUnknownHistoricalPrefixWithoutInventingActivity(){
        var result=StreakContinuity.evaluate(Set.of(TODAY.minusDays(1),TODAY),Set.of(),TODAY,TODAY,12);
        assertThat(result.current()).isEqualTo(12);assertThat(result.longest()).isEqualTo(12);
    }
    @Test void leapDayAndYearBoundaryUseCalendarDates(){
        var leap=LocalDate.of(2024,3,1);
        var r=StreakContinuity.evaluate(Set.of(leap.minusDays(2)),Set.of(),leap,null,0);
        assertThat(r.gap()).containsExactly(LocalDate.of(2024,2,29));
        var year=LocalDate.of(2027,1,1);
        assertThat(StreakContinuity.evaluate(Set.of(year.minusDays(1),year),Set.of(),year,null,0).current()).isEqualTo(2);
    }
    @Test void aPreviouslyProtectedDateIsNeverChargedAgainInsideAReconnectedRange(){
        var r=StreakContinuity.evaluate(Set.of(TODAY.minusDays(5),TODAY),Set.of(TODAY.minusDays(3)),TODAY,null,0);
        assertThat(r.gap()).containsExactly(TODAY.minusDays(4),TODAY.minusDays(2),TODAY.minusDays(1));
        assertThat(r.gap()).doesNotContain(TODAY.minusDays(3));
    }
}
