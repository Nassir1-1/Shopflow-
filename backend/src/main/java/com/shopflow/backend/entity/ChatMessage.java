package com.shopflow.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * FILE LOCATION:
 *   src/main/java/com/shopflow/backend/entity/ChatMessage.java
 *
 * DATABASE TABLE: chat_messages
 *   Matches ChatRoom's "mappedBy = room" on its `messages` list.
 *   With ddl-auto=update the table is created automatically.
 */
@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Lob
    @Column(columnDefinition = "CLOB", nullable = false)
    private String content;

    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();

    @Builder.Default
    private Boolean read = false;
}