using System.Collections.Concurrent;
using InventoryService.Models;

namespace InventoryService.Services;

public class InventoryStore
{
    private readonly ConcurrentDictionary<string, InventoryItem> _inventory = new();

    public InventoryStore()
    {
        // Seed with sample items
        _inventory["item-001"] = new InventoryItem("item-001", 100, 0);
        _inventory["item-002"] = new InventoryItem("item-002", 50, 0);
        _inventory["item-003"] = new InventoryItem("item-003", 75, 0);
    }

    public InventoryItem? Get(string itemId) => 
        _inventory.TryGetValue(itemId, out var item) ? item : null;

    public IEnumerable<InventoryItem> GetAll() => _inventory.Values;

    public bool AddItem(string itemId, int initialQuantity = 0)
    {
        return _inventory.TryAdd(itemId, new InventoryItem(itemId, initialQuantity, 0));
    }

    public void Reserve(string itemId, int quantity)
    {
        if (_inventory.TryGetValue(itemId, out var item))
        {
            var newAvailable = item.AvailableQuantity - quantity;
            var newReserved = item.ReservedQuantity + quantity;
            _inventory[itemId] = new InventoryItem(itemId, newAvailable, newReserved);
        }
    }

    /// <summary>
    /// Releases reserved stock back to available inventory.
    /// Used for rental returns, order cancellations, or reverse logistics.
    /// </summary>
    public bool Release(string itemId, int quantity)
    {
        if (_inventory.TryGetValue(itemId, out var item))
        {
            // Only release up to what's currently reserved
            var actualRelease = Math.Min(quantity, item.ReservedQuantity);
            if (actualRelease <= 0) return false;

            var newAvailable = item.AvailableQuantity + actualRelease;
            var newReserved = item.ReservedQuantity - actualRelease;
            _inventory[itemId] = new InventoryItem(itemId, newAvailable, newReserved);
            return true;
        }
        return false;
    }
}
