package com.fmcg.controllers;

import com.fmcg.models.User;
import com.fmcg.repositories.UserRepository;
import com.fmcg.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already in use!"));
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User registered successfully!"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginRequest) {

        // ✅ FIX 1: Return 401 JSON instead of throwing RuntimeException (which gives a 500)
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.get("email"));
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password."));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(loginRequest.get("password"), user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password."));
        }

        // ✅ FIX 2: Normalize role to lowercase BEFORE putting in token AND response.
        // This ensures admin/distributor/shop_owner all work consistently on the frontend
        // regardless of how the role was stored in the DB (ADMIN, admin, Admin — all work).
        String normalizedRole = user.getRole().toLowerCase();

        String token = jwtUtil.generateToken(user.getEmail(), normalizedRole, user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", normalizedRole);          // always lowercase
        response.put("distributorId", user.getDistributorId());

        return ResponseEntity.ok(response);
    }
}