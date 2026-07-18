---
name: safe-migration
description: Write zero/low-downtime Django migrations for tables with real production data — safe patterns for adding NOT NULL/unique columns, renaming columns, changing types, and backfilling data without locking large MySQL/MariaDB tables. Use before running makemigrations/migrate on a table that already has meaningful data, not on empty dev tables.
---

# Viết migration an toàn cho bảng lớn (zero-downtime)

## Khi nào dùng

- Khi 1 bảng **đã có dữ liệu thật đáng kể** (không phải bảng dev trống hoặc vài dòng test) và cần: thêm cột `NOT NULL`/`unique`, đổi kiểu dữ liệu, đổi tên cột, hoặc xoá cột.
- **Chưa cần thiết cho hiện trạng dự án** — tất cả bảng hiện tại (`categories`, `customers`) còn rất nhỏ, migration bình thường (`makemigrations` + `migrate`) là đủ, xem CLAUDE.md mục 6. Dùng skill này khi dự án có dữ liệu thật quy mô lớn hơn, hoặc khi thao tác trên môi trường có traffic đang chạy (không được downtime).

## Các bước thực hiện

### Thêm cột `NOT NULL`/`unique` vào bảng đã có dữ liệu

Không thêm thẳng cột `NOT NULL` không có default vào 1 bước — MySQL/MariaDB ở chế độ **non-strict** (hiện tại của dự án, xem CLAUDE.md mục 8 — `sql_mode` chưa bật `STRICT_TRANS_TABLES`) sẽ *âm thầm* điền `''`/`0` cho các dòng cũ, dễ để lại dữ liệu rác không nhất quán (đã từng xảy ra thật: field `slug` của 1 category tạo trước migration bị để trống, phải backfill thủ công sau đó).

Quy trình 3 bước an toàn hơn:
1. Thêm cột **nullable trước** (`null=True, blank=True`), không có `unique=True` ngay:
   ```python
   slug = models.SlugField(max_length=140, null=True, blank=True)
   ```
2. Chạy **data migration** backfill giá trị cho toàn bộ dòng cũ, tường minh bằng `RunPython` (không phụ thuộc hành vi ngầm của DB):
   ```python
   def backfill_slug(apps, schema_editor):
       Category = apps.get_model('categories', 'Category')
       for cat in Category.objects.filter(slug__isnull=True):
           cat.slug = generate_slug(cat.name)  # copy logic từ model, không import model thật trong migration
           cat.save(update_fields=['slug'])

   class Migration(migrations.Migration):
       operations = [
           migrations.RunPython(backfill_slug, migrations.RunPython.noop),
       ]
   ```
3. Sau khi mọi dòng đã có giá trị hợp lệ, migration tiếp theo mới đổi cột thành `NOT NULL`/`unique=True`.

Với bảng rất lớn (hàng triệu dòng), bước 2 nên **backfill theo batch** (`Model.objects.filter(...)[:1000]` lặp lại) thay vì load hết vào memory 1 lần.

### Đổi kiểu dữ liệu cột đang dùng

1. Thêm cột mới với tên tạm (`<field>_new`) kiểu dữ liệu mới.
2. Data migration copy/convert dữ liệu từ cột cũ sang cột mới.
3. Deploy code đọc/ghi cả 2 cột song song (dual-write) trong 1 khoảng thời gian nếu có traffic đang chạy.
4. Migration xoá cột cũ, đổi tên cột mới về tên gốc.

Không đổi kiểu dữ liệu trực tiếp trong 1 migration (`AlterField` đổi type) trên bảng lớn đang có traffic — có thể khoá bảng lâu tuỳ storage engine/kích thước.

### Đổi tên cột/bảng

Dùng `RenameField`/`RenameModel` của Django — **không** xoá cột cũ + thêm cột mới thủ công (sẽ mất dữ liệu và Django không hiểu đó là rename, coi như 2 thao tác độc lập).

### Xoá cột/bảng không còn dùng

- Deploy code **ngừng đọc/ghi** cột đó trước.
- Đợi ít nhất 1 chu kỳ release ổn định (để chắc chắn không cần rollback code cũ vẫn phụ thuộc cột đó).
- Migration `RemoveField`/`DeleteModel` sau cùng, không gộp chung với bước ngừng sử dụng.

## Ví dụ

Trường hợp thực tế đã xảy ra trong dự án: thêm `slug` (unique) + `sort_order` + `deleted_at` vào `Category` sau khi bảng đã có 1 dòng dữ liệu thật (`Bát Long Phương`) tạo trước migration. Vì chạy thẳng `makemigrations`/`migrate` không qua quy trình 3 bước ở trên, dòng đó bị lưu `slug=''`, phải phát hiện qua kiểm tra thủ công và chạy script backfill riêng sau đó. Với bảng chỉ 1 dòng thì chấp nhận được — với bảng hàng nghìn/triệu dòng, cách làm tắt này sẽ để lại dữ liệu rác quy mô lớn.

## Lưu ý/cạm bẫy thường gặp

- **Đừng tin vào hành vi "tự điền default" ngầm của MySQL non-strict mode** — nó che giấu vấn đề thay vì giải quyết, và sẽ khác hành vi nếu sau này bật `STRICT_TRANS_TABLES` (migration sẽ bắt đầu lỗi thay vì âm thầm điền rác).
- **`makemigrations` không tự chạy `RunPython` cho bạn** — data migration luôn phải viết tay, Django chỉ tự sinh schema migration (`AddField`/`AlterField`...).
- Luôn **test migration trên bản sao dữ liệu thật** (hoặc ít nhất vài trăm dòng dữ liệu giả lập giống thật), không chỉ trên DB dev trống — DB trống sẽ không bao giờ lộ ra vấn đề backfill.
- Với `unique=True` thêm vào cột đã có dữ liệu trùng lặp — migration sẽ fail thẳng khi tạo constraint; phải xử lý trùng lặp (gộp/đổi tên) trước khi thêm unique, không phải sau.
- Kiểm tra kỹ trước khi chạy migration trên môi trường có traffic thật: bảng càng lớn, `AlterField`/thêm `unique index` càng dễ khoá bảng lâu tuỳ storage engine (InnoDB thường online DDL được với đa số thao tác đơn giản, nhưng không phải luôn luôn — kiểm tra bằng `pt-online-schema-change`/`gh-ost` nếu bảng thực sự lớn và cần zero-downtime tuyệt đối).
