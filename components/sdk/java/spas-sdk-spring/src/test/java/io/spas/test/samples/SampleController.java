package io.spas.test.samples;

import io.spas.sdk.metadata.annotations.SpasCommand;
import io.spas.sdk.metadata.annotations.SpasQuery;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class SampleController {

    @PostMapping
    @SpasCommand(
        name = "CreateOrder",
        version = "1.0.0",
        path = "/api/orders",
        produces = { SampleEvent.class },
        description = "SAMPLE_COMMAND_DESC"
    )
    public SampleResponse createOrder(@RequestBody SampleRequest request) {
        return new SampleResponse();
    }

    @GetMapping("/{id}")
    @SpasQuery(
        name = "GetOrder",
        version = "1.0.0",
        path = "/api/orders/{id}"
    )
    public SampleResponse getOrder(@PathVariable("id") String id) {
        return new SampleResponse();
    }
}
