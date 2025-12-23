using System.Collections.Concurrent;
using SubscriptionService.Models;

namespace SubscriptionService.Services;

public class SubscriptionStore
{
    private readonly ConcurrentDictionary<Guid, Subscription> _subscriptions = new();

    public void Add(Subscription subscription) => _subscriptions[subscription.SubscriptionId] = subscription;
    public Subscription? Get(Guid id) => _subscriptions.TryGetValue(id, out var subscription) ? subscription : null;
    public IEnumerable<Subscription> GetAll() => _subscriptions.Values;
}
