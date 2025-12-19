package io.spas.sdk.metadata.builders;

import io.spas.sdk.metadata.model.Consistency;
import io.spas.sdk.metadata.model.ConsistencyLevel;
import io.spas.sdk.metadata.model.QueryConsistencyLevel;

/**
 * Fluent builder for consistency metadata.
 */
public final class ConsistencyBuilder {
    private ConsistencyLevel commands;
    private QueryConsistencyLevel queries;
    
    private ConsistencyBuilder() {}
    
    public static ConsistencyBuilder create() {
        return new ConsistencyBuilder();
    }
    
    public ConsistencyBuilder withCommands(ConsistencyLevel level) {
        this.commands = level;
        return this;
    }
    
    public ConsistencyBuilder withQueries(QueryConsistencyLevel level) {
        this.queries = level;
        return this;
    }
    
    public Consistency build() {
        return new Consistency(commands, queries);
    }
}
