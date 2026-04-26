package com.fmcg.models;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long shopId;
    private String shopName;
    private Long distributorId;

    private Double total;

    // Explicit length ensures PENDING / CONFIRMED / CANCELLED all fit safely
    @Column(length = 20)
    private String status;

    private LocalDateTime date = LocalDateTime.now();

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "order")
    private List<OrderItem> items;

    @Column(name = "transaction_id")
    private String transactionId;
}