"use strict";

require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const { rateLimit } = require("express-rate-limit");

const app = express();
const port = Number(process.env.PORT || 3000);
let poolPromise;
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Bạn thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại." }
});
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Bạn thử đăng nhập quá nhiều lần. Vui lòng đợi ít phút rồi thử lại." }
});
const couponValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Bạn đã thử quá nhiều mã. Vui lòng đợi ít phút rồi thử lại." }
});
const adminUploadDirectory = path.join(__dirname, "uploads", "products");
const addressDataCache = new Map();
const imageExtensions = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      fs.mkdirSync(adminUploadDirectory, { recursive: true });
      callback(null, adminUploadDirectory);
    },
    filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${imageExtensions[file.mimetype]}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = Object.hasOwn(imageExtensions, file.mimetype);
    callback(allowed ? null : new Error("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP."), allowed);
  }
});

function normalizePhone(value) { return String(value || "").replace(/\D/g, ""); }
function validPassword(value) { return typeof value === "string" && value.length >= 10 && value.length <= 64; }
function authConfigured() { return typeof process.env.AUTH_TOKEN_SECRET === "string" && Buffer.byteLength(process.env.AUTH_TOKEN_SECRET) >= 32; }
function publicCustomer(row) { return { id: row.Id, fullName: row.FullName, email: row.Email, phone: row.Phone }; }
function setSessionCookie(res, customerId) {
  if (!authConfigured()) throw new Error("Customer authentication is not configured.");
  const token = jwt.sign({ sub: String(customerId) }, process.env.AUTH_TOKEN_SECRET, { expiresIn: "7d" });
  res.cookie("atelier_session", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}
async function requireCustomer(req, res, next) {
  const token = req.cookies?.atelier_session;
  if (!token) return res.status(401).json({ error: "Vui lòng đăng nhập để tiếp tục." });
  if (!authConfigured()) return res.status(503).json({ error: "Xác thực tài khoản chưa được cấu hình." });
  try {
    const claims = jwt.verify(token, process.env.AUTH_TOKEN_SECRET);
    const result = await (await getPool()).request().input("id", sql.Int, Number(claims.sub)).query(`
      SELECT Id, FullName, Email, Phone FROM dbo.Customers WHERE Id = @id AND IsActive = 1;
    `);
    if (!result.recordset.length) return res.status(401).json({ error: "Phiên đăng nhập không còn hợp lệ." });
    req.customer = result.recordset[0];
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return res.status(401).json({ error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
    console.error("Customer session lookup failed:", error.message);
    res.status(503).json({ error: "Không thể xác thực tài khoản với SQL Server." });
  }
}
function safeStringEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
function requireAdmin(req, res, next) {
  const token = req.cookies?.atelier_admin;
  if (!token || !authConfigured()) return res.status(401).json({ error: "Vui lòng đăng nhập quản trị." });
  try {
    const claims = jwt.verify(token, process.env.AUTH_TOKEN_SECRET);
    if (claims.role !== "admin") return res.status(401).json({ error: "Phiên quản trị không hợp lệ." });
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return res.status(401).json({ error: "Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại." });
    res.status(401).json({ error: "Không thể xác thực phiên quản trị." });
  }
}
function setAdminCookie(res) {
  const token = jwt.sign({ role: "admin" }, process.env.AUTH_TOKEN_SECRET, { expiresIn: "8h" });
  res.cookie("atelier_admin", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000
  });
}
async function optionalCustomer(req, res, next) {
  const token = req.cookies?.atelier_session;
  if (!token || !authConfigured()) return next();
  try {
    const claims = jwt.verify(token, process.env.AUTH_TOKEN_SECRET);
    const result = await (await getPool()).request().input("id", sql.Int, Number(claims.sub)).query(`SELECT Id, FullName, Email, Phone FROM dbo.Customers WHERE Id = @id AND IsActive = 1;`);
    req.customer = result.recordset[0] || null;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return next();
    console.error("Optional customer lookup failed:", error.message);
    res.status(503).json({ error: "Không thể tải thông tin khách hàng." });
  }
}

function getPool() {
  const required = ["SQL_SERVER", "SQL_DATABASE", "SQL_USER", "SQL_PASSWORD"];
  if (required.some(name => !process.env[name])) {
    throw new Error("SQL Server connection settings are missing.");
  }
  if (!poolPromise) {
    const instanceName = process.env.SQL_INSTANCE?.trim();
    poolPromise = new sql.ConnectionPool({
      server: process.env.SQL_SERVER,
      ...(instanceName ? {} : { port: Number(process.env.SQL_PORT || 1433) }),
      database: process.env.SQL_DATABASE,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      options: {
        ...(instanceName ? { instanceName } : {}),
        encrypt: process.env.SQL_ENCRYPT === "true",
        trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE === "true"
      },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
    }).connect().catch(error => {
      poolPromise = null;
      throw error;
    });
  }
  return poolPromise;
}

function values(value, limit = 10) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(list.map(item => String(item).trim()).filter(Boolean))].slice(0, limit);
}

function buildFilters(query) {
  const clauses = ["p.IsActive = 1"];
  const parameters = [];
  const addParameter = (name, value, type = sql.NVarChar(120)) => parameters.push({ name, value, type });
  const addList = (column, key, items) => {
    if (!items.length) return;
    const placeholders = items.map((item, index) => {
      const name = `${key}${index}`;
      addParameter(name, item);
      return `@${name}`;
    });
    clauses.push(`${column} IN (${placeholders.join(", ")})`);
  };

  const search = String(query.q || "").trim().slice(0, 200);
  if (search) {
    addParameter("search", `%${search.replace(/[\\%_\[\]]/g, character => `\\${character}`)}%`, sql.NVarChar(202));
    clauses.push("(p.ProductName LIKE @search ESCAPE '\\' OR p.Sku LIKE @search ESCAPE '\\' OR p.Category LIKE @search ESCAPE '\\' OR p.MirrorType LIKE @search ESCAPE '\\' OR p.Brand LIKE @search ESCAPE '\\' OR p.Description LIKE @search ESCAPE '\\')");
  }

  addList("p.Category", "category", values(query.category));
  addList("p.Shape", "shape", values(query.shape));
  addList("p.Space", "space", values(query.space));

  const priceBands = {
    "under-500": (name) => { addParameter(name, 500000, sql.Decimal(18, 2)); return `p.Price < @${name}`; },
    "500-1000": (name) => { addParameter(`${name}Min`, 500000, sql.Decimal(18, 2)); addParameter(`${name}Max`, 1000000, sql.Decimal(18, 2)); return `(p.Price >= @${name}Min AND p.Price < @${name}Max)`; },
    "1000-2000": (name) => { addParameter(`${name}Min`, 1000000, sql.Decimal(18, 2)); addParameter(`${name}Max`, 2000000, sql.Decimal(18, 2)); return `(p.Price >= @${name}Min AND p.Price < @${name}Max)`; },
    "2000-5000": (name) => { addParameter(`${name}Min`, 2000000, sql.Decimal(18, 2)); addParameter(`${name}Max`, 5000000, sql.Decimal(18, 2)); return `(p.Price >= @${name}Min AND p.Price <= @${name}Max)`; },
    "over-5000": (name) => { addParameter(name, 5000000, sql.Decimal(18, 2)); return `p.Price > @${name}`; }
  };
  const selectedBands = values(query.price).filter(band => Object.hasOwn(priceBands, band));
  if (selectedBands.length) clauses.push(`(${selectedBands.map((band, index) => priceBands[band](`price${index}`)).join(" OR ")})`);
  if (query.promotion === "true") clauses.push("p.OldPrice > p.Price");

  return {
    where: clauses.join(" AND "),
    bind(request) {
      for (const parameter of parameters) request.input(parameter.name, parameter.type, parameter.value);
      return request;
    }
  };
}

const sortExpressions = {
  featured: "p.IsFeatured DESC, p.ProductName ASC",
  "price-asc": "p.Price ASC, p.ProductName ASC",
  "price-desc": "p.Price DESC, p.ProductName ASC",
  "name-asc": "p.ProductName ASC",
  "name-desc": "p.ProductName DESC",
  newest: "p.CreatedAt DESC, p.Id DESC",
  "best-selling": "p.SoldCount DESC, p.ProductName ASC"
};
const adminOrderStatuses = ["Chờ xác nhận", "Đã xác nhận", "Đang chuẩn bị", "Đang giao", "Đã giao", "Đã hủy"];

function mapProduct(row) {
  let gallery = [];
  try {
    gallery = JSON.parse(row.galleryJson || "[]");
  } catch {
    gallery = [];
  }
  const { galleryJson, ...product } = row;
  return { ...product, gallery: Array.isArray(gallery) ? gallery.filter(image => typeof image === "string") : [] };
}

