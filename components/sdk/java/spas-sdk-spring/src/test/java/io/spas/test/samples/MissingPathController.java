package io.spas.test.samples;

import io.spas.sdk.metadata.annotations.SpasCommand;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test controller with missing path - no Spring mapping annotation and no explicit path.
 * This should trigger a warning and skip the endpoint.
 */
@RestController
public class MissingPathController {

    @SpasCommand(
        name = "OrphanCommand",
        version = "1.0.0"
        // No path, no Spring mapping annotation - should be skipped with warning
    )
    public SampleResponse orphanCommand(@RequestBody SampleRequest request) {
        return new SampleResponse();
    }
}
