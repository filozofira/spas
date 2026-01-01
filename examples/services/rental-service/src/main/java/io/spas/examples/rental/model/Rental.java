package io.spas.examples.rental.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Rental {
    private UUID id;
    private String customerId;
    private List<RentalItem> items;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status; // REQUESTED, ACTIVE, RETURNED
    private List<StatusChange> statusHistory;

    public Rental() {
        this.statusHistory = new ArrayList<>();
    }

    public Rental(UUID id, String customerId, List<RentalItem> items, LocalDateTime startDate, LocalDateTime endDate, String status) {
        this.id = id;
        this.customerId = customerId;
        this.items = items;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.statusHistory = new ArrayList<>();
        this.statusHistory.add(new StatusChange(status, LocalDateTime.now(), "Initial status"));
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public List<RentalItem> getItems() { return items; }
    public void setItems(List<RentalItem> items) { this.items = items; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<StatusChange> getStatusHistory() { return statusHistory; }
    public void setStatusHistory(List<StatusChange> statusHistory) { this.statusHistory = statusHistory; }

    public void addStatusChange(String newStatus, String reason) {
        this.status = newStatus;
        if (this.statusHistory == null) {
            this.statusHistory = new ArrayList<>();
        }
        this.statusHistory.add(new StatusChange(newStatus, LocalDateTime.now(), reason));
    }

    public static class RentalItem {
        private String productId;
        private int quantity;

        public RentalItem() {}
        public RentalItem(String productId, int quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }

        public String getProductId() { return productId; }
        public void setProductId(String productId) { this.productId = productId; }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }

    public static class StatusChange {
        private String status;
        private LocalDateTime timestamp;
        private String reason;

        public StatusChange() {}
        public StatusChange(String status, LocalDateTime timestamp, String reason) {
            this.status = status;
            this.timestamp = timestamp;
            this.reason = reason;
        }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
