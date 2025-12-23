namespace OrderService.Models;

public record OrderItem(string ProductId, int Quantity, decimal Price);
