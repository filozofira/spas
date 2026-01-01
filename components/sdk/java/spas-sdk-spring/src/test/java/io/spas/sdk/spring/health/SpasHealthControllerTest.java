package io.spas.sdk.spring.health;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.health.Status;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SpasHealthControllerTest {

    private MockMvc mockMvc;
    private HealthEndpoint healthEndpoint;

    @BeforeEach
    void setUp() {
        healthEndpoint = mock(HealthEndpoint.class);
        SpasHealthController controller = new SpasHealthController(healthEndpoint);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void live_returnsUp() throws Exception {
        mockMvc.perform(get("/_spas/health/live"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(content().json("{\"status\":\"UP\"}"));
    }

    @Test
    void ready_returnsUp_whenActuatorIsUp() throws Exception {
        HealthComponent health = Health.up().build();
        when(healthEndpoint.health()).thenReturn(health);

        mockMvc.perform(get("/_spas/health/ready"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(content().json("{\"status\":\"UP\"}"));
    }

    @Test
    void ready_returnsServiceUnavailable_whenActuatorIsDown() throws Exception {
        HealthComponent health = Health.down().build();
        when(healthEndpoint.health()).thenReturn(health);

        mockMvc.perform(get("/_spas/health/ready"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(content().json("{\"status\":\"DOWN\"}"));
    }
}
