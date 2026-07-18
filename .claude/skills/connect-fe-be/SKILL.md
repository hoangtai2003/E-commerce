---
name: connect-fe-be
description: Wire a React page in admin_ecommerce_hoanthom to its Django REST API in be_ecommerce_hoanthom — create a typed service, map backend field names to the existing frontend type, replace mock data with a real fetch, and verify end-to-end with Playwright. Use when a Django API for a domain already exists and the matching React page still uses mock data.
---

# Kết nối API giữa Frontend (React) và Backend (Django)

## Khi nào dùng

- Backend đã có app + API (CRUD) cho 1 domain (xem skill `django-crud-app`), và trang React tương ứng (`src/pages/<Trang>.tsx`) vẫn đang dùng mock data từ `src/data/mock.ts`.
- **Không** dùng skill này để tạo mới API backend — đó là việc của `django-crud-app`.

## Các bước thực hiện

1. **Đọc trang FE hiện tại** (`src/pages/<Trang>.tsx`) và `src/types/index.ts` để biết type hiện có đang được dùng ở đâu. Kiểm tra bằng Grep xem type đó (vd. `Customer`, `Category`) có được **dùng chung ở nhiều trang khác** không (vd. `Customer` được POS.tsx/Orders.tsx/Dashboard.tsx dùng qua `mockCustomers`).

2. **Quyết định chiến lược map field** dựa trên bước 1:
   - Nếu type **chỉ dùng trong 1 trang này** (như `Category`) → có thể đổi field name của type gốc để khớp thẳng với response backend (`description`, `status`...).
   - Nếu type **dùng chung nhiều trang** (như `Customer`) → **không đổi type gốc**. Tạo type `Api<Model>` riêng trong service khớp đúng response backend, viết hàm `to<Model>()` map về đúng shape FE hiện có. Việc này giữ nguyên mọi trang khác không bị ảnh hưởng.

3. **Kiểm tra `src/services/api.ts`** đã có sẵn (fetch wrapper dùng chung, đọc `VITE_API_BASE_URL` từ `.env`). Nếu chưa có, tạo trước — xem file này làm mẫu, không tạo bản thứ 2.

4. **Tạo `src/services/<domain>.ts`:**
   ```typescript
   import { apiRequest } from './api';
   import type { <Model> } from '../types';

   type Api<Model> = {
       id: number;
       // ...đúng field name/kiểu của response backend...
   };

   function to<Model>(api: Api<Model>): <Model> {
       return {
           id: api.id,
           // map field backend -> field FE hiện có
       };
   }

   export async function get<Model>s(): Promise<<Model>[]> {
       const data = await apiRequest<Api<Model>[]>('/<domain>/');
       return data.map(to<Model>);
   }
   // thêm create<Model>/update<Model>/delete<Model> nếu trang có form thêm/sửa/xoá
   ```

5. **Sửa trang React** — chỉ đổi nguồn dữ liệu, giữ nguyên toàn bộ JSX/logic sort/filter/pagination đã có:
   ```tsx
   const [items, setItems] = useState<Model[]>([]);
   const [loading, setLoading] = useState(true);
   const { showToast } = useToast();

   useEffect(() => {
       get<Model>s()
           .then(setItems)
           .catch(() => showToast('error', 'Lỗi tải dữ liệu', 'Không thể tải dữ liệu từ máy chủ.'))
           .finally(() => setLoading(false));
   }, [showToast]);
   ```
   ⚠️ Nếu có `useMemo` tính danh sách đã lọc/sort dựa trên state này — **phải thêm state đó vào dependency array** (xem mục Lưu ý).

   Thêm nhánh `loading` trong phần render bảng (giống `Đang tải…` đã dùng ở Categories/Customers).

6. **Nếu trang có form thêm/sửa/xoá** — chuyển input từ `defaultValue` (uncontrolled) sang controlled state, gọi `create<Model>`/`update<Model>`/`delete<Model>` trong handler, cập nhật state cục bộ từ response trả về (không cần fetch lại toàn bộ danh sách).

7. **Verify bằng Playwright** (bắt buộc — đây là thay đổi frontend, không được chỉ dựa vào typecheck):
   - Đảm bảo Django dev server (`python manage.py runserver`) và Vite dev server (`npm run dev`) đang chạy.
   - Cài Playwright nếu chưa có trong môi trường (`npx playwright install chromium`).
   - Viết script `.mjs` ngắn: `chromium.launch()` → `page.goto()` trang cần test → chờ selector dữ liệu thật xuất hiện → chụp screenshot → `console --errors` / lắng nghe `pageerror`.
   - Test qua API thật (curl tạo 1 bản ghi) rồi xác nhận nó xuất hiện đúng trên UI — không chỉ test với danh sách rỗng.
   - Dọn dữ liệu test (curl DELETE) sau khi xác nhận xong.

## Ví dụ

- `Categories.tsx` — type `Category` chỉ dùng ở đây → đổi field name gốc khớp thẳng backend (`src/services/categories.ts`).
- `Customers.tsx` — type `Customer` dùng chung nhiều trang → giữ nguyên type gốc, map ở `src/services/customers.ts` (`full_name` → `name`, `joined_at` → `joined`, `total_orders` → `orders`, `total_spent` → `spent`).

## Lưu ý/cạm bẫy thường gặp

- **`useMemo`/`useCallback` thiếu dependency khi mock data (hằng số) chuyển thành state (bất đồng bộ)** — đây là bug thực tế đã gặp: code gốc dùng `mockCustomers` (hằng số, không cần liệt kê dependency), sau khi đổi sang `customers` (state cập nhật sau khi fetch xong) mà quên thêm `customers` vào dependency array của `useMemo`, khiến danh sách luôn hiển thị rỗng dù fetch thành công. **Luôn rà lại toàn bộ dependency array của mọi `useMemo`/`useCallback` phía dưới khi đổi biến từ hằng số sang state.**
- **Field nullable ở backend** (vd. `email`, `phone` cho phép `NULL`) — khi map về type FE yêu cầu `string`, dùng `api.field ?? ''` thay vì giả định luôn có giá trị, tránh lỗi `.toLowerCase()` trên `null` khi filter/search.
- **Console log tiếng Việt trong terminal Windows có thể lỗi encoding** (`UnicodeEncodeError`/dấu `?` thay cho ký tự có dấu) khi debug qua `curl`/`python -c` trực tiếp trong Git Bash — ghi kết quả ra file rồi đọc bằng công cụ đọc file thay vì `print()`/`console.log()` thẳng ra terminal khi cần kiểm tra dữ liệu tiếng Việt.
- Đừng đổi type dùng chung nhiều nơi chỉ để tiện cho 1 trang — luôn Grep kiểm tra phạm vi ảnh hưởng trước (bước 1).
