package com.shopflow.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * FILE LOCATION:
 *   src/main/java/com/shopflow/backend/entity/ChatRoom.java
 *
 * DATABASE TABLE: chat_rooms
 *   One row per buyer-seller-product combination.
 *   With ddl-auto=update the table is created automatically.
 *
 *   Manual SQL (if needed):
 *     CREATE TABLE chat_rooms (
 *       id          BIGINT AUTO_INCREMENT PRIMARY KEY,
 *       product_id  BIGINT NOT NULL,
 *       buyer_id    BIGINT NOT NULL,
 *       seller_id   BIGINT NOT NULL,
 *       created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 *       CONSTRAINT uq_room UNIQUE (product_id, buyer_id, seller_id),
 *       FOREIGN KEY (product_id)  REFERENCES products(id),
 *       FOREIGN KEY (buyer_id)    REFERENCES users(id),
 *       FOREIGN KEY (seller_id)   REFERENCES users(id)
 *     );
 */
@Entity
@Table(name = "chat_rooms",
        uniqueConstraints = @UniqueConstraint(columnNames = {"product_id","buyer_id","seller_id"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChatMessage> messages;
}