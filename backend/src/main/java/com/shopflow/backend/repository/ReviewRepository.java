package com.shopflow.backend.repository;

import com.shopflow.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductId(Long productId);
    boolean existsByCustomerIdAndProductId(Long customerId, Long productId);
}