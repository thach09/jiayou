package com.heyganba.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Pure calendar logic. Protected dates connect runs but earn zero study days. */
public final class StreakContinuity {
    private StreakContinuity() {}
    public record Result(int current, int preserved, int longest, boolean protectedRun,
                         List<LocalDate> gap, boolean withinWindow) {}
    private record Segment(LocalDate start,LocalDate end,int realDays,boolean protectedRun) {}

    public static Result evaluate(Set<LocalDate> qualified, Set<LocalDate> restored,
                                  LocalDate today,LocalDate summaryAnchor,int summaryCount) {
        Set<LocalDate> real=new HashSet<>(qualified);
        // A historical summary is trusted only for its recorded last qualified day.
        if(summaryAnchor!=null&&!summaryAnchor.isAfter(today)&&summaryCount>0)real.add(summaryAnchor);
        TreeSet<LocalDate> covered=new TreeSet<>(real);covered.addAll(restored);
        covered.removeIf(day->day.isAfter(today));
        List<Segment> segments=new ArrayList<>();
        LocalDate start=null,end=null;int count=0;boolean protectedRun=false;
        for(LocalDate day:covered){
            if(end!=null&&!day.equals(end.plusDays(1))){
                segments.add(new Segment(start,end,count,protectedRun));start=null;count=0;protectedRun=false;
            }
            if(start==null)start=day;
            end=day;if(real.contains(day))count++;else protectedRun=true;
        }
        if(end!=null)segments.add(new Segment(start,end,count,protectedRun));
        if(summaryAnchor!=null){
            for(int i=0;i<segments.size();i++){
                Segment s=segments.get(i);
                if(!summaryAnchor.isBefore(s.start)&&!summaryAnchor.isAfter(s.end)){
                    long knownPrefix=real.stream().filter(d->!d.isBefore(s.start)&&!d.isAfter(summaryAnchor)).count();
                    segments.set(i,new Segment(s.start,s.end,s.realDays+Math.max(0,summaryCount-(int)knownPrefix),s.protectedRun));
                }
            }
        }
        segments.removeIf(s->s.realDays==0); // A protected date alone cannot originate a streak.
        int longest=segments.stream().mapToInt(Segment::realDays).max().orElse(0);
        if(segments.isEmpty())return new Result(0,0,longest,false,List.of(),false);
        Segment latest=segments.getLast();
        boolean current=!latest.end.isBefore(today.minusDays(1));
        LocalDate gapStart=null,gapEnd=null;int preserved=0;
        if(!current){gapStart=latest.end.plusDays(1);gapEnd=today.minusDays(1);preserved=latest.realDays;}
        else if(segments.size()>1){
            Segment previous=segments.get(segments.size()-2);
            gapStart=previous.end.plusDays(1);gapEnd=latest.start.minusDays(1);preserved=previous.realDays;
        }
        List<LocalDate> gap=new ArrayList<>();
        boolean eligible=gapStart!=null&&!gapStart.isBefore(today.minusDays(7))&&!gapEnd.isAfter(today.minusDays(1));
        // Bounded output even for a years-old break; never allocate its full date range.
        if(eligible&&ChronoUnit.DAYS.between(gapStart,gapEnd)<7)
            for(LocalDate d=gapStart;!d.isAfter(gapEnd);d=d.plusDays(1))if(!covered.contains(d))gap.add(d);
        return new Result(current?latest.realDays:0,preserved,longest,latest.protectedRun,List.copyOf(gap),eligible&&!gap.isEmpty());
    }
}