app.post("/api/auth/register", authLimiter, async (req, res) => {
  const fullName = String(req.body?.fullName || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phone = normalizePhone(req.body?.phone);
  const password = req.body?.password;
  if (!authConfigured()) return res.status(503).json({ error: "Xác thực tài khoản chưa được cấu hình." });
  if (fullName.length < 2 || fullName.length > 160) return res.status(400).json({ error: "Họ tên cần từ 2 đến 160 ký tự." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ error: "Email không hợp lệ." });
  if (phone.length < 9 || phone.length > 15) return res.status(400).json({ error: "Số điện thoại không hợp lệ." });
  if (!validPassword(password)) return res.status(400).json({ error: "Mật khẩu cần từ 10 đến 64 ký tự." });
  if (password !== req.body.confirmPassword) return res.status(400).json({ error: "Mật khẩu xác nhận không khớp." });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await (await getPool()).request()
      .input("fullName", sql.NVarChar(160), fullName)
      .input("email", sql.NVarChar(254), email)
      .input("phone", sql.NVarChar(24), phone)
      .input("passwordHash", sql.NVarChar(100), passwordHash)
      .query(`INSERT INTO dbo.Customers (FullName, Email, Phone, PasswordHash) OUTPUT INSERTED.Id, INSERTED.FullName, INSERTED.Email, INSERTED.Phone VALUES (@fullName, @email, @phone, @passwordHash);`);
    const customer = result.recordset[0];
    setSessionCookie(res, customer.Id);
    res.status(201).json({ customer: publicCustomer(customer) });
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ error: "Email hoặc số điện thoại đã được đăng ký." });
    console.error("Customer registration failed:", error.message);
    res.status(503).json({ error: "Không thể tạo tài khoản. Kiểm tra SQL Server và cấu hình xác thực." });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const identifier = String(req.body?.identifier || "").trim();
  const normalizedEmail = identifier.toLowerCase();
  const normalizedPhone = normalizePhone(identifier);
  const password = req.body?.password;
  if (!authConfigured()) return res.status(503).json({ error: "Xác thực tài khoản chưa được cấu hình." });
  if (!identifier || typeof password !== "string") return res.status(400).json({ error: "Nhập email/số điện thoại và mật khẩu." });
  try {
    const result = await (await getPool()).request()
      .input("email", sql.NVarChar(254), normalizedEmail)
      .input("phone", sql.NVarChar(24), normalizedPhone)
      .query(`SELECT TOP (1) Id, FullName, Email, Phone, PasswordHash FROM dbo.Customers WHERE IsActive = 1 AND (Email = @email OR Phone = @phone);`);
    const customer = result.recordset[0];
    if (!customer || !(await bcrypt.compare(password, customer.PasswordHash))) return res.status(401).json({ error: "Thông tin đăng nhập không chính xác." });
    setSessionCookie(res, customer.Id);
    res.json({ customer: publicCustomer(customer) });
  } catch (error) {
    console.error("Customer login failed:", error.message);
    res.status(503).json({ error: "Không thể đăng nhập. Kiểm tra SQL Server và cấu hình xác thực." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("atelier_session", { httpOnly: true, secure: process.env.COOKIE_SECURE === "true", sameSite: "strict", path: "/" });
  res.status(204).end();
});

async function getVietnamAddressData(key, url) {
  const cached = addressDataCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Address provider returned ${response.status}.`);
  const data = await response.json();
  addressDataCache.set(key, { data, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  return data;
}

app.get("/api/addresses/provinces", async (_req, res) => {
  try {
    const provinces = await getVietnamAddressData("provinces", "https://provinces.open-api.vn/api/v2/?depth=1");
    res.set("Cache-Control", "public, max-age=86400");
    res.json({ provinces: provinces.map(({ code, name, division_type: divisionType }) => ({ code, name, divisionType })) });
  } catch (error) {
    console.error("Vietnam province list failed:", error.message);
    res.status(503).json({ error: "Không thể tải danh sách tỉnh/thành phố Việt Nam." });
  }
});

app.get("/api/addresses/provinces/:code/wards", async (req, res) => {
  const code = Number.parseInt(req.params.code, 10);
  if (!Number.isInteger(code) || code < 1 || String(code) !== req.params.code) return res.status(400).json({ error: "Mã tỉnh/thành phố không hợp lệ." });
  try {
    const province = await getVietnamAddressData(`province-${code}`, `https://provinces.open-api.vn/api/v2/p/${code}?depth=2`);
    res.set("Cache-Control", "public, max-age=86400");
    res.json({ province: { code: province.code, name: province.name }, wards: (province.wards || []).map(({ code: wardCode, name, division_type: divisionType }) => ({ code: wardCode, name, divisionType })) });
  } catch (error) {
    console.error("Vietnam ward list failed:", error.message);
    res.status(503).json({ error: "Không thể tải danh sách phường/xã." });
  }
});

app.get("/api/auth/me", requireCustomer, (req, res) => res.json({ customer: publicCustomer(req.customer) }));

app.put("/api/account/profile", requireCustomer, async (req, res) => {
  const fullName = String(req.body?.fullName || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phone = normalizePhone(req.body?.phone);
  if (fullName.length < 2 || fullName.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || phone.length < 9 || phone.length > 15) return res.status(400).json({ error: "Vui lòng kiểm tra họ tên, email và số điện thoại." });
  try {
    const result = await (await getPool()).request()
      .input("id", sql.Int, req.customer.Id)
      .input("fullName", sql.NVarChar(160), fullName)
      .input("email", sql.NVarChar(254), email)
      .input("phone", sql.NVarChar(24), phone)
      .query(`UPDATE dbo.Customers SET FullName = @fullName, Email = @email, Phone = @phone, UpdatedAt = SYSUTCDATETIME() OUTPUT INSERTED.Id, INSERTED.FullName, INSERTED.Email, INSERTED.Phone WHERE Id = @id;`);
    res.json({ customer: publicCustomer(result.recordset[0]) });
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ error: "Email hoặc số điện thoại đã được dùng bởi tài khoản khác." });
    console.error("Customer profile update failed:", error.message);
    res.status(503).json({ error: "Không thể cập nhật thông tin tài khoản." });
  }
});

app.put("/api/account/password", requireCustomer, async (req, res) => {
  const currentPassword = req.body?.currentPassword;
  const newPassword = req.body?.newPassword;
  if (!validPassword(newPassword) || newPassword !== req.body?.confirmPassword) return res.status(400).json({ error: "Mật khẩu mới cần từ 10 đến 64 ký tự và xác nhận phải khớp." });
  try {
    const pool = await getPool();
    const result = await pool.request().input("id", sql.Int, req.customer.Id).query(`SELECT PasswordHash FROM dbo.Customers WHERE Id = @id AND IsActive = 1;`);
    if (!result.recordset.length || !(await bcrypt.compare(String(currentPassword || ""), result.recordset[0].PasswordHash))) return res.status(401).json({ error: "Mật khẩu hiện tại không chính xác." });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.request().input("id", sql.Int, req.customer.Id).input("hash", sql.NVarChar(100), hash).query(`UPDATE dbo.Customers SET PasswordHash = @hash, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id;`);
    res.json({ message: "Đã đổi mật khẩu." });
  } catch (error) {
    console.error("Password update failed:", error.message);
    res.status(503).json({ error: "Không thể đổi mật khẩu." });
  }
});

app.get("/api/account/addresses", requireCustomer, async (req, res) => {
  try {
    const result = await (await getPool()).request().input("customerId", sql.Int, req.customer.Id).query(`SELECT Id AS id, Label AS label, RecipientName AS recipientName, Phone AS phone, AddressLine AS addressLine, Ward AS ward, District AS district, City AS city, IsDefault AS isDefault FROM dbo.CustomerAddresses WHERE CustomerId = @customerId ORDER BY IsDefault DESC, Id DESC;`);
    res.json({ addresses: result.recordset });
  } catch (error) {
    console.error("Address list failed:", error.message);
    res.status(503).json({ error: "Không thể tải địa chỉ giao hàng." });
  }
});

app.post("/api/account/addresses", requireCustomer, async (req, res) => {
  const label = String(req.body?.label || "Nhà riêng").trim().slice(0, 60);
  const recipientName = String(req.body?.recipientName || "").trim();
  const phone = normalizePhone(req.body?.phone);
  const addressLine = String(req.body?.addressLine || "").trim();
  const district = String(req.body?.district || "").trim();
  const ward = String(req.body?.ward || "").trim();
  const city = String(req.body?.city || "").trim();
  const isDefault = Boolean(req.body?.isDefault);
  if (recipientName.length < 2 || phone.length < 9 || phone.length > 15 || !addressLine || addressLine.length > 300 || !ward || ward.length > 120 || district.length > 120 || !city || city.length > 120) return res.status(400).json({ error: "Vui lòng nhập đầy đủ người nhận và địa chỉ giao hàng." });
  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      if (isDefault) await new sql.Request(transaction).input("customerId", sql.Int, req.customer.Id).query(`UPDATE dbo.CustomerAddresses SET IsDefault = 0 WHERE CustomerId = @customerId;`);
      const result = await new sql.Request(transaction)
        .input("customerId", sql.Int, req.customer.Id)
        .input("label", sql.NVarChar(60), label || "Nhà riêng")
        .input("name", sql.NVarChar(160), recipientName)
        .input("phone", sql.NVarChar(24), phone)
        .input("address", sql.NVarChar(300), addressLine)
        .input("district", sql.NVarChar(120), district)
        .input("ward", sql.NVarChar(120), ward)
        .input("city", sql.NVarChar(120), city)
        .input("isDefault", sql.Bit, isDefault)
        .query(`INSERT INTO dbo.CustomerAddresses (CustomerId, Label, RecipientName, Phone, AddressLine, Ward, District, City, IsDefault) OUTPUT INSERTED.Id AS id, INSERTED.Label AS label, INSERTED.RecipientName AS recipientName, INSERTED.Phone AS phone, INSERTED.AddressLine AS addressLine, INSERTED.Ward AS ward, INSERTED.District AS district, INSERTED.City AS city, INSERTED.IsDefault AS isDefault VALUES (@customerId, @label, @name, @phone, @address, @ward, @district, @city, @isDefault);`);
      await transaction.commit();
      res.status(201).json({ address: result.recordset[0] });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Address save failed:", error.message);
    res.status(503).json({ error: "Không thể lưu địa chỉ giao hàng." });
  }
});

app.delete("/api/account/addresses/:id", requireCustomer, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Địa chỉ không hợp lệ." });
  try {
    await (await getPool()).request().input("id", sql.Int, id).input("customerId", sql.Int, req.customer.Id).query(`DELETE FROM dbo.CustomerAddresses WHERE Id = @id AND CustomerId = @customerId;`);
    res.status(204).end();
  } catch (error) {
    console.error("Address delete failed:", error.message);
    res.status(503).json({ error: "Không thể xóa địa chỉ." });
  }
});

