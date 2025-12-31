package io.spas.test.samples;

import io.spas.sdk.metadata.annotations.SpasCommand;
import io.spas.sdk.metadata.annotations.SpasQuery;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test controller demonstrating optional path behavior.
 * Paths are inferred from Spring annotations.
 */
@RestController
@RequestMapping("/api/products")
public class OptionalPathController {

    @PostMapping
    @SpasCommand(
        name = "CreateProduct",
        version = "1.0.0"
        // path omitted - will be inferred as /api/products
    )
    public SampleResponse createProduct(@RequestBody SampleRequest request) {
        return new SampleResponse();
    }

    @GetMapping("/{id}")
    @SpasQuery(
        name = "GetProduct",
        version = "1.0.0"
        // path omitted - will be inferred as /api/products/{id}
    )
    public SampleResponse getProduct(@PathVariable("id") String id) {
        return new SampleResponse();
    }

    @PostMapping("/batch")
    @SpasCommand(
        name = "CreateProductBatch",
        version = "1.0.0"
        // path omitted - will be inferred as /api/products/batch
    )
    public SampleResponse createProductBatch(@RequestBody SampleRequest request) {
        return new SampleResponse();
    }
}
