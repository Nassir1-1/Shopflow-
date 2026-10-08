package com.shopflow.backend.repository;

import com.shopflow.backend.entity.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {
    Optional<UserProgress> findByUserIdAndProductId(Long userId, Long productId);
}