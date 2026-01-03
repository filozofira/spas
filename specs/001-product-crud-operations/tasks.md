# Tasks: Product CRUD Operations with Event Emission

**Input**: Design documents from `/specs/001-product-crud-operations/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in specification, focusing on demonstrating implementation patterns

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Project extends existing `examples/services/product-service/` structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare infrastructure for CRUD operations and event emission

- [X] T001 Create Models/Events directory in examples/services/product-service/Models/
- [X] T002 [P] Create Validation directory in examples/services/product-service/Validation/
- [X] T003 [P] Verify SPAS SDK dependencies are available in ProductService.csproj (Events, Metadata already referenced)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Register EventPublisher with DI container in examples/services/product-service/Program.cs
- [X] T005 [P] Create ProductValidator class with validation methods in examples/services/product-service/Validation/ProductValidator.cs
- [X] T006 [P] Create AddProductRequest DTO with validation attributes in examples/services/product-service/Models/AddProductRequest.cs
- [X] T007 [P] Create UpdateProductRequest DTO with optional fields in examples/services/product-service/Models/UpdateProductRequest.cs

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add New Product (Priority: P1) 🎯 MVP

**Goal**: Enable catalog managers to add new products to the catalog with validation and ProductAdded event emission

**Independent Test**: Submit a new product with all required fields (ID, name, category, price, description) and verify it appears in subsequent product listings. Verify ProductAdded event is emitted.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Create ProductAdded event model with [SpasEvent] attribute in examples/services/product-service/Models/Events/ProductAdded.cs
- [ ] T009 [US1] Extend ProductCatalog service with Add() method using TryAdd for uniqueness check in examples/services/product-service/Services/ProductCatalog.cs
- [ ] T010 [US1] Implement POST /products endpoint with [SpasCommand] attribute in examples/services/product-service/Controllers/ProductsController.cs
- [ ] T011 [US1] Add validation logic for ProductId format, field lengths, and price in POST endpoint
- [ ] T012 [US1] Emit ProductAdded event via EventPublisher after successful add operation
- [ ] T013 [US1] Add conflict handling (409) for duplicate product IDs
- [ ] T014 [US1] Add error logging for event emission failures (best-effort pattern)

**Checkpoint**: At this point, User Story 1 should be fully functional - products can be added with validation and events

---

## Phase 4: User Story 2 - Update Existing Product (Priority: P2)

**Goal**: Enable catalog managers to update product information with partial update support and ProductUpdated event emission with change tracking

**Independent Test**: Modify one or more fields of an existing product and verify changes are reflected in subsequent queries. Verify ProductUpdated event contains old and new values.

### Implementation for User Story 2

- [ ] T015 [P] [US2] Create ProductUpdated event model with Changes property containing old/new values in examples/services/product-service/Models/Events/ProductUpdated.cs
- [ ] T016 [US2] Create ProductChange model for tracking field changes with OldValue and NewValue properties in examples/services/product-service/Models/Events/ProductUpdated.cs
- [ ] T017 [US2] Extend ProductCatalog service with Update() method supporting partial updates in examples/services/product-service/Services/ProductCatalog.cs
- [ ] T018 [US2] Implement change tracking logic to detect which fields changed in ProductCatalog.Update()
- [ ] T019 [US2] Implement PATCH /products/{id} endpoint with [SpasCommand] attribute in examples/services/product-service/Controllers/ProductsController.cs
- [ ] T020 [US2] Add validation for partial update request (at least one field, valid values)
- [ ] T021 [US2] Emit ProductUpdated event with change details via EventPublisher after successful update
- [ ] T022 [US2] Add 404 handling for non-existent products
- [ ] T023 [US2] Add error logging for event emission failures (best-effort pattern)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - products can be added and updated independently

---

## Phase 5: User Story 3 - Remove Product (Priority: P3)

**Goal**: Enable catalog managers to remove discontinued products from the catalog with ProductRemoved event emission

**Independent Test**: Remove an existing product and verify it no longer appears in product listings or can be retrieved by ID. Verify ProductRemoved event is emitted.

### Implementation for User Story 3

- [ ] T024 [P] [US3] Create ProductRemoved event model with full product details in examples/services/product-service/Models/Events/ProductRemoved.cs
- [ ] T025 [US3] Extend ProductCatalog service with Remove() method using TryRemove in examples/services/product-service/Services/ProductCatalog.cs
- [ ] T026 [US3] Implement DELETE /products/{id} endpoint with [SpasCommand] attribute in examples/services/product-service/Controllers/ProductsController.cs
- [ ] T027 [US3] Emit ProductRemoved event with removed product details via EventPublisher after successful removal
- [ ] T028 [US3] Add 404 handling for non-existent products
- [ ] T029 [US3] Verify removed products don't appear in GET /products and GET /products/{id}
- [ ] T030 [US3] Add error logging for event emission failures (best-effort pattern)

**Checkpoint**: All three user stories should now be independently functional - complete CRUD with events

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final deliverables

- [ ] T031 [P] Update README.md with new endpoints, events, and usage examples in examples/services/product-service/README.md
- [ ] T032 [P] Regenerate service metadata using spas-service metadata extract command
- [ ] T033 [P] Verify W3C Trace Context propagation for all new operations
- [ ] T034 [P] Test quickstart.md workflows (add, update, remove, verify events)
- [ ] T035 Code review for validation consistency across all endpoints
- [ ] T036 Verify error messages are clear and actionable for validation failures
- [ ] T037 Test all acceptance scenarios from spec.md for each user story
- [ ] T038 Verify event schemas match data-model.md specifications
- [ ] T039 Test with sidecar to confirm CloudEvents format and routing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational (Phase 2) completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 (operates on existing products, US1 adds them)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2 (operates on existing products)

**Note**: While US2 and US3 operate on products that US1 creates, they are testable with the existing seed data, making them independently implementable.

### Within Each User Story

**User Story 1 (Add Product)**:
1. ProductAdded event model (T008) - first
2. ProductCatalog.Add() method (T009) - depends on T008
3. POST endpoint (T010-T014) - depends on T008, T009

**User Story 2 (Update Product)**:
1. ProductUpdated event model with change tracking (T015-T016) - first (can parallel)
2. ProductCatalog.Update() with change tracking (T017-T018) - depends on T015-T016
3. PATCH endpoint (T019-T023) - depends on T017-T018

**User Story 3 (Remove Product)**:
1. ProductRemoved event model (T024) - first
2. ProductCatalog.Remove() (T025) - depends on T024
3. DELETE endpoint (T026-T030) - depends on T024-T025

### Parallel Opportunities

**Phase 1 - Setup**:
- T001, T002, T003 can all run in parallel (different directories)

**Phase 2 - Foundational**:
- T005 (validator), T006 (AddProductRequest), T007 (UpdateProductRequest) can run in parallel
- T004 (DI registration) should be done after T005-T007

**Phase 3-5 - User Stories**:
- Once Phase 2 completes, ALL THREE user stories can be implemented in parallel by different developers
- Within US1: T008 can start immediately, then T009-T014
- Within US2: T015-T016 can start immediately in parallel, then T017-T018, then T019-T023
- Within US3: T024 can start immediately, then T025, then T026-T030

**Phase 6 - Polish**:
- T031 (README), T032 (metadata), T033 (tracing), T034 (quickstart) can all run in parallel
- T035-T039 are review/validation tasks that should be sequential

---

## Parallel Example: All User Stories

Once Foundational (Phase 2) completes, three developers can work in parallel:

```bash
# Developer 1: User Story 1 (Add Product)
# Creates: Models/Events/ProductAdded.cs
# Extends: Services/ProductCatalog.cs (Add method)
# Extends: Controllers/ProductsController.cs (POST endpoint)

