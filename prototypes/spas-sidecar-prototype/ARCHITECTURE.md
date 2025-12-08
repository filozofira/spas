# SPAS Architecture Diagrams

## 1. System Architecture - Component Interaction

```mermaid
graph TB
    subgraph Services["📦 Application Services"]
        OrderSvc["order-service<br/>(Port 5001)<br/>─────<br/>✓ Publish orders<br/>✓ Receive responses"]
        FulfillmentSvc["fulfillment-service<br/>(Port 5002)<br/>─────<br/>✓ Process orders<br/>✓ Publish events"]
    end
    
    subgraph Sidecars["🔄 SPAS Sidecars"]
        OrderSidecar["order-service-sidecar<br/>(Port 7001)<br/>─────<br/>✓ Transform input<br/>✓ Transform output<br/>✓ Redis pub/sub"]
        FulfillmentSidecar["fulfillment-service-sidecar<br/>(Port 7002)<br/>─────<br/>✓ Transform input<br/>✓ Transform output<br/>✓ Redis pub/sub"]
    end
    
    subgraph Infrastructure["🏗️ Infrastructure"]
        Redis["Redis Streams<br/>(Port 6379)<br/>─────<br/>📨 orders-requested<br/>📨 orders-processed"]
        Zipkin["Zipkin<br/>(Port 9411)<br/>─────<br/>🔍 Distributed Tracing<br/>W3C Trace Context"]
    end
    
    OrderSvc -->|POST /publish| OrderSidecar
    OrderSidecar -->|HTTP POST /incoming| OrderSvc
    
    FulfillmentSvc -->|POST /publish| FulfillmentSidecar
    FulfillmentSidecar -->|HTTP POST /incoming| FulfillmentSvc
    
    OrderSidecar <-->|Redis Streams| Redis
    FulfillmentSidecar <-->|Redis Streams| Redis
    
    OrderSidecar -->|Log spans| Zipkin
    FulfillmentSidecar -->|Log spans| Zipkin
```

## 2. Message Flow - Complete Cycle with Trace Propagation

```mermaid
sequenceDiagram
    participant OS as order-service
    participant OSS as order-service-sidecar
    participant Redis
    participant FSS as fulfillment-service-sidecar
    participant FS as fulfillment-service
    participant Zipkin
    
    Note over OS,Zipkin: Phase 1: Order Publication
    
    OS->>OS: Generate W3C traceparent<br/>00-abc...xyz-01
    OS->>OSS: POST /publish/orders-requested<br/>Headers: traceparent, x-service-name
    
    activate OSS
    OSS->>OSS: Transform message (input)
    OSS->>OSS: Wrap in CloudEvents<br/>+ embed traceparent
    OSS->>Zipkin: Log span: receive order
    OSS->>Redis: xAdd orders-requested
    OSS->>Zipkin: Log span: publish to Redis
    deactivate OSS
    
    activate FSS
    FSS->>Redis: Subscribe to orders-requested
    FSS->>FSS: Receive CloudEvent<br/>Extract traceparent (SAME!)
    FSS->>FSS: Transform message (output)
    FSS->>Zipkin: Log span: transform
    FSS->>FS: HTTP POST /incoming<br/>Headers: traceparent
    FSS->>Zipkin: Log span: invoke service
    deactivate FSS
    
    activate FS
    FS->>FS: Extract & log trace ID
    FS->>FS: Process order
    FS->>FS: Generate fulfillment event
    deactivate FS
    
    Note over OS,Zipkin: Phase 2: Fulfillment Publication
    
    FS->>FSS: POST /publish/orders-processed<br/>Headers: traceparent (SAME!), x-service-name
    
    activate FSS
    FSS->>FSS: Transform message (input)
    FSS->>FSS: Wrap in CloudEvents<br/>+ embed traceparent
    FSS->>Zipkin: Log span: receive fulfillment
    FSS->>Redis: xAdd orders-processed
    FSS->>Zipkin: Log span: publish to Redis
    deactivate FSS
    
    activate OSS
    OSS->>Redis: Subscribe to orders-processed
    OSS->>OSS: Receive CloudEvent<br/>Extract traceparent (SAME!)
    OSS->>OSS: Transform message (output)
    OSS->>Zipkin: Log span: transform
    OSS->>OS: HTTP POST /incoming<br/>Headers: traceparent
    OSS->>Zipkin: Log span: invoke service
    deactivate OSS
    
    activate OS
    OS->>OS: Extract & log trace ID
    OS->>OS: Correlate with original order
    OS->>Zipkin: Log operation complete
    deactivate OS
```

## 3. Trace Correlation - Single Trace ID Throughout

```mermaid
graph LR
    T1["🔵 Trace ID<br/>00-abc...xyz-01"]
    
    T1 --> P1["📤 order-service<br/>publishes"]
    P1 --> T1
    P1 --> P2["🔄 order-sidecar<br/>transforms"]
    P2 --> T1
    P2 --> P3["📨 Redis<br/>stores"]
    P3 --> T1
    P3 --> P4["🔄 fulfillment-sidecar<br/>transforms"]
    P4 --> T1
    P4 --> P5["🔵 fulfillment-service<br/>processes"]
    P5 --> T1
    P5 --> P6["📤 fulfillment-service<br/>publishes"]
    P6 --> T1
    P6 --> P7["🔄 fulfillment-sidecar<br/>transforms"]
    P7 --> T1
    P7 --> P8["📨 Redis<br/>stores"]
    P8 --> T1
    P8 --> P9["🔄 order-sidecar<br/>transforms"]
    P9 --> T1
    P9 --> P10["📥 order-service<br/>receives"]
    P10 --> T1
    
    P10 --> CHECK["✅ CORRELATED!<br/>Same trace ID"]
    
    style T1 fill:#4CAF50,stroke:#2E7D32,stroke-width:3px,color:#fff
    style CHECK fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    style P1 fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    style P5 fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    style P10 fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
```

## 4. Sidecar Pattern - Publisher vs Subscriber

```mermaid
graph TB
    subgraph Publisher["📤 Publishing Pattern"]
        PApp["Application<br/>Service"]
        PApp -->|POST /publish/topic| PSidecar["Sidecar"]
        PSidecar -->|Transform<br/>Input| PCE["CloudEvents<br/>+ Trace"]
        PCE -->|Publish| PRedis["Redis<br/>Stream"]
        
        style PApp fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
        style PSidecar fill:#FFF9C4,stroke:#F57F17,stroke-width:2px
        style PCE fill:#C8E6C9,stroke:#388E3C,stroke-width:2px
        style PRedis fill:#FFCCBC,stroke:#D84315,stroke-width:2px
    end
    
    subgraph Subscriber["📥 Subscribing Pattern"]
        SRedis["Redis<br/>Stream"]
        SRedis -->|Subscribe| SSidecar["Sidecar"]
        SSidecar -->|Extract<br/>Trace ID| SSidecar2["Transform<br/>Output"]
        SSidecar2 -->|HTTP POST| SApp["Application<br/>Service<br/>/incoming"]
        
        style SApp fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
        style SSidecar fill:#FFF9C4,stroke:#F57F17,stroke-width:2px
        style SSidecar2 fill:#FFF9C4,stroke:#F57F17,stroke-width:2px
        style SRedis fill:#FFCCBC,stroke:#D84315,stroke-width:2px
    end
```

## 5. Message Transformation Pipeline

```mermaid
graph LR
    A["📦<br/>Raw Message<br/><br/>orderId: ORDER-1<br/>amount: 100<br/>timestamp: 2025-12-08T..."]
    
    B["1️⃣ Extract<br/>Trace ID<br/><br/>From request headers<br/>or CloudEvent"]
    
    C["2️⃣ Apply<br/>Transform<br/><br/>Add metadata<br/>_transformed: true<br/>_component: ..."]
    
    D["3️⃣ Wrap in<br/>CloudEvents<br/><br/>specversion: 1.0<br/>type: message<br/>traceparent: ✓"]
    
    E["4️⃣ Preserve<br/>Trace<br/><br/>Embed in CloudEvent<br/>Pass to next service"]
    
    F["✅<br/>CloudEvent<br/><br/>Ready for Redis<br/>or HTTP delivery"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    
    style A fill:#E3F2FD,stroke:#1976D2,stroke-width:2px,color:#000
    style B fill:#FFF9C4,stroke:#F57F17,stroke-width:2px,color:#000
    style C fill:#FFF9C4,stroke:#F57F17,stroke-width:2px,color:#000
    style D fill:#C8E6C9,stroke:#388E3C,stroke-width:2px,color:#000
    style E fill:#C8E6C9,stroke:#388E3C,stroke-width:2px,color:#000
    style F fill:#A5D6A7,stroke:#1B5E20,stroke-width:3px,color:#fff
```

## 6. Zipkin Trace Visualization

```mermaid
graph TB
    subgraph Trace["🔍 Single Trace ID: 00-abc...xyz-01"]
        Span1["Span 1: order-service<br/>publishes order<br/>Duration: 2ms"]
        Span2["Span 2: order-sidecar<br/>transforms & publishes<br/>Duration: 5ms"]
        Span3["Span 3: fulfillment-sidecar<br/>receives & invokes<br/>Duration: 8ms"]
        Span4["Span 4: fulfillment-service<br/>processes order<br/>Duration: 15ms"]
        Span5["Span 5: fulfillment-sidecar<br/>transforms & publishes<br/>Duration: 6ms"]
        Span6["Span 6: order-sidecar<br/>receives & invokes<br/>Duration: 7ms"]
        Span7["Span 7: order-service<br/>processes response<br/>Duration: 3ms"]
        
        Span1 --> Span2
        Span2 --> Span3
        Span3 --> Span4
        Span4 --> Span5
        Span5 --> Span6
        Span6 --> Span7
        
        style Span1 fill:#BBDEFB,stroke:#1976D2,stroke-width:2px
        style Span2 fill:#FFF9C4,stroke:#F57F17,stroke-width:2px
        style Span3 fill:#FFF9C4,stroke:#F57F17,stroke-width:2px
        style Span4 fill:#BBDEFB,stroke:#1976D2,stroke-width:2px
        style Span5 fill:#FFF9C4,stroke:#F57F17,stroke-width:2px
        style Span6 fill:#FFF9C4,stroke:#F57F17,stroke-width:2px
        style Span7 fill:#BBDEFB,stroke:#1976D2,stroke-width:2px
    end
    
    Legend["Service Spans (Blue)<br/>Sidecar Spans (Yellow)<br/>Total Latency: 46ms"]
```

