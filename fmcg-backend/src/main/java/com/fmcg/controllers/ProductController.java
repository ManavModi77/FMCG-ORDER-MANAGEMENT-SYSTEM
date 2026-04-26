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
        boolean hasCategory = category != null && !category.isEmpty() && !category.equalsIgnoreCase("All");
        boolean hasSearch   = search   != null && !search.trim().isEmpty();

        List<Product> products;
        if (hasCategory && hasSearch)
            products = productRepository.findByNameContainingIgnoreCaseAndCategory(search.trim(), category);
        else if (hasSearch)
            products = productRepository.findByNameContainingIgnoreCase(search.trim());
        else if (hasCategory)
            products = productRepository.findByCategory(category);
        else
            products = productRepository.findAll();

        return products.stream().map(p -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id",       p.getId());
            dto.put("name",     p.getName());
            dto.put("category", p.getCategory());
            dto.put("price",    p.getPrice());
            dto.put("image",    p.getImage());

            if (distributorId != null) {
                int stock = inventoryRepository
                        .findByDistributorIdAndProductId(distributorId, p.getId())
                        .map(DistributorInventory::getStock)
                        .orElse(0);
                dto.put("stock", stock);
            } else {
                dto.put("stock", 0);
            }
            return dto;
        }).toList();
    }

    // ── POST /api/products  (Admin only) ────────────────────────────────────
    // Creates product master record + seeds a zero-stock inventory row
    // for every existing distributor automatically.
    @PostMapping
    public ResponseEntity<?> addProduct(@RequestBody Product product) {
        if (product.getName() == null || product.getName().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Product name is required."));
        if (product.getPrice() == null || product.getPrice() < 0)
            return ResponseEntity.badRequest().body(Map.of("error", "A valid price is required."));

        product.setStock(0);
        Product saved = productRepository.save(product);

        // Auto-seed zero stock for every existing distributor
        List<User> distributors = userRepository.findByRole("DISTRIBUTOR");
        List<DistributorInventory> seedRows = new ArrayList<>();
        for (User dist : distributors) {
            DistributorInventory inv = new DistributorInventory();
            inv.setDistributorId(dist.getId());
            inv.setProduct(saved);
            inv.setStock(0);
            seedRows.add(inv);
        }
        inventoryRepository.saveAll(seedRows);

        return ResponseEntity.ok(saved);
    }

    // ── PUT /api/products/{id}/stock?distributorId=X ────────────────────────
    // Updates stock only for the requesting distributor — others unaffected.
    @PutMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(
            @PathVariable Long id,
            @RequestParam Long distributorId,
            @RequestBody Map<String, Integer> body
    ) {
        Integer newStock = body.get("stock");
        if (newStock == null || newStock < 0)
            return ResponseEntity.badRequest().body(Map.of("error", "Stock value must be 0 or greater."));

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        DistributorInventory inv = inventoryRepository
                .findByDistributorIdAndProductId(distributorId, id)
                .orElseGet(() -> {
                    DistributorInventory newInv = new DistributorInventory();
                    newInv.setDistributorId(distributorId);
                    newInv.setProduct(product);
                    newInv.setStock(0);
                    return newInv;
                });

        inv.setStock(newStock);
        inventoryRepository.save(inv);

        return ResponseEntity.ok(Map.of("message", "Stock updated.", "stock", newStock));
    }

    // ── GET /api/products/inventory?distributorId=X ─────────────────────────
    // Used by StockManagement.jsx — returns all products with THIS distributor's stock.
    @GetMapping("/inventory")
    public ResponseEntity<?> getDistributorInventory(@RequestParam Long distributorId) {
        List<DistributorInventory> rows = inventoryRepository.findByDistributorId(distributorId);

        // New distributor with no rows yet → auto-seed from all products
        if (rows.isEmpty()) {
            List<Product> allProducts = productRepository.findAll();
            List<DistributorInventory> seeded = new ArrayList<>();
            for (Product p : allProducts) {
                DistributorInventory inv = new DistributorInventory();
                inv.setDistributorId(distributorId);
                inv.setProduct(p);
                inv.setStock(0);
                seeded.add(inv);
            }
            rows = inventoryRepository.saveAll(seeded);
        }

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