package com.heyganba.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name="streak_restored_days",uniqueConstraints={
    @UniqueConstraint(columnNames={"user_id","restored_date"}),
    @UniqueConstraint(columnNames={"user_id","charge_month","credit_slot"})})
@org.hibernate.annotations.Check(constraints="credit_slot BETWEEN 1 AND 5")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class StreakRestoredDay {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id",nullable=false)
    @org.hibernate.annotations.OnDelete(action=org.hibernate.annotations.OnDeleteAction.CASCADE) private User user;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="restoration_id",nullable=false)
    @org.hibernate.annotations.OnDelete(action=org.hibernate.annotations.OnDeleteAction.CASCADE) private StreakRestoration restoration;
    @Column(name="restored_date",nullable=false) private LocalDate restoredDate;
    @Column(name="charge_month",nullable=false) private LocalDate chargeMonth;
    @Column(name="credit_slot",nullable=false) private Integer creditSlot;
}
