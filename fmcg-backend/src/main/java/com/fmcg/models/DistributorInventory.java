package com.fmcg.models;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(
        name = "distributor_inventory",
        uniqueConstraints = @UniqueConstraint(columnNames = {"distributor_id", "product_id"})
)
public class DistributorInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which distributor owns this stock record
    @Column(name = "distributor_id", nullable = false)
    private Long distributorId;

    // Which product this stock record is for
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // THIS distributor's stock for this product
    @Column(nullable = false)
    private Integer stock = 0;
}