package io.spas.test.samples;

import io.spas.sdk.metadata.annotations.SpasEvent;

@SpasEvent(
    type = "SampleEvent",
    version = "1.0.0"
)
public class SampleEvent {
    public String id;
}
