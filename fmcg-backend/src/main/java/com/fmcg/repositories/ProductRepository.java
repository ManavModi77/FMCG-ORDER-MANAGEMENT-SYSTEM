package com.fmcg.repositories;

import com.fmcg.models.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Filter by exact category
    List<Product> findByCategory(String category);

    // Search by name (case-insensitive)
    List<Product> findByNameContainingIgnoreCase(String name);

    // Search by name AND category together
    List<Product> findByNameContainingIgnoreCaseAndCategory(String name, String category);

    // ✅ NEW: Find products at or below a stock threshold (for low stock alerts)
    List<Product> findByStockLessThanEqual(int threshold);
}