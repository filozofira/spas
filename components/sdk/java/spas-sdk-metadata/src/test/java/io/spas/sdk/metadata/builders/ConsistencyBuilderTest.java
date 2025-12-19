package io.spas.sdk.metadata.builders;

import io.spas.sdk.metadata.model.Consistency;
import io.spas.sdk.metadata.model.ConsistencyLevel;
import io.spas.sdk.metadata.model.QueryConsistencyLevel;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ConsistencyBuilderTest {
    
    @Test
    void build_shouldCreateEmptyConsistency() {
        Consistency consistency = ConsistencyBuilder.create().build();
        
        assertNull(consistency.commands());
        assertNull(consistency.queries());
    }
    
    @Test
    void build_shouldIncludeCommandsConsistency() {
        Consistency consistency = ConsistencyBuilder.create()
            .withCommands(ConsistencyLevel.ACID)
            .build();
        
        assertEquals(ConsistencyLevel.ACID, consistency.commands());
        assertNull(consistency.queries());
    }
    
    @Test
    void build_shouldIncludeQueriesConsistency() {
        Consistency consistency = ConsistencyBuilder.create()
            .withQueries(QueryConsistencyLevel.EVENTUAL)
            .build();
        
        assertNull(consistency.commands());
        assertEquals(QueryConsistencyLevel.EVENTUAL, consistency.queries());
    }
    
    @Test
    void build_shouldIncludeBothConsistencies() {
        Consistency consistency = ConsistencyBuilder.create()
            .withCommands(ConsistencyLevel.EVENTUAL)
            .withQueries(QueryConsistencyLevel.STRONG)
            .build();
        
        assertEquals(ConsistencyLevel.EVENTUAL, consistency.commands());
        assertEquals(QueryConsistencyLevel.STRONG, consistency.queries());
    }
}
