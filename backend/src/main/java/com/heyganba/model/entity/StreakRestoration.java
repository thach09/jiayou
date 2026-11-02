package com.heyganba.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name="streak_restorations", uniqueConstraints=@UniqueConstraint(columnNames={"user_id","request_key"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class StreakRestoration {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id",nullable=false)
    @org.hibernate.annotations.OnDelete(action=org.hibernate.annotations.OnDeleteAction.CASCADE) private User user;
    @Column(name="request_key",nullable=false,length=36) private String requestKey;
    @Column(name="gap_token",nullable=false,length=64) private String gapToken;
    @Column(name="charge_month",nullable=false) private LocalDate chargeMonth;
    @Column(name="restored_count",nullable=false) private Integer restoredCount;
    @Column(name="created_at",nullable=false) private Instant createdAt;
}
