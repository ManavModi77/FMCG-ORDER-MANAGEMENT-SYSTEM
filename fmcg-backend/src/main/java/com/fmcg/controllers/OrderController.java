package com.fmcg.controllers;

import com.fmcg.models.DistributorInventory;
import com.fmcg.models.Order;
import com.fmcg.models.Product;
import com.fmcg.models.User;
import com.fmcg.repositories.DistributorInventoryRepository;
import com.fmcg.repositories.OrderRepository;
import com.fmcg.repositories.ProductRepository;
import com.fmcg.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {

    @Autowired private OrderRepository orderRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private DistributorInventoryRepository inventoryRepository;

    // ── POST /api/orders ────────────────────────────────────────────────────
    // Deducts from the specific distributor's inventory — not a global stock.
    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody Order order) {
        order.getItems().forEach(item -> item.setOrder(order));

        User shop = userRepository.findById(order.getShopId()).orElse(null);
        if (shop != null) order.setShopName(shop.getName());

        Long distributorId = order.getDistributorId();

        // Check & deduct from THIS distributor's inventory only
        for (var item : order.getItems()) {
            Long productId = item.getProduct().getId();

            DistributorInventory inv = inventoryRepository
                    .findByDistributorIdAndProductId(distributorId, productId)
                    .orElse(null);

            if (inv == null) {
                // Distributor has no inventory row for this product → treat as out of stock
                Product p = productRepository.findById(productId).orElse(null);
                String pName = p != null ? p.getName() : "ID " + productId;
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Product not in distributor's inventory: " + pName)
                );
            }

            int updatedStock = inv.getStock() - item.getCount();
            if (updatedStock < 0) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Insufficient stock for: " + inv.getProduct().getName()
                                + ". Available: " + inv.getStock()
                                + ", Requested: " + item.getCount())
                );
            }
            inv.setStock(updatedStock);
            inventoryRepository.save(inv);
        }

        order.setStatus("PENDING");
        return ResponseEntity.ok(orderRepository.save(order));
    }

    // ── GET /api/orders/shop/{shopId} ───────────────────────────────────────
    @GetMapping("/shop/{shopId}")
    public List<Order> getOrdersByShop(@PathVariable Long shopId) {
        return orderRepository.findByShopIdOrderByDateDesc(shopId);
    }

    // ── GET /api/orders/distributor/{distributorId} ─────────────────────────
    @GetMapping("/distributor/{distributorId}")
    public List<Order> getOrdersByDistributor(
            @PathVariable Long distributorId,
            @RequestParam(required = false) String status) {
        if (status != null)
            return orderRepository.findByDistributorIdAndStatusOrderByDateDesc(
                    distributorId, status.toUpperCase());
        return orderRepository.findByDistributorIdOrderByDateDesc(distributorId);
    }

    // ── PUT /api/orders/{orderId}/confirm ───────────────────────────────────
    @PutMapping("/{orderId}/confirm")
    public ResponseEntity<?> confirmOrder(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus("CONFIRMED");
        orderRepository.save(order);
        return ResponseEntity.ok().build();
    }

    // ── PUT /api/orders/{orderId}/cancel ────────────────────────────────────
    // Restores stock back to THIS distributor's inventory only.
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if ("CONFIRMED".equalsIgnoreCase(order.getStatus()))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Cannot cancel a confirmed order."));

        if ("CANCELLED".equalsIgnoreCase(order.getStatus()))
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Order is already cancelled."));

        Long distributorId = order.getDistributorId();

        // Restore stock to THIS distributor's inventory only
        for (var item : order.getItems()) {
            inventoryRepository
                    .findByDistributorIdAndProductId(distributorId, item.getProduct().getId())
                    .ifPresent(inv -> {
                        inv.setStock(inv.getStock() + item.getCount());
                        inventoryRepository.save(inv);
                    });
        }

        order.setStatus("CANCELLED");
        orderRepository.save(order);
        return ResponseEntity.ok(Map.of("message", "Order cancelled. Stock restored."));
    }
}