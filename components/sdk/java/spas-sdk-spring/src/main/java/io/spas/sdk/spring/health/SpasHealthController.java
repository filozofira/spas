package io.spas.sdk.spring.health;

import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.health.Status;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
public class SpasHealthController {

    private final HealthEndpoint healthEndpoint;

    public SpasHealthController(HealthEndpoint healthEndpoint) {
        this.healthEndpoint = healthEndpoint;
    }

    @GetMapping("/_spas/health/ready")
    public ResponseEntity<Map<String, String>> ready() {
        HealthComponent health = healthEndpoint.health();
        Status status = health.getStatus();

        if (Status.UP.equals(status)) {
            return ResponseEntity.ok(Collections.singletonMap("status", "UP"));
        } else {
            return ResponseEntity.status(503).body(Collections.singletonMap("status", "DOWN"));
        }
    }

    @GetMapping("/_spas/health/live")
    public ResponseEntity<Map<String, String>> live() {
        return ResponseEntity.ok(Collections.singletonMap("status", "UP"));
    }
}