app.get("/api/account/orders", requireCustomer, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().input("customerId", sql.Int, req.customer.Id).query(`
      SELECT o.Id AS orderId, o.OrderNumber AS orderNumber, o.CreatedAt AS createdAt, o.Status AS status,
        o.Subtotal AS subtotal, o.Discount AS discount, o.Shipping AS shipping, o.Total AS total,
        i.ProductId AS productId, i.Sku AS sku, i.ProductName AS productName,
        i.UnitPrice AS unitPrice, i.OriginalUnitPrice AS originalUnitPrice, i.Quantity AS quantity
      FROM dbo.Orders o LEFT JOIN dbo.OrderItems i ON i.OrderId = o.Id
      WHERE o.CustomerId = @customerId ORDER BY o.CreatedAt DESC, o.Id DESC;
    `);
    const orders = new Map();
    for (const row of result.recordset) {
      if (!orders.has(row.orderId)) orders.set(row.orderId, { orderNumber: row.orderNumber, createdAt: row.createdAt, status: row.status, subtotal: row.subtotal, discount: row.discount, shipping: row.shipping, total: row.total, statusHistory: [], items: [] });
      if (row.productId) orders.get(row.orderId).items.push({ productId: row.productId, sku: row.sku, name: row.productName, unitPrice: row.unitPrice, originalUnitPrice: row.originalUnitPrice, quantity: row.quantity });
    }
    const historyResult = await pool.request().input("customerId", sql.Int, req.customer.Id).query(`
      SELECT h.OrderId AS orderId, h.Status AS status, h.Note AS note, h.CreatedAt AS createdAt
      FROM dbo.OrderStatusHistory h JOIN dbo.Orders o ON o.Id = h.OrderId
      WHERE o.CustomerId = @customerId ORDER BY h.CreatedAt, h.Id;
    `);
    for (const entry of historyResult.recordset) orders.get(entry.orderId)?.statusHistory.push({ status: entry.status, note: entry.note, createdAt: entry.createdAt });
    res.json({ orders: [...orders.values()] });
  } catch (error) {
    console.error("Customer orders query failed:", error.message);
    res.status(503).json({ error: "Không thể tải đơn hàng của bạn." });
  }
});

app.get("/api/products/:id/reviews", optionalCustomer, async (req, res) => {
  const productId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(productId) || productId < 1) return res.status(400).json({ error: "Sản phẩm không hợp lệ." });
  try {
    const pool = await getPool();
    const reviewsResult = await pool.request().input("productId", sql.Int, productId).query(`
      SELECT TOP (50) Rating AS rating, Comment AS comment, CreatedAt AS createdAt
      FROM dbo.Reviews WHERE ProductId = @productId AND IsVisible = 1 ORDER BY CreatedAt DESC, Id DESC;
    `);
    let canReview = false;
    if (req.customer) {
      const eligibility = await pool.request().input("customerId", sql.Int, req.customer.Id).input("productId", sql.Int, productId).query(`
        SELECT TOP (1) oi.Id FROM dbo.OrderItems oi JOIN dbo.Orders o ON o.Id = oi.OrderId
        WHERE o.CustomerId = @customerId AND oi.ProductId = @productId
          AND NOT EXISTS (SELECT 1 FROM dbo.Reviews r WHERE r.OrderItemId = oi.Id)
        ORDER BY o.CreatedAt DESC;
      `);
      canReview = eligibility.recordset.length > 0;
    }
    res.json({ reviews: reviewsResult.recordset, canReview });
  } catch (error) {
    console.error("Product reviews query failed:", error.message);
    res.status(503).json({ error: "Không thể tải đánh giá sản phẩm." });
  }
});

app.post("/api/products/:id/reviews", requireCustomer, async (req, res) => {
  const productId = Number.parseInt(req.params.id, 10);
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment || "").trim();
  if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3 || comment.length > 1000) return res.status(400).json({ error: "Chọn từ 1 đến 5 sao và nhập nhận xét từ 3 đến 1.000 ký tự." });
  try {
    const pool = await getPool();
    const eligible = await pool.request().input("customerId", sql.Int, req.customer.Id).input("productId", sql.Int, productId).query(`
      SELECT TOP (1) oi.Id FROM dbo.OrderItems oi JOIN dbo.Orders o ON o.Id = oi.OrderId
      WHERE o.CustomerId = @customerId AND oi.ProductId = @productId
        AND NOT EXISTS (SELECT 1 FROM dbo.Reviews r WHERE r.OrderItemId = oi.Id)
      ORDER BY o.CreatedAt DESC;
    `);
    const orderItemId = eligible.recordset[0]?.Id;
    if (!orderItemId) return res.status(403).json({ error: "Bạn cần mua sản phẩm này trước khi đánh giá." });
    await pool.request().input("orderItemId", sql.Int, orderItemId).input("customerId", sql.Int, req.customer.Id).input("productId", sql.Int, productId).input("rating", sql.TinyInt, rating).input("comment", sql.NVarChar(1000), comment).query(`
      INSERT INTO dbo.Reviews (OrderItemId, CustomerId, ProductId, Rating, Comment) VALUES (@orderItemId, @customerId, @productId, @rating, @comment);
      UPDATE dbo.Products SET Rating = (SELECT CAST(AVG(CAST(Rating AS DECIMAL(3,1))) AS DECIMAL(2,1)) FROM dbo.Reviews WHERE ProductId = @productId AND IsVisible = 1) WHERE Id = @productId;
    `);
    res.status(201).json({ message: "Cảm ơn bạn đã đánh giá sản phẩm." });
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ error: "Bạn đã đánh giá lần mua này rồi." });
    console.error("Product review save failed:", error.message);
    res.status(503).json({ error: "Không thể lưu đánh giá sản phẩm." });
  }
});

app.post("/api/orders", requireCustomer, async (req, res) => {
  const recipientName = String(req.body?.name || "").trim();
  const phone = normalizePhone(req.body?.phone);
  const addressLine = String(req.body?.address || "").trim();
  const district = String(req.body?.district || "").trim();
  const ward = String(req.body?.ward || "").trim();
  const city = String(req.body?.city || "").trim();
  const paymentMethod = ["cod", "bank", "online"].includes(req.body?.payment) ? req.body.payment : "cod";
  const note = String(req.body?.note || "").trim().slice(0, 500);
  const couponCode = String(req.body?.couponCode || "").trim().toUpperCase();
  if (couponCode && !/^[A-Z0-9_-]{3,40}$/.test(couponCode)) return res.status(400).json({ error: "Mã giảm giá không hợp lệ." });
  const mergedItems = new Map();
  for (const entry of Array.isArray(req.body?.items) ? req.body.items : []) {
    const id = Number(entry.id);
    const quantity = Number(entry.quantity);
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) return res.status(400).json({ error: "Sản phẩm hoặc số lượng không hợp lệ." });
    mergedItems.set(id, (mergedItems.get(id) || 0) + quantity);
  }
  if (recipientName.length < 2 || phone.length < 9 || phone.length > 15 || !addressLine || addressLine.length > 300 || !ward || ward.length > 120 || district.length > 120 || !city || city.length > 120 || mergedItems.size === 0 || mergedItems.size > 30) return res.status(400).json({ error: "Thông tin giao hàng hoặc giỏ hàng không hợp lệ." });
  if ([...mergedItems.values()].some(quantity => quantity > 50)) return res.status(400).json({ error: "Số lượng một sản phẩm không được vượt quá 50." });

  let transaction;
  try {
    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    const orderItems = [];
    let subtotal = 0;
    let discount = 0;
    let couponDiscount = 0;
    let coupon = null;
    for (const [productId, quantity] of mergedItems) {
      const result = await new sql.Request(transaction).input("id", sql.Int, productId).query(`SELECT Id, Sku, ProductName, Price, OldPrice, Stock FROM dbo.Products WITH (UPDLOCK, ROWLOCK) WHERE Id = @id AND IsActive = 1;`);
      const product = result.recordset[0];
      if (!product || product.Stock < quantity) {
        const error = new Error("Một sản phẩm đã hết hàng hoặc không đủ số lượng.");
        error.status = 409;
        throw error;
      }
      const originalPrice = product.OldPrice > product.Price ? product.OldPrice : product.Price;
      subtotal += originalPrice * quantity;
      discount += (originalPrice - product.Price) * quantity;
      orderItems.push({ product, quantity, originalPrice });
    }
    if (couponCode) {
      const couponResult = await new sql.Request(transaction).input("code", sql.NVarChar(40), couponCode).query(`
        SELECT Id, Code, DiscountType, DiscountValue FROM dbo.Coupons WITH (UPDLOCK, ROWLOCK)
        WHERE Code = @code AND IsActive = 1 AND UsedCount < Quantity
          AND CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time' AS DATE) BETWEEN StartsAt AND EndsAt;
      `);
      coupon = couponResult.recordset[0];
      if (!coupon) {
        const error = new Error("Mã giảm giá đã hết lượt, bị tắt hoặc ngoài thời gian áp dụng.");
        error.status = 409;
        throw error;
      }
      const eligibleSubtotal = Math.max(0, subtotal - discount);
      couponDiscount = Math.min(eligibleSubtotal, coupon.DiscountType === "percent" ? eligibleSubtotal * Number(coupon.DiscountValue) / 100 : Number(coupon.DiscountValue));
      couponDiscount = Math.round(couponDiscount * 100) / 100;
    }
    const shipping = 100000;
    const total = subtotal - discount - couponDiscount + shipping;
    const initialStatus = "Chờ xác nhận";
    const provisionalNumber = `TMP-${crypto.randomBytes(16).toString("hex")}`;
    const inserted = await new sql.Request(transaction)
      .input("orderNumber", sql.NVarChar(32), provisionalNumber)
      .input("customerId", sql.Int, req.customer.Id)
      .input("name", sql.NVarChar(160), recipientName)
      .input("phone", sql.NVarChar(24), phone)
      .input("email", sql.NVarChar(254), req.customer.Email)
      .input("address", sql.NVarChar(300), addressLine)
      .input("district", sql.NVarChar(120), district)
      .input("ward", sql.NVarChar(120), ward)
      .input("city", sql.NVarChar(120), city)
      .input("payment", sql.NVarChar(24), paymentMethod)
      .input("note", sql.NVarChar(500), note || null)
      .input("subtotal", sql.Decimal(18, 2), subtotal)
      .input("discount", sql.Decimal(18, 2), discount)
      .input("shipping", sql.Decimal(18, 2), shipping)
      .input("total", sql.Decimal(18, 2), total)
      .input("couponId", sql.Int, coupon?.Id ?? null)
      .input("couponCode", sql.NVarChar(40), coupon?.Code ?? null)
      .input("couponDiscount", sql.Decimal(18, 2), couponDiscount)
      .input("status", sql.NVarChar(40), initialStatus)
      .query(`INSERT INTO dbo.Orders (OrderNumber, CustomerId, RecipientName, Phone, Email, AddressLine, District, Ward, City, PaymentMethod, Note, Subtotal, Discount, Shipping, Total, CouponId, CouponCode, CouponDiscount, Status) OUTPUT INSERTED.Id AS id VALUES (@orderNumber, @customerId, @name, @phone, @email, @address, @district, @ward, @city, @payment, @note, @subtotal, @discount, @shipping, @total, @couponId, @couponCode, @couponDiscount, @status);`);
    const orderId = inserted.recordset[0].id;
    if (coupon) {
      const usage = await new sql.Request(transaction).input("couponId", sql.Int, coupon.Id).query(`UPDATE dbo.Coupons SET UsedCount = UsedCount + 1, UpdatedAt = SYSUTCDATETIME() WHERE Id = @couponId AND IsActive = 1 AND UsedCount < Quantity;`);
      if (usage.rowsAffected[0] !== 1) {
        const error = new Error("Mã giảm giá vừa hết lượt. Vui lòng thử mã khác.");
        error.status = 409;
        throw error;
      }
    }
    const orderNumber = `HD${String(orderId).padStart(5, "0")}`;
    await new sql.Request(transaction).input("id", sql.Int, orderId).input("orderNumber", sql.NVarChar(32), orderNumber).query(`UPDATE dbo.Orders SET OrderNumber = @orderNumber WHERE Id = @id;`);
    await new sql.Request(transaction).input("orderId", sql.Int, orderId).input("status", sql.NVarChar(40), initialStatus).query(`INSERT INTO dbo.OrderStatusHistory (OrderId, Status, Note) VALUES (@orderId, @status, N'Đơn hàng đã được tiếp nhận.');`);
    for (const { product, quantity, originalPrice } of orderItems) {
      await new sql.Request(transaction)
        .input("orderId", sql.Int, orderId)
        .input("productId", sql.Int, product.Id)
        .input("sku", sql.NVarChar(40), product.Sku)
        .input("name", sql.NVarChar(200), product.ProductName)
        .input("price", sql.Decimal(18, 2), product.Price)
        .input("originalPrice", sql.Decimal(18, 2), originalPrice)
        .input("quantity", sql.Int, quantity)
        .query(`INSERT INTO dbo.OrderItems (OrderId, ProductId, Sku, ProductName, UnitPrice, OriginalUnitPrice, Quantity) VALUES (@orderId, @productId, @sku, @name, @price, @originalPrice, @quantity); UPDATE dbo.Products SET Stock = Stock - @quantity, SoldCount = SoldCount + @quantity WHERE Id = @productId;`);
    }
    await transaction.commit();
    res.status(201).json({ orderNumber, subtotal, discount, couponCode: coupon?.Code ?? null, couponDiscount, shipping, total, status: initialStatus });
  } catch (error) {
    if (transaction?._aborted !== true) await transaction?.rollback().catch(() => {});
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("Account order creation failed:", error.message);
    res.status(503).json({ error: "Không thể lưu đơn hàng với SQL Server." });
  }
});

app.post("/api/admin/login", adminLoginLimiter, (req, res) => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || username.startsWith("replace-with-") || password.startsWith("replace-with-") || !authConfigured()) return res.status(503).json({ error: "Chưa cấu hình tài khoản quản trị trên máy chủ." });
  if (!safeStringEqual(req.body?.username || "", username) || !safeStringEqual(req.body?.password || "", password)) return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác." });
  setAdminCookie(res);
  res.json({ username });
});

app.post("/api/admin/logout", (_req, res) => {
  res.clearCookie("atelier_admin", { httpOnly: true, secure: process.env.COOKIE_SECURE === "true", sameSite: "strict", path: "/" });
  res.status(204).end();
});

app.get("/api/admin/session", requireAdmin, (_req, res) => res.json({ username: process.env.ADMIN_USERNAME }));

function validateCoupon(body) {
  const code = String(body?.code || "").trim().toUpperCase();
  const programName = String(body?.programName || "").trim();
  const discountType = String(body?.discountType || "");
  const discountValue = Number(body?.discountValue);
  const startsAt = String(body?.startsAt || "");
  const endsAt = String(body?.endsAt || "");
  const quantity = Number(body?.quantity);
  const parseDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  };
  const startDate = parseDate(startsAt);
  const endDate = parseDate(endsAt);
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return { error: "Mã giảm giá chỉ gồm chữ in hoa, số, gạch ngang hoặc gạch dưới (3–40 ký tự)." };
  if (!programName || programName.length > 160) return { error: "Tên chương trình không được trống và tối đa 160 ký tự." };
  if (!["percent", "fixed"].includes(discountType)) return { error: "Loại giảm giá không hợp lệ." };
  if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === "percent" && discountValue > 100) || discountValue > 9999999999999999) return { error: "Giá trị giảm không hợp lệ." };
  if (!startDate || !endDate || endsAt < startsAt) return { error: "Ngày áp dụng không hợp lệ." };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647) return { error: "Số lượng mã phải là số nguyên dương." };
  if (!["active", "inactive"].includes(body?.status)) return { error: "Trạng thái mã giảm giá không hợp lệ." };
  return { coupon: { code, programName, discountType, discountValue, startsAt, endsAt, quantity, isActive: body.status === "active" } };
}

function bindCoupon(request, coupon) {
  return request
    .input("code", sql.NVarChar(40), coupon.code)
    .input("programName", sql.NVarChar(160), coupon.programName)
    .input("discountType", sql.NVarChar(20), coupon.discountType)
    .input("discountValue", sql.Decimal(18, 2), coupon.discountValue)
    .input("startsAt", sql.Date, new Date(`${coupon.startsAt}T00:00:00.000Z`))
    .input("endsAt", sql.Date, new Date(`${coupon.endsAt}T00:00:00.000Z`))
    .input("quantity", sql.Int, coupon.quantity)
    .input("isActive", sql.Bit, coupon.isActive);
}

app.get("/api/coupons/:code/validate", couponValidateLimiter, async (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();
  const subtotal = Number(req.query.subtotal);
  if (!/^[A-Z0-9_-]{3,40}$/.test(code) || !Number.isFinite(subtotal) || subtotal < 0) return res.status(400).json({ error: "Mã giảm giá hoặc giá trị đơn hàng không hợp lệ." });
  try {
    const result = await (await getPool()).request().input("code", sql.NVarChar(40), code).input("subtotal", sql.Decimal(18, 2), subtotal).query(`
      SELECT Id AS id, Code AS code, ProgramName AS programName, DiscountType AS discountType, DiscountValue AS discountValue
      FROM dbo.Coupons
      WHERE Code = @code AND IsActive = 1 AND UsedCount < Quantity
        AND CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time' AS DATE) BETWEEN StartsAt AND EndsAt;
    `);
    const coupon = result.recordset[0];
    if (!coupon) return res.status(404).json({ error: "Mã giảm giá không tồn tại, đã hết lượt hoặc ngoài thời gian áp dụng." });
    const discount = Math.min(subtotal, coupon.discountType === "percent" ? subtotal * Number(coupon.discountValue) / 100 : Number(coupon.discountValue));
    res.json({ coupon: { code: coupon.code, programName: coupon.programName }, discount: Math.round(discount * 100) / 100 });
  } catch (error) {
    console.error("Coupon validation failed:", error.message);
    res.status(503).json({ error: "Không thể kiểm tra mã giảm giá." });
  }
});

app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
  const search = String(req.query.q || "").trim().slice(0, 160);
  const status = String(req.query.status || "all");
  if (!["all", "active", "inactive"].includes(status)) return res.status(400).json({ error: "Trạng thái chương trình không hợp lệ." });
  const clauses = [];
  if (search) clauses.push("(Code LIKE @search ESCAPE '\\' OR ProgramName LIKE @search ESCAPE '\\')");
  if (status !== "all") clauses.push(`IsActive = ${status === "active" ? "1" : "0"}`);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  try {
    const request = (await getPool()).request();
    if (search) request.input("search", sql.NVarChar(162), `%${search.replace(/[\\%_\[\]]/g, character => `\\${character}`)}%`);
    const result = await request.query(`
      SELECT Id AS id, Code AS code, ProgramName AS programName, DiscountType AS discountType,
        DiscountValue AS discountValue, StartsAt AS startsAt, EndsAt AS endsAt,
        Quantity AS quantity, UsedCount AS usedCount, IsActive AS isActive
      FROM dbo.Coupons ${where} ORDER BY CreatedAt DESC, Id DESC;
    `);
    res.json({ coupons: result.recordset });
  } catch (error) {
    console.error("Admin coupon list failed:", error.message);
    res.status(503).json({ error: "Không thể tải chương trình giảm giá." });
  }
});

app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
  const validated = validateCoupon(req.body);
  if (validated.error) return res.status(400).json({ error: validated.error });
  try {
    const result = await bindCoupon((await getPool()).request(), validated.coupon).query(`
      INSERT INTO dbo.Coupons (Code, ProgramName, DiscountType, DiscountValue, StartsAt, EndsAt, Quantity, IsActive)
      OUTPUT INSERTED.Id AS id VALUES (@code, @programName, @discountType, @discountValue, @startsAt, @endsAt, @quantity, @isActive);
    `);
    res.status(201).json({ id: result.recordset[0].id, message: "Đã tạo mã giảm giá." });
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ error: "Mã giảm giá đã tồn tại." });
    console.error("Admin coupon create failed:", error.message);
    res.status(503).json({ error: "Không thể tạo mã giảm giá." });
  }
});

app.put("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã chương trình không hợp lệ." });
  const validated = validateCoupon(req.body);
  if (validated.error) return res.status(400).json({ error: validated.error });
  try {
    const pool = await getPool();
    const current = await pool.request().input("id", sql.Int, id).query(`SELECT UsedCount FROM dbo.Coupons WHERE Id = @id;`);
    if (!current.recordset.length) return res.status(404).json({ error: "Không tìm thấy mã giảm giá." });
    if (validated.coupon.quantity < current.recordset[0].UsedCount) return res.status(400).json({ error: "Số lượng không thể thấp hơn số mã đã được sử dụng." });
    const result = await bindCoupon(pool.request(), validated.coupon).input("id", sql.Int, id).query(`
      UPDATE dbo.Coupons SET Code = @code, ProgramName = @programName, DiscountType = @discountType,
        DiscountValue = @discountValue, StartsAt = @startsAt, EndsAt = @endsAt,
        Quantity = @quantity, IsActive = @isActive, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id;
      SELECT @@ROWCOUNT AS affected;
    `);
    if (!result.recordset[0]?.affected) return res.status(404).json({ error: "Không tìm thấy mã giảm giá." });
    res.json({ message: "Đã cập nhật chương trình giảm giá." });
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ error: "Mã giảm giá đã tồn tại." });
    if (error.number === 547) return res.status(409).json({ error: "Không thể giảm số lượng xuống thấp hơn số mã đã dùng." });
    console.error("Admin coupon update failed:", error.message);
    res.status(503).json({ error: "Không thể cập nhật mã giảm giá." });
  }
});

app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã chương trình không hợp lệ." });
  try {
    const result = await (await getPool()).request().input("id", sql.Int, id).query(`UPDATE dbo.Coupons SET IsActive = 0, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id AND IsActive = 1; SELECT @@ROWCOUNT AS affected;`);
    if (!result.recordset[0]?.affected) return res.status(404).json({ error: "Không tìm thấy chương trình đang hoạt động." });
    res.json({ message: "Đã tắt mã giảm giá." });
  } catch (error) {
    console.error("Admin coupon deactivation failed:", error.message);
    res.status(503).json({ error: "Không thể tắt mã giảm giá." });
  }
});

app.get("/api/admin/customers", requireAdmin, async (req, res) => {
  const page = Math.max(1, Math.min(Number.parseInt(req.query.page, 10) || 1, 100000));
  const pageSize = Math.max(1, Math.min(Number.parseInt(req.query.pageSize, 10) || 20, 100));
  const search = String(req.query.q || "").trim().slice(0, 200);
  const status = String(req.query.status || "all");
  if (!["all", "active", "locked"].includes(status)) return res.status(400).json({ error: "Trạng thái khách hàng không hợp lệ." });
  const clauses = [];
  if (search) clauses.push("(c.FullName LIKE @search ESCAPE '\\' OR c.Email LIKE @search ESCAPE '\\' OR c.Phone LIKE @search ESCAPE '\\')");
  if (status !== "all") clauses.push(`c.IsActive = ${status === "active" ? "1" : "0"}`);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  try {
    const pool = await getPool();
    const countRequest = pool.request();
    if (search) countRequest.input("search", sql.NVarChar(202), `%${search.replace(/[\\%_\[\]]/g, character => `\\${character}`)}%`);
    const count = await countRequest.query(`SELECT COUNT_BIG(1) AS total FROM dbo.Customers c ${where};`);
    const listRequest = pool.request();
    if (search) listRequest.input("search", sql.NVarChar(202), `%${search.replace(/[\\%_\[\]]/g, character => `\\${character}`)}%`);
    const result = await listRequest.input("offset", sql.Int, (page - 1) * pageSize).input("pageSize", sql.Int, pageSize).query(`
      SELECT c.Id AS id, c.FullName AS fullName, c.Email AS email, c.Phone AS phone,
        c.IsActive AS isActive, c.CreatedAt AS createdAt,
        (SELECT COUNT_BIG(1) FROM dbo.Orders o WHERE o.CustomerId = c.Id) AS orderCount
      FROM dbo.Customers c ${where}
      ORDER BY c.CreatedAt DESC, c.Id DESC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `);
    res.json({ customers: result.recordset, total: Number(count.recordset[0].total), page, pageSize });
  } catch (error) {
    console.error("Admin customer listing failed:", error.message);
    res.status(503).json({ error: "Không thể tải khách hàng từ SQL Server." });
  }
});

app.get("/api/admin/customers/:id", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã khách hàng không hợp lệ." });
  try {
    const pool = await getPool();
    const customerResult = await pool.request().input("id", sql.Int, id).query(`
      SELECT Id AS id, FullName AS fullName, Email AS email, Phone AS phone,
        IsActive AS isActive, CreatedAt AS createdAt
      FROM dbo.Customers WHERE Id = @id;
    `);
    if (!customerResult.recordset.length) return res.status(404).json({ error: "Không tìm thấy khách hàng." });
    const ordersResult = await pool.request().input("customerId", sql.Int, id).query(`
      SELECT TOP (100) OrderNumber AS orderNumber, CreatedAt AS createdAt, Total AS total,
        Status AS status, PaymentMethod AS paymentMethod
      FROM dbo.Orders WHERE CustomerId = @customerId ORDER BY CreatedAt DESC, Id DESC;
    `);
    res.json({ customer: customerResult.recordset[0], orders: ordersResult.recordset });
  } catch (error) {
    console.error("Admin customer detail failed:", error.message);
    res.status(503).json({ error: "Không thể tải thông tin khách hàng." });
  }
});

app.put("/api/admin/customers/:id/status", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const status = String(req.body?.status || "");
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã khách hàng không hợp lệ." });
  if (!["active", "locked"].includes(status)) return res.status(400).json({ error: "Trạng thái khách hàng không hợp lệ." });
  try {
    const result = await (await getPool()).request().input("id", sql.Int, id).input("isActive", sql.Bit, status === "active")
      .query(`UPDATE dbo.Customers SET IsActive = @isActive, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id; SELECT @@ROWCOUNT AS affected;`);
    if (!result.recordset[0]?.affected) return res.status(404).json({ error: "Không tìm thấy khách hàng." });
    res.json({ message: status === "active" ? "Đã mở khóa tài khoản khách hàng." : "Đã khóa tài khoản khách hàng." });
  } catch (error) {
    console.error("Admin customer status update failed:", error.message);
    res.status(503).json({ error: "Không thể cập nhật tài khoản khách hàng." });
  }
});

function validateEmployee(body) {
  const limits = { employeeCode: 30, fullName: 160, email: 254, phone: 24, position: 120 };
  const employee = {};
  for (const [key, max] of Object.entries(limits)) {
    employee[key] = String(body?.[key] || "").trim();
    if (!employee[key] || employee[key].length > max) return { error: `Trường ${key} không được trống và tối đa ${max} ký tự.` };
  }
  employee.email = employee.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) return { error: "Email nhân viên không hợp lệ." };
  employee.salary = Number(body.salary);
  if (!Number.isFinite(employee.salary) || employee.salary < 0 || employee.salary > 9999999999999999) return { error: "Mức lương không hợp lệ." };
  employee.hireDate = String(body.hireDate || "");
  const hireDate = /^\d{4}-\d{2}-\d{2}$/.test(employee.hireDate) ? new Date(`${employee.hireDate}T00:00:00Z`) : null;
  if (!hireDate || Number.isNaN(hireDate.getTime()) || hireDate.toISOString().slice(0, 10) !== employee.hireDate) return { error: "Ngày vào làm không hợp lệ." };
  employee.status = String(body.status || "");
  if (!["Đang làm việc", "Đã nghỉ việc"].includes(employee.status)) return { error: "Trạng thái nhân viên không hợp lệ." };
  return { employee };
}

function bindEmployee(request, employee) {
  return request
    .input("employeeCode", sql.NVarChar(30), employee.employeeCode)
    .input("fullName", sql.NVarChar(160), employee.fullName)
    .input("email", sql.NVarChar(254), employee.email)
    .input("phone", sql.NVarChar(24), employee.phone)
    .input("position", sql.NVarChar(120), employee.position)
    .input("salary", sql.Decimal(18, 2), employee.salary)
    .input("hireDate", sql.Date, new Date(`${employee.hireDate}T00:00:00.000Z`))
    .input("status", sql.NVarChar(30), employee.status);
}

app.get("/api/admin/employees", requireAdmin, async (req, res) => {
  const page = Math.max(1, Math.min(Number.parseInt(req.query.page, 10) || 1, 100000));
  const pageSize = Math.max(1, Math.min(Number.parseInt(req.query.pageSize, 10) || 20, 100));
  const search = String(req.query.q || "").trim().slice(0, 200);
  const status = String(req.query.status || "all");
  if (!["all", "Đang làm việc", "Đã nghỉ việc"].includes(status)) return res.status(400).json({ error: "Trạng thái nhân viên không hợp lệ." });
  const clauses = [];
  if (search) clauses.push("(EmployeeCode LIKE @search ESCAPE '\\' OR FullName LIKE @search ESCAPE '\\' OR Email LIKE @search ESCAPE '\\' OR Phone LIKE @search ESCAPE '\\' OR Position LIKE @search ESCAPE '\\')");
  if (status !== "all") clauses.push("Status = @status");
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  try {
    const pool = await getPool();
    const countRequest = pool.request();
    if (search) countRequest.input("search", sql.NVarChar(202), `%${search.replace(/[\\%_\[\]]/g, character => `\\${character}`)}%`);
    if (status !== "all") countRequest.input("status", sql.NVarChar(30), status);
    const count = await countRequest.query(`SELECT COUNT_BIG(1) AS total FROM dbo.Employees ${where};`);
    const listRequest = pool.request();
    if (search) listRequest.input("search", sql.NVarChar(202), `%${search.replace(/[\\%_\[\]]/g, character => `\\${character}`)}%`);
    if (status !== "all") listRequest.input("status", sql.NVarChar(30), status);
    const result = await listRequest.input("offset", sql.Int, (page - 1) * pageSize).input("pageSize", sql.Int, pageSize).query(`
      SELECT Id AS id, EmployeeCode AS employeeCode, FullName AS fullName, Email AS email,
        Phone AS phone, Position AS position, Salary AS salary, HireDate AS hireDate, Status AS status
      FROM dbo.Employees ${where}
      ORDER BY CASE WHEN Status = N'Đang làm việc' THEN 0 ELSE 1 END, FullName ASC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `);
    res.json({ employees: result.recordset, total: Number(count.recordset[0].total), page, pageSize });
  } catch (error) {
    console.error("Admin employee listing failed:", error.message);
    res.status(503).json({ error: "Không thể tải nhân viên từ SQL Server." });
  }
});

app.post("/api/admin/employees", requireAdmin, async (req, res) => {
  const validated = validateEmployee(req.body);
  if (validated.error) return res.status(400).json({ error: validated.error });
  try {
    const result = await bindEmployee((await getPool()).request(), validated.employee).query(`
      INSERT INTO dbo.Employees (EmployeeCode, FullName, Email, Phone, Position, Salary, HireDate, Status)
      OUTPUT INSERTED.Id AS id VALUES (@employeeCode, @fullName, @email, @phone, @position, @salary, @hireDate, @status);
    `);
    res.status(201).json({ id: result.recordset[0].id, message: "Đã thêm nhân viên." });
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ error: "Mã nhân viên hoặc email đã tồn tại." });
    console.error("Admin employee creation failed:", error.message);
    res.status(503).json({ error: "Không thể thêm nhân viên." });
  }
});

app.put("/api/admin/employees/:id", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã nhân viên không hợp lệ." });
  const validated = validateEmployee(req.body);
  if (validated.error) return res.status(400).json({ error: validated.error });
  try {
    const result = await bindEmployee((await getPool()).request(), validated.employee).input("id", sql.Int, id).query(`
      UPDATE dbo.Employees SET EmployeeCode = @employeeCode, FullName = @fullName, Email = @email,
        Phone = @phone, Position = @position, Salary = @salary, HireDate = @hireDate,
        Status = @status, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id;
      SELECT @@ROWCOUNT AS affected;
    `);
    if (!result.recordset[0]?.affected) return res.status(404).json({ error: "Không tìm thấy nhân viên." });
    res.json({ message: "Đã cập nhật thông tin nhân viên." });
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ error: "Mã nhân viên hoặc email đã tồn tại." });
    console.error("Admin employee update failed:", error.message);
    res.status(503).json({ error: "Không thể cập nhật nhân viên." });
  }
});

app.delete("/api/admin/employees/:id", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã nhân viên không hợp lệ." });
  try {
    const result = await (await getPool()).request().input("id", sql.Int, id).query(`DELETE FROM dbo.Employees WHERE Id = @id; SELECT @@ROWCOUNT AS affected;`);
    if (!result.recordset[0]?.affected) return res.status(404).json({ error: "Không tìm thấy nhân viên." });
    res.json({ message: "Đã xóa nhân viên." });
  } catch (error) {
    console.error("Admin employee deletion failed:", error.message);
    res.status(503).json({ error: "Không thể xóa nhân viên." });
  }
});

app.get("/api/categories", async (_req, res) => {
  try {
    const result = await (await getPool()).request().query(`SELECT CategoryName AS name FROM dbo.Categories ORDER BY CategoryName;`);
    res.json({ categories: result.recordset.map(row => row.name) });
  } catch (error) {
    console.error("Category list failed:", error.message);
    res.status(503).json({ error: "Không thể tải danh mục." });
  }
});

app.get("/api/admin/categories", requireAdmin, async (req, res) => {
  const search = String(req.query.q || "").trim().slice(0, 100);
  const where = search ? "WHERE c.CategoryName LIKE @search ESCAPE '\\'" : "";
  try {
    const request = (await getPool()).request();
    if (search) request.input("search", sql.NVarChar(102), `%${search.replace(/[\\%_\[\]]/g, character => `\\${character}`)}%`);
    const result = await request.query(`
      SELECT c.Id AS id, c.CategoryName AS name, COUNT(p.Id) AS productCount
      FROM dbo.Categories c LEFT JOIN dbo.Products p ON p.Category = c.CategoryName
      ${where} GROUP BY c.Id, c.CategoryName ORDER BY c.CategoryName;
    `);
    res.json({ categories: result.recordset });
  } catch (error) {
    console.error("Admin category listing failed:", error.message);
    res.status(503).json({ error: "Không thể tải danh mục." });
  }
});

app.post("/api/admin/categories", requireAdmin, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name || name.length > 100) return res.status(400).json({ error: "Tên danh mục không được trống và tối đa 100 ký tự." });
  try {
    const result = await (await getPool()).request().input("name", sql.NVarChar(100), name)
      .query(`INSERT INTO dbo.Categories (CategoryName) OUTPUT INSERTED.Id AS id, INSERTED.CategoryName AS name VALUES (@name);`);
    res.status(201).json({ category: result.recordset[0] });
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ error: "Tên danh mục đã tồn tại." });
    console.error("Admin category creation failed:", error.message);
    res.status(503).json({ error: "Không thể thêm danh mục." });
  }
});

app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const name = String(req.body?.name || "").trim();
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã danh mục không hợp lệ." });
  if (!name || name.length > 100) return res.status(400).json({ error: "Tên danh mục không được trống và tối đa 100 ký tự." });
  try {
    const result = await (await getPool()).request().input("id", sql.Int, id).input("name", sql.NVarChar(100), name)
      .query(`UPDATE dbo.Categories SET CategoryName = @name WHERE Id = @id; SELECT @@ROWCOUNT AS affected;`);
    if (!result.recordset[0]?.affected) return res.status(404).json({ error: "Không tìm thấy danh mục." });
    res.json({ message: "Đã cập nhật danh mục." });
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ error: "Tên danh mục đã tồn tại." });
    console.error("Admin category update failed:", error.message);
    res.status(503).json({ error: "Không thể cập nhật danh mục." });
  }
});

app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã danh mục không hợp lệ." });
  try {
    const result = await (await getPool()).request().input("id", sql.Int, id).query(`DELETE FROM dbo.Categories WHERE Id = @id; SELECT @@ROWCOUNT AS affected;`);
    if (!result.recordset[0]?.affected) return res.status(404).json({ error: "Không tìm thấy danh mục." });
    res.json({ message: "Đã xóa danh mục." });
  } catch (error) {
    if (error.number === 547) return res.status(409).json({ error: "Danh mục đang có sản phẩm. Hãy đổi danh mục của các sản phẩm trước khi xóa." });
    console.error("Admin category deletion failed:", error.message);
    res.status(503).json({ error: "Không thể xóa danh mục." });
  }
});

app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  const page = Math.max(1, Math.min(Number.parseInt(req.query.page, 10) || 1, 100000));
  const pageSize = Math.max(1, Math.min(Number.parseInt(req.query.pageSize, 10) || 20, 100));
  const search = String(req.query.q || "").trim().slice(0, 200);
  const status = String(req.query.status || "");
  if (status && !adminOrderStatuses.includes(status)) return res.status(400).json({ error: "Trạng thái đơn hàng không hợp lệ." });
  const clauses = [];
  if (search) clauses.push("(o.OrderNumber LIKE @search ESCAPE '\\' OR o.RecipientName LIKE @search ESCAPE '\\' OR o.Phone LIKE @search ESCAPE '\\')");
  if (status) clauses.push("o.Status = @status");
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  try {
    const pool = await getPool();
    const countRequest = pool.request();
    if (search) countRequest.input("search", sql.NVarChar(202), `%${search.replace(/[\\%_\[\]]/g, character => `\\${character}`)}%`);
    if (status) countRequest.input("status", sql.NVarChar(40), status);
    const count = await countRequest.query(`SELECT COUNT_BIG(1) AS total FROM dbo.Orders o ${where};`);
    const listRequest = pool.request();
    if (search) listRequest.input("search", sql.NVarChar(202), `%${search.replace(/[\\%_\[\]]/g, character => `\\${character}`)}%`);
    if (status) listRequest.input("status", sql.NVarChar(40), status);
    const result = await listRequest.input("offset", sql.Int, (page - 1) * pageSize).input("pageSize", sql.Int, pageSize).query(`
      SELECT o.Id AS id, o.OrderNumber AS orderNumber, o.RecipientName AS customerName, o.Phone AS phone,
        o.CreatedAt AS createdAt, o.Total AS total,
        CONCAT(o.AddressLine, N', ', o.Ward,
          CASE WHEN NULLIF(o.District, N'') IS NULL THEN N'' ELSE CONCAT(N', ', o.District) END,
          N', ', o.City) AS address,
        o.PaymentMethod AS paymentMethod, o.Status AS status
      FROM dbo.Orders o ${where}
      ORDER BY o.CreatedAt DESC, o.Id DESC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `);
    res.json({ orders: result.recordset, total: Number(count.recordset[0].total), page, pageSize });
  } catch (error) {
    console.error("Admin order listing failed:", error.message);
    res.status(503).json({ error: "Không thể tải đơn hàng từ SQL Server." });
  }
});

app.put("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const status = String(req.body?.status || "");
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã đơn hàng không hợp lệ." });
  if (!adminOrderStatuses.includes(status)) return res.status(400).json({ error: "Trạng thái đơn hàng không hợp lệ." });
  let transaction;
  try {
    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    const orderResult = await new sql.Request(transaction).input("id", sql.Int, id)
      .query(`SELECT Id, Status FROM dbo.Orders WITH (UPDLOCK, ROWLOCK) WHERE Id = @id;`);
    const order = orderResult.recordset[0];
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
    }
    if (order.Status === status) {
      await transaction.commit();
      return res.json({ message: "Trạng thái đơn hàng không thay đổi." });
    }
    const wasCancelled = order.Status === "Đã hủy";
    const isCancelled = status === "Đã hủy";
    if (!wasCancelled && isCancelled) {
      await new sql.Request(transaction).input("orderId", sql.Int, id).query(`
        UPDATE p SET Stock = p.Stock + i.Quantity,
          SoldCount = CASE WHEN p.SoldCount >= i.Quantity THEN p.SoldCount - i.Quantity ELSE 0 END
        FROM dbo.Products p JOIN dbo.OrderItems i ON i.ProductId = p.Id WHERE i.OrderId = @orderId;
      `);
      await new sql.Request(transaction).input("orderId", sql.Int, id).query(`
        UPDATE c SET UsedCount = CASE WHEN c.UsedCount > 0 THEN c.UsedCount - 1 ELSE 0 END,
          UpdatedAt = SYSUTCDATETIME()
        FROM dbo.Coupons c JOIN dbo.Orders o ON o.CouponId = c.Id WHERE o.Id = @orderId;
      `);
    } else if (wasCancelled && !isCancelled) {
      const shortage = await new sql.Request(transaction).input("orderId", sql.Int, id).query(`
        SELECT TOP (1) p.ProductName FROM dbo.OrderItems i
        JOIN dbo.Products p WITH (UPDLOCK, ROWLOCK) ON p.Id = i.ProductId
        WHERE i.OrderId = @orderId AND p.Stock < i.Quantity;
      `);
      if (shortage.recordset.length) {
        await transaction.rollback();
        return res.status(409).json({ error: `Không đủ tồn kho để khôi phục đơn hàng: ${shortage.recordset[0].ProductName}.` });
      }
      const couponCapacity = await new sql.Request(transaction).input("orderId", sql.Int, id).query(`
        SELECT c.Id FROM dbo.Coupons c JOIN dbo.Orders o ON o.CouponId = c.Id
        WHERE o.Id = @orderId AND c.UsedCount >= c.Quantity;
      `);
      if (couponCapacity.recordset.length) {
        await transaction.rollback();
        return res.status(409).json({ error: "Không thể khôi phục đơn: mã giảm giá đã hết hạn mức sử dụng." });
      }
      await new sql.Request(transaction).input("orderId", sql.Int, id).query(`
        UPDATE p SET Stock = p.Stock - i.Quantity, SoldCount = p.SoldCount + i.Quantity
        FROM dbo.Products p JOIN dbo.OrderItems i ON i.ProductId = p.Id WHERE i.OrderId = @orderId;
      `);
      await new sql.Request(transaction).input("orderId", sql.Int, id).query(`
        UPDATE c SET UsedCount = UsedCount + 1, UpdatedAt = SYSUTCDATETIME()
        FROM dbo.Coupons c JOIN dbo.Orders o ON o.CouponId = c.Id WHERE o.Id = @orderId;
      `);
    }
    await new sql.Request(transaction).input("id", sql.Int, id).input("status", sql.NVarChar(40), status)
      .query(`UPDATE dbo.Orders SET Status = @status WHERE Id = @id; INSERT INTO dbo.OrderStatusHistory (OrderId, Status, Note) VALUES (@id, @status, N'Admin cập nhật trạng thái đơn hàng.');`);
    await transaction.commit();
    res.json({ message: "Đã cập nhật trạng thái đơn hàng.", status });
  } catch (error) {
    if (transaction?._aborted !== true) await transaction?.rollback().catch(() => {});
    console.error("Admin order status update failed:", error.message);
    res.status(503).json({ error: "Không thể cập nhật trạng thái đơn hàng." });
  }
});

app.get("/api/admin/dashboard", requireAdmin, async (_req, res) => {
  try {
    const result = await (await getPool()).request().query(`
      DECLARE @employeeCount BIGINT = NULL;
      IF OBJECT_ID(N'dbo.Employees', N'U') IS NOT NULL
      BEGIN
        SET @employeeCount = 0;
        EXEC sys.sp_executesql N'SELECT @count = COUNT_BIG(1) FROM dbo.Employees WHERE Status = N''Đang làm việc''', N'@count BIGINT OUTPUT', @count = @employeeCount OUTPUT;
      END;
      SELECT
        (SELECT COUNT_BIG(1) FROM dbo.Products WHERE IsActive = 1) AS products,
        (SELECT COUNT_BIG(1) FROM dbo.Orders) AS orders,
        (SELECT COUNT_BIG(1) FROM dbo.Customers WHERE IsActive = 1) AS customers,
        @employeeCount AS employees,
        (SELECT COALESCE(SUM(Total), 0) FROM dbo.Orders WHERE Status <> N'Đã hủy') AS revenue;
    `);
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Admin dashboard query failed:", error.message);
    res.status(503).json({ error: "Không thể tải thống kê từ SQL Server." });
  }
});

app.get("/api/admin/statistics", requireAdmin, async (req, res) => {
  const year = Number.parseInt(req.query.year, 10) || new Date().getUTCFullYear();
  if (year < 2000 || year > 2200) return res.status(400).json({ error: "Năm thống kê không hợp lệ." });
  try {
    const pool = await getPool();
    const [summary, daily, monthly, yearly, bestSellers] = await Promise.all([
      pool.request().query(`
        SELECT
          (SELECT COUNT_BIG(1) FROM dbo.Products WHERE IsActive = 1) AS products,
          (SELECT COUNT_BIG(1) FROM dbo.Orders WHERE Status <> N'Đã hủy') AS orders,
          (SELECT COUNT_BIG(1) FROM dbo.Customers WHERE IsActive = 1) AS customers,
          (SELECT COALESCE(SUM(Total), 0) FROM dbo.Orders WHERE Status <> N'Đã hủy') AS revenue;
      `),
      pool.request().query(`
        SELECT CONVERT(date, CreatedAt) AS date, SUM(Total) AS revenue, COUNT_BIG(1) AS orders
        FROM dbo.Orders WHERE Status <> N'Đã hủy'
          AND CreatedAt >= DATEADD(day, -29, CONVERT(date, SYSUTCDATETIME()))
        GROUP BY CONVERT(date, CreatedAt) ORDER BY date;
      `),
      pool.request().input("year", sql.Int, year).query(`
        SELECT MONTH(CreatedAt) AS month, SUM(Total) AS revenue, COUNT_BIG(1) AS orders
        FROM dbo.Orders WHERE Status <> N'Đã hủy' AND YEAR(CreatedAt) = @year
        GROUP BY MONTH(CreatedAt) ORDER BY month;
      `),
      pool.request().query(`
        SELECT YEAR(CreatedAt) AS year, SUM(Total) AS revenue, COUNT_BIG(1) AS orders
        FROM dbo.Orders WHERE Status <> N'Đã hủy'
        GROUP BY YEAR(CreatedAt) ORDER BY year DESC;
      `),
      pool.request().query(`
        SELECT TOP (10) oi.ProductId AS productId, oi.Sku AS sku, oi.ProductName AS name,
          SUM(oi.Quantity) AS quantity, SUM(oi.Quantity * oi.UnitPrice) AS revenue
        FROM dbo.OrderItems oi JOIN dbo.Orders o ON o.Id = oi.OrderId
        WHERE o.Status <> N'Đã hủy'
        GROUP BY oi.ProductId, oi.Sku, oi.ProductName
        ORDER BY SUM(oi.Quantity) DESC, SUM(oi.Quantity * oi.UnitPrice) DESC;
      `)
    ]);
    res.json({
      year,
      summary: summary.recordset[0],
      daily: daily.recordset,
      monthly: monthly.recordset,
      yearly: yearly.recordset,
      bestSellers: bestSellers.recordset
    });
  } catch (error) {
    console.error("Admin statistics query failed:", error.message);
    res.status(503).json({ error: "Không thể tải thống kê từ SQL Server." });
  }
});

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  const page = Math.max(1, Math.min(Number.parseInt(req.query.page, 10) || 1, 100000));
  const pageSize = Math.max(1, Math.min(Number.parseInt(req.query.pageSize, 10) || 20, 100));
  const sortOptions = {
    newest: "CreatedAt DESC, Id DESC", "name-asc": "ProductName ASC", "name-desc": "ProductName DESC",
    "price-asc": "Price ASC", "price-desc": "Price DESC", "stock-asc": "Stock ASC", "stock-desc": "Stock DESC",
    "sku-asc": "Sku ASC", category: "Category ASC, ProductName ASC"
  };
  const sort = sortOptions[String(req.query.sort || "newest")] || sortOptions.newest;
  const clauses = [];
  const search = String(req.query.q || "").trim().slice(0, 200);
  if (search) {
    clauses.push("(Sku LIKE @search ESCAPE '\\' OR ProductName LIKE @search ESCAPE '\\' OR Category LIKE @search ESCAPE '\\' OR Brand LIKE @search ESCAPE '\\')");
  }
  if (["active", "inactive"].includes(req.query.status)) clauses.push(`IsActive = ${req.query.status === "active" ? "1" : "0"}`);
  const category = String(req.query.category || "").trim().slice(0, 100);
  if (category) clauses.push("Category = @category");
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  try {
    const pool = await getPool();
    const countRequest = pool.request();
    if (search) countRequest.input("search", sql.NVarChar(202), `%${search.replace(/[\\%_\[\]]/g, character => `\\${character}`)}%`);
    if (category) countRequest.input("category", sql.NVarChar(100), category);
    const count = await countRequest.query(`SELECT COUNT_BIG(1) AS total FROM dbo.Products ${where};`);
    const dataRequest = pool.request();
    if (search) dataRequest.input("search", sql.NVarChar(202), `%${search.replace(/[\\%_\[\]]/g, character => `\\${character}`)}%`);
    if (category) dataRequest.input("category", sql.NVarChar(100), category);
    const result = await dataRequest
      .input("offset", sql.Int, (page - 1) * pageSize)
      .input("pageSize", sql.Int, pageSize)
      .query(`
        SELECT Id AS id, Sku AS sku, ProductName AS name, Category AS category, MirrorType AS type,
          Brand AS brand, Shape AS shape, Material AS material, Size AS size, Finish AS color,
          Price AS price, OldPrice AS oldPrice, Stock AS stock, ImageUrl AS image,
          Description AS description, GalleryJson AS galleryJson, Space AS space, Badge AS badge,
          IsActive AS isActive, CreatedAt AS createdAt
        FROM dbo.Products ${where} ORDER BY ${sort} OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
      `);
    res.json({ items: result.recordset.map(mapProduct), total: Number(count.recordset[0].total), page, pageSize });
  } catch (error) {
    console.error("Admin product listing failed:", error.message);
    res.status(503).json({ error: "Không thể tải sản phẩm từ SQL Server." });
  }
});

function validateAdminProduct(body) {
  const fields = {
    sku: [40, "Mã sản phẩm"], name: [200, "Tên sản phẩm"], category: [100, "Danh mục"],
    type: [100, "Loại gương"], brand: [120, "Thương hiệu"], shape: [60, "Hình dáng"],
    material: [120, "Chất liệu"], size: [80, "Kích thước"], color: [120, "Màu sắc"],
    description: [1200, "Mô tả"]
  };
  const product = {};
  for (const [key, [max, label]] of Object.entries(fields)) {
    product[key] = String(body?.[key] || "").trim();
    if (!product[key] || product[key].length > max) return { error: `${label} không được để trống và tối đa ${max} ký tự.` };
  }
  product.price = Number(body.price);
  product.oldPrice = body.oldPrice === "" || body.oldPrice == null ? null : Number(body.oldPrice);
  product.stock = Number(body.stock);
  if (!Number.isFinite(product.price) || product.price < 0 || (product.oldPrice !== null && (!Number.isFinite(product.oldPrice) || product.oldPrice < 0))) return { error: "Giá sản phẩm không hợp lệ." };
  if (!Number.isInteger(product.stock) || product.stock < 0) return { error: "Số lượng phải là số nguyên không âm." };
  product.image = String(body.image || "").trim();
  if (product.image.length > 700 || !(/^(https?:\/\/|\/uploads\/products\/)[^\s]+$/i.test(product.image))) return { error: "Hình ảnh cần là URL HTTPS/HTTP hoặc ảnh đã tải lên." };
  product.status = body.status === "inactive" ? 0 : body.status === "active" ? 1 : null;
  if (product.status === null) return { error: "Trạng thái sản phẩm không hợp lệ." };
  product.space = String(body.space || "").trim().slice(0, 80) || "Nhiều không gian";
  product.badge = String(body.badge || "").trim().slice(0, 60) || null;
  const gallery = Array.isArray(body.gallery) ? body.gallery : [];
  product.gallery = [...new Set([product.image, ...gallery.map(item => String(item).trim()).filter(item => /^(https?:\/\/|\/uploads\/products\/)[^\s]+$/i.test(item))])].slice(0, 8);
  return { product };
}

function bindAdminProduct(request, product) {
  return request
    .input("sku", sql.NVarChar(40), product.sku)
    .input("name", sql.NVarChar(200), product.name)
    .input("category", sql.NVarChar(100), product.category)
    .input("type", sql.NVarChar(100), product.type)
    .input("brand", sql.NVarChar(120), product.brand)
    .input("shape", sql.NVarChar(60), product.shape)
    .input("material", sql.NVarChar(120), product.material)
    .input("size", sql.NVarChar(80), product.size)
    .input("color", sql.NVarChar(120), product.color)
    .input("price", sql.Decimal(18, 2), product.price)
    .input("oldPrice", sql.Decimal(18, 2), product.oldPrice)
    .input("stock", sql.Int, product.stock)
    .input("image", sql.NVarChar(700), product.image)
    .input("description", sql.NVarChar(1200), product.description)
    .input("space", sql.NVarChar(80), product.space)
    .input("badge", sql.NVarChar(60), product.badge)
    .input("gallery", sql.NVarChar(sql.MAX), JSON.stringify(product.gallery))
    .input("isActive", sql.Bit, product.status);
}

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const validated = validateAdminProduct(req.body);
  if (validated.error) return res.status(400).json({ error: validated.error });
  try {
    const result = await bindAdminProduct((await getPool()).request(), validated.product).query(`
      INSERT INTO dbo.Products (Sku, ProductName, Category, MirrorType, Brand, Shape, Material, Size, Finish, Price, OldPrice, Stock, ImageUrl, Description, Space, Badge, GalleryJson, IsActive)
      OUTPUT INSERTED.Id AS id VALUES (@sku, @name, @category, @type, @brand, @shape, @material, @size, @color, @price, @oldPrice, @stock, @image, @description, @space, @badge, @gallery, @isActive);
    `);
    res.status(201).json({ id: result.recordset[0].id, message: "Đã thêm sản phẩm." });
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ error: "Mã sản phẩm đã tồn tại." });
    console.error("Admin product creation failed:", error.message);
    res.status(503).json({ error: "Không thể thêm sản phẩm." });
  }
});

app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã sản phẩm không hợp lệ." });
  const validated = validateAdminProduct(req.body);
  if (validated.error) return res.status(400).json({ error: validated.error });
  try {
    const result = await bindAdminProduct((await getPool()).request(), validated.product).input("id", sql.Int, id).query(`
      UPDATE dbo.Products SET Sku = @sku, ProductName = @name, Category = @category, MirrorType = @type,
        Brand = @brand, Shape = @shape, Material = @material, Size = @size, Finish = @color,
        Price = @price, OldPrice = @oldPrice, Stock = @stock, ImageUrl = @image,
        Description = @description, Space = @space, Badge = @badge, GalleryJson = @gallery,
        IsActive = @isActive
      WHERE Id = @id;
      SELECT @@ROWCOUNT AS affected;
    `);
    if (!result.recordset[0]?.affected) return res.status(404).json({ error: "Không tìm thấy sản phẩm." });
    res.json({ message: "Đã cập nhật sản phẩm." });
  } catch (error) {
    if (error.number === 2601 || error.number === 2627) return res.status(409).json({ error: "Mã sản phẩm đã tồn tại." });
    console.error("Admin product update failed:", error.message);
    res.status(503).json({ error: "Không thể cập nhật sản phẩm." });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã sản phẩm không hợp lệ." });
  try {
    const result = await (await getPool()).request().input("id", sql.Int, id).query(`UPDATE dbo.Products SET IsActive = 0 WHERE Id = @id AND IsActive = 1; SELECT @@ROWCOUNT AS affected;`);
    if (!result.recordset[0]?.affected) return res.status(404).json({ error: "Không tìm thấy sản phẩm đang hoạt động." });
    res.json({ message: "Đã chuyển sản phẩm sang trạng thái ngừng kinh doanh." });
  } catch (error) {
    console.error("Admin product deletion failed:", error.message);
    res.status(503).json({ error: "Không thể xóa sản phẩm." });
  }
});

app.post("/api/admin/uploads", requireAdmin, (req, res, next) => {
  imageUpload.single("image")(req, res, error => {
    if (error) return res.status(400).json({ error: error.message || "Không thể tải hình ảnh." });
    next();
  });
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Chọn một hình ảnh để tải lên." });
  const signature = fs.readFileSync(req.file.path).subarray(0, 12);
  const validSignature = req.file.mimetype === "image/jpeg"
    ? signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
    : req.file.mimetype === "image/png"
      ? signature.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : signature.toString("ascii", 0, 4) === "RIFF" && signature.toString("ascii", 8, 12) === "WEBP";
  if (!validSignature) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Nội dung tệp không khớp với định dạng ảnh." });
  }
  res.status(201).json({ image: `/uploads/products/${req.file.filename}` });
});

app.get("/api/products", async (req, res) => {
  const page = Math.max(1, Math.min(Number.parseInt(req.query.page, 10) || 1, 100000));
  const pageSize = Math.max(1, Math.min(Number.parseInt(req.query.pageSize, 10) || 8, 50));
  const sort = sortExpressions[String(req.query.sort || "featured")] ? String(req.query.sort) : "featured";
  const filters = buildFilters(req.query);
  try {
    const pool = await getPool();
    const countRequest = filters.bind(pool.request());
    const countResult = await countRequest.query(`SELECT COUNT_BIG(1) AS total FROM dbo.Products p WHERE ${filters.where};`);
    const total = Number(countResult.recordset[0].total);
    const dataRequest = filters.bind(pool.request())
      .input("offset", sql.Int, (page - 1) * pageSize)
      .input("pageSize", sql.Int, pageSize);
    const result = await dataRequest.query(`
      SELECT p.Id AS id, p.Sku AS sku, p.ProductName AS name, p.Category AS category,
        p.MirrorType AS type, p.Brand AS brand, p.Description AS description,
        p.Shape AS shape, p.Space AS space, p.Material AS material,
        p.UseCase AS useCase, p.CleaningInstructions AS cleaningInstructions,
        p.WarrantyPolicy AS warrantyPolicy, p.GalleryJson AS galleryJson,
        p.Price AS price, p.OldPrice AS oldPrice,
        p.Rating AS rating, p.Stock AS stock, p.ImageUrl AS image, p.Size AS size,
        p.Finish AS color, p.Badge AS badge, p.CreatedAt AS createdAt, p.SoldCount AS soldCount
      FROM dbo.Products p
      WHERE ${filters.where}
      ORDER BY ${sortExpressions[sort]}
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `);
    res.json({ items: result.recordset.map(mapProduct), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error("Product query failed:", error.message);
    res.status(503).json({ error: "Không thể truy vấn SQL Server. Kiểm tra cấu hình kết nối và schema." });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Mã sản phẩm không hợp lệ." });
  try {
    const pool = await getPool();
    const result = await pool.request().input("id", sql.Int, id).query(`
      SELECT p.Id AS id, p.Sku AS sku, p.ProductName AS name, p.Category AS category,
        p.MirrorType AS type, p.Brand AS brand, p.Description AS description,
        p.Shape AS shape, p.Space AS space, p.Material AS material,
        p.UseCase AS useCase, p.CleaningInstructions AS cleaningInstructions,
        p.WarrantyPolicy AS warrantyPolicy, p.GalleryJson AS galleryJson,
        p.Price AS price, p.OldPrice AS oldPrice,
        p.Rating AS rating, p.Stock AS stock, p.ImageUrl AS image, p.Size AS size,
        p.Finish AS color, p.Badge AS badge, p.CreatedAt AS createdAt, p.SoldCount AS soldCount
      FROM dbo.Products p WHERE p.Id = @id AND p.IsActive = 1;
    `);
    if (!result.recordset.length) return res.status(404).json({ error: "Không tìm thấy sản phẩm." });
    res.json(mapProduct(result.recordset[0]));
  } catch (error) {
    console.error("Product lookup failed:", error.message);
    res.status(503).json({ error: "Không thể truy vấn SQL Server." });
  }
});

app.get("/admin", (_req, res) => res.sendFile(path.join(__dirname, "admin.html")));
app.use("/uploads/products", express.static(adminUploadDirectory, {
  dotfiles: "deny",
  index: false,
  setHeaders: res => res.setHeader("X-Content-Type-Options", "nosniff")
}));
app.use(express.static(path.join(__dirname)));
app.listen(port, () => console.log(`Atelier Gương đang chạy tại http://localhost:${port}`));