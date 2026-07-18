---
name: django-crud-app
description: Scaffold a new Django domain app (model + soft-delete manager + serializer + ModelViewSet + router + settings/urls registration + migration) following this project's established categories/customers pattern. Use when adding a new business domain to be_ecommerce_hoanthom (products, orders, staff, promotions...).
---

# Tạo CRUD Django app mới

## Khi nào dùng

- Khi cần thêm 1 domain nghiệp vụ mới vào backend (`products`, `orders`, `staff`, `promotions`...), theo đúng cấu trúc "1 domain = 1 app" đã áp dụng cho `categories` và `customers`.
- **Không** dùng skill này để thêm field/logic vào app đã có — chỉ dùng khi tạo app hoàn toàn mới.

## Các bước thực hiện

1. **Xác nhận schema** trước khi viết code: hỏi user field nào, kiểu gì, ràng buộc gì (NOT NULL, unique, default). Nếu user đưa ảnh/bảng ERD, đối chiếu với quy ước PK hiện tại của dự án (`BigAutoField`, xem CLAUDE.md mục 3) trước khi map 1:1 kiểu dữ liệu trong ảnh.

2. **Tạo khung app:**
   ```powershell
   cd be_ecommerce_hoanthom
   python manage.py startapp <ten_domain>
   ```

3. **Viết `models.py`** theo pattern soft-delete chuẩn của dự án:
   ```python
   from django.db import models
   from django.utils import timezone


   class <Model>Manager(models.Manager):
       def get_queryset(self):
           return super().get_queryset().filter(deleted_at__isnull=True)


   class <Model>(models.Model):
       # ... field theo schema ...
       created_at = models.DateTimeField(auto_now_add=True)
       deleted_at = models.DateTimeField(null=True, blank=True)

       objects = <Model>Manager()
       all_objects = models.Manager()

       def __str__(self):
           return self.<truong_hien_thi>

       def soft_delete(self):
           self.deleted_at = timezone.now()
           self.save(update_fields=['deleted_at'])
   ```
   Chỉ thêm `updated_at = models.DateTimeField(auto_now=True)` nếu schema thực sự cần — không mặc định copy từ `categories` nếu ERD không yêu cầu (xem trường hợp `customers`, ERD không có `updated_at`).

   Field mang tính cache/aggregate (đếm, tổng tiền...) → `default=0`, sẽ đánh dấu `read_only` ở bước serializer, **không** để client set trực tiếp.

4. **Viết `serializers.py`:**
   ```python
   from rest_framework import serializers
   from .models import <Model>

   class <Model>Serializer(serializers.ModelSerializer):
       class Meta:
           model = <Model>
           fields = '__all__'
           read_only_fields = ['deleted_at']  # + field cache/aggregate nếu có
   ```
   ⚠️ `fields = '__all__'` — **chuỗi thuần**, không phải `['__all__']` hay `('__all__',)` (xem mục "Lưu ý" bên dưới).

5. **Viết `views.py`:**
   ```python
   from rest_framework import viewsets
   from .models import <Model>
   from .serializers import <Model>Serializer

   class <Model>ViewSet(viewsets.ModelViewSet):
       queryset = <Model>.objects.all().order_by('-created_at')
       serializer_class = <Model>Serializer

       def perform_destroy(self, instance):
           instance.soft_delete()
   ```

6. **Tạo `urls.py`** (file mới, chưa có sẵn từ `startapp`):
   ```python
   from django.urls import path, include
   from rest_framework.routers import DefaultRouter
   from .views import <Model>ViewSet

   router = DefaultRouter()
   router.register(r'<ten_domain>', <Model>ViewSet, basename='<model_singular>')

   urlpatterns = [
       path('', include(router.urls)),
   ]
   ```

7. **Đăng ký app:**
   - `backend/settings.py` → thêm `'<ten_domain>'` vào cuối `INSTALLED_APPS`.
   - `backend/urls.py` → thêm `path('api/', include('<ten_domain>.urls'))`.

8. **Migration:**
   ```powershell
   python manage.py makemigrations <ten_domain>
   python manage.py migrate
   ```

9. **Verify end-to-end** (bắt buộc, không bỏ qua):
   ```powershell
   python manage.py runserver
   ```
   Từ terminal khác — test create/list/soft-delete:
   ```powershell
   curl.exe -X POST http://127.0.0.1:8000/api/<ten_domain>/ -H "Content-Type: application/json" -d '{...}'
   curl.exe http://127.0.0.1:8000/api/<ten_domain>/
   curl.exe -X DELETE http://127.0.0.1:8000/api/<ten_domain>/1/
   curl.exe http://127.0.0.1:8000/api/<ten_domain>/   # bản ghi vừa xoá không còn xuất hiện
   python manage.py shell -c "from <ten_domain>.models import <Model>; print(list(<Model>.all_objects.values()))"  # xác nhận soft-delete, không mất dữ liệu
   ```
   Dọn dữ liệu test (`curl DELETE` hoặc xoá thẳng qua shell) trước khi báo hoàn thành, trừ khi user muốn giữ lại làm dữ liệu mẫu.

## Ví dụ

Xem 2 app đã tạo theo đúng pattern này: `categories/` (có thêm `slug` tự sinh + `sort_order`) và `customers/` (có field cache `total_orders`/`total_spent`, `joined_at` với `default=date.today`).

## Lưu ý/cạm bẫy thường gặp

- **`fields = ['__all__']` thay vì `fields = '__all__'`** — lỗi thực tế đã gặp trong dự án (`ImproperlyConfigured: Field name '__all__' is not valid`). List/tuple bọc quanh chuỗi `'__all__'` khiến DRF hiểu đó là tên field thật, không phải sentinel "lấy hết field".
- **`default=date.today` phải truyền tên hàm, không gọi `date.today()`** — gọi sẵn sẽ đóng băng một ngày cố định tại thời điểm import/migrate thay vì luôn là "hôm nay" khi tạo bản ghi mới.
- **Ảnh ERD ghi `INT UNSIGNED` cho PK** — dự án này dùng `BigAutoField` (BIGINT) thống nhất cho mọi bảng, không đổi theo từng ảnh. Hỏi user nếu không chắc, đừng tự ý đổi PK type khác với các app đã có.
- **Trường "(cache)" trong mô tả schema** (vd. tổng đơn, tổng chi tiêu) — luôn đánh dấu `read_only` trên serializer, không cho client ghi trực tiếp.
- **DELETE luôn là xoá mềm** trong dự án này (`perform_destroy` gọi `soft_delete()`) — đừng gọi `instance.delete()` trực tiếp trừ khi được yêu cầu rõ ràng khác đi.
- Sau khi tạo app mới, nếu đây là **app thứ 3** dùng chung pattern soft-delete y hệt `categories`/`customers` → cân nhắc đề xuất rút thành abstract base model (xem CLAUDE.md mục 3) thay vì tiếp tục copy-paste.
