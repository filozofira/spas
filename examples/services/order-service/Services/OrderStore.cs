using System.Collections.Concurrent;
using OrderService.Models;

namespace OrderService.Services;

public class OrderStore
{
    private readonly ConcurrentDictionary<Guid, Order> _orders = new();

    public void Add(Order order) => _orders[order.OrderId] = order;
    public Order? Get(Guid id) => _orders.TryGetValue(id, out var order) ? order : null;
    public IEnumerable<Order> GetAll() => _orders.Values;
}
