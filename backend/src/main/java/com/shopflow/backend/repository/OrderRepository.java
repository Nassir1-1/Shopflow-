package com.shopflow.backend.repository;

import com.shopflow.backend.entity.Order;
import com.shopflow.backend.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerId(Long customerId);
    List<Order> findByStatut(OrderStatus statut);
}