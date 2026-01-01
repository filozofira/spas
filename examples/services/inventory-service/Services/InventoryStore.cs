using System.Collections.Concurrent;
using InventoryService.Models;

namespace InventoryService.Services;

public class InventoryStore
{
    private readonly ConcurrentDictionary<string, InventoryItem> _inventory = new();

    public InventoryStore()
    {
        // Seed with sample products
        _inventory["prod-001"] = new InventoryItem("prod-001", 100, 0);
        _inventory["prod-002"] = new InventoryItem("prod-002", 50, 0);
        _inventory["prod-003"] = new InventoryItem("prod-003", 75, 0);
    }

    public InventoryItem? Get(string productId) => 
        _inventory.TryGetValue(productId, out var item) ? item : null;

    public IEnumerable<InventoryItem> GetAll() => _inventory.Values;

    public void Reserve(string productId, int quantity)
    {
        if (_inventory.TryGetValue(productId, out var item))
        {
            var newAvailable = item.AvailableQuantity - quantity;
            var newReserved = item.ReservedQuantity + quantity;
            _inventory[productId] = new InventoryItem(productId, newAvailable, newReserved);
        }
    }

    /// <summary>
    /// Releases reserved stock back to available inventory.
    /// Used for rental returns, order cancellations, or reverse logistics.
    /// </summary>
    public bool Release(string productId, int quantity)
    {
        if (_inventory.TryGetValue(productId, out var item))
        {
            // Only release up to what's currently reserved
            var actualRelease = Math.Min(quantity, item.ReservedQuantity);
            if (actualRelease <= 0) return false;

            var newAvailable = item.AvailableQuantity + actualRelease;
            var newReserved = item.ReservedQuantity - actualRelease;
            _inventory[productId] = new InventoryItem(productId, newAvailable, newReserved);
            return true;
        }
        return false;
    }
}
