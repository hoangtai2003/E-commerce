# CLAUDE.md — Quy tắc dự án E-commerce

Đây là monorepo gồm 2 dự án độc lập:

```
E-commerce/
├── admin_ecommerce_hoanthom/   # Frontend — React + Vite + TypeScript (admin dashboard)
└── be_ecommerce_hoanthom/      # Backend — Django + Django REST Framework (API)
```

Tài liệu này tập trung vào **backend Django** (`be_ecommerce_hoanthom/`). Khi làm việc trong `admin_ecommerce_hoanthom/`, áp dụng quy ước TypeScript/React thông thường của dự án đó (không lặp lại ở đây).

---

## 1. Tổng quan kiến trúc backend

- **Django 6.0.7**, **Python 3.12**, DB **MySQL/MariaDB** (10.11 LTS), API qua **Django REST Framework**. Không dùng template Django/HTMX — frontend là SPA React riêng, giao tiếp thuần qua REST API dưới prefix `/api/`.
- **Không dùng Celery/Redis/cache** — mọi xử lý hiện tại là đồng bộ, request/response trực tiếp.
- **Cấu trúc: nhiều app nhỏ theo domain**, không phải 1 app lớn. Mỗi domain nghiệp vụ (danh mục, khách hàng, sản phẩm, đơn hàng...) là **1 Django app riêng**:

```
be_ecommerce_hoanthom/
├── backend/            # project: settings.py, urls.py (chỉ include, không chứa logic)
├── categories/         # domain "danh mục"
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
├── customers/          # domain "khách hàng" — cùng cấu trúc như trên
└── manage.py
```

Khi thêm domain mới (products, orders, staff, promotions...) → **tạo app mới cùng cấu trúc này**, không nhét vào app có sẵn. Xem skill `django-crud-app`.

