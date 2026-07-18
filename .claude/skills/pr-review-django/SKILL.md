---
name: pr-review-django
description: Review Django backend changes (be_ecommerce_hoanthom) against a security + performance checklist before merging — permissions/auth, secrets, CORS, N+1 queries, migration safety, soft-delete correctness. Use when reviewing a diff/PR touching the Django backend, even without a formal GitHub PR workflow (project currently commits straight to main).
---

# Review PR Django theo checklist bảo mật + performance

## Khi nào dùng

- Trước khi merge/commit bất kỳ thay đổi nào vào `be_ecommerce_hoanthom/` — model, view, serializer, settings, migration.
- Dự án hiện **chưa có PR workflow chính thức** (làm thẳng trên `main`, chưa có remote Git) — dùng skill này như một checklist tự-review trước khi commit, không nhất thiết cần một GitHub PR thật.

## Các bước thực hiện

1. **Lấy diff cần review:**
   ```powershell
   git status
   git diff
   ```
   hoặc nếu review 1 PR GitHub thật: `gh pr diff <số>`.

2. **Chạy qua checklist bảo mật** (xem chi tiết từng mục bên dưới) trên từng file thay đổi.

3. **Chạy qua checklist performance.**

4. **Nếu có migration trong diff** — xem thêm skill `safe-migration` để kiểm tra kỹ hơn.

5. **Chạy lint/test nếu đã cài** (xem CLAUDE.md mục 6/7/10):
   ```powershell
   ruff check .
   pytest
   ```

6. **Báo cáo kết quả** dạng danh sách finding, xếp theo mức độ nghiêm trọng, mỗi finding nêu rõ file/dòng + kịch bản cụ thể gây lỗi (không nêu chung chung "nên thêm validation").

### Checklist bảo mật

- [ ] **Permission/Authentication**: `ViewSet`/`APIView` mới có dựa vào `DEFAULT_PERMISSION_CLASSES` mặc định không? Dự án hiện **chưa cấu hình `REST_FRAMEWORK`** (xem CLAUDE.md mục 8) → mọi endpoint mới đang **public hoàn toàn** trừ khi tự khai báo `permission_classes`. Nếu endpoint chứa dữ liệu nhạy cảm (khách hàng, đơn hàng, nhân viên) → phải tự thêm `permission_classes = [IsAuthenticated]` (hoặc cấu hình mặc định toàn cục nếu đây là lúc thích hợp để làm).
- [ ] **Secret/credential**: có giá trị nào hardcode trực tiếp trong code thay vì đọc từ `.env`/`os.environ` không (API key, password, token)? `SECRET_KEY` trong `settings.py` hiện đang hardcode — đừng thêm secret mới theo cùng kiểu sai đó.
- [ ] **CORS**: nếu sửa `CORS_ALLOW_ALL_ORIGINS`/`CORS_ALLOWED_ORIGINS`, xác nhận thay đổi phù hợp với môi trường (dev vs. sắp deploy).
- [ ] **Input validation**: field nhận từ client có dùng đúng serializer field type không (`EmailField` cho email, không phải `CharField` chung chung)? Field hệ thống quản lý (`slug`, `deleted_at`, field cache/aggregate) có bị lộ ra cho client ghi (thiếu trong `read_only_fields`) không?
- [ ] **Mass assignment qua `fields = '__all__'`**: mọi field mới thêm vào model có tự động lộ ra qua API không (vì dự án dùng `fields = '__all__'` thay vì liệt kê) — nếu field nhạy cảm/nội bộ, phải thêm vào `read_only_fields` hoặc tách serializer riêng cho input/output.
- [ ] **Soft-delete bị bỏ qua**: có chỗ nào gọi `Model.objects.filter(...)` nhưng vô tình cần cả bản ghi đã xoá (nên dùng `all_objects`) hay ngược lại, dùng `all_objects` ở chỗ lẽ ra phải lọc `deleted_at` (lộ dữ liệu đã "xoá" ra ngoài API)?
- [ ] **DELETE có thực sự soft-delete** không, hay ai đó gọi thẳng `instance.delete()`/`queryset.delete()` bỏ qua `perform_destroy`?

### Checklist performance

- [ ] **N+1 query**: serializer/view mới có truy cập field của quan hệ FK/M2M trong loop (vd. trong `SerializerMethodField`, hoặc vòng lặp Python sau khi lấy `queryset`) mà `queryset` không có `select_related()`/`prefetch_related()` tương ứng không?
- [ ] **Query trong loop**: có đoạn code nào loop qua danh sách rồi gọi `.save()`/`.get()`/query riêng cho từng phần tử không? Nên dùng `bulk_create()`/`bulk_update()` hoặc gộp query.
- [ ] **`queryset` có `.order_by()` tường minh** không (tránh phụ thuộc thứ tự ngầm định của MySQL)?
- [ ] **Pagination**: endpoint list có khả năng trả về rất nhiều bản ghi trong tương lai (orders, customers khi có traffic thật) mà chưa có `pagination_class` không? Hiện dự án chưa cấu hình pagination toàn cục — cân nhắc khi 1 bảng có khả năng vượt vài trăm bản ghi.

## Ví dụ

Một finding tốt (cụ thể, có kịch bản):
> **[Bảo mật] `orders/views.py:12`** — `OrderViewSet` không khai báo `permission_classes` và `REST_FRAMEWORK` chưa có `DEFAULT_PERMISSION_CLASSES` toàn cục → bất kỳ ai có network access tới server đều gọi được `GET /api/orders/` xem toàn bộ đơn hàng + thông tin khách hàng liên kết mà không cần đăng nhập.

Một finding tệ (chung chung, không actionable):
> Nên chú ý bảo mật hơn cho API.

## Lưu ý/cạm bẫy thường gặp

- Đừng chỉ review "code có chạy không" — checklist này tồn tại vì code có thể chạy hoàn hảo và vẫn lộ dữ liệu công khai (đúng như tình trạng thật hiện tại của dự án ở mục permission).
- Ưu tiên finding **có bằng chứng cụ thể** (đọc đúng file/dòng) hơn là liệt kê best-practice chung chung không gắn với diff thực tế.
- Nếu dự án vẫn chưa cấu hình `REST_FRAMEWORK` permission toàn cục tại thời điểm review — đây là finding **luôn luôn nên nêu lại** cho tới khi được xử lý, không phải review 1 lần rồi bỏ qua ở các PR sau.
