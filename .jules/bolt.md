## 2026-05-11 - [Missing Database Indexes on High-Growth Tables]
**Learning:** Identified that tables like `Comment` and `GroupMessage` lack composite indexes for common query patterns (e.g., fetching comments for a post or messages for a group, often ordered by time). Without these indexes, as the data grows, fetching feeds and chat history will become significantly slower due to full table scans or inefficient index usage.
**Action:** Add targeted composite indexes to `Comment`, `GroupMessage`, and `PostReaction` tables to optimize common read operations and aggregations.
