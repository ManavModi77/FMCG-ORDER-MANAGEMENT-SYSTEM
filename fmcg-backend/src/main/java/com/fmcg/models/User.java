package com.fmcg.models;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;
    private String password;

    private String role; // "SHOP_OWNER" or "DISTRIBUTOR"
    private Long distributorId; // Only applicable if user is a shop_owner
}