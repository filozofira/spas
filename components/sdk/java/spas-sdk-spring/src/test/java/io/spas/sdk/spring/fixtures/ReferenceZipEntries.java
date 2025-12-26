package io.spas.sdk.spring.fixtures;

import java.util.List;

public final class ReferenceZipEntries {
    private ReferenceZipEntries() {}

    public static final List<String> ORDER_SERVICE_1_0_0 = List.of(
        "spas.json",
        "schemas/events/order-confirmed.schema.json",
        "schemas/events/order-created.schema.json",
        "schemas/endpoints/confirm-order.schema.json",
        "schemas/endpoints/create-order.schema.json",
        "schemas/endpoints/update-shipment-status.schema.json"
    );
}