# Developer 2: User Story 2 (Update Product)
# Creates: Models/Events/ProductUpdated.cs
# Extends: Services/ProductCatalog.cs (Update method)
# Extends: Controllers/ProductsController.cs (PATCH endpoint)

# Developer 3: User Story 3 (Remove Product)
# Creates: Models/Events/ProductRemoved.cs
# Extends: Services/ProductCatalog.cs (Remove method)
# Extends: Controllers/ProductsController.cs (DELETE endpoint)
```

All three can merge independently as each operates on different methods/endpoints.

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

**Recommended**: Implement User Story 1 (P1) first for quickest value delivery:
- Phase 1: Setup (T001-T003)
- Phase 2: Foundational (T004-T007)
- Phase 3: User Story 1 only (T008-T014)
- Phase 6: Minimal polish (T031-T034)

This delivers the most critical functionality: ability to add products with validation and events.

### Incremental Delivery

After MVP, add stories in priority order:
1. **Iteration 1**: US1 (P1) - Add products
2. **Iteration 2**: US1 + US2 (P1-P2) - Add and update products
3. **Iteration 3**: US1 + US2 + US3 (P1-P3) - Full CRUD

Each iteration delivers independently valuable functionality.

### Full Parallel (if team size allows)

With 3+ developers:
- Complete Phases 1-2 together
- Split into 3 parallel tracks for US1, US2, US3
- Merge all user stories
- Complete Phase 6 together

---

## Validation Checklist

After implementation, verify:

- [ ] All acceptance scenarios from spec.md pass for each user story
- [ ] ProductAdded event emitted with complete product data
- [ ] ProductUpdated event emitted with change tracking (old/new values)
- [ ] ProductRemoved event emitted with complete product data
- [ ] Validation rejects: invalid product ID format, negative price, missing fields, excessive lengths
- [ ] HTTP status codes correct: 201 (created), 200 (updated), 204 (deleted), 400 (validation), 404 (not found), 409 (conflict)
- [ ] Events use best-effort delivery (failures logged, operations succeed)
- [ ] W3C Trace Context propagated through all operations
- [ ] Metadata regenerated and includes new commands/events
- [ ] README updated with new capabilities
- [ ] Quickstart guide workflows verified
- [ ] No concurrency control needed (example service)
- [ ] In-memory storage maintained (ConcurrentDictionary)

---

## Total Task Count

- **Setup**: 3 tasks
- **Foundational**: 4 tasks
- **User Story 1**: 7 tasks
- **User Story 2**: 9 tasks
- **User Story 3**: 7 tasks
- **Polish**: 9 tasks

**Grand Total**: 39 tasks

### Tasks by User Story

- **US1 (P1)**: 7 tasks - Add product with validation and events
- **US2 (P2)**: 9 tasks - Update product with change tracking and events
- **US3 (P3)**: 7 tasks - Remove product with events

### Parallel Task Count

Tasks that can run in parallel (marked with [P]): 11 tasks
- Phase 1: 2 parallel tasks (T002, T003)
- Phase 2: 3 parallel tasks (T005, T006, T007)
- Phase 3: 1 parallel task (T008)
- Phase 4: 2 parallel tasks (T015, T016)
- Phase 5: 1 parallel task (T024)
- Phase 6: 4 parallel tasks (T031, T032, T033, T034)

### Suggested MVP Scope

**Minimum for demonstration**: Phases 1-3 + minimal Phase 6 (Setup + Foundational + User Story 1 + README/metadata)
- 18 tasks total
- Delivers: Add products with full validation and event emission
- Time estimate: 1-2 days for experienced developer

**Recommended for complete example**: All phases
- 39 tasks total
- Delivers: Full CRUD operations with events
- Time estimate: 3-5 days for experienced developer
