package com.fmcg.repositories;

import com.fmcg.models.DistributorInventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DistributorInventoryRepository extends JpaRepository<DistributorInventory, Long> {

    // Get all inventory rows for one distributor (used by StockManagement page)
    List<DistributorInventory> findByDistributorId(Long distributorId);

    // Get a specific product's stock for a specific distributor (used on order placement)
    Optional<DistributorInventory> findByDistributorIdAndProductId(Long distributorId, Long productId);

    // Delete all inventory rows for a product (used when admin deletes a product)
    void deleteByProductId(Long productId);
}