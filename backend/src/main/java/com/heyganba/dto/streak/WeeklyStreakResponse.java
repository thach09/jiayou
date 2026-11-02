package com.heyganba.dto.streak;
import java.time.LocalDate;
import java.util.List;
public record WeeklyStreakResponse(String state,int currentStreak,int displayStreak,int preservedStreak,
        int longestStreak,boolean todayQualified,String zone,LocalDate today,LocalDate weekStart,
        List<Day> days,int monthlyLimit,int usedRestorations,int remainingRestorations,
        int requiredRestorations,boolean canRestore,String gapToken,String reason,
        List<LocalDate> missedDates,boolean replayed) {
    public record Day(LocalDate date,String state,boolean qualified,boolean restored) {}
}
