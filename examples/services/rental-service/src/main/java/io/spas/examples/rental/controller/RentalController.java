package io.spas.examples.rental.controller;

import io.spas.examples.rental.dto.RentalRequest;
import io.spas.examples.rental.events.RentalRequestedEvent;
import io.spas.examples.rental.events.RentalReturnedEvent;
import io.spas.examples.rental.model.Rental;
import io.spas.sdk.events.EventPublisher;
import io.spas.sdk.metadata.annotations.SpasCommand;
import io.spas.sdk.metadata.annotations.SpasQuery;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/rentals")
public class RentalController {

    private final EventPublisher eventPublisher;
    private final Map<UUID, Rental> rentalStore = new ConcurrentHashMap<>();

    public RentalController(EventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @PostMapping
    @SpasCommand(name = "request-rental", version = "1.0", description = "Requests a new equipment rental", produces = RentalRequestedEvent.class)
    public ResponseEntity<Rental> requestRental(@RequestBody RentalRequest request) {
        UUID id = UUID.randomUUID();
        
        List<Rental.RentalItem> items = request.getItems().stream()
            .map(i -> new Rental.RentalItem(i.getProductId(), i.getQuantity()))
            .collect(Collectors.toList());

        Rental rental = new Rental(
            id,
            request.getCustomerId(),
            items,
            request.getStartDate(),
            request.getEndDate(),
            "REQUESTED"
        );

        rentalStore.put(id, rental);

        // Publish event
        List<RentalRequestedEvent.RentalItem> eventItems = items.stream()
            .map(i -> new RentalRequestedEvent.RentalItem(i.getProductId(), i.getQuantity()))
            .collect(Collectors.toList());

        RentalRequestedEvent event = new RentalRequestedEvent(
            id,
            request.getCustomerId(),
            eventItems,
            request.getStartDate(),
            request.getEndDate()
        );

        eventPublisher.publish(event);

        return ResponseEntity.ok(rental);
    }

    @PostMapping("/{id}/return")
    @SpasCommand(name = "return-rental", version = "1.0", description = "Processes the return of rented equipment", produces = RentalReturnedEvent.class)
    public ResponseEntity<Rental> returnRental(@PathVariable UUID id) {
        Rental rental = rentalStore.get(id);
        if (rental == null) {
            return ResponseEntity.notFound().build();
        }

        rental.addStatusChange("RETURNED", "Equipment returned by customer");
        rental.setEndDate(LocalDateTime.now()); // Actual return time

        // Publish event
        List<RentalReturnedEvent.ReturnedItem> eventItems = rental.getItems().stream()
            .map(i -> new RentalReturnedEvent.ReturnedItem(i.getProductId(), i.getQuantity()))
            .collect(Collectors.toList());

        RentalReturnedEvent event = new RentalReturnedEvent(
            id,
            eventItems,
            LocalDateTime.now()
        );

        eventPublisher.publish(event);

        return ResponseEntity.ok(rental);
    }

    @GetMapping("/{id}")
    @SpasQuery(name = "get-rental", version = "1.0", description = "Gets rental details")
    public ResponseEntity<Rental> getRental(@PathVariable UUID id) {
        Rental rental = rentalStore.get(id);
        if (rental == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rental);
    }
    
    @GetMapping
    @SpasQuery(name = "list-rentals", version = "1.0", description = "Lists all rentals")
    public ResponseEntity<List<Rental>> listRentals() {
        return ResponseEntity.ok(new ArrayList<>(rentalStore.values()));
    }
}