`backend/urls.py` chỉ làm nhiệm vụ include từng app dưới prefix chung `api/`:

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('categories.urls')),
    path('api/', include('customers.urls')),
]
```

---

## 2. Quy ước đặt tên

| Thành phần | Quy ước | Ví dụ |
|---|---|---|
| App (thư mục) | số nhiều, snake_case, tên domain | `categories`, `customers`, `orders` |
| Model | số ít, PascalCase | `Category`, `Customer` |
| Manager tuỳ chỉnh | `<Model>Manager` | `CategoryManager` |
| Serializer | `<Model>Serializer` | `CategorySerializer` |
| ViewSet | `<Model>ViewSet` | `CategoryViewSet` |
| Router prefix / basename | số nhiều, snake_case, trùng tên app | `router.register(r'categories', ..., basename='category')` |
| Migration | tên tự sinh của Django là đủ (`0001_initial`, `0002_category_slug...`); đặt tên rõ ràng bằng `--name` khi migration làm nhiều việc cùng lúc | `makemigrations categories --name add_slug_and_sort_order` |
| File test | `tests/test_models.py`, `tests/test_api.py` trong từng app (xem mục 7) | |

Không có template/view HTML nào trong dự án này (API-only) nên không cần quy ước đặt tên template.

---

## 3. Quy tắc viết models

- **PK mặc định `BigAutoField`** cho mọi model (project-wide default của Django, đã áp dụng nhất quán cho `categories`/`customers`) — **không override** `default_auto_field` theo từng app để giữ đồng nhất, kể cả khi tài liệu thiết kế (ERD) ghi `INT UNSIGNED`.
- **Soft delete là chuẩn mặc định** cho các model nghiệp vụ chính (không xoá cứng dữ liệu khách hàng/danh mục/đơn hàng):
  ```python
  class CategoryManager(models.Manager):
      def get_queryset(self):
          return super().get_queryset().filter(deleted_at__isnull=True)

  class Category(models.Model):
      ...
      deleted_at = models.DateTimeField(null=True, blank=True)

      objects = CategoryManager()        # mặc định: chỉ bản ghi chưa xoá
      all_objects = models.Manager()     # không lọc, dùng khi cần truy cập bản ghi đã xoá

      def soft_delete(self):
          self.deleted_at = timezone.now()
          self.save(update_fields=['deleted_at'])
  ```
  Việc xoá qua API phải gọi `instance.soft_delete()` (override `perform_destroy` trong ViewSet), **không** gọi `instance.delete()` trực tiếp trừ khi có lý do rõ ràng (dữ liệu rác, test data).
- **Abstract base model**: `categories` và `customers` hiện đang **copy-paste** logic soft-delete giống hệt nhau. Theo "rule of three" — khi có **app thứ 3** cần cùng pattern (`deleted_at` + manager lọc + `soft_delete()`), rút thành abstract base dùng chung, ví dụ tạo app `common` với:
  ```python
  # common/models.py
  class SoftDeleteManager(models.Manager):
      def get_queryset(self):
          return super().get_queryset().filter(deleted_at__isnull=True)

  class SoftDeleteModel(models.Model):
      created_at = models.DateTimeField(auto_now_add=True)
      deleted_at = models.DateTimeField(null=True, blank=True)
      objects = SoftDeleteManager()
      all_objects = models.Manager()

      class Meta:
          abstract = True

      def soft_delete(self):
          self.deleted_at = timezone.now()
          self.save(update_fields=['deleted_at'])
  ```
  Đừng làm việc này sớm hơn khi mới có 2 app — tránh trừu tượng hoá non.
- **ForeignKey / ManyToMany** (áp dụng khi thêm `products`, `orders` sẽ có quan hệ thật):
  - Luôn chỉ định rõ `on_delete` — không bao giờ để mặc định gây lỗi. Dùng `PROTECT` cho quan hệ nghiệp vụ quan trọng không được mất dấu vết (vd. `OrderItem.product` → không cho xoá Product đang có trong đơn hàng cũ), `CASCADE` chỉ khi con thực sự vô nghĩa nếu cha bị xoá (vd. `OrderItem.order`).
  - Luôn đặt `related_name` rõ nghĩa, số nhiều, snake_case — không dùng `_set` mặc định của Django:
    ```python
    class Order(models.Model):
        customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='orders')
    # dùng: customer.orders.all() — không phải customer.order_set.all()
    ```
- **Choices** thay cho ENUM: MySQL/Django ở dự án này không dùng ENUM thật ở tầng DB — dùng `CharField` + `choices` (đã áp dụng cho `Category.status`, `Customer.tier`). Giữ nhất quán, đừng chuyển sang enum thật trừ khi có lý do kỹ thuật cụ thể.
- Field mang tính **cache/aggregate** (vd. `total_orders`, `total_spent` trên `Customer`) → mặc định `0`, đánh dấu `read_only` ở serializer, chỉ được cập nhật bởi logic nghiệp vụ (vd. signal/service khi tạo đơn hàng), không cho client set trực tiếp qua API.

---

## 4. Quy tắc viết views

- **Ưu tiên DRF `ModelViewSet` + `DefaultRouter`** cho mọi CRUD chuẩn (đã áp dụng cho toàn bộ app hiện có). Đây là lựa chọn mặc định — không tự viết function-based view cho CRUD thông thường.
  ```python
  class CategoryViewSet(viewsets.ModelViewSet):
      queryset = Category.objects.all().order_by('sort_order', '-created_at')
      serializer_class = CategorySerializer

      def perform_destroy(self, instance):
          instance.soft_delete()
  ```
- Chỉ dùng **`APIView` hoặc function-based view (`@api_view`)** khi endpoint không map trực tiếp vào CRUD một model (vd. endpoint tổng hợp báo cáo, action đặc thù như "duyệt đơn hàng", webhook). Với action đặc thù trên 1 model, ưu tiên `@action` trong `ModelViewSet` trước khi tách view riêng.
- Không viết business logic phức tạp trực tiếp trong view — nếu logic vượt quá vài dòng (vd. tính toán, gọi nhiều model), tách ra `services.py` trong app đó.

---

## 5. Quy tắc serializer

- 1 `ModelSerializer` cho mỗi model, `fields = '__all__'` (chuỗi thuần — **lỗi hay gặp**: gõ nhầm thành `['__all__']` hoặc `('__all__',)` sẽ khiến DRF hiểu nhầm thành tên field và ném `ImproperlyConfigured`).
- Field hệ thống quản lý → `read_only_fields`: field tự sinh không cho client set (`slug`, `deleted_at`) và field cache/aggregate (`total_orders`, `total_spent`).
  ```python
  class CustomerSerializer(serializers.ModelSerializer):
      class Meta:
          model = Customer
          fields = '__all__'
          read_only_fields = ['total_orders', 'total_spent', 'deleted_at']
  ```
- Field có `auto_now_add=True` (`created_at`) đã tự động là read-only ở DRF (Django đánh dấu `editable=False`) — không cần liệt kê lại trong `read_only_fields`.
- Không dùng Django Forms (dự án API-only, không có `forms.py`).

---

## 6. Quy tắc migrations

- **1 thay đổi logic = 1 migration.** Không gộp nhiều thay đổi không liên quan vào 1 migration để dễ revert.
- Đặt tên migration rõ ràng bằng `--name` khi migration làm nhiều việc hoặc là data migration:
  ```powershell
  python manage.py makemigrations customers --name backfill_slug_for_existing_rows
  ```
- **Data migration** cần khi: thêm field `NOT NULL`/`unique` vào bảng đã có dữ liệu (cần backfill giá trị hợp lệ trước khi ràng buộc có hiệu lực thật sự — MySQL ở chế độ non-strict hiện tại của dự án sẽ tự điền `''`/`0` cho cột mới, **nhưng đây là hành vi ngầm, không nên phụ thuộc vào nó** — nên viết `RunPython` để backfill tường minh), hoặc đổi kiểu dữ liệu có khả năng mất thông tin.
- **Trước khi merge/migrate lên môi trường dùng chung**, luôn kiểm tra:
  - Migration có field `unique=True`/`NOT NULL` mới mà bảng đích đã có dữ liệu không → cần default hợp lý hoặc data migration đi kèm.
  - `makemigrations` chạy xong có tạo đúng 1 file, không có migration "rỗng" hoặc trùng lặp.
  - Chạy thử `python manage.py migrate` trên bản sao dữ liệu thật (không chỉ DB trống) trước khi áp dụng lên môi trường chung.
- Với bảng lớn (chưa gặp trong dự án hiện tại — tất cả bảng còn nhỏ) → xem skill `safe-migration` khi cần.

---

## 7. Quy tắc testing

> **Trạng thái hiện tại: dự án CHƯA có test nào** (`tests.py` mỗi app đang là stub rỗng). Mục này là quy ước cần áp dụng khi bắt đầu viết test, không phải mô tả hiện trạng.

- Dùng **pytest-django** thay vì `unittest`/`TestCase` mặc định của Django. Cần cài (chưa có trong venv hiện tại):
  ```powershell
  pip install pytest pytest-django factory_boy faker
  ```
  và thêm `pytest.ini`/`pyproject.toml` với `DJANGO_SETTINGS_MODULE = backend.settings`.
- Cấu trúc test theo app, tách khỏi `tests.py` mặc định:
  ```
  categories/
  └── tests/
      ├── __init__.py
      ├── factories.py     # factory_boy: CategoryFactory
      ├── test_models.py   # test slug tự sinh, soft_delete()...
      └── test_api.py      # test CRUD endpoint qua DRF test client
  ```
- Dùng **factory_boy + faker** cho fixture thay vì tạo object thủ công lặp lại trong từng test:
  ```python
  # categories/tests/factories.py
  import factory
  from categories.models import Category

  class CategoryFactory(factory.django.DjangoModelFactory):
      class Meta:
          model = Category
      name = factory.Faker('word', locale='vi_VN')
      status = 'active'
  ```
- **Coverage tối thiểu gợi ý**: 70-80% cho `models.py` (đặc biệt logic tuỳ chỉnh như `save()`, `soft_delete()`, slug generation) và `views.py`/API endpoint (CRUD + trường hợp lỗi/permission). Không ép coverage 100% máy móc.
- Test bắt buộc phải có cho mọi model có custom `save()`/method nghiệp vụ (vd. `vietnamese_slugify`, sinh slug trùng tên tự động tăng hậu tố).

---

## 8. Bảo mật — bắt buộc tuân thủ

- **Xác thực dùng JWT lưu trong HttpOnly cookie**, tự viết bằng `PyJWT` (không dùng `djangorestframework-simplejwt` — model `users.User` không phải `AUTH_USER_MODEL`/`AbstractBaseUser` nên simplejwt không khớp; xem `users/services.py` + `users/authentication.py`). `backend/settings.py` đã cấu hình:
  ```python
  REST_FRAMEWORK = {
      'DEFAULT_AUTHENTICATION_CLASSES': ['users.authentication.CookieJWTAuthentication'],
      'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
  }
  ```
  Mọi endpoint mặc định yêu cầu đăng nhập; chỉ `LoginView`/`RefreshView`/`LogoutView` (`users/views.py`) khai báo `permission_classes = [AllowAny]`, `authentication_classes = []` để mở public có chủ đích. `CookieJWTAuthentication` **phải** override `authenticate_header()` (trả `'Bearer'`) — nếu bỏ qua, DRF sẽ tự hạ mọi lỗi xác thực xuống 403 thay vì 401, khiến FE không phân biệt được "cần refresh token" với "không đủ quyền" (lỗi thực tế đã gặp khi build tính năng này).
  - Endpoint: `POST /api/auth/login/`, `POST /api/auth/logout/`, `POST /api/auth/refresh/`, `GET /api/auth/me/`.
  - Access token 15 phút, refresh token 7 ngày (`JWT_ACCESS_TOKEN_LIFETIME`/`JWT_REFRESH_TOKEN_LIFETIME` trong settings). Cookie access `path='/'`, refresh scoped `path='/api/auth/refresh/'`.
  - Mật khẩu hash bằng `django.contrib.auth.hashers.make_password`/`check_password` (không cần `AUTH_USER_MODEL`), lưu vào `User.password_hash` qua `users/services.py::set_user_password()` — không bao giờ nhận `password_hash` thô từ client (xem `UserSerializer.create/update`).
- ✅ **`SECRET_KEY` đã chuyển vào `.env`** (`SECRET_KEY = os.environ.get('SECRET_KEY')`), cùng `JWT_SECRET_KEY` riêng để ký JWT — theo cách `DB_*` đã làm (`python-dotenv`).
- ✅ **`CORS_ALLOWED_ORIGINS`** đã liệt kê cụ thể (`http://localhost:5173`, `http://127.0.0.1:5173`) + `CORS_ALLOW_CREDENTIALS = True` — bắt buộc phải làm cùng lúc với cookie auth vì trình duyệt từ chối cookie kèm request khi origin là wildcard `*`. Khi deploy, cập nhật danh sách này thành domain FE thật.
- ⚠️ **Frontend và backend dev server phải cùng hostname** (`localhost` hoặc `127.0.0.1`, không trộn lẫn) — nếu không, cookie `SameSite=Lax` bị trình duyệt coi là cross-site và không gửi kèm ổn định sau khi reload trang (lỗi thực tế đã gặp). Xem `admin_ecommerce_hoanthom/.env` (`VITE_API_BASE_URL`) phải khớp hostname với nơi chạy `npm run dev`.
- Không bao giờ commit `.env`/secret thật vào git (đã có `.env` trong `.gitignore` ở root — giữ nguyên).
- Tránh N+1 query — xem mục 9.
- Validate input ở serializer (dùng field type đúng: `EmailField` cho email, `SlugField` cho slug...) thay vì `CharField` chung chung khi có ý nghĩa rõ ràng, để DRF tự validate format.

---

## 9. Quy tắc performance

- Dùng `select_related()` cho quan hệ **ForeignKey/OneToOne** (join 1 query), `prefetch_related()` cho **ManyToMany/reverse FK** (query riêng rồi join ở Python) — áp dụng ngay khi thêm quan hệ giữa các app (vd. `Order.objects.select_related('customer').prefetch_related('items')`).
- **Không query trong loop.** Khi cần tạo/cập nhật nhiều bản ghi, dùng `bulk_create()`/`bulk_update()` thay vì loop gọi `.save()` từng cái.
- `queryset` trong `ViewSet` luôn có `.order_by(...)` tường minh (đã áp dụng) — tránh phụ thuộc thứ tự ngầm định của DB.
- Khi thêm quan hệ mới giữa các app, kiểm tra bằng Django Debug Toolbar hoặc log SQL (`django.db.backends` logger ở mức `DEBUG`) để phát hiện N+1 trước khi merge — công cụ này chưa được cài, cân nhắc thêm vào dev dependencies khi cần.

---

## 10. Quy tắc git

- Lịch sử commit hiện tại dùng tiền tố dạng `Feat: <mô tả tiếng Việt>` (không đồng nhất hoa/thường giữa các commit) — giữ mô tả tiếng Việt, nhưng **chuẩn hoá tiền tố viết thường** theo Conventional Commits, ví dụ:
  ```
  feat: thêm app customers với soft-delete
  fix: sửa fields=['__all__'] gây ImproperlyConfigured trong CustomerSerializer
  refactor: tách Category/Customer soft-delete thành base model dùng chung
  test: thêm test cho vietnamese_slugify
  chore: dọn requirements.txt
  ```
- **Branch naming** (khi bắt đầu dùng branch, hiện dự án làm thẳng trên `main`): `feature/<ten-ngan>`, `fix/<ten-ngan>`.
- Trước khi commit thay đổi backend (khi đã cài lint/test theo mục 6-7):
  ```powershell
  ruff check .
  ruff format .
  python manage.py test        # hoặc: pytest
  ```
- Không commit `db.sqlite3`, `.env`, `venv/`, `__pycache__/` (đã có trong `.gitignore` root).
- Không dùng `git commit --no-verify` trừ khi được yêu cầu rõ ràng.

---

## 11. Lệnh thường dùng

Từ thư mục `be_ecommerce_hoanthom/`:

```powershell
# Kích hoạt venv
.\venv\Scripts\Activate.ps1

# Chạy dev server
python manage.py runserver

# Tạo app mới cho 1 domain (xem thêm skill django-crud-app)
python manage.py startapp <ten_domain>

# Migration
python manage.py makemigrations <app>
python manage.py migrate

# Django shell (debug nhanh qua ORM)
python manage.py shell
python manage.py shell -c "from categories.models import Category; print(list(Category.objects.values()))"

# Test (sau khi cài pytest-django theo mục 7)
pytest
# hoặc mặc định Django nếu chưa cài pytest:
python manage.py test

# Lint/format (sau khi cài ruff theo mục 6/10)
ruff check .
ruff format .
```

---

## Nợ kỹ thuật đã biết (cập nhật khi xử lý xong)

- [ ] Chưa cài `pytest-django`, `factory_boy`, `faker`, `ruff` — mục 6/7/10 mới là quy ước mục tiêu, chưa phải hiện trạng.
- [x] `REST_FRAMEWORK` đã cấu hình `CookieJWTAuthentication` + `IsAuthenticated` toàn cục (mục 8).
- [x] `SECRET_KEY`/`JWT_SECRET_KEY` đã chuyển vào `.env` (mục 8).
- [ ] `requirements.txt` hiện không phản ánh đúng dependency thật của dự án (là `pip freeze` từ máy khác, và giờ còn thiếu `pyjwt` mới cài) — cần chạy `pip freeze > requirements.txt` từ đúng venv của dự án.
- [ ] `categories`/`customers` đang trùng lặp logic soft-delete — cân nhắc rút thành base model khi có app thứ 3 (mục 3).
- [ ] `JWT_COOKIE_SECURE=False` đang hardcode cho dev (http) — bắt buộc đổi `True` khi deploy lên môi trường có HTTPS thật, nếu không cookie vẫn được set nhưng không có bảo vệ `Secure`.
