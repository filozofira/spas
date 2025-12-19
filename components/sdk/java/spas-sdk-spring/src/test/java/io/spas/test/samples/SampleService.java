package io.spas.test.samples;

import io.spas.sdk.metadata.annotations.SpasService;

@SpasService(
    id = "sample-service",
    name = "Sample Service",
    version = "1.0.0",
    boundedContext = "test"
)
public class SampleService {
}
