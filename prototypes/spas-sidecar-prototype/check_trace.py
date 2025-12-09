#!/usr/bin/env python3
import json
import urllib.request

data = json.loads(urllib.request.urlopen("http://localhost:9411/api/v2/traces?limit=1").read())
if data:
    spans = data[0]
    print(f"{'Span ID':<20} {'Parent ID':<20} {'Span Name':<50}")
    print("-" * 90)
    for span in sorted(spans, key=lambda x: x.get('timestamp', 0)):
        span_id = span.get('id', 'N/A')[:16]
        parent_id = span.get('parentId', '')[:16] if span.get('parentId') else '(root)'
        name = span.get('name', 'N/A')[:45]
        print(f"{span_id:<20} {parent_id:<20} {name:<50}")
    
    print("\n\n=== HIERARCHY CHECK ===")
    # Check if all parentIds are present as spanIds
    all_ids = {span.get('id') for span in spans}
    missing_parents = set()
    for span in spans:
        if span.get('parentId') and span.get('parentId') not in all_ids:
            missing_parents.add(span.get('parentId'))
    
    if missing_parents:
        print(f"❌ ERROR: Missing parent IDs (not found as span IDs): {missing_parents}")
    else:
        print("✅ GOOD: All parentIds point to existing span IDs")
