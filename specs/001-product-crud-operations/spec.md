# Feature Specification: Product CRUD Operations with Event Emission

**Feature Branch**: `001-product-crud-operations`  
**Created**: January 3, 2026  
**Status**: Draft  
**Input**: User description: "Extend example product-service to support add, update and remove operations including emitting corresponding events"

## Clarifications

### Session 2026-01-03

- Q: When two catalog managers attempt to update the same product simultaneously, how should the system handle this? → A: This is an example service hence no need to deal with concurrent writes
- Q: Should product operations (add/update/remove) succeed even if the event fails to emit, or should the entire operation be rolled back? → A: Best effort: Operation succeeds, event failure logged but doesn't block operation
- Q: What constraints should apply to text field lengths (name, description) to prevent unreasonably large data? → A: Name max 200 chars, Description max 2000 chars
- Q: When updating a product, should the catalog manager be required to provide all fields (full replacement), or can they send only the fields they want to change (partial update)? → A: Partial update: Only changed fields need to be provided (PATCH semantics)
- Q: Should ProductId follow a specific pattern for validation? → A: Lowercase alphanumeric with hyphens, 1-50 chars

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add New Product (Priority: P1)

A catalog manager needs to add new products to the catalog so they become available for customers to browse and purchase. This is the foundation of inventory management.

**Why this priority**: Without the ability to add products, the catalog remains static and cannot grow with business needs. This is the most fundamental operation for any product catalog system.

**Independent Test**: Can be fully tested by submitting a new product with all required details (ID, name, category, price, description) and verifying it appears in subsequent product listings. An event notification should be observable confirming the product was added.

**Acceptance Scenarios**:

1. **Given** a valid product with all required fields (ID, name, category, price, description), **When** a catalog manager submits the add product request, **Then** the product is added to the catalog and a ProductAdded event is emitted containing all product details
2. **Given** a product ID that already exists, **When** a catalog manager attempts to add a product with that ID, **Then** the operation fails with a conflict error and no event is emitted
3. **Given** a product with missing required fields, **When** a catalog manager submits the add product request, **Then** the operation fails with a validation error specifying which fields are missing and no event is emitted
4. **Given** a product with invalid data (e.g., negative price), **When** a catalog manager submits the add product request, **Then** the operation fails with a validation error and no event is emitted

---

### User Story 2 - Update Existing Product (Priority: P2)

A catalog manager needs to update product information (such as price changes, description improvements, or category reassignments) to keep the catalog accurate and current.

**Why this priority**: While not as critical as adding products, updating existing product data is essential for maintaining catalog accuracy and responding to market changes like price adjustments or improved product descriptions.

**Independent Test**: Can be fully tested by modifying one or more fields of an existing product and verifying the changes are reflected in subsequent queries. An event notification should be observable with both old and new values.

**Acceptance Scenarios**:

1. **Given** an existing product in the catalog, **When** a catalog manager updates one or more fields (name, category, price, or description), **Then** the product is updated with the new values and a ProductUpdated event is emitted containing the product ID, old values, and new values
2. **Given** a product ID that does not exist, **When** a catalog manager attempts to update that product, **Then** the operation fails with a not found error and no event is emitted
3. **Given** an existing product, **When** a catalog manager attempts to update it with invalid data (e.g., negative price), **Then** the operation fails with a validation error, the product remains unchanged, and no event is emitted
4. **Given** an existing product, **When** a catalog manager updates only some fields while leaving others unchanged, **Then** only the specified fields are updated and the event reflects only the changed fields

---

### User Story 3 - Remove Product (Priority: P3)

A catalog manager needs to remove discontinued or obsolete products from the catalog so they are no longer visible to customers.

**Why this priority**: While important for catalog maintenance, removing products is typically less frequent than adding or updating them. Products are often marked as discontinued rather than removed entirely.

**Independent Test**: Can be fully tested by removing an existing product and verifying it no longer appears in product listings or can be retrieved by ID. An event notification should be observable confirming the product was removed.

**Acceptance Scenarios**:

1. **Given** an existing product in the catalog, **When** a catalog manager removes the product, **Then** the product is deleted from the catalog and a ProductRemoved event is emitted containing the removed product's details
2. **Given** a product ID that does not exist, **When** a catalog manager attempts to remove that product, **Then** the operation fails with a not found error and no event is emitted
3. **Given** a product that was just removed, **When** a customer attempts to query that product by ID, **Then** the operation returns a not found response
4. **Given** a product that was just removed, **When** a customer lists all products, **Then** the removed product does not appear in the results

---

### Edge Cases

- How does the system handle removal of a product that is currently being updated?
- What happens if the event emission fails after the product operation succeeds? (Best effort: operation succeeds, failure logged)
- How does the system handle very large product descriptions or names that exceed typical length limits? (Validation rejects: Name max 200 chars, Description max 2000 chars)
- What happens when attempting to add/update a product with special characters or unicode in the name or description?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authorized users to add new products to the catalog with required fields: product ID, name, category, price, and description
- **FR-002**: System MUST validate that product IDs are unique before adding a new product
- **FR-002a**: System MUST validate that product IDs contain only lowercase alphanumeric characters and hyphens, and are between 1 and 50 characters in length
- **FR-003**: System MUST validate that prices are non-negative decimal values
- **FR-004**: System MUST validate that all required fields are present and non-empty before accepting add or update operations
- **FR-004a**: System MUST validate that product names do not exceed 200 characters
- **FR-004b**: System MUST validate that product descriptions do not exceed 2000 characters
- **FR-005**: System MUST allow authorized users to update existing products by changing one or more fields (name, category, price, description) using partial update semantics where only changed fields are provided
- **FR-006**: System MUST allow authorized users to remove products from the catalog by product ID
- **FR-007**: System MUST emit a ProductAdded event when a product is successfully added, containing all product details (ID, name, category, price, description)
- **FR-008**: System MUST emit a ProductUpdated event when a product is successfully updated, containing the product ID, the fields that changed, and both old and new values
- **FR-009**: System MUST emit a ProductRemoved event when a product is successfully removed, containing all details of the removed product
- **FR-010**: System MUST return appropriate HTTP status codes: 201 for successful creation, 200 for successful updates, 204 for successful deletion, 404 for not found, 409 for conflicts, 400 for validation errors
- **FR-011**: System MUST persist product changes so they survive service restarts
- **FR-012**: System MUST ensure that removed products do not appear in product listings or individual product queries
- **FR-013**: System MUST reject operations that would create invalid catalog states (e.g., duplicate IDs, invalid data types)
- **FR-014**: Events MUST be emitted through the SPAS sidecar using the event publishing mechanism on a best-effort basis (event failures are logged but do not block operations)
- **FR-015**: All operations MUST maintain W3C Trace Context for observability

### Key Entities

- **Product**: Represents a catalog item with attributes: ProductId (unique identifier, lowercase alphanumeric with hyphens, 1-50 characters), Name (display name, max 200 characters), Category (product classification), Price (decimal value, non-negative), Description (detailed information, max 2000 characters)
- **ProductAdded Event**: Domain event emitted when a product is created, containing the complete product data
- **ProductUpdated Event**: Domain event emitted when a product is modified, containing product ID, changed fields with old and new values
- **ProductRemoved Event**: Domain event emitted when a product is deleted, containing the complete product data of the removed item

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Catalog managers can add a new product to the catalog in under 5 seconds
- **SC-002**: Catalog managers can update an existing product in under 3 seconds
- **SC-003**: Catalog managers can remove a product from the catalog in under 3 seconds
- **SC-004**: All product operations (add, update, remove) successfully emit corresponding events within 1 second of operation completion
- **SC-005**: Product changes are immediately visible in subsequent queries (within 100 milliseconds)
- **SC-006**: The system correctly validates 100% of invalid operations and rejects them with appropriate error messages
- **SC-007**: The system maintains catalog integrity with zero orphaned or duplicate products across all operations
- **SC-008**: Event consumers can successfully process all emitted events and reconstruct catalog state from the event stream
