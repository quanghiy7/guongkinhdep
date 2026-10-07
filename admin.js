"use strict";

const $ = selector => document.querySelector(selector);
const safe = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const money = value => new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + "đ";
let currentPage = 1;
let currentItems = [];
let editProductId = null;
let categoryCache = [];
let editCategoryId = null;
let currentOrderPage = 1;
let currentCustomerPage = 1;
let currentEmployeePage = 1;
let editEmployeeId = null;
let currentCategories = [];
let currentEmployees = [];
let currentCoupons = [];
let editCouponId = null;
let searchTimer;
let toastTimer;
const orderStatuses = ["Chờ xác nhận", "Đã xác nhận", "Đang chuẩn bị", "Đang giao", "Đã giao", "Đã hủy"];

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", ...options });
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Không thể xử lý yêu cầu.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function notify(message) {
  const toast = $("#admin-toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function activateAdmin(username) {
  $("#admin-login").hidden = true;
  $("#admin-shell").hidden = false;
  $("#admin-username").textContent = username || "Quản trị viên";
  $("#today-date").textContent = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(new Date());
  loadDashboard();
  loadCategoryOptions();
}

function showLogin(message = "") {
  $("#admin-shell").hidden = true;
  $("#admin-login").hidden = false;
  $("#login-message").textContent = message;
}

async function loadDashboard() {
  const grid = $("#metric-grid");
  try {
    const data = await api("/api/admin/dashboard");
    const metrics = [
      ["SẢN PHẨM", data.products, "Sản phẩm đang kinh doanh", "metric-product"],
      ["ĐƠN HÀNG", data.orders, "Tất cả đơn hàng", "metric-orders"],
      ["KHÁCH HÀNG", data.customers, "Tài khoản đang hoạt động", "metric-customers"],
      ["NHÂN VIÊN", data.employees == null ? "—" : data.employees, data.employees == null ? "Chưa có dữ liệu nhân sự" : "Nhân viên nội bộ", "metric-staff"],
      ["DOANH THU", money(data.revenue), "Tổng giá trị đơn hàng", "metric-revenue"]
    ];
    grid.innerHTML = metrics.map(([label, value, caption, theme]) => `<article class="metric-card ${theme}"><div class="metric-label">${label}<span aria-hidden="true">↗</span></div><strong>${safe(value)}</strong><small>${caption}</small></article>`).join("");
  } catch (error) {
    grid.innerHTML = `<div class="admin-error">${safe(error.message)}</div>`;
    if (error.status === 401) showLogin(error.message);
  }
}

function openView(view) {
  const views = ["dashboard", "products", "categories", "orders", "customers", "employees", "coupons", "statistics"];
  if (!views.includes(view)) return;
  views.forEach(name => { $(`#${name}-view`).hidden = name !== view; });
  $("#page-title").textContent = ({ dashboard: "Tổng quan", products: "Sản phẩm", categories: "Danh mục", orders: "Đơn hàng", customers: "Khách hàng", employees: "Nhân viên", coupons: "Khuyến mãi", statistics: "Thống kê" })[view];
  document.querySelectorAll(".sidebar-link").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  if (view === "products") {
    currentPage = 1;
    loadProducts();
  }
  if (view === "categories") loadCategories();
  if (view === "orders") loadOrders();
  if (view === "customers") loadCustomers();
  if (view === "employees") loadEmployees();
  if (view === "coupons") loadCoupons();
  if (view === "statistics") loadStatistics();
}

function renderCategoryOptions() {
  const names = categoryCache.map(category => category.name);
  const productCategoryInput = $("#product-category-input");
  const selectedProductCategory = productCategoryInput.value;
  productCategoryInput.innerHTML = `<option value="">Chọn danh mục</option>${categoryCache.map(category => `<option value="${safe(category.name)}">${safe(category.name)}</option>`).join("")}`;
  productCategoryInput.value = names.includes(selectedProductCategory) ? selectedProductCategory : "";
  const categorySelect = $("#product-category");
  const selectedCategory = categorySelect.value;
  categorySelect.innerHTML = `<option value="">Tất cả danh mục</option>${categoryCache.map(category => `<option value="${safe(category.name)}">${safe(category.name)}</option>`).join("")}`;
  categorySelect.value = names.includes(selectedCategory) ? selectedCategory : "";
}

async function loadCategoryOptions() {
  try {
    const data = await api("/api/admin/categories");
    categoryCache = Array.isArray(data.categories) ? data.categories : [];
    renderCategoryOptions();
    return true;
  } catch (error) {
    categoryCache = [];
    renderCategoryOptions();
    if (error.status === 401) showLogin(error.message);
    return false;
  }
}

async function loadCategories() {
  const query = $("#category-search").value.trim();
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  try {
    const data = await api(`/api/admin/categories?${params}`);
    currentCategories = data.categories;
    if (!query) {
      categoryCache = data.categories;
      renderCategoryOptions();
    }
    $("#category-rows").innerHTML = data.categories.map(category => `<tr>
      <td><b class="category-name-cell">${safe(category.name)}</b></td>
      <td>${Number(category.productCount).toLocaleString("vi-VN")} sản phẩm</td>
      <td><div class="row-actions"><button type="button" data-edit-category="${safe(category.id)}" title="Sửa danh mục" aria-label="Sửa ${safe(category.name)}">✎</button><button type="button" data-delete-category="${safe(category.id)}" title="Xóa danh mục" aria-label="Xóa ${safe(category.name)}">×</button></div></td>
    </tr>`).join("") || `<tr><td class="table-empty" colspan="3">Không tìm thấy danh mục phù hợp.</td></tr>`;
    $("#category-count").textContent = `${data.categories.length.toLocaleString("vi-VN")} danh mục`;
  } catch (error) {
    $("#category-rows").innerHTML = `<tr><td class="table-empty admin-error" colspan="3">${safe(error.message)}</td></tr>`;
    if (error.status === 401) showLogin(error.message);
  }
}

function openCategoryEditor(category = null) {
  const form = $("#category-form");
  form.reset();
  editCategoryId = category?.id ?? null;
  $("#category-editor-title").textContent = category ? "Sửa danh mục" : "Thêm danh mục";
  $("#category-editor-message").textContent = "";
  if (category) form.elements.name.value = category.name;
  $("#category-editor").hidden = false;
  document.body.classList.add("editor-open");
  form.elements.name.focus();
}

function closeCategoryEditor() {
  $("#category-editor").hidden = true;
  document.body.classList.remove("editor-open");
}

async function loadOrders() {
  const params = new URLSearchParams({ page: String(currentOrderPage), pageSize: "20" });
  const query = $("#order-search").value.trim();
  const status = $("#order-status-filter").value;
  if (query) params.set("q", query);
  if (status) params.set("status", status);
  try {
    const data = await api(`/api/admin/orders?${params}`);
    $("#order-rows").innerHTML = data.orders.map(order => {
      const payment = ({ cod: "COD", bank: "Chuyển khoản", online: "Online" })[order.paymentMethod] || order.paymentMethod;
      const createdAt = new Date(order.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
      return `<tr>
        <td><b class="order-number">${safe(order.orderNumber)}</b></td>
        <td><b>${safe(order.customerName)}</b><small class="table-subline">${safe(order.phone)}</small></td>
        <td>${safe(createdAt)}</td>
        <td><b>${money(order.total)}</b></td>
        <td class="order-address" title="${safe(order.address)}">${safe(order.address)}</td>
        <td>${safe(payment)}</td>
        <td><select class="order-status-select ${order.status === "Đã hủy" ? "order-cancelled" : ""}" data-order-status="${safe(order.id)}" data-previous-status="${safe(order.status)}" aria-label="Trạng thái đơn ${safe(order.orderNumber)}">${orderStatuses.map(value => `<option value="${safe(value)}" ${order.status === value ? "selected" : ""}>${safe(value)}</option>`).join("")}</select></td>
      </tr>`;
    }).join("") || `<tr><td class="table-empty" colspan="7">Chưa có đơn hàng phù hợp.</td></tr>`;
    $("#order-count").textContent = `${data.total.toLocaleString("vi-VN")} đơn hàng`;
    const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
    $("#order-pagination").innerHTML = pages > 1 ? `<button type="button" data-order-page="${currentOrderPage - 1}" ${currentOrderPage === 1 ? "disabled" : ""} aria-label="Trang trước">←</button><span>${currentOrderPage} / ${pages}</span><button type="button" data-order-page="${currentOrderPage + 1}" ${currentOrderPage === pages ? "disabled" : ""} aria-label="Trang sau">→</button>` : "";
  } catch (error) {
    $("#order-rows").innerHTML = `<tr><td class="table-empty admin-error" colspan="7">${safe(error.message)}</td></tr>`;
    if (error.status === 401) showLogin(error.message);
  }
}

async function loadCustomers() {
  const params = new URLSearchParams({ page: String(currentCustomerPage), pageSize: "20", status: $("#customer-status-filter").value });
  const query = $("#customer-search").value.trim();
  if (query) params.set("q", query);
  try {
    const data = await api(`/api/admin/customers?${params}`);
    $("#customer-rows").innerHTML = data.customers.map(customer => {
      const date = new Date(customer.createdAt).toLocaleDateString("vi-VN");
      return `<tr>
        <td><b>${safe(customer.fullName)}</b><small class="table-subline">${safe(customer.email)}</small></td>
        <td>${safe(customer.phone)}</td>
        <td>${safe(date)}</td>
        <td>${Number(customer.orderCount).toLocaleString("vi-VN")}</td>
        <td><span class="product-status ${customer.isActive ? "status-active" : "status-inactive"}">${customer.isActive ? "Hoạt động" : "Đã khóa"}</span></td>
        <td><div class="row-actions"><button type="button" data-view-customer="${safe(customer.id)}" title="Xem hồ sơ và lịch sử mua" aria-label="Xem khách ${safe(customer.fullName)}">⌕</button><button type="button" data-toggle-customer="${safe(customer.id)}" data-active="${customer.isActive ? "true" : "false"}" title="${customer.isActive ? "Khóa tài khoản" : "Mở tài khoản"}" aria-label="${customer.isActive ? "Khóa" : "Mở"} tài khoản ${safe(customer.fullName)}">${customer.isActive ? "⊘" : "↻"}</button></div></td>
      </tr>`;
    }).join("") || `<tr><td class="table-empty" colspan="6">Không tìm thấy khách hàng phù hợp.</td></tr>`;
    $("#customer-count").textContent = `${data.total.toLocaleString("vi-VN")} khách hàng`;
    const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
    $("#customer-pagination").innerHTML = pages > 1 ? `<button type="button" data-customer-page="${currentCustomerPage - 1}" ${currentCustomerPage === 1 ? "disabled" : ""} aria-label="Trang trước">←</button><span>${currentCustomerPage} / ${pages}</span><button type="button" data-customer-page="${currentCustomerPage + 1}" ${currentCustomerPage === pages ? "disabled" : ""} aria-label="Trang sau">→</button>` : "";
  } catch (error) {
    $("#customer-rows").innerHTML = `<tr><td class="table-empty admin-error" colspan="6">${safe(error.message)}</td></tr>`;
    if (error.status === 401) showLogin(error.message);
  }
}

async function openCustomerDetail(id) {
  const modal = $("#customer-detail-modal");
  const content = $("#customer-detail-content");
  content.innerHTML = `<div class="detail-loading">Đang tải hồ sơ...</div>`;
  modal.hidden = false;
  document.body.classList.add("editor-open");
  try {
    const data = await api(`/api/admin/customers/${encodeURIComponent(id)}`);
    const customer = data.customer;
    $("#customer-detail-title").textContent = customer.fullName;
    const orders = data.orders.map(order => `<tr><td><b>${safe(order.orderNumber)}</b></td><td>${safe(new Date(order.createdAt).toLocaleDateString("vi-VN"))}</td><td>${money(order.total)}</td><td>${safe(order.status)}</td></tr>`).join("");
    content.innerHTML = `<div class="customer-profile">
      <div class="customer-profile-grid"><div><small>HỌ VÀ TÊN</small><b>${safe(customer.fullName)}</b></div><div><small>EMAIL</small><b>${safe(customer.email)}</b></div><div><small>SỐ ĐIỆN THOẠI</small><b>${safe(customer.phone)}</b></div><div><small>NGÀY ĐĂNG KÝ</small><b>${safe(new Date(customer.createdAt).toLocaleDateString("vi-VN"))}</b></div><div><small>TRẠNG THÁI</small><b>${customer.isActive ? "Đang hoạt động" : "Đã khóa"}</b></div></div>
      <div class="customer-history-heading"><div><span class="eyebrow">HỒ SƠ / GIAO DỊCH</span><h3>Lịch sử mua hàng</h3></div><button class="button ${customer.isActive ? "button-outline" : "button-dark"}" type="button" data-detail-toggle-customer="${safe(customer.id)}" data-active="${customer.isActive ? "true" : "false"}">${customer.isActive ? "Khóa tài khoản" : "Mở tài khoản"}</button></div>
      <div class="product-table-wrap customer-history-table"><table class="admin-products-table"><thead><tr><th>MÃ ĐƠN</th><th>NGÀY ĐẶT</th><th>TỔNG TIỀN</th><th>TRẠNG THÁI</th></tr></thead><tbody>${orders || `<tr><td class="table-empty" colspan="4">Khách hàng chưa có đơn mua.</td></tr>`}</tbody></table></div>
      ${data.orders.length === 100 ? `<small class="history-limit-note">Đang hiển thị 100 đơn gần nhất.</small>` : ""}
    </div>`;
  } catch (error) {
    content.innerHTML = `<div class="detail-loading admin-error">${safe(error.message)}</div>`;
  }
}

async function toggleCustomerStatus(id, isActive) {
  const nextStatus = isActive ? "locked" : "active";
  if (isActive && !window.confirm("Khóa tài khoản này? Khách hàng sẽ không thể đăng nhập.")) return;
  try {
    const result = await api(`/api/admin/customers/${encodeURIComponent(id)}/status`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus })
    });
    notify(result.message);
    await loadCustomers();
    loadDashboard();
    if (!$("#customer-detail-modal").hidden) openCustomerDetail(id);
  } catch (error) {
    notify(error.message);
  }
}

