package com.heyganba.service;

import com.heyganba.common.exception.BadRequestException;
import com.heyganba.common.exception.ResourceNotFoundException;
import com.heyganba.dto.streak.WeeklyStreakResponse;
import com.heyganba.model.entity.*;
import com.heyganba.repository.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class StreakRestorationService {
    public static final int MONTHLY_LIMIT=5;
    private final UserRepository users;
    private final StudyActivityRepository activities;
    private final StreakRepository streaks;
    private final StreakRestorationRepository transactions;
    private final StreakRestoredDayRepository restoredDays;
    private final StreakService streak;
    private final StreakPolicy policy;
    private final Clock clock;
    public StreakRestorationService(UserRepository users,StudyActivityRepository activities,StreakRepository streaks,
            StreakRestorationRepository transactions,StreakRestoredDayRepository restoredDays,StreakService streak,
            StreakPolicy policy,@Qualifier("streakClock") Clock clock){
        this.users=users;this.activities=activities;this.streaks=streaks;this.transactions=transactions;
        this.restoredDays=restoredDays;this.streak=streak;this.policy=policy;this.clock=clock;
    }
    /** Lock also makes multiple read queries a consistent owner snapshot during restoration. */
    @Transactional
    public WeeklyStreakResponse status(Long owner){
        locked(owner);return snapshot(owner,clock.instant(),false);
    }
    @Transactional
    public WeeklyStreakResponse restore(Long owner,UUID requestId,String expectedGap){
        User user=locked(owner);Instant now=clock.instant();
        var replay=transactions.findByUserIdAndRequestKey(owner,requestId.toString());
        if(replay.isPresent()){
            if(!replay.get().getGapToken().equals(expectedGap))throw new BadRequestException("Mã yêu cầu đã được dùng cho lần khôi phục khác.");
            return snapshot(owner,now,true);
        }
        var before=snapshot(owner,now,false);
        if(!before.canRestore()||!Objects.equals(before.gapToken(),expectedGap))
            throw new BadRequestException("Trạng thái chuỗi đã thay đổi hoặc không đủ lượt. Vui lòng tải lại trước khi khôi phục.");
        LocalDate month=before.today().withDayOfMonth(1);
        var event=transactions.saveAndFlush(StreakRestoration.builder().user(user).requestKey(requestId.toString())
                .gapToken(expectedGap).chargeMonth(month).restoredCount(before.requiredRestorations()).createdAt(now).build());
        int slot=before.usedRestorations();
        for(LocalDate day:before.missedDates())restoredDays.save(StreakRestoredDay.builder().user(user).restoration(event)
                .restoredDate(day).chargeMonth(month).creditSlot(++slot).build());
        restoredDays.flush();
        var after=snapshot(owner,now,false);
        // Keep the legacy summary consistent. No study_activities, EXP or rewards are written.
        var summary=streaks.findByUserId(owner).orElseThrow();
        summary.setCurrentStreak(after.currentStreak());
        summary.setLongestStreak(Math.max(summary.getLongestStreak(),after.longestStreak()));
        streaks.save(summary);
        return snapshot(owner,now,false);
    }
    private User locked(Long owner){return users.findLockedById(owner).orElseThrow(()->new ResourceNotFoundException("Người dùng","id",owner));}

    private WeeklyStreakResponse snapshot(Long owner,Instant now,boolean replayed){
        LocalDate today=streak.today(now),month=today.withDayOfMonth(1);
        Map<LocalDate,int[]> daily=new HashMap<>();
        for(var a:activities.findByUserId(owner)){
            if(a.getActivityDate().isAfter(today))continue;
            int index=switch(a.getSource()){case StudyActivityService.SOURCE_FLASHCARD->0;case StudyActivityService.SOURCE_EXAM->1;case StudyActivityService.SOURCE_GRAMMAR->2;default->-1;};
            if(index>=0)daily.computeIfAbsent(a.getActivityDate(),k->new int[3])[index]+=a.getItemCount();
        }
        Set<LocalDate> real=new HashSet<>();
        daily.forEach((d,n)->{if(policy.qualifies(n[0],n[1],n[2]))real.add(d);});
        Set<LocalDate> protectedDates=new HashSet<>();
        restoredDays.findByUserId(owner).forEach(d->protectedDates.add(d.getRestoredDate()));
        var summary=streaks.findByUserId(owner).orElse(null);
        var result=StreakContinuity.evaluate(real,protectedDates,today,summary==null?null:summary.getLastActiveDate(),summary==null?0:summary.getCurrentStreak());
        int used=Math.toIntExact(restoredDays.countByUserIdAndChargeMonth(owner,month)),remaining=Math.max(0,MONTHLY_LIMIT-used);
        boolean canRestore=result.withinWindow()&&result.gap().size()<=remaining;
        String state,reason;
        if(canRestore){state="FROZEN_PENDING";reason="ELIGIBLE_GAP";}
        else if(result.withinWindow()){state="BROKEN";reason="INSUFFICIENT_ALLOWANCE";}
        else if(result.current()==0&&result.preserved()>0){state="BROKEN";reason="WINDOW_EXPIRED";}
        else if(result.protectedRun()){state="RESTORED";reason="CONTINUITY_PROTECTED";}
        else {state=real.contains(today)?"ACTIVE":"AT_RISK";reason=result.current()==0?"NO_STREAK":"NONE";}
        LocalDate monday=today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<WeeklyStreakResponse.Day> week=new ArrayList<>();
        for(int i=0;i<7;i++){
            LocalDate d=monday.plusDays(i);boolean q=real.contains(d),r=protectedDates.contains(d);
            String dayState=d.isAfter(today)?"FUTURE":q?(d.equals(today)?"TODAY_COMPLETED":"COMPLETED"):
                    r?"RESTORED":d.equals(today)?"TODAY_PENDING":"MISSED";
            week.add(new WeeklyStreakResponse.Day(d,dayState,q,r));
        }
        int longest=Math.max(summary==null?0:summary.getLongestStreak(),result.longest());
        return new WeeklyStreakResponse(state,result.current(),canRestore?result.preserved():result.current(),result.preserved(),longest,
                real.contains(today),streak.zone().getId(),today,monday,List.copyOf(week),MONTHLY_LIMIT,used,remaining,result.gap().size(),canRestore,
                canRestore?gapToken(owner,month,result.gap()):null,reason,result.gap(),replayed);
    }
    private static String gapToken(Long owner,LocalDate month,List<LocalDate> dates){
        try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest((owner+":"+month+":"+dates).getBytes(StandardCharsets.UTF_8)));}
        catch(java.security.NoSuchAlgorithmException e){throw new IllegalStateException("Required digest unavailable");}
    }
}
