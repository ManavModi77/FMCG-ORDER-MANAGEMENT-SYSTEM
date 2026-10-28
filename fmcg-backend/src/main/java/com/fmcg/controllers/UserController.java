package com.fmcg.controllers;

import com.fmcg.models.User;
import com.fmcg.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/distributors")
    public List<Map<String, Object>> getDistributors() {
        
        return userRepository.findByRole("DISTRIBUTOR")
                .stream()
                .map(this::toSafeResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/shops/{distributorId}")
    public List<Map<String, Object>> getShopsByDistributor(@PathVariable Long distributorId) {
        
        return userRepository.findByDistributorId(distributorId)
                .stream()
                .map(this::toSafeResponse)
                .collect(Collectors.toList());
    }

    
    private Map<String, Object> toSafeResponse(User user) {
        Map<String, Object> safe = new HashMap<>();
        safe.put("id", user.getId());
        safe.put("name", user.getName());
        safe.put("email", user.getEmail());
        safe.put("role", user.getRole());
        safe.put("distributorId", user.getDistributorId());
        return safe;
    }
}
