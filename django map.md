# Django Models & DRF Serializers — Skill Mindmap

## 1. Foundations
- Models.Model cơ bản
  - Fields chuẩn: Char, Integer, DateTime, Boolean
  - Quan hệ: FK, M2M, O2O
- Migrations
  - makemigrations / migrate
  - Rollback, data migration
- Django Admin
  - Register model
  - Inline relationships

---

## 2. Model Design Principles
- Tối ưu schema
  - null vs blank
  - default, choices
  - unique, constraints
- Meta configuration
  - ordering
  - db_index, unique_together
- String & url methods
  - __str__()
  - get_absolute_url()

---

## 3. ORM Mastery
- QuerySet essentials
  - filter, exclude, annotate, aggregate
  - values / values_list
- Performance
  - select_related vs prefetch_related
  - N+1 detection
  - Query logging
- Custom extensions
  - Custom Manager
  - Custom QuerySet
  - Custom Model Fields

---

## 4. Data Integrity & Transactions
- atomic blocks
- select_for_update
- Optimistic concurrency
- Database-level constraints

---

## 5. DRF Serializer Foundations
- Serializer vs ModelSerializer
- Fields
  - CharField, IntegerField, DateTimeField
  - PrimaryKeyRelatedField, SlugRelatedField
- Validation
  - Field-level
  - Object-level
  - Unique & custom validators
- Methods
  - create()
  - update()
  - to_representation()
  - to_internal_value()

---

## 6. Advanced Serializer Techniques
- Nested serializers
  - Read-only vs writable nested
- Dynamic fields
  - Hide/show fields theo user, context
- SerializerMethodField
  - Khi nào nên tránh
- Polymorphic serialization
- Versioning

---

## 7. API Performance & Safety
- Prefetching & select_related trong viewset
- Tránh query trong SerializerMethodField
- Bulk operations
- Pagination, throttling, caching
- Field security
  - tránh expose fields nhạy cảm
  - explicit `fields` vs `exclude`

---

## 8. Testing & Reliability
- Unit test cho models
  - constraints, custom methods
- Test cho serializers
  - input validation
  - output shape
- Integration tests
  - permissions
  - business rules
- Load testing API

---

## 9. Production Patterns
- Zero-downtime migrations
- Partitioning, sharding khi cần
- Logging & monitoring query
- Reusable components
  - shared serializers
  - base models & managers