## 7. Framework Integration Deployment

```mermaid
graph TB
    subgraph K8S["☸️ Kubernetes Deployment"]
        subgraph Pod1["📦 Pod: Order Service"]
            OS["order-service<br/>Container"]
            OSS["spas-sidecar<br/>Container<br/>config:<br/>order-service.json"]
            OS -.->|localhost:7001| OSS
        end
        
        subgraph Pod2["📦 Pod: Fulfillment Service"]
            FS["fulfillment-service<br/>Container"]
            FSS["spas-sidecar<br/>Container<br/>config:<br/>fulfillment-service.json"]
            FS -.->|localhost:7002| FSS
        end
        
        subgraph Shared["🔗 Shared Services"]
            Redis["Redis<br/>Deployment"]
            Zipkin["Zipkin<br/>Deployment"]
        end
        
        OSS <-->|Redis Streams| Redis
        FSS <-->|Redis Streams| Redis
        OSS -->|Trace Spans| Zipkin
        FSS -->|Trace Spans| Zipkin
        
        style OS fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
        style OSS fill:#FFF9C4,stroke:#F57F17,stroke-width:2px
        style FS fill:#E3F2FD,stroke:#1976D2,stroke-width:2px
        style FSS fill:#FFF9C4,stroke:#F57F17,stroke-width:2px
        style Redis fill:#FFCCBC,stroke:#D84315,stroke-width:2px
        style Zipkin fill:#F8BBD0,stroke:#C2185B,stroke-width:2px
    end
```

## 8. Data Flow - Order to Fulfillment

```mermaid
graph LR
    subgraph Input["📥 Input: Order"]
        I["orderId: ORDER-1<br/>amount: 600.65<br/>timestamp: ..."]
    end
    
    subgraph Transport["🚀 Transport Layer"]
        T1["CloudEvents Wrapper<br/>+ W3C Trace Context<br/>+ Metadata"]
    end
    
    subgraph Processing["⚙️ Processing"]
        P["Order Processing<br/>Fulfillment Logic<br/>Event Generation"]
    end
    
    subgraph Output["📤 Output: Response"]
        O["orderId: ORDER-1<br/>status: fulfilled<br/>amount: 600.65<br/>timestamp: ..."]
    end
    
    I -->|Transform| T1
    T1 -->|Redis Pub/Sub| P
    P -->|Transform| T1
    T1 -->|HTTP Delivery| O
    
    style I fill:#BBDEFB,stroke:#1976D2,stroke-width:2px
    style T1 fill:#C8E6C9,stroke:#388E3C,stroke-width:2px
    style P fill:#FFF9C4,stroke:#F57F17,stroke-width:2px
    style O fill:#C8E6C9,stroke:#388E3C,stroke-width:2px
```

---

## How to Use These Diagrams

1. **System Architecture (Diagram 1)**: Overview of all components and their interactions
2. **Message Flow (Diagram 2)**: Detailed sequence showing trace propagation through phases
3. **Trace Correlation (Diagram 3)**: Shows how single trace ID flows through system
4. **Sidecar Pattern (Diagram 4)**: Illustrates publish/subscribe patterns
5. **Transformation (Diagram 5)**: Details message transformation pipeline
6. **Zipkin Visualization (Diagram 6)**: How traces appear in Zipkin UI
7. **Kubernetes Deployment (Diagram 7)**: How to deploy in framework
8. **Data Flow (Diagram 8)**: End-to-end data transformation

## Integration Notes

When integrating SPAS into the framework (`src/sidecar`):

1. **Deploy sidecars in same pod** as service (see Diagram 7)
2. **Services communicate via localhost** to sidecar (port 7001, 7002, etc.)
3. **Configure via JSON files** (order-service.json, fulfillment-service.json)
4. **Enable Zipkin** for distributed tracing backend
5. **Deploy Redis Streams** as message broker (can be external service)
6. **Use CloudEvents SDK** in services for message handling
7. **Implement /incoming endpoint** in services for sidecar invocation

All diagrams are in Mermaid format and render in:
- GitHub markdown (.md files)
- GitLab markdown
- Notion
- Confluence
- Any Mermaid-compatible viewer
