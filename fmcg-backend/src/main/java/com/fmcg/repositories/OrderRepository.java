package com.fmcg.repositories;

import com.fmcg.models.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByShopIdOrderByDateDesc(Long shopId);
    List<Order> findByDistributorIdOrderByDateDesc(Long distributorId);
    List<Order> findByDistributorIdAndStatusOrderByDateDesc(Long distributorId, String status);
}