async function loadEmployees() {
  const params = new URLSearchParams({ page: String(currentEmployeePage), pageSize: "20", status: $("#employee-status-filter").value });
  const query = $("#employee-search").value.trim();
  if (query) params.set("q", query);
  try {
    const data = await api(`/api/admin/employees?${params}`);
    currentEmployees = data.employees;
    $("#employee-rows").innerHTML = data.employees.map(employee => `<tr>
      <td><b>${safe(employee.fullName)}</b><small class="table-subline">${safe(employee.employeeCode)} · ${safe(employee.email)}</small><small class="table-subline">${safe(employee.phone)}</small></td>
      <td>${safe(employee.position)}</td><td><b>${money(employee.salary)}</b></td>
      <td>${safe(new Date(employee.hireDate).toLocaleDateString("vi-VN"))}</td>
      <td><span class="product-status ${employee.status === "Đang làm việc" ? "status-active" : "status-inactive"}">${safe(employee.status)}</span></td>
      <td><div class="row-actions"><button type="button" data-edit-employee="${safe(employee.id)}" title="Sửa nhân viên" aria-label="Sửa ${safe(employee.fullName)}">✎</button><button type="button" data-delete-employee="${safe(employee.id)}" title="Xóa nhân viên" aria-label="Xóa ${safe(employee.fullName)}">×</button></div></td>
    </tr>`).join("") || `<tr><td class="table-empty" colspan="6">Không tìm thấy nhân viên phù hợp.</td></tr>`;
    $("#employee-count").textContent = `${data.total.toLocaleString("vi-VN")} nhân viên`;
    const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
    $("#employee-pagination").innerHTML = pages > 1 ? `<button type="button" data-employee-page="${currentEmployeePage - 1}" ${currentEmployeePage === 1 ? "disabled" : ""} aria-label="Trang trước">←</button><span>${currentEmployeePage} / ${pages}</span><button type="button" data-employee-page="${currentEmployeePage + 1}" ${currentEmployeePage === pages ? "disabled" : ""} aria-label="Trang sau">→</button>` : "";
  } catch (error) {
    $("#employee-rows").innerHTML = `<tr><td class="table-empty admin-error" colspan="6">${safe(error.message)}</td></tr>`;
    if (error.status === 401) showLogin(error.message);
  }
}

function dateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function localCouponDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function couponState(coupon) {
  if (!coupon.isActive) return "Đã tắt";
  if (coupon.usedCount >= coupon.quantity) return "Hết lượt";
  const today = localCouponDate();
  if (today < dateOnly(coupon.startsAt)) return "Sắp diễn ra";
  if (today > dateOnly(coupon.endsAt)) return "Đã kết thúc";
  return "Đang diễn ra";
}

function couponValue(coupon) {
  return coupon.discountType === "percent" ? `${Number(coupon.discountValue)}%` : money(coupon.discountValue);
}

async function loadCoupons() {
  const params = new URLSearchParams({ status: $("#coupon-status-filter").value });
  const query = $("#coupon-search").value.trim();
  if (query) params.set("q", query);
  try {
    const data = await api(`/api/admin/coupons?${params}`);
    currentCoupons = data.coupons;
    $("#coupon-rows").innerHTML = currentCoupons.map(coupon => {
      const state = couponState(coupon);
      return `<tr>
        <td><b class="coupon-code">${safe(coupon.code)}</b><small class="table-subline">${safe(coupon.programName)}</small></td>
        <td><b>${safe(couponValue(coupon))}</b><small class="table-subline">${coupon.discountType === "percent" ? "Phần trăm" : "Số tiền"}</small></td>
        <td>${safe(new Date(coupon.startsAt).toLocaleDateString("vi-VN"))}<small class="table-subline">đến ${safe(new Date(coupon.endsAt).toLocaleDateString("vi-VN"))}</small></td>
        <td>${Number(coupon.usedCount).toLocaleString("vi-VN")} / ${Number(coupon.quantity).toLocaleString("vi-VN")}</td>
        <td><span class="product-status ${state === "Đang diễn ra" ? "status-active" : "status-inactive"}">${state}</span></td>
        <td><div class="row-actions"><button type="button" data-edit-coupon="${safe(coupon.id)}" title="Sửa chương trình" aria-label="Sửa ${safe(coupon.code)}">✎</button><button type="button" data-disable-coupon="${safe(coupon.id)}" title="Tắt chương trình" aria-label="Tắt ${safe(coupon.code)}" ${coupon.isActive ? "" : "disabled"}>×</button></div></td>
      </tr>`;
    }).join("") || `<tr><td class="table-empty" colspan="6">Không tìm thấy chương trình phù hợp.</td></tr>`;
    $("#coupon-count").textContent = `${data.coupons.length.toLocaleString("vi-VN")} chương trình`;
  } catch (error) {
    $("#coupon-rows").innerHTML = `<tr><td class="table-empty admin-error" colspan="6">${safe(error.message)}</td></tr>`;
    if (error.status === 401) showLogin(error.message);
  }
}

function openCouponEditor(coupon = null) {
  const form = $("#coupon-form");
  form.reset();
  editCouponId = coupon?.id ?? null;
  $("#coupon-editor-title").textContent = coupon ? "Sửa chương trình" : "Tạo mã giảm giá";
  $("#coupon-editor-message").textContent = "";
  if (coupon) {
    form.elements.code.value = coupon.code;
    form.elements.programName.value = coupon.programName;
    form.elements.discountType.value = coupon.discountType;
    form.elements.discountValue.value = coupon.discountValue;
    form.elements.startsAt.value = dateOnly(coupon.startsAt);
    form.elements.endsAt.value = dateOnly(coupon.endsAt);
    form.elements.quantity.value = coupon.quantity;
    form.elements.status.value = coupon.isActive ? "active" : "inactive";
  } else {
    const today = localCouponDate();
    form.elements.startsAt.value = today;
    form.elements.endsAt.value = today;
    form.elements.status.value = "active";
  }
  $("#coupon-editor").hidden = false;
  document.body.classList.add("editor-open");
  form.elements.code.focus();
}

function closeCouponEditor() {
  $("#coupon-editor").hidden = true;
  document.body.classList.remove("editor-open");
}

function renderBars(target, rows, key, labeler, emptyText) {
  const values = rows.map(row => Number(row.revenue) || 0);
  const max = Math.max(...values, 0);
  if (!rows.length || max === 0) {
    target.innerHTML = `<p class="chart-empty">${emptyText}</p>`;
    return;
  }
  target.innerHTML = rows.map((row, index) => {
    const value = values[index];
    const height = Math.max(2, value / max * 100);
    const label = labeler(row[key]);
    return `<div class="chart-bar-item" title="${safe(label)} · ${safe(money(value))}"><span class="chart-bar-value">${safe(money(value))}</span><div class="chart-bar-track"><span style="height:${height}%"></span></div><small>${safe(label)}</small></div>`;
  }).join("");
}

function renderDailyChart(rows) {
  const byDate = new Map(rows.map(row => [dateOnly(row.date), Number(row.revenue) || 0]));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - (29 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, revenue: byDate.get(key) || 0 };
  });
  const max = Math.max(...days.map(day => day.revenue), 0);
  if (!max) {
    $("#daily-chart").innerHTML = `<p class="chart-empty">Chưa có doanh thu trong 30 ngày gần nhất.</p>`;
    return;
  }
  $("#daily-chart").innerHTML = days.map((day, index) => `<div class="chart-bar-item ${index % 5 === 0 || index === 29 ? "chart-label-visible" : ""}" title="${day.date} · ${safe(money(day.revenue))}"><div class="chart-bar-track"><span style="height:${Math.max(day.revenue ? 2 : 0, day.revenue / max * 100)}%"></span></div><small>${index % 5 === 0 || index === 29 ? day.date.slice(5) : ""}</small></div>`).join("");
}

async function loadStatistics() {
  const select = $("#statistics-year");
  if (!select.options.length) {
    const currentYear = new Date().getFullYear();
    select.innerHTML = Array.from({ length: Math.max(currentYear - 2020, 1) }, (_, index) => currentYear - index).map(year => `<option value="${year}">${year}</option>`).join("");
    select.value = String(currentYear);
  }
  const panels = ["#statistics-metrics", "#daily-chart", "#monthly-chart", "#yearly-chart", "#best-sellers"];
  try {
    const data = await api(`/api/admin/statistics?year=${encodeURIComponent(select.value)}`);
    const summary = data.summary;
    $("#statistics-metrics").innerHTML = [
      ["DOANH THU", money(summary.revenue), "Không tính đơn đã hủy"],
      ["ĐƠN HÀNG", Number(summary.orders).toLocaleString("vi-VN"), "Tổng số đơn"],
      ["KHÁCH HÀNG", Number(summary.customers).toLocaleString("vi-VN"), "Tài khoản hoạt động"],
      ["SẢN PHẨM", Number(summary.products).toLocaleString("vi-VN"), "Đang kinh doanh"]
    ].map(([label, value, caption]) => `<article class="statistics-metric"><small>${label}</small><b>${safe(value)}</b><span>${caption}</span></article>`).join("");
    renderDailyChart(data.daily);
    renderBars($("#monthly-chart"), Array.from({ length: 12 }, (_, index) => ({ month: index + 1, revenue: Number(data.monthly.find(row => Number(row.month) === index + 1)?.revenue) || 0 })), "month", value => `T${value}`, "Chưa có doanh thu theo tháng.");
    $("#yearly-chart").innerHTML = data.yearly.length ? data.yearly.map(row => `<div class="yearly-row"><b>${Number(row.year)}</b><span>${Number(row.orders).toLocaleString("vi-VN")} đơn</span><strong>${money(row.revenue)}</strong></div>`).join("") : `<p class="chart-empty">Chưa có dữ liệu theo năm.</p>`;
    $("#best-sellers").innerHTML = data.bestSellers.length ? data.bestSellers.map((item, index) => `<div class="best-seller-row"><span class="best-seller-rank">${String(index + 1).padStart(2, "0")}</span><span><b>${safe(item.name)}</b><small>${safe(item.sku)}</small></span><strong>${Number(item.quantity).toLocaleString("vi-VN")} <small>đã bán</small></strong></div>`).join("") : `<p class="chart-empty">Chưa có dữ liệu bán hàng.</p>`;
  } catch (error) {
    panels.forEach(selector => { $(selector).innerHTML = `<p class="chart-empty admin-error">${safe(error.message)}</p>`; });
    if (error.status === 401) showLogin(error.message);
  }
}

function openEmployeeEditor(employee = null) {
  const form = $("#employee-form");
  form.reset();
  editEmployeeId = employee?.id ?? null;
  $("#employee-editor-title").textContent = employee ? "Sửa thông tin nhân viên" : "Thêm nhân viên";
  $("#employee-editor-message").textContent = "";
  if (employee) {
    for (const key of ["employeeCode", "fullName", "email", "phone", "position", "salary", "status"]) form.elements[key].value = employee[key] ?? "";
    form.elements.hireDate.value = String(employee.hireDate).slice(0, 10);
  } else {
    form.elements.status.value = "Đang làm việc";
  }
  $("#employee-editor").hidden = false;
  document.body.classList.add("editor-open");
  form.elements.employeeCode.focus();
}

function closeEmployeeEditor() {
  $("#employee-editor").hidden = true;
  document.body.classList.remove("editor-open");
}

async function loadProducts() {
  const params = new URLSearchParams({ page: String(currentPage), pageSize: "20", sort: $("#product-sort").value, status: $("#product-status").value });
  const query = $("#product-search").value.trim();
  const category = $("#product-category").value;
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  const table = $("#product-table-wrap");
  table.setAttribute("aria-busy", "true");
  try {
    const data = await api(`/api/admin/products?${params}`);
    currentItems = data.items;
    if (!categoryCache.length) await loadCategoryOptions();
    $("#product-rows").innerHTML = data.items.map(item => `<tr>
      <td><div class="table-product"><img src="${safe(item.image)}" alt="" loading="lazy"><span><b>${safe(item.name)}</b><small>${safe(item.sku)}</small></span></div></td>
      <td>${safe(item.category)}<small class="table-subline">${safe(item.type)}</small></td>
      <td><b>${money(item.price)}</b>${item.oldPrice > item.price ? `<small class="table-old-price">${money(item.oldPrice)}</small>` : ""}</td>
      <td><span class="stock-value ${item.stock <= 3 ? "stock-low" : ""}">${Number(item.stock)}</span></td>
      <td><span class="product-status ${item.isActive ? "status-active" : "status-inactive"}">${item.isActive ? "Đang bán" : "Ngừng bán"}</span></td>
      <td><div class="row-actions"><button type="button" data-edit-product="${safe(item.id)}" title="Sửa sản phẩm" aria-label="Sửa ${safe(item.name)}">✎</button><button type="button" data-delete-product="${safe(item.id)}" title="Ngừng kinh doanh" aria-label="Ngừng kinh doanh ${safe(item.name)}">×</button></div></td>
    </tr>`).join("") || `<tr><td class="table-empty" colspan="6">Không tìm thấy sản phẩm phù hợp.</td></tr>`;
    $("#product-count").textContent = `${data.total.toLocaleString("vi-VN")} sản phẩm`;
    const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
    $("#product-pagination").innerHTML = pages > 1 ? `<button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Trang trước">←</button><span>${currentPage} / ${pages}</span><button type="button" data-page="${currentPage + 1}" ${currentPage === pages ? "disabled" : ""} aria-label="Trang sau">→</button>` : "";
  } catch (error) {
    $("#product-rows").innerHTML = `<tr><td class="table-empty admin-error" colspan="6">${safe(error.message)}</td></tr>`;
    if (error.status === 401) showLogin(error.message);
  } finally {
    table.setAttribute("aria-busy", "false");
  }
}

async function resetEditor(product = null) {
  const categoriesLoaded = await loadCategoryOptions();
  const form = $("#product-form");
  form.reset();
  editProductId = product?.id ?? null;
  $("#editor-title").textContent = product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm";
  $("#editor-message").textContent = "";
  $("#image-preview").innerHTML = product?.image ? `<img src="${safe(product.image)}" alt="Ảnh sản phẩm">` : `<span>Ảnh xem trước</span>`;
  if (product) {
    for (const key of ["sku", "name", "category", "type", "brand", "shape", "material", "size", "color", "stock", "space", "description"]) {
      form.elements[key].value = product[key] ?? "";
    }
    const hasDiscount = Number(product.oldPrice) > Number(product.price);
    form.elements.price.value = hasDiscount ? product.oldPrice : product.price;
    form.elements.discountPercent.value = hasDiscount ? ((1 - Number(product.price) / Number(product.oldPrice)) * 100).toFixed(2) : "0";
    const oldBadge = String(product.badge || "").toLocaleUpperCase("vi");
    form.elements.badge.value = /BÁN CHẠY|BESTSELLER/.test(oldBadge) ? "BÁN CHẠY" : /MỚI|NEW/.test(oldBadge) ? "HÀNG MỚI" : "BÌNH THƯỜNG";
    form.elements.image.value = product.image || "";
    form.elements.status.value = product.isActive ? "active" : "inactive";
    form.elements.gallery.value = (product.gallery || []).filter(image => image !== product.image).join("\n");
  } else {
    form.elements.stock.value = "0";
    form.elements.discountPercent.value = "0";
    form.elements.badge.value = "BÌNH THƯỜNG";
  }
  $("#editor-message").textContent = categoriesLoaded ? (categoryCache.length ? "" : "Chưa có danh mục. Hãy tạo danh mục trước khi thêm sản phẩm.") : "Không tải được danh mục. Kiểm tra kết nối rồi thử mở lại biểu mẫu.";
  $("#product-editor").hidden = false;
  document.body.classList.add("editor-open");
}

function closeEditor() {
  $("#product-editor").hidden = true;
  document.body.classList.remove("editor-open");
}

document.querySelectorAll(".sidebar-link").forEach(button => button.addEventListener("click", () => openView(button.dataset.view)));
$("#refresh-dashboard").addEventListener("click", loadDashboard);
$("#add-product").addEventListener("click", () => resetEditor());
$("#add-category").addEventListener("click", () => openCategoryEditor());
$("#product-search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; loadProducts(); }, 250);
});
["#product-category", "#product-status", "#product-sort"].forEach(selector => $(selector).addEventListener("change", () => { currentPage = 1; loadProducts(); }));
$("#product-pagination").addEventListener("click", event => {
  const button = event.target.closest("[data-page]");
  if (!button || button.disabled) return;
  currentPage = Number(button.dataset.page);
  loadProducts();
});
$("#category-search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadCategories, 250);
});
$("#category-rows").addEventListener("click", async event => {
  const edit = event.target.closest("[data-edit-category]");
  if (edit) {
    const category = categoryCache.find(item => String(item.id) === edit.dataset.editCategory);
    if (category) openCategoryEditor(category);
    return;
  }
  const remove = event.target.closest("[data-delete-category]");
  if (!remove) return;
  const category = categoryCache.find(item => String(item.id) === remove.dataset.deleteCategory);
  if (!category || !window.confirm(`Xóa danh mục “${category.name}”?`)) return;
  try {
    const result = await api(`/api/admin/categories/${encodeURIComponent(category.id)}`, { method: "DELETE" });
    notify(result.message);
    await Promise.all([loadCategories(), loadCategoryOptions()]);
  } catch (error) {
    notify(error.message);
  }
});
document.querySelectorAll("[data-category-editor-close]").forEach(button => button.addEventListener("click", closeCategoryEditor));
$("#category-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("#save-category");
  const message = $("#category-editor-message");
  button.disabled = true;
  message.textContent = "";
  const name = new FormData(event.currentTarget).get("name").trim();
  const editing = editCategoryId !== null;
  try {
    const result = await api(editing ? `/api/admin/categories/${encodeURIComponent(editCategoryId)}` : "/api/admin/categories", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    closeCategoryEditor();
    notify(result.message || "Đã thêm danh mục.");
    await Promise.all([loadCategories(), loadCategoryOptions()]);
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
$("#order-search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentOrderPage = 1; loadOrders(); }, 250);
});
$("#order-status-filter").addEventListener("change", () => { currentOrderPage = 1; loadOrders(); });
$("#order-pagination").addEventListener("click", event => {
  const button = event.target.closest("[data-order-page]");
  if (!button || button.disabled) return;
  currentOrderPage = Number(button.dataset.orderPage);
  loadOrders();
});
$("#order-rows").addEventListener("change", async event => {
  const select = event.target.closest("[data-order-status]");
  if (!select || select.value === select.dataset.previousStatus) return;
  select.disabled = true;
  try {
    const result = await api(`/api/admin/orders/${encodeURIComponent(select.dataset.orderStatus)}/status`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: select.value })
    });
    select.dataset.previousStatus = select.value;
    select.classList.toggle("order-cancelled", select.value === "Đã hủy");
    notify(result.message);
    loadDashboard();
  } catch (error) {
    select.value = select.dataset.previousStatus;
    notify(error.message);
  } finally {
    select.disabled = false;
  }
});
$("#customer-search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentCustomerPage = 1; loadCustomers(); }, 250);
});
$("#customer-status-filter").addEventListener("change", () => { currentCustomerPage = 1; loadCustomers(); });
$("#customer-pagination").addEventListener("click", event => {
  const button = event.target.closest("[data-customer-page]");
  if (!button || button.disabled) return;
  currentCustomerPage = Number(button.dataset.customerPage);
  loadCustomers();
});
$("#customer-rows").addEventListener("click", event => {
  const view = event.target.closest("[data-view-customer]");
  if (view) {
    openCustomerDetail(view.dataset.viewCustomer);
    return;
  }
  const toggle = event.target.closest("[data-toggle-customer]");
  if (toggle) toggleCustomerStatus(toggle.dataset.toggleCustomer, toggle.dataset.active === "true");
});
$("#customer-detail-content").addEventListener("click", event => {
  const toggle = event.target.closest("[data-detail-toggle-customer]");
  if (toggle) toggleCustomerStatus(toggle.dataset.detailToggleCustomer, toggle.dataset.active === "true");
});
document.querySelectorAll("[data-customer-detail-close]").forEach(button => button.addEventListener("click", () => {
  $("#customer-detail-modal").hidden = true;
  document.body.classList.remove("editor-open");
}));
$("#employee-search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentEmployeePage = 1; loadEmployees(); }, 250);
});
$("#employee-status-filter").addEventListener("change", () => { currentEmployeePage = 1; loadEmployees(); });
$("#employee-pagination").addEventListener("click", event => {
  const button = event.target.closest("[data-employee-page]");
  if (!button || button.disabled) return;
  currentEmployeePage = Number(button.dataset.employeePage);
  loadEmployees();
});
$("#add-employee").addEventListener("click", () => openEmployeeEditor());
$("#coupon-search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadCoupons, 250);
});
$("#coupon-status-filter").addEventListener("change", loadCoupons);
$("#add-coupon").addEventListener("click", () => openCouponEditor());
$("#coupon-rows").addEventListener("click", event => {
  const edit = event.target.closest("[data-edit-coupon]");
  if (edit) {
    const coupon = currentCoupons.find(item => String(item.id) === edit.dataset.editCoupon);
    if (coupon) openCouponEditor(coupon);
    return;
  }
  const disable = event.target.closest("[data-disable-coupon]");
  if (!disable) return;
  const coupon = currentCoupons.find(item => String(item.id) === disable.dataset.disableCoupon);
  if (!coupon || !window.confirm(`Tắt mã ${coupon.code}? Mã sẽ không thể áp dụng cho đơn mới.`)) return;
  api(`/api/admin/coupons/${encodeURIComponent(coupon.id)}`, { method: "DELETE" })
    .then(result => { notify(result.message); loadCoupons(); })
    .catch(error => notify(error.message));
});
document.querySelectorAll("[data-coupon-editor-close]").forEach(button => button.addEventListener("click", closeCouponEditor));
$("#coupon-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("#save-coupon");
  const message = $("#coupon-editor-message");
  const values = Object.fromEntries(new FormData(event.currentTarget));
  values.code = String(values.code).trim().toUpperCase();
  const editing = editCouponId !== null;
  button.disabled = true;
  message.textContent = "";
  try {
    const result = await api(editing ? `/api/admin/coupons/${encodeURIComponent(editCouponId)}` : "/api/admin/coupons", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    closeCouponEditor();
    notify(result.message);
    loadCoupons();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
$("#statistics-year").addEventListener("change", loadStatistics);
$("#employee-rows").addEventListener("click", event => {
  const edit = event.target.closest("[data-edit-employee]");
  if (edit) {
    const employee = currentEmployees.find(item => String(item.id) === edit.dataset.editEmployee);
    if (employee) openEmployeeEditor(employee);
    return;
  }
  const remove = event.target.closest("[data-delete-employee]");
  if (!remove) return;
  const employee = currentEmployees.find(item => String(item.id) === remove.dataset.deleteEmployee);
  if (!employee || !window.confirm(`Xóa nhân viên “${employee.fullName}”?`)) return;
  api(`/api/admin/employees/${encodeURIComponent(employee.id)}`, { method: "DELETE" })
    .then(result => { notify(result.message); loadEmployees(); loadDashboard(); })
    .catch(error => notify(error.message));
});
document.querySelectorAll("[data-employee-editor-close]").forEach(button => button.addEventListener("click", closeEmployeeEditor));
$("#employee-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("#save-employee");
  const message = $("#employee-editor-message");
  button.disabled = true;
  message.textContent = "";
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const editing = editEmployeeId !== null;
  try {
    const result = await api(editing ? `/api/admin/employees/${encodeURIComponent(editEmployeeId)}` : "/api/admin/employees", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    closeEmployeeEditor();
    notify(result.message);
    currentEmployeePage = 1;
    loadEmployees();
    loadDashboard();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
$("#product-rows").addEventListener("click", event => {
  const edit = event.target.closest("[data-edit-product]");
  if (edit) {
    const product = currentItems.find(item => String(item.id) === edit.dataset.editProduct);
    if (product) resetEditor(product);
    return;
  }
  const remove = event.target.closest("[data-delete-product]");
  if (!remove) return;
  const product = currentItems.find(item => String(item.id) === remove.dataset.deleteProduct);
  if (!product || !window.confirm(`Ngừng kinh doanh sản phẩm “${product.name}”?`)) return;
  api(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: "DELETE" })
    .then(() => { notify("Đã cập nhật trạng thái sản phẩm."); loadProducts(); loadDashboard(); })
    .catch(error => notify(error.message));
});
document.querySelectorAll("[data-editor-close]").forEach(button => button.addEventListener("click", closeEditor));
$("#product-form").elements.imageFile.addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  $("#image-preview").innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Ảnh xem trước">`;
});
$("#product-form").elements.image.addEventListener("input", event => {
  if (event.target.value) $("#image-preview").innerHTML = `<img src="${safe(event.target.value)}" alt="Ảnh xem trước">`;
});
$("#product-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $("#save-product");
  const message = $("#editor-message");
  const values = Object.fromEntries(new FormData(form));
  const discountPercent = Number(values.discountPercent || 0);
  delete values.discountPercent;
  if (discountPercent > 0) {
    const originalPrice = Number(values.price);
    values.oldPrice = originalPrice;
    values.price = Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100;
  } else {
    values.oldPrice = "";
  }
  values.gallery = String(values.gallery || "").split(/\r?\n/).map(image => image.trim()).filter(Boolean);
  delete values.imageFile;
  button.disabled = true;
  message.textContent = "";
  try {
    const imageFile = form.elements.imageFile.files[0];
    if (imageFile) {
      const upload = new FormData();
      upload.append("image", imageFile);
      const result = await api("/api/admin/uploads", { method: "POST", body: upload });
      values.image = result.image;
    }
    const editing = editProductId !== null;
    await api(editing ? `/api/admin/products/${encodeURIComponent(editProductId)}` : "/api/admin/products", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    closeEditor();
    notify(editing ? "Đã lưu thay đổi sản phẩm." : "Đã thêm sản phẩm mới.");
    currentPage = 1;
    loadProducts();
    loadDashboard();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
$("#admin-login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const message = $("#login-message");
  const values = Object.fromEntries(new FormData(event.currentTarget));
  message.textContent = "";
  try {
    const result = await api("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    activateAdmin(result.username);
  } catch (error) {
    message.textContent = error.message;
  }
});
$("#admin-logout").addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" }).catch(() => {});
  showLogin("Bạn đã đăng xuất.");
});

api("/api/admin/session").then(result => activateAdmin(result.username)).catch(error => showLogin(error.status === 401 ? "" : error.message));