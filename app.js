const seedProducts = [
  { id: "arc", name: "Gương Arc Sculpt", category: "Gương treo tường", price: 2850000, oldPrice: 3200000, size: "60 × 90 cm", color: "Khung champagne", badge: "BÁN CHẠY", rating: "4.9", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=82", description: "Đường cong vòm cổ điển được giản lược thành một hình khối thanh lịch. Khung kim loại hoàn thiện champagne, phù hợp với phòng khách và lối vào." },
  { id: "sol", name: "Gương Sol Pleated", category: "Gương nghệ thuật", price: 3480000, size: "Ø 70 cm", color: "Khung gỗ sồi", badge: "THIẾT KẾ MỚI", rating: "5.0", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=82", description: "Lấy cảm hứng từ ánh nắng sớm, Sol tạo chiều sâu cho bức tường với đường viền gỗ sồi thủ công." },
  { id: "forma", name: "Gương Forma Organic", category: "Gương phòng khách", price: 2190000, size: "55 × 80 cm", color: "Không khung", badge: "YÊU THÍCH", rating: "4.8", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=82", description: "Phom dáng tự nhiên mềm mại, mài cạnh tinh xảo. Một điểm nhấn nhẹ nhàng cho căn phòng theo phong cách hiện đại." },
  { id: "nord", name: "Gương Nord Full Length", category: "Gương soi toàn thân", price: 4290000, size: "55 × 160 cm", color: "Khung sồi tự nhiên", badge: "BESTSELLER", rating: "4.9", image: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=900&q=82", description: "Gương toàn thân dáng đứng thanh thoát với chân tựa vững chắc. Gỗ sồi tự nhiên xử lý chống ẩm, hoàn thiện thủ công." },
  { id: "linea", name: "Gương Linea Bath", category: "Gương phòng tắm", price: 2650000, size: "60 × 80 cm", color: "Khung nhôm đen", badge: "CHỐNG ẨM", rating: "4.7", image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=82", description: "Thiết kế tối giản dành cho phòng tắm hiện đại. Kính tráng bạc chống ố, khung nhôm cao cấp bền bỉ trong môi trường ẩm." },
  { id: "halo", name: "Gương Halo Light", category: "Gương LED", price: 3890000, oldPrice: 4250000, size: "Ø 70 cm", color: "Đèn LED cảm ứng", badge: "ƯU ĐÃI", rating: "4.8", image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=82", description: "Đèn LED ánh sáng trung tính bao quanh viền gương. Điều chỉnh độ sáng bằng cảm ứng, tích hợp tính năng chống mờ." },
  { id: "milo", name: "Gương Milo Petite", category: "Gương trang điểm", price: 1590000, size: "40 × 60 cm", color: "Khung đồng xước", badge: "NHỎ XINH", rating: "4.9", image: "https://images.unsplash.com/photo-1616486232519-ec5aaed8f9c7?auto=format&fit=crop&w=900&q=82", description: "Một chấm sáng duyên dáng cho bàn trang điểm hoặc góc đọc sách. Khung đồng xước mờ với móc treo giấu kín." },
  { id: "luna", name: "Gương Luna Full Length", category: "Gương phòng ngủ", price: 5150000, size: "65 × 170 cm", color: "Khung walnut", badge: "EDITION 01", rating: "5.0", image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=82", description: "Tỷ lệ dáng cao thanh mảnh cùng khung walnut đậm ấm. Có thể treo tường hoặc sử dụng với chân chống rời." },
  { id: "dawn", name: "Gương Dawn Atelier", category: "Gương trang trí", price: 2380000, size: "50 × 75 cm", color: "Khung champagne", badge: "ATELIER PICK", rating: "4.9", image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=82", description: "Thiết kế trang trí thanh lịch với tỷ lệ cân đối và lớp hoàn thiện champagne ấm. Dễ kết hợp với nhiều phong cách nội thất." },
  { id: "cove", name: "Gương Cove Pebble", category: "Gương decor", price: 1890000, size: "45 × 65 cm", color: "Mài cạnh bóng", badge: "FORM TỰ NHIÊN", rating: "4.8", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=82", description: "Phom dáng viên sỏi mềm mại tạo điểm nhấn cho những góc nhỏ. Mài cạnh thủ công, có thể treo dọc hoặc ngang." }
];
let productCategories = ["Gương trang trí", "Gương phòng tắm", "Gương phòng khách", "Gương phòng ngủ", "Gương trang điểm", "Gương soi toàn thân", "Gương LED", "Gương nghệ thuật", "Gương treo tường", "Gương decor"];
const categoryLabels = { "Gương trang trí": "Trang trí", "Gương phòng tắm": "Phòng tắm", "Gương phòng khách": "Phòng khách", "Gương phòng ngủ": "Phòng ngủ", "Gương trang điểm": "Trang điểm", "Gương soi toàn thân": "Toàn thân", "Gương LED": "LED", "Gương nghệ thuật": "Nghệ thuật", "Gương treo tường": "Treo tường", "Gương decor": "Decor", "Khuyến mãi": "Khuyến mãi" };
const orderStatusStages = ["Chờ xác nhận", "Đã xác nhận", "Đang chuẩn bị", "Đang giao", "Đã giao"];
const storage = { products: "atelier_products", cart: "atelier_cart", orders: "atelier_orders" };
const money = value => new Intl.NumberFormat("vi-VN").format(value) + " ₫";
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
let products = load(storage.products, seedProducts);
let cart = load(storage.cart, []);
let orders = load(storage.orders, []);
let activeCoupon = null;
let activeCategory = "Tất cả";
let accountCustomer = null;
let currentAccountView = "profile";
let accountSessionReady = false;
let currentPage = 1;
const productsPerPage = 8;
const filterState = { category: [], shape: [], price: [], space: [] };
const catalogCache = new Map();
let vietnamProvinces = null;
const vietnamWardCache = new Map();
let productRequestId = 0;
let searchTimer;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const safe = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const persist = key => localStorage.setItem(key, JSON.stringify({ [storage.products]: products, [storage.cart]: cart, [storage.orders]: orders }[key]));
function cacheProducts(items) { items.forEach(item => catalogCache.set(String(item.id), item)); }
function findCachedProduct(id) { return catalogCache.get(String(id)) || products.find(item => String(item.id) === String(id)) || null; }
function syncFilterChecks() { $$("#filter-panel input[data-filter-group]").forEach(input => { input.checked = filterState[input.dataset.filterGroup].includes(input.value); }); }
async function getVietnamProvinces() {
  if (vietnamProvinces) return vietnamProvinces;
  const response = await fetch("/api/addresses/provinces");
  if (!response.ok) throw new Error("Không thể tải danh sách tỉnh/thành phố.");
  const data = await response.json();
  vietnamProvinces = data.provinces || [];
  if (!vietnamProvinces.length) throw new Error("Danh sách địa chỉ đang trống.");
  return vietnamProvinces;
}
function replaceAddressSelectWithInput(select, placeholder) {
  const input = document.createElement("input");
  input.name = select.name;
  input.value = select.dataset.selected || select.value || "";
  input.placeholder = placeholder;
  input.autocomplete = select.name === "city" ? "address-level1" : "address-level3";
  input.required = true;
  select.replaceWith(input);
  return input;
}
async function initializeVietnamAddressSelectors(form) {
  const provinceSelect = form?.querySelector("[data-vn-province]");
  const wardSelect = form?.querySelector("[data-vn-ward]");
  if (!provinceSelect || !wardSelect) return;
  const previousProvince = provinceSelect.dataset.selected || provinceSelect.value;
  const previousWard = wardSelect.dataset.selected || wardSelect.value;
  try {
    const provinces = await getVietnamProvinces();
    provinceSelect.innerHTML = `<option value="">Chọn tỉnh/thành phố</option>${provinces.map(province => `<option value="${safe(province.name)}" data-code="${province.code}">${safe(province.name)}</option>`).join("")}`;
    const normalizedPrevious = previousProvince.replace(/^(Tỉnh|Thành phố)\s+/i, "").trim().toLocaleLowerCase("vi");
    const matchingProvince = provinces.find(province => province.name === previousProvince || province.name.replace(/^(Tỉnh|Thành phố)\s+/i, "").trim().toLocaleLowerCase("vi") === normalizedPrevious);
    if (matchingProvince) provinceSelect.value = matchingProvince.name;
    const updateWards = async selectedWard => {
      const code = provinceSelect.selectedOptions[0]?.dataset.code;
      wardSelect.innerHTML = `<option value="">${code ? "Đang tải phường/xã..." : "Chọn tỉnh/thành phố trước"}</option>`;
      wardSelect.disabled = true;
      if (!code) return;
      try {
        if (!vietnamWardCache.has(code)) {
          const response = await fetch(`/api/addresses/provinces/${encodeURIComponent(code)}/wards`);
          if (!response.ok) throw new Error("Không thể tải danh sách phường/xã.");
          const data = await response.json();
          vietnamWardCache.set(code, data.wards || []);
        }
        const wards = vietnamWardCache.get(code);
        wardSelect.innerHTML = `<option value="">Chọn phường/xã</option>${wards.map(ward => `<option value="${safe(ward.name)}">${safe(ward.name)}</option>`).join("")}`;
        if (wards.some(ward => ward.name === selectedWard)) wardSelect.value = selectedWard;
        wardSelect.disabled = false;
      } catch {
        const fallback = replaceAddressSelectWithInput(wardSelect, "Nhập phường/xã");
        fallback.value = selectedWard;
      }
    };
    provinceSelect.addEventListener("change", () => updateWards(""));
    provinceSelect.disabled = false;
    await updateWards(previousWard);
  } catch {
    replaceAddressSelectWithInput(provinceSelect, "Nhập tỉnh/thành phố");
    replaceAddressSelectWithInput(wardSelect, "Nhập phường/xã");
  }
}
async function loadProductCategories() {
  try {
    const response = await fetch("/api/categories");
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data.categories)) return;
    productCategories = data.categories;
    const options = $("#filter-panel fieldset").querySelector(".filter-options");
    options.innerHTML = productCategories.map(category => `<label><input type="checkbox" data-filter-group="category" value="${safe(category)}">${safe(category)}</label>`).join("");
    syncFilterChecks();
    renderProducts(true);
  } catch { }
}
async function getProduct(id) {
  const cached = findCachedProduct(id);
  if (cached) return cached;
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(id)}`);
    if (!response.ok) return null;
    const item = await response.json();
    catalogCache.set(String(item.id), item);
    return item;
  } catch {
    return null;
  }
}
function toast(message) { const item = $("#toast"); item.textContent = message; item.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => item.classList.remove("show"), 2600); }
function productCard(product, index) {
  const sku = product.sku || `AG-${String(product.id).toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
  const stock = Number.isFinite(product.stock) ? product.stock : 8;
  const discount = product.oldPrice > product.price ? Math.round((product.oldPrice - product.price) / product.oldPrice * 100) : 0;
  return `<article class="product-card" style="animation-delay:${index * 45}ms"><div class="product-photo" data-view="${safe(product.id)}"><img src="${safe(product.image)}" alt="${safe(product.name)}" loading="lazy"><span class="badge">${safe(product.badge || product.category)}</span>${discount ? `<span class="discount-badge">-${discount}%</span>` : ""}</div><div class="product-info"><h3>${safe(product.name)}</h3><div class="product-meta"><span>Mã: ${safe(sku)}</span><span>${stock > 0 ? `Còn ${stock}` : "Tạm hết hàng"}</span></div><div class="product-rating">★★★★★ <span>${safe(product.rating || "4.8")} · Đánh giá</span></div><div class="price-row">${discount ? `<del>${money(product.oldPrice)}</del><strong class="sale-price">${money(product.price)}</strong><span class="discount-inline">-${discount}%</span>` : `<strong>${money(product.price)}</strong>`}</div><div class="product-actions"><button class="detail-button" data-view="${safe(product.id)}">Xem chi tiết</button><button class="button button-dark" data-add="${safe(product.id)}" ${stock <= 0 ? "disabled" : ""}>Thêm giỏ <span>+</span></button></div></div></article>`;
}
async function renderProducts(resetPage = false) {
  if (resetPage) { currentPage = 1; clearTimeout(searchTimer); }
  const requestId = ++productRequestId;
  const query = $("#search-input").value.trim().toLocaleLowerCase("vi");
    const categories = [...new Set([...productCategories, "Khuyến mãi"])];
  $("#category-tabs").innerHTML = `<button class="${activeCategory === "Tất cả" ? "active" : ""}" data-filter="Tất cả">Tất cả <span>00</span></button>${categories.map(category => `<button class="${activeCategory === category ? "active" : ""}" data-filter="${safe(category)}">${safe(categoryLabels[category] || category.replace(/^Gương /, ""))}</button>`).join("")}`;
    const headingCategory = activeCategory === "Tất cả" && filterState.category.length === 1 ? filterState.category[0] : activeCategory;
    $("#shop-breadcrumb").hidden = headingCategory === "Tất cả";
    $("#breadcrumb-current").textContent = headingCategory;
    $("#product-heading").classList.toggle("category-active", headingCategory !== "Tất cả");
    $("#shop-title").innerHTML = headingCategory === "Tất cả" ? "Đẹp trong từng<br><em>góc nhìn.</em>" : safe(headingCategory.toLocaleUpperCase("vi"));
  const params = new URLSearchParams({ page: String(currentPage), pageSize: String(productsPerPage), sort: $("#sort-select").value });
  if (query) params.set("q", query);
  if (activeCategory === "Khuyến mãi") params.set("promotion", "true");
  else if (activeCategory !== "Tất cả") params.append("category", activeCategory);
  for (const key of Object.keys(filterState)) for (const value of filterState[key]) params.append(key, value);
  $("#product-grid").setAttribute("aria-busy", "true");
  $("#products-error").hidden = true;
  try {
    const response = await fetch(`/api/products?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể tải sản phẩm từ SQL Server.");
    if (requestId !== productRequestId) return;
    cacheProducts(data.items);
    $("#product-grid").innerHTML = data.items.map(productCard).join("");
    $("#product-grid").setAttribute("aria-busy", "false");
    $("#empty-products").hidden = data.items.length > 0;
    $("#pagination").hidden = data.totalPages <= 1;
    $("#pagination").innerHTML = data.totalPages > 1 ? `<button data-page="${currentPage - 1}" aria-label="Trang trước" ${currentPage === 1 ? "disabled" : ""}>←</button>${Array.from({ length: data.totalPages }, (_, index) => `<button data-page="${index + 1}" aria-current="${currentPage === index + 1 ? "page" : "false"}">${index + 1}</button>`).join("")}<span class="pagination-status">${currentPage} / ${data.totalPages}</span><button data-page="${currentPage + 1}" aria-label="Trang sau" ${currentPage === data.totalPages ? "disabled" : ""}>→</button>` : "";
    const countButton = $("#category-tabs button[data-filter='Tất cả'] span");
    countButton.textContent = String(data.total).padStart(2, "0");
  } catch (error) {
    if (requestId !== productRequestId) return;
    $("#product-grid").innerHTML = "";
    $("#product-grid").setAttribute("aria-busy", "false");
    $("#empty-products").hidden = true;
    $("#pagination").hidden = true;
    $("#products-error").textContent = error.message;
    $("#products-error").hidden = false;
  }
}
async function renderCart() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  $("#cart-count").textContent = count;
  $("#drawer-count").textContent = `(${count})`;
  const lineItems = await Promise.all(cart.map(async item => ({ item, product: await getProduct(item.id) })));
  const rows = lineItems.map(({ item, product }) => { if (!product) return ""; const discounted = product.oldPrice > product.price; return `<div class="cart-row"><img src="${safe(product.image)}" alt="${safe(product.name)}"><div><h3>${safe(product.name)}</h3><small>${discounted ? `<del>${money(product.oldPrice)} × ${item.quantity}</del><br>` : ""}${money(product.price)} × ${item.quantity}</small><div class="quantity"><button data-quantity="${safe(item.id)}" data-delta="-1" aria-label="Giảm số lượng">−</button><span>${item.quantity}</span><button data-quantity="${safe(item.id)}" data-delta="1" aria-label="Tăng số lượng">+</button></div></div><div class="cart-line-price">${discounted ? `<del>${money(product.oldPrice * item.quantity)}</del>` : ""}<span class="product-price">${money(product.price * item.quantity)}</span><button class="remove-item" data-remove="${safe(item.id)}" aria-label="Xóa sản phẩm">×</button></div></div>`; }).join("");
  $("#cart-items").innerHTML = rows || `<div class="admin-empty">Giỏ hàng đang chờ chiếc gương đầu tiên.</div>`;
  const totals = calculateCartTotals(lineItems);
  $("#cart-subtotal").textContent = money(totals.subtotal);
  $("#cart-discount").textContent = money(totals.discount);
  $("#cart-shipping").textContent = money(totals.shipping);
  $("#cart-total").textContent = money(totals.total);
  $("#clear-cart").disabled = count === 0;
  $("#checkout-open").disabled = count === 0;
  $("#checkout-open").style.opacity = count ? "1" : ".5";
}
function calculateCartTotals(lineItems) {
  const subtotal = lineItems.reduce((sum, line) => { const quantity = line.item?.quantity ?? line.row?.quantity ?? 0; const price = line.product?.oldPrice > line.product?.price ? line.product.oldPrice : line.product?.price; return sum + (price || 0) * quantity; }, 0);
  const discount = lineItems.reduce((sum, line) => { const quantity = line.item?.quantity ?? line.row?.quantity ?? 0; const product = line.product; return sum + (product?.oldPrice > product?.price ? product.oldPrice - product.price : 0) * quantity; }, 0);
  const shipping = lineItems.some(row => row.product) ? 100000 : 0;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
function addToCart(id, quantity = 1) { const existing = cart.find(item => item.id === id); if (existing) existing.quantity += quantity; else cart.push({ id, quantity }); persist(storage.cart); renderCart(); toast("Đã thêm sản phẩm vào giỏ hàng"); }
function openPanel(id) { closePanels(); $("#overlay").hidden = false; if (id === "cart-drawer") { $("#cart-drawer").classList.add("open"); $("#cart-drawer").setAttribute("aria-hidden", "false"); } else { $("#" + id).hidden = false; } document.body.style.overflow = "hidden"; }
function closePanels() { $("#cart-drawer").classList.remove("open"); $("#cart-drawer").setAttribute("aria-hidden", "true"); $$(".modal").forEach(modal => modal.hidden = true); $("#overlay").hidden = true; document.body.style.overflow = ""; }
function openProduct(id) {
  const item = findCachedProduct(id); if (!item) return;
  const discount = item.oldPrice > item.price ? Math.round((item.oldPrice - item.price) / item.oldPrice * 100) : 0;
  const sku = item.sku || `AG-${String(item.id).toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
  const stock = Number.isFinite(item.stock) ? item.stock : 8;
  const type = item.type || item.category;
  const shape = item.shape || "Chưa cập nhật";
  const material = item.material || "Kính cao cấp";
  const color = item.color || "Bạc";
  const gallery = [...new Set([...(Array.isArray(item.gallery) ? item.gallery : []), item.image].filter(image => typeof image === "string" && image))];
  const galleryMarkup = `<div class="detail-gallery"><div class="detail-image"><img id="active-product-image" src="${safe(gallery[0] || item.image)}" alt="${safe(item.name)}"></div>${gallery.length > 1 ? `<div class="detail-thumbnails" aria-label="Ảnh sản phẩm">${gallery.map((image, index) => `<button class="${index === 0 ? "active" : ""}" type="button" data-gallery-image="${safe(image)}" aria-label="Xem ảnh ${index + 1}"><img src="${safe(image)}" alt=""></button>`).join("")}</div>` : ""}</div>`;
  const useCase = item.useCase || `Phù hợp ${String(item.space || "nhiều không gian").toLocaleLowerCase("vi")}.`;
  const cleaning = item.cleaningInstructions || "Lau bằng khăn mềm, sạch và khô; tránh chất tẩy rửa có tính ăn mòn.";
  const warranty = item.warrantyPolicy || "Bảo hành 24 tháng theo chính sách Atelier Gương.";
  $("#product-detail").innerHTML = `${galleryMarkup}<div class="detail-copy"><span class="eyebrow">${safe(item.category).toUpperCase()} · ATELIER SELECT</span><h2>${safe(item.name.toLocaleUpperCase("vi"))}</h2><div class="product-meta"><span>Mã: ${safe(sku)}</span><span>${stock > 0 ? `Còn ${stock} sản phẩm` : "Tạm hết hàng"}</span></div><div class="product-rating">★★★★★ <span>${safe(item.rating || "4.8")} · Khách hàng đánh giá</span></div><div class="price-row detail-price-row">${discount ? `<del>${money(item.oldPrice)}</del><strong class="sale-price">${money(item.price)}</strong><span class="discount-inline">-${discount}%</span>` : `<strong>${money(item.price)}</strong>`}</div><p>${safe(item.description || "Thiết kế gương trang trí tinh tuyển với chất liệu cao cấp, hoàn thiện thủ công và bảo hành chính hãng 24 tháng.")}</p><div class="detail-specs"><div>Loại gương <b>${safe(type)}</b></div><div>Hình dáng <b>${safe(shape.replace(/^Gương\s+/i, ""))}</b></div><div>Chất liệu <b>${safe(material)}</b></div><div>Kích thước <b>${safe(item.size || "Theo yêu cầu")}</b></div><div>Màu sắc <b>${safe(color)}</b></div></div><div class="detail-information"><section><h3>Công dụng & không gian phù hợp</h3><p>${safe(useCase)}</p></section><section><h3>Hướng dẫn vệ sinh</h3><p>${safe(cleaning)}</p></section><section><h3>Chính sách bảo hành</h3><p>${safe(warranty)}</p></section></div><div class="detail-quantity"><button type="button" data-quantity-step="-1" aria-label="Giảm số lượng">−</button><input type="number" min="1" max="${Math.max(stock, 1)}" value="1" id="detail-quantity" aria-label="Số lượng"><button type="button" data-quantity-step="1" aria-label="Tăng số lượng" ${stock <= 1 ? "disabled" : ""}>+</button></div><div class="detail-purchase-actions"><button class="button button-outline" data-detail-add="${safe(item.id)}" ${stock <= 0 ? "disabled" : ""}>THÊM VÀO GIỎ HÀNG</button><button class="button button-dark" data-buy-now="${safe(item.id)}" ${stock <= 0 ? "disabled" : ""}>MUA NGAY <span>→</span></button></div></div>`;
  openPanel("product-modal");
  loadProductReviews(item.id);
}
async function checkoutSummary() {
  const lineItems = await Promise.all(cart.map(async row => ({ row, product: await getProduct(row.id) })));
  $("#checkout-items").innerHTML = lineItems.map(({ row, product }) => product ? `<div class="summary-row"><span>${safe(product.name)} × ${row.quantity}<br><small>${money(product.price)} × ${row.quantity}</small></span><span>${money(product.price * row.quantity)}</span></div>` : "").join("");
  const totals = calculateCartTotals(lineItems);
  const cartKey = cart.map(item => `${item.id}:${item.quantity}`).sort().join("|");
  if (activeCoupon && activeCoupon.cartKey !== cartKey) activeCoupon = null;
  if (!$("#checkout-coupon")) $("#checkout-items").insertAdjacentHTML("afterend", `<div class="checkout-coupon" id="checkout-coupon"><label for="coupon-code">Mã giảm giá</label><div class="coupon-code-entry"><input id="coupon-code" autocomplete="off" maxlength="40" placeholder="Nhập mã ưu đãi"><button type="button" id="coupon-apply">Áp dụng</button><button type="button" id="coupon-remove" hidden aria-label="Gỡ mã giảm giá">×</button></div><small class="coupon-message" id="coupon-message" role="status" aria-live="polite"></small></div>`);
  const couponCode = $("#coupon-code");
  const couponMessage = $("#coupon-message");
  const couponRemove = $("#coupon-remove");
  const couponDiscount = activeCoupon?.discount || 0;
  if (activeCoupon) {
    couponCode.value = activeCoupon.code;
    couponMessage.textContent = `${activeCoupon.programName} · giảm ${money(couponDiscount)}`;
    couponMessage.classList.add("applied");
    couponRemove.hidden = false;
  } else {
    couponCode.value = "";
    couponMessage.textContent = "";
    couponMessage.classList.remove("applied");
    couponRemove.hidden = true;
  }
  const total = Math.max(0, totals.total - couponDiscount);
  $("#checkout-breakdown").innerHTML = `<div class="summary-row"><span>Tạm tính</span><span>${money(totals.subtotal)}</span></div><div class="summary-row"><span>Giảm giá sản phẩm</span><span>− ${money(totals.discount)}</span></div>${couponDiscount ? `<div class="summary-row coupon-total-row"><span>Mã ${safe(activeCoupon.code)}</span><span>− ${money(couponDiscount)}</span></div>` : ""}<div class="summary-row"><span>Phí vận chuyển</span><span>${money(totals.shipping)}</span></div>`;
  $("#checkout-total").textContent = money(total);
}
async function applyCheckoutCoupon() {
  if (!accountSessionReady) await restoreAccountSession();
  if (!accountCustomer) { $("#coupon-message").textContent = "Đăng nhập tài khoản để sử dụng mã giảm giá."; return; }
  const code = $("#coupon-code").value.trim().toUpperCase();
  if (!code) { $("#coupon-message").textContent = "Nhập mã giảm giá để tiếp tục."; return; }
  const button = $("#coupon-apply");
  button.disabled = true;
  try {
    const lineItems = await Promise.all(cart.map(async row => ({ row, product: await getProduct(row.id) })));
    const totals = calculateCartTotals(lineItems);
    const eligibleSubtotal = Math.max(0, totals.subtotal - totals.discount);
    const response = await fetch(`/api/coupons/${encodeURIComponent(code)}/validate?subtotal=${encodeURIComponent(eligibleSubtotal)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Không thể áp dụng mã giảm giá.");
    activeCoupon = { code: data.coupon.code, programName: data.coupon.programName, discount: Number(data.discount), cartKey: cart.map(item => `${item.id}:${item.quantity}`).sort().join("|") };
    await checkoutSummary();
  } catch (error) {
    activeCoupon = null;
    $("#coupon-message").textContent = error.message;
    $("#coupon-message").classList.remove("applied");
    $("#coupon-remove").hidden = true;
  } finally {
    button.disabled = false;
  }
}
async function accountRequest(url, method = "GET", body = null) {
  const response = await fetch(url, { method, credentials: "same-origin", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.error || "Không thể xử lý yêu cầu tài khoản."); error.status = response.status; throw error; }
  return data;
}
function setAuthView(view) {
  $$(".account-switch [data-auth-view]").forEach(button => button.classList.toggle("active", button.dataset.authView === view));
  $("#login-form").hidden = view !== "login";
  $("#register-form").hidden = view !== "register";
  $("#account-auth-title").textContent = view === "login" ? "Chào mừng bạn" : "Tạo tài khoản Atelier";
  $("#account-message").textContent = "";
}
function showAccountAuth(message = "") {
  accountCustomer = null;
  $("#account-auth").hidden = false;
  $("#account-dashboard").hidden = true;
  $("#account-message").textContent = message;
  setAuthView("login");
  $("#account-message").textContent = message;
}
async function showAccountDashboard(customer) {
  accountCustomer = customer;
  $("#account-auth").hidden = true;
  $("#account-dashboard").hidden = false;
  $("#account-greeting").textContent = `Xin chào, ${customer.fullName}`;
  await renderAccountView("profile");
}
async function restoreAccountSession() {
  try {
    const result = await accountRequest("/api/auth/me");
    accountCustomer = result.customer;
  } catch {
    accountCustomer = null;
  } finally {
    accountSessionReady = true;
  }
}
async function renderAccountView(view) {
  currentAccountView = view;
  $("#account-dashboard-message").textContent = "";
  $$(".account-nav [data-account-view]").forEach(button => button.classList.toggle("active", button.dataset.accountView === view));
  const panel = $("#account-view");
  if (view === "profile") {
    panel.innerHTML = `<h3>Thông tin tài khoản</h3><form class="account-form" data-account-form="profile"><label>Họ tên<input name="fullName" value="${safe(accountCustomer.fullName)}" autocomplete="name" required></label><div class="field-pair"><label>Email<input name="email" type="email" value="${safe(accountCustomer.email)}" autocomplete="email" required></label><label>Số điện thoại<input name="phone" value="${safe(accountCustomer.phone)}" inputmode="tel" autocomplete="tel" required></label></div><button class="button button-dark">Lưu thông tin</button></form>`;
    return;
  }
  if (view === "password") {
    panel.innerHTML = `<h3>Đổi mật khẩu</h3><form class="account-form" data-account-form="password"><label>Mật khẩu hiện tại<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>Mật khẩu mới<input name="newPassword" type="password" autocomplete="new-password" minlength="10" maxlength="64" required></label><label>Xác nhận mật khẩu mới<input name="confirmPassword" type="password" autocomplete="new-password" minlength="10" maxlength="64" required></label><button class="button button-dark">Cập nhật mật khẩu</button></form>`;
    return;
  }
  panel.innerHTML = `<div class="account-empty">Đang tải...</div>`;
  try {
    if (view === "orders") {
      const result = await accountRequest("/api/account/orders");
      panel.innerHTML = result.orders.length ? `<h3>Đơn hàng của tôi</h3>${result.orders.map(order => `<article class="account-order"><header><b>${safe(order.orderNumber)}</b><span>${safe(new Date(order.createdAt).toLocaleDateString("vi-VN"))}</span></header><div class="account-order-items">${order.items.map(item => `${safe(item.name)} × ${item.quantity} · ${money(item.unitPrice * item.quantity)}`).join("<br>")}</div><p>Trạng thái: <b>${safe(order.status)}</b></p>${orderTimeline(order)}<strong>${money(order.total)}</strong></article>`).join("")}` : `<h3>Đơn hàng của tôi</h3><div class="account-empty">Bạn chưa có đơn hàng nào.</div>`;
    } else if (view === "addresses") {
      const result = await accountRequest("/api/account/addresses");
      const savedAddresses = result.addresses.map(address => `<article class="account-address"><header><b>${safe(address.label)} ${address.isDefault ? `<span class="default-address">MẶC ĐỊNH</span>` : ""}</b><button type="button" data-delete-address="${address.id}">Xóa</button></header>${safe(address.recipientName)} · ${safe(address.phone)}<br>${safe(address.addressLine)}, ${safe(address.ward)}${address.district ? `, ${safe(address.district)}` : ""}, ${safe(address.city)}</article>`).join("");
      panel.innerHTML = `<h3>Địa chỉ giao hàng</h3>${savedAddresses || `<div class="account-empty">Chưa lưu địa chỉ giao hàng.</div>`}<form class="account-form" data-account-form="address"><h3>Thêm địa chỉ</h3><div class="field-pair"><label>Nhãn<input name="label" value="Nhà riêng" required></label><label>Người nhận<input name="recipientName" value="${safe(accountCustomer.fullName)}" required></label></div><div class="field-pair"><label>Số điện thoại<input name="phone" value="${safe(accountCustomer.phone)}" required></label><label>Tỉnh / Thành phố<select name="city" data-vn-province required><option value="">Chọn tỉnh/thành phố</option></select></label></div><input type="hidden" name="district" value=""><label>Phường / Xã<select name="ward" data-vn-ward required disabled><option value="">Chọn tỉnh/thành phố trước</option></select></label><label>Địa chỉ chi tiết<input name="addressLine" autocomplete="street-address" required></label><label><input name="isDefault" type="checkbox"> Đặt làm địa chỉ mặc định</label><button class="button button-dark">Lưu địa chỉ</button></form>`;
      await initializeVietnamAddressSelectors(panel.querySelector("[data-account-form='address']"));
    }
  } catch (error) {
    panel.innerHTML = `<div class="account-empty">${safe(error.message)}</div>`;
  }
}
function orderTimeline(order) {
  if (order.status === "Đã hủy") return `<p class="order-cancelled-note">Đơn hàng đã được hủy.</p>`;
  const activeIndex = Math.max(0, orderStatusStages.indexOf(order.status));
  const stages = orderStatusStages.map((status, index) => `<li class="${index < activeIndex ? "done" : ""} ${index === activeIndex ? "current" : ""}">${safe(status)}</li>`).join("");
  const events = (order.statusHistory || []).map(item => `${safe(new Date(item.createdAt).toLocaleString("vi-VN"))} · ${safe(item.status)}${item.note ? ` · ${safe(item.note)}` : ""}`).join("<br>");
  return `<ol class="order-timeline" aria-label="Tiến trình đơn hàng">${stages}</ol>${events ? `<div class="order-history-events">${events}</div>` : ""}`;
}
async function loadProductReviews(productId) {
  const section = $("#product-reviews");
  section.dataset.productId = productId;
  section.innerHTML = `<div class="account-empty">Đang tải đánh giá...</div>`;
  try {
    const response = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews`, { credentials: "same-origin" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể tải đánh giá.");
    const reviews = data.reviews || [];
    const cards = reviews.map(review => `<article class="review-card"><header><span class="review-stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span><time>${safe(new Date(review.createdAt).toLocaleDateString("vi-VN"))}</time></header><p>${safe(review.comment)}</p></article>`).join("");
    const action = data.canReview ? `<form class="review-form" id="review-form" data-product-id="${safe(productId)}"><h4>Đánh giá sản phẩm đã mua</h4><label for="review-rating">Số sao</label><select id="review-rating" name="rating" required>${[5, 4, 3, 2, 1].map(rating => `<option value="${rating}" ${rating === 5 ? "selected" : ""}>${"★".repeat(rating)} (${rating} sao)</option>`).join("")}</select><label for="review-comment">Nhận xét</label><textarea id="review-comment" name="comment" rows="3" minlength="3" maxlength="1000" required placeholder="Chia sẻ trải nghiệm của bạn..."></textarea><button class="button button-dark">Gửi đánh giá</button><div class="review-message" role="status"></div></form>` : `<button class="review-login" type="button" data-review-login>Đăng nhập và mua sản phẩm để gửi đánh giá</button>`;
    section.innerHTML = `<h3>Đánh giá sản phẩm</h3><div class="review-summary"><strong>${data.averageRating ? Number(data.averageRating).toFixed(1) : "—"}</strong><span class="review-stars">★★★★★</span><span>${data.count || 0} đánh giá</span></div>${cards || `<p class="account-empty">Chưa có đánh giá nào.</p>`}${action}`;
  } catch (error) {
    section.innerHTML = `<div class="account-empty">${safe(error.message)}</div>`;
  }
}
function clearCategoryChecks() { filterState.category = []; $$("#filter-panel input[data-filter-group='category']").forEach(input => input.checked = false); }
$("#category-tabs").addEventListener("click", event => { const button = event.target.closest("[data-filter]"); if (!button) return; activeCategory = button.dataset.filter; clearCategoryChecks(); renderProducts(true); });
$("#filter-panel").addEventListener("change", event => { const input = event.target.closest("input[data-filter-group]"); if (!input) return; const group = input.dataset.filterGroup; filterState[group] = $$(`#filter-panel input[data-filter-group='${group}']:checked`).map(item => item.value); activeCategory = "Tất cả"; renderProducts(true); });
$("#filter-reset").addEventListener("click", () => { for (const group of Object.keys(filterState)) filterState[group] = []; activeCategory = "Tất cả"; syncFilterChecks(); renderProducts(true); });
$("#sort-select").addEventListener("change", () => renderProducts(true));
$("#search-input").addEventListener("input", () => { $("#search-clear").hidden = !$("#search-input").value; clearTimeout(searchTimer); searchTimer = setTimeout(() => renderProducts(true), 300); });
$("#header-search").addEventListener("submit", event => { event.preventDefault(); clearTimeout(searchTimer); renderProducts(true); $("#products").scrollIntoView({ behavior: "smooth" }); });
$("#search-clear").addEventListener("click", () => { $("#search-input").value = ""; $("#search-clear").hidden = true; renderProducts(true); $("#search-input").focus(); });
$("#pagination").addEventListener("click", event => { const button = event.target.closest("[data-page]"); if (!button || button.disabled) return; currentPage = Number(button.dataset.page); renderProducts(); });
$("#product-grid").addEventListener("click", event => { const add = event.target.closest("[data-add]"); if (add) { event.stopPropagation(); addToCart(add.dataset.add); return; } const view = event.target.closest("[data-view]"); if (view) openProduct(view.dataset.view); });
$("#product-detail").addEventListener("click", async event => { const thumbnail = event.target.closest("[data-gallery-image]"); if (thumbnail) { $("#active-product-image").src = thumbnail.dataset.galleryImage; $$("#product-detail .detail-thumbnails button").forEach(button => button.classList.toggle("active", button === thumbnail)); return; } const step = event.target.closest("[data-quantity-step]"); if (step) { const input = $("#detail-quantity"); const max = Number(input.max) || 1; input.value = Math.max(1, Math.min(max, (Number(input.value) || 1) + Number(step.dataset.quantityStep))); return; } const add = event.target.closest("[data-detail-add]"); const buy = event.target.closest("[data-buy-now]"); if (!add && !buy) return; const id = (buy || add).dataset[buy ? "buyNow" : "detailAdd"]; const max = Number($("#detail-quantity").max) || 1; const quantity = Math.max(1, Math.min(max, Number($("#detail-quantity").value) || 1)); addToCart(id, quantity); closePanels(); if (buy) { await checkoutSummary(); openPanel("checkout-modal"); } else openPanel("cart-drawer"); });
$("#product-reviews").addEventListener("click", event => { if (!event.target.closest("[data-review-login]")) return; closePanels(); $("#account-open").click(); });
$("#product-reviews").addEventListener("submit", async event => { const form = event.target.closest("#review-form"); if (!form) return; event.preventDefault(); const message = form.querySelector(".review-message"); const values = Object.fromEntries(new FormData(form)); try { const result = await accountRequest(`/api/products/${encodeURIComponent(form.dataset.productId)}/reviews`, "POST", { rating: Number(values.rating), comment: values.comment }); toast(result.message); await loadProductReviews(form.dataset.productId); } catch (error) { message.textContent = error.message; } });
$("#cart-items").addEventListener("click", event => { const remove = event.target.closest("[data-remove]"); if (remove) cart = cart.filter(item => item.id !== remove.dataset.remove); const quantity = event.target.closest("[data-quantity]"); if (quantity) { const row = cart.find(item => item.id === quantity.dataset.quantity); row.quantity += Number(quantity.dataset.delta); if (row.quantity <= 0) cart = cart.filter(item => item !== row); } persist(storage.cart); renderCart(); });
$("#clear-cart").addEventListener("click", () => { cart = []; persist(storage.cart); renderCart(); });
$("#cart-open").addEventListener("click", () => { renderCart(); openPanel("cart-drawer"); });
$("#checkout-open").addEventListener("click", async () => { if (!cart.length) return; await checkoutSummary(); closePanels(); openPanel("checkout-modal"); });
$("#checkout-modal").addEventListener("click", event => {
  if (event.target.closest("#coupon-apply")) applyCheckoutCoupon();
  if (event.target.closest("#coupon-remove")) { activeCoupon = null; checkoutSummary(); }
});
$("#checkout-modal").addEventListener("keydown", event => {
  if (event.key === "Enter" && event.target.id === "coupon-code") { event.preventDefault(); applyCheckoutCoupon(); }
});
$("#checkout-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!cart.length) return;
  const form = event.currentTarget;
  if (!accountSessionReady) await restoreAccountSession();
  const data = Object.fromEntries(new FormData(form));
  const lineItems = await Promise.all(cart.map(async row => ({ row, product: await getProduct(row.id) })));
  const totals = calculateCartTotals(lineItems);
  let savedOrder = null;
  if (accountCustomer) {
    try {
      savedOrder = await accountRequest("/api/orders", "POST", {
        ...data,
        couponCode: activeCoupon?.code || "",
        items: cart.map(row => ({ id: Number(row.id), quantity: row.quantity }))
      });
    } catch (error) {
      toast(error.message);
      if (activeCoupon) { activeCoupon = null; await checkoutSummary(); }
      return;
    }
  }
  const localSequence = Number(localStorage.getItem("atelier_local_order_sequence") || 0) + 1;
  if (!savedOrder) localStorage.setItem("atelier_local_order_sequence", String(localSequence));
  const order = {
    id: savedOrder?.orderNumber || `HD${String(localSequence).padStart(5, "0")}`,
    ...data,
    items: cart.map(row => ({ ...row })),
    subtotal: savedOrder?.subtotal ?? totals.subtotal,
    discount: savedOrder?.discount ?? totals.discount,
    couponCode: savedOrder?.couponCode || null,
    couponDiscount: savedOrder?.couponDiscount ?? 0,
    shipping: savedOrder?.shipping ?? totals.shipping,
    total: savedOrder?.total ?? totals.total,
    status: savedOrder?.status || "Chờ xác nhận",
    date: new Date().toLocaleDateString("vi-VN")
  };
  orders.unshift(order);
  persist(storage.orders);
  cart = [];
  persist(storage.cart);
  activeCoupon = null;
  renderCart();
  closePanels();
  form.reset();
  $("#success-order-number").textContent = order.id;
  toast("Đặt hàng thành công · " + order.id);
  openPanel("order-success-modal");
});
$("#order-track-button").addEventListener("click", () => { const order = orders[0]; if (!order) return; const trackForm = $("#track-form"); trackForm.elements.orderId.value = order.id; trackForm.elements.phone.value = order.phone; $("#track-result").innerHTML = ""; closePanels(); openPanel("track-modal"); trackForm.requestSubmit(); });
$(".account-switch").addEventListener("click", event => { const button = event.target.closest("[data-auth-view]"); if (button) setAuthView(button.dataset.authView); });
$("#login-form").addEventListener("submit", async event => { event.preventDefault(); const form = event.currentTarget; $("#account-message").textContent = ""; try { const customer = await accountRequest("/api/auth/login", "POST", Object.fromEntries(new FormData(form))); accountSessionReady = true; form.reset(); await showAccountDashboard(customer.customer); } catch (error) { $("#account-message").textContent = error.message; } });
$("#register-form").addEventListener("submit", async event => { event.preventDefault(); const form = event.currentTarget; $("#account-message").textContent = ""; const values = Object.fromEntries(new FormData(form)); if (values.password !== values.confirmPassword) { $("#account-message").textContent = "Mật khẩu xác nhận không khớp."; return; } try { const customer = await accountRequest("/api/auth/register", "POST", values); accountSessionReady = true; form.reset(); await showAccountDashboard(customer.customer); } catch (error) { $("#account-message").textContent = error.message; } });
$("#forgot-password").addEventListener("click", () => { $("#account-message").textContent = "Để bảo vệ tài khoản, vui lòng liên hệ hotline 0900 000 000 để được hỗ trợ đặt lại mật khẩu."; });
$("#account-open").addEventListener("click", async () => { openPanel("account-modal"); $("#account-message").textContent = ""; try { const result = await accountRequest("/api/auth/me"); accountSessionReady = true; await showAccountDashboard(result.customer); } catch (error) { if (error.status === 401) showAccountAuth(); else { showAccountAuth(); $("#account-message").textContent = error.message; } } });
$("#account-logout").addEventListener("click", async () => { try { await accountRequest("/api/auth/logout", "POST"); } catch { } accountCustomer = null; accountSessionReady = true; $("#login-form").reset(); $("#register-form").reset(); showAccountAuth("Bạn đã đăng xuất."); });
$(".account-nav").addEventListener("click", event => { const button = event.target.closest("[data-account-view]"); if (button) renderAccountView(button.dataset.accountView); });
$("#account-view").addEventListener("click", async event => { const button = event.target.closest("[data-delete-address]"); if (!button) return; try { await accountRequest(`/api/account/addresses/${button.dataset.deleteAddress}`, "DELETE"); await renderAccountView("addresses"); $("#account-dashboard-message").textContent = "Đã xóa địa chỉ."; } catch (error) { $("#account-dashboard-message").textContent = error.message; } });
$("#account-view").addEventListener("submit", async event => { const form = event.target.closest("[data-account-form]"); if (!form) return; event.preventDefault(); const message = $("#account-dashboard-message"); message.textContent = ""; const values = Object.fromEntries(new FormData(form)); try { if (form.dataset.accountForm === "profile") { const result = await accountRequest("/api/account/profile", "PUT", values); accountCustomer = result.customer; $("#account-greeting").textContent = `Xin chào, ${accountCustomer.fullName}`; message.textContent = "Đã cập nhật thông tin tài khoản."; } else if (form.dataset.accountForm === "password") { const result = await accountRequest("/api/account/password", "PUT", values); form.reset(); message.textContent = result.message; } else { values.isDefault = form.elements.isDefault.checked; await accountRequest("/api/account/addresses", "POST", values); await renderAccountView("addresses"); $("#account-dashboard-message").textContent = "Đã lưu địa chỉ giao hàng."; } } catch (error) { message.textContent = error.message; } });
$("#track-form").addEventListener("submit", event => { event.preventDefault(); const data = new FormData(event.currentTarget); const order = orders.find(item => item.id.toLowerCase() === String(data.get("orderId")).trim().toLowerCase() && item.phone.replace(/\D/g, "") === String(data.get("phone")).replace(/\D/g, "")); $("#track-result").innerHTML = order ? `<b>Đơn hàng ${safe(order.id)}</b><br>Người nhận: ${safe(order.name)}<br>Ngày đặt: ${safe(order.date)}<br>Tổng tiền: ${money(order.total)}<br>Trạng thái: <span class="status-pill">${safe(order.status)}</span>` : "Không tìm thấy đơn hàng phù hợp. Vui lòng kiểm tra lại mã đơn và số điện thoại."; });
$("#newsletter-form").addEventListener("submit", event => { event.preventDefault(); event.currentTarget.reset(); toast("Cảm ơn bạn đã đăng ký nhận tin!"); });
$("#mobile-menu").addEventListener("click", () => $(".main-nav").classList.toggle("open"));
$(".main-nav").addEventListener("click", event => { const promoLink = event.target.closest("[data-promotion-link]"); const link = event.target.closest("[data-category-link]"); if (promoLink || link) { event.preventDefault(); clearCategoryChecks(); activeCategory = promoLink ? "Khuyến mãi" : link.dataset.categoryLink; renderProducts(true); $("#products").scrollIntoView({ behavior: "smooth" }); } $(".main-nav").classList.remove("open"); });
$("#home-categories").addEventListener("click", event => { const link = event.target.closest("[data-category-link]"); if (!link) return; clearCategoryChecks(); activeCategory = link.dataset.categoryLink; renderProducts(true); $("#products").scrollIntoView({ behavior: "smooth" }); });
$("#overlay").addEventListener("click", closePanels);
$$("[data-close]").forEach(button => button.addEventListener("click", closePanels));
document.addEventListener("keydown", event => { if (event.key === "Escape") closePanels(); });
syncFilterChecks();
renderProducts();
renderCart();
restoreAccountSession();
loadProductCategories();
initializeVietnamAddressSelectors($("#checkout-form"));