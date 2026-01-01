# SPAS Examples

High-level guide to the examples workspace. Use this directory to explore SPAS domain choreographies, sample services, and an edge API gateway.

## Domain Examples

Each domain workspace contains a `choreography.yaml`, pulled service metadata, and JSONata transformations. See the domain README for diagrams and run steps:

- [basic-order](./domains/basic-order/README.md)
- [order-fulfillment](./domains/order-fulfillment/README.md)
- [subscription-order](./domains/subscription-order/README.md)
- [basket-checkout](./domains/basket-checkout/README.md)
- [equipment-rental](./domains/equipment-rental/README.md)

## Services

Sample SPAS-compliant services used across the domain examples, plus helper scripts for publishing metadata and images. Start here for service-specific instructions and archives:

- Overview: [examples/services](./services/README.md)
- Service folders:
  - [order-service](./services/order-service/)
  - [inventory-service](./services/inventory-service/)
  - [product-service](./services/product-service/)
  - [fulfillment-service](./services/fulfillment-service/)
  - [subscription-service](./services/subscription-service/)
  - [basket-service](./services/basket-service/)

## API Gateway (Future Use)

The API Gateway under [examples/gateways/api-gateway](./gateways/api-gateway/) is provided for future/optional scenarios. It demonstrates a north-south edge gateway pattern and is not required for the core domain examples. See its README for details and build/run commands.
