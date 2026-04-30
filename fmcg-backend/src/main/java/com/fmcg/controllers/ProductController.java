package com.fmcg.controllers;

import com.fmcg.models.DistributorInventory;
import com.fmcg.models.Product;
import com.fmcg.models.User;
import com.fmcg.repositories.DistributorInventoryRepository;
import com.fmcg.repositories.ProductRepository;
import com.fmcg.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    @Autowired private ProductRepository productRepository;
    @Autowired private DistributorInventoryRepository inventoryRepository;
    @Autowired private UserRepository userRepository;

    // ── GET /api/products?distributorId=X ───────────────────────────────────
    // Shop owners pass their distributorId → see THAT distributor's personal stock.
    // Admin / no distributorId → returns product list with stock=0.
    @GetMapping
    public List<Map<String, Object>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long distributorId
    ) {
        // ✅ FIX: Safely check for null BEFORE calling methods on the strings
        boolean hasCategory = category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("All");
        boolean hasSearch = search != null && !search.trim().isEmpty();

        List<Product> baseProducts;

        if (hasCategory && hasSearch) {
            baseProducts = productRepository.findByNameContainingIgnoreCaseAndCategory(search, category);
        } else if (hasCategory) {
            baseProducts = productRepository.findByCategory(category);
        } else if (hasSearch) {
            baseProducts = productRepository.findByNameContainingIgnoreCase(search);
        } else {
            baseProducts = productRepository.findAll();
        }

        List<Map<String, Object>> result = new ArrayList<>();

        for (Product product : baseProducts) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", product.getId());
            dto.put("name", product.getName());
            dto.put("category", product.getCategory());
            dto.put("price", product.getPrice());
            dto.put("image", product.getImage());

            int stock = 0;
            // If distributor ID is passed, fetch their specific stock for this product
            if (distributorId != null) {
                stock = inventoryRepository.findByDistributorIdAndProductId(distributorId, product.getId())
                        .map(DistributorInventory::getStock)
                        .orElse(0);
            }
            dto.put("stock", stock);
            result.add(dto);
        }

        return result;
    }

    // ── POST /api/products ──────────────────────────────────────────────────
    // Admin adds a new product. We also seed a blank stock row for all distributors.
    @PostMapping
    public ResponseEntity<?> addProduct(@RequestBody Product product) {
        Product savedProduct = productRepository.save(product);

        // Fetch all existing distributors
        List<User> distributors = userRepository.findByRole("distributor"); // ensure matches DB case

        // Create a 0-stock inventory record for every distributor for this new product
        for (User distributor : distributors) {
            DistributorInventory inv = new DistributorInventory();
            inv.setDistributorId(distributor.getId());
            inv.setProduct(savedProduct);
            inv.setStock(0);
            inventoryRepository.save(inv);
        }

        return ResponseEntity.ok(savedProduct);
    }

    // ── GET /api/products/inventory/{distributorId} ─────────────────────────
    // Fetch all products with the specific stock owned by this distributor
    @GetMapping("/inventory/{distributorId}")
    public ResponseEntity<List<Map<String, Object>>> getInventory(@PathVariable Long distributorId) {
        
        // Safety check to ensure all products are seeded for this distributor
        List<Product> allProducts = productRepository.findAll();
        for (Product product : allProducts) {
            Optional<DistributorInventory> existing = inventoryRepository.findByDistributorIdAndProductId(distributorId, product.getId());
            if (existing.isEmpty()) {
                DistributorInventory seeded = new DistributorInventory();
                seeded.setDistributorId(distributorId);
                seeded.setProduct(product);
                seeded.setStock(0);
                inventoryRepository.save(seeded);
            }
        }

        List<DistributorInventory> rows = inventoryRepository.findByDistributorId(distributorId);

        List<Map<String, Object>> result = rows.stream().map(inv -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id",       inv.getProduct().getId());
            dto.put("name",     inv.getProduct().getName());
            dto.put("category", inv.getProduct().getCategory());
            dto.put("price",    inv.getProduct().getPrice());
            dto.put("image",    inv.getProduct().getImage());
            dto.put("stock",    inv.getStock());
            return dto;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // ── PUT /api/products/{productId}/stock?distributorId=X ─────────────────
    // Distributor updates their own stock for a product
    @PutMapping("/{productId}/stock")
    public ResponseEntity<?> updateStock(
            @PathVariable Long productId,
            @RequestParam Long distributorId,
            @RequestBody Map<String, Integer> payload) {
            
        int addedStock = payload.getOrDefault("stock", 0);
        
        DistributorInventory inv = inventoryRepository.findByDistributorIdAndProductId(distributorId, productId)
                .orElseThrow(() -> new RuntimeException("Inventory record not found"));
                
        inv.setStock(inv.getStock() + addedStock);
        inventoryRepository.save(inv);
        
        return ResponseEntity.ok(Map.of("message", "Stock updated successfully", "newStock", inv.getStock()));
    }

    // ── GET /api/products/low-stock?distributorId=X ─────────────────────────
    @GetMapping("/low-stock")
    public List<Map<String, Object>> getLowStockProducts(
            @RequestParam Long distributorId,
            @RequestParam(defaultValue = "10") int threshold
    ) {
        return inventoryRepository.findByDistributorId(distributorId)
                .stream()
                .filter(inv -> inv.getStock() <= threshold)
                .map(inv -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id",       inv.getProduct().getId());
                    dto.put("name",     inv.getProduct().getName());
                    dto.put("category", inv.getProduct().getCategory());
                    dto.put("stock",    inv.getStock());
                    return dto;
                }).toList();
    }
}
