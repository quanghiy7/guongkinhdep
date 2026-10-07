IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Products (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Products PRIMARY KEY,
    Sku NVARCHAR(40) NOT NULL CONSTRAINT UQ_Products_Sku UNIQUE,
    ProductName NVARCHAR(200) NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    MirrorType NVARCHAR(100) NOT NULL,
    Brand NVARCHAR(120) NOT NULL,
    Description NVARCHAR(1200) NOT NULL,
    Material NVARCHAR(120) NOT NULL CONSTRAINT DF_Products_Material DEFAULT N'Kính cao cấp',
    UseCase NVARCHAR(500) NOT NULL CONSTRAINT DF_Products_UseCase DEFAULT N'Gương trang trí và soi hằng ngày.',
    CleaningInstructions NVARCHAR(500) NOT NULL CONSTRAINT DF_Products_Cleaning DEFAULT N'Lau bằng khăn mềm, sạch và khô.',
    WarrantyPolicy NVARCHAR(500) NOT NULL CONSTRAINT DF_Products_Warranty DEFAULT N'Bảo hành 24 tháng theo chính sách Atelier Gương.',
    GalleryJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Products_Gallery DEFAULT N'[]',
    Shape NVARCHAR(60) NOT NULL,
    Space NVARCHAR(80) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    OldPrice DECIMAL(18,2) NULL,
    Rating DECIMAL(2,1) NOT NULL CONSTRAINT DF_Products_Rating DEFAULT 5.0,
    Stock INT NOT NULL CONSTRAINT DF_Products_Stock DEFAULT 0,
    ImageUrl NVARCHAR(700) NOT NULL,
    Size NVARCHAR(80) NOT NULL,
    Finish NVARCHAR(120) NOT NULL,
    Badge NVARCHAR(60) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT SYSUTCDATETIME(),
    SoldCount INT NOT NULL CONSTRAINT DF_Products_SoldCount DEFAULT 0,
    IsFeatured BIT NOT NULL CONSTRAINT DF_Products_IsFeatured DEFAULT 0,
    IsActive BIT NOT NULL CONSTRAINT DF_Products_IsActive DEFAULT 1,
    CONSTRAINT CK_Products_Price CHECK (Price >= 0),
    CONSTRAINT CK_Products_Stock CHECK (Stock >= 0)
  );
END;
GO

IF COL_LENGTH(N'dbo.Products', N'Material') IS NULL
  ALTER TABLE dbo.Products ADD Material NVARCHAR(120) NOT NULL CONSTRAINT DF_Products_Material DEFAULT N'Kính cao cấp';
IF COL_LENGTH(N'dbo.Products', N'CreatedAt') IS NULL
  ALTER TABLE dbo.Products ADD CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT SYSUTCDATETIME();
IF COL_LENGTH(N'dbo.Products', N'SoldCount') IS NULL
  ALTER TABLE dbo.Products ADD SoldCount INT NOT NULL CONSTRAINT DF_Products_SoldCount DEFAULT 0;
IF COL_LENGTH(N'dbo.Products', N'UseCase') IS NULL
  ALTER TABLE dbo.Products ADD UseCase NVARCHAR(500) NOT NULL CONSTRAINT DF_Products_UseCase DEFAULT N'Gương trang trí và soi hằng ngày.';
IF COL_LENGTH(N'dbo.Products', N'CleaningInstructions') IS NULL
  ALTER TABLE dbo.Products ADD CleaningInstructions NVARCHAR(500) NOT NULL CONSTRAINT DF_Products_Cleaning DEFAULT N'Lau bằng khăn mềm, sạch và khô.';
IF COL_LENGTH(N'dbo.Products', N'WarrantyPolicy') IS NULL
  ALTER TABLE dbo.Products ADD WarrantyPolicy NVARCHAR(500) NOT NULL CONSTRAINT DF_Products_Warranty DEFAULT N'Bảo hành 24 tháng theo chính sách Atelier Gương.';
IF COL_LENGTH(N'dbo.Products', N'GalleryJson') IS NULL
  ALTER TABLE dbo.Products ADD GalleryJson NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Products_Gallery DEFAULT N'[]';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Products)
BEGIN
  INSERT INTO dbo.Products
    (Sku, ProductName, Category, MirrorType, Brand, Description, Shape, Space, Price, OldPrice, Rating, Stock, ImageUrl, Size, Finish, Badge, IsFeatured)
  VALUES
    (N'AG-0001', N'Gương Oval Luxury', N'Gương phòng khách', N'Gương treo tường', N'Atelier Gương', N'Gương oval cao cấp, kính Bỉ sáng rõ, khung champagne phù hợp phòng khách hiện đại.', N'Gương oval', N'Phòng khách', 1850000, 2200000, 4.9, 8, N'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=82', N'60 × 90 cm', N'Khung champagne', N'BÁN CHẠY', 1),
    (N'AG-0002', N'Gương Linea Bath', N'Gương phòng tắm', N'Gương treo tường', N'Atelier Gương', N'Gương chữ nhật chống ẩm cho phòng tắm, kính tráng bạc chống ố và khung nhôm bền bỉ.', N'Gương chữ nhật', N'Phòng tắm', 2650000, NULL, 4.7, 12, N'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=82', N'60 × 80 cm', N'Khung nhôm đen', N'CHỐNG ẨM', 1),
    (N'AG-0003', N'Gương Halo LED', N'Gương LED', N'Gương LED cảm ứng', N'Atelier Gương', N'Gương LED cảm ứng ánh sáng trung tính, tích hợp chống mờ cho phòng tắm và bàn trang điểm.', N'Gương tròn', N'Phòng tắm', 3890000, 4250000, 4.8, 6, N'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=82', N'Ø 70 cm', N'Đèn LED cảm ứng', N'ƯU ĐÃI', 1),
    (N'AG-0004', N'Gương Arc Vòm', N'Gương phòng ngủ', N'Gương treo tường', N'Atelier Gương', N'Gương vòm khung kim loại thanh mảnh tạo điểm nhấn nhẹ nhàng trong phòng ngủ.', N'Gương vòm', N'Phòng ngủ', 2190000, NULL, 4.8, 9, N'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=82', N'55 × 80 cm', N'Khung champagne', N'YÊU THÍCH', 1),
    (N'AG-0005', N'Gương Nord Full Length', N'Gương soi toàn thân', N'Gương đứng', N'Atelier Gương', N'Gương chữ nhật soi toàn thân, khung sồi tự nhiên, có thể tựa sàn hoặc treo tường.', N'Gương chữ nhật', N'Phòng ngủ', 4290000, NULL, 4.9, 5, N'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=900&q=82', N'55 × 160 cm', N'Khung sồi tự nhiên', N'BESTSELLER', 1),
    (N'AG-0006', N'Gương Milo Vanity', N'Gương trang điểm', N'Gương bàn', N'Atelier Gương', N'Gương vuông nhỏ gọn cho bàn trang điểm, viền đồng xước và chân đế vững chắc.', N'Gương vuông', N'Phòng trang điểm', 890000, NULL, 4.9, 15, N'https://images.unsplash.com/photo-1616486232519-ec5aaed8f9c7?auto=format&fit=crop&w=900&q=82', N'40 × 60 cm', N'Khung đồng xước', N'NHỎ XINH', 0),
    (N'AG-0007', N'Gương Sol Pleated', N'Gương nghệ thuật', N'Gương decor', N'Atelier Gương', N'Gương tròn nghệ thuật với đường viền gỗ sồi tạo hình thủ công, phù hợp phòng khách và sảnh.', N'Gương nghệ thuật', N'Sảnh', 3480000, NULL, 5.0, 4, N'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=82', N'Ø 70 cm', N'Khung gỗ sồi', N'THIẾT KẾ MỚI', 1),
    (N'AG-0008', N'Gương Cove Decor', N'Gương decor', N'Gương decor nội thất', N'Atelier Gương', N'Gương oval decor mài cạnh thủ công, tạo điểm nhấn cho phòng khách, phòng ngủ hoặc cửa hàng.', N'Gương oval', N'Cửa hàng', 1890000, NULL, 4.8, 10, N'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=82', N'45 × 65 cm', N'Mài cạnh bóng', N'FORM TỰ NHIÊN', 0),
    (N'AG-0009', N'Gương Atrium', N'Gương trang trí', N'Gương treo tường', N'Atelier Gương', N'Gương chữ nhật khổ lớn giúp mở rộng cảm giác không gian tại sảnh và cửa hàng.', N'Gương chữ nhật', N'Sảnh', 5150000, NULL, 4.8, 3, N'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=82', N'65 × 170 cm', N'Khung walnut', N'EDITION 01', 0),
    (N'AG-0010', N'Gương Atelier Round', N'Gương phòng khách', N'Gương decor', N'Atelier Gương', N'Gương tròn tối giản cho phòng khách và cửa hàng, kính trong và khung hoàn thiện thủ công.', N'Gương tròn', N'Cửa hàng', 1450000, NULL, 4.6, 7, N'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=82', N'60 × 60 cm', N'Khung đen mờ', N'ATELIER PICK', 0);
END;
GO

IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Categories (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Categories PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL CONSTRAINT UQ_Categories_CategoryName UNIQUE,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Categories_CreatedAt DEFAULT SYSUTCDATETIME()
  );
END;
GO

INSERT INTO dbo.Categories (CategoryName)
SELECT seedCategories.CategoryName
FROM (VALUES
  (N'Gương phòng tắm'), (N'Gương phòng khách'), (N'Gương phòng ngủ'), (N'Gương trang điểm'),
  (N'Gương soi toàn thân'), (N'Gương LED'), (N'Gương nghệ thuật'), (N'Gương decor')
) AS seedCategories(CategoryName)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Categories c WHERE c.CategoryName = seedCategories.CategoryName);

INSERT INTO dbo.Categories (CategoryName)
SELECT DISTINCT p.Category
FROM dbo.Products p
WHERE NOT EXISTS (SELECT 1 FROM dbo.Categories c WHERE c.CategoryName = p.Category);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Products_Categories' AND parent_object_id = OBJECT_ID(N'dbo.Products'))
  ALTER TABLE dbo.Products WITH CHECK ADD CONSTRAINT FK_Products_Categories
    FOREIGN KEY (Category) REFERENCES dbo.Categories(CategoryName) ON UPDATE CASCADE;
GO

UPDATE dbo.Products
SET SoldCount = CASE Sku
  WHEN N'AG-0001' THEN 128 WHEN N'AG-0002' THEN 49 WHEN N'AG-0003' THEN 86
  WHEN N'AG-0004' THEN 64 WHEN N'AG-0005' THEN 101 WHEN N'AG-0006' THEN 32
  WHEN N'AG-0007' THEN 55 WHEN N'AG-0008' THEN 25 WHEN N'AG-0009' THEN 19
  WHEN N'AG-0010' THEN 42 ELSE SoldCount END,
  CreatedAt = CASE Sku
    WHEN N'AG-0001' THEN '2024-03-10' WHEN N'AG-0002' THEN '2026-01-12'
    WHEN N'AG-0003' THEN '2026-06-08' WHEN N'AG-0004' THEN '2025-09-09'
    WHEN N'AG-0005' THEN '2025-12-11' WHEN N'AG-0006' THEN '2024-06-18'
    WHEN N'AG-0007' THEN '2026-04-15' WHEN N'AG-0008' THEN '2024-02-03'
    WHEN N'AG-0009' THEN '2026-09-05' WHEN N'AG-0010' THEN '2025-04-20'
    ELSE CreatedAt END
WHERE Sku IN (N'AG-0001', N'AG-0002', N'AG-0003', N'AG-0004', N'AG-0005', N'AG-0006', N'AG-0007', N'AG-0008', N'AG-0009', N'AG-0010')
  AND SoldCount = 0;
GO

UPDATE dbo.Products
SET GalleryJson = N'["https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=82","https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=82"]'
WHERE Sku = N'AG-0001' AND GalleryJson = N'[]';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_SearchFilters' AND object_id = OBJECT_ID(N'dbo.Products'))
  CREATE INDEX IX_Products_SearchFilters ON dbo.Products (IsActive, Category, Shape, Space, Price) INCLUDE (Sku, ProductName, MirrorType, Brand, Rating, Stock, IsFeatured);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_CreatedAt' AND object_id = OBJECT_ID(N'dbo.Products'))
  CREATE INDEX IX_Products_CreatedAt ON dbo.Products (IsActive, CreatedAt DESC) INCLUDE (ProductName, Price);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_SoldCount' AND object_id = OBJECT_ID(N'dbo.Products'))
  CREATE INDEX IX_Products_SoldCount ON dbo.Products (IsActive, SoldCount DESC) INCLUDE (ProductName, Price);
GO

IF OBJECT_ID(N'dbo.Customers', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Customers (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Customers PRIMARY KEY,
    FullName NVARCHAR(160) NOT NULL,
    Email NVARCHAR(254) NOT NULL,
    Phone NVARCHAR(24) NOT NULL,
    PasswordHash NVARCHAR(100) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Customers_IsActive DEFAULT 1,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Customers_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Customers_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Customers_Email UNIQUE (Email),
    CONSTRAINT UQ_Customers_Phone UNIQUE (Phone)
  );
END;
GO

IF OBJECT_ID(N'dbo.Employees', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Employees (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Employees PRIMARY KEY,
    EmployeeCode NVARCHAR(30) NOT NULL CONSTRAINT UQ_Employees_EmployeeCode UNIQUE,
    FullName NVARCHAR(160) NOT NULL,
    Email NVARCHAR(254) NOT NULL CONSTRAINT UQ_Employees_Email UNIQUE,
    Phone NVARCHAR(24) NOT NULL,
    Position NVARCHAR(120) NOT NULL,
    Salary DECIMAL(18,2) NOT NULL,
    HireDate DATE NOT NULL,
    Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Employees_Status DEFAULT N'Đang làm việc',
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Employees_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Employees_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Employees_Salary CHECK (Salary >= 0),
    CONSTRAINT CK_Employees_Status CHECK (Status IN (N'Đang làm việc', N'Đã nghỉ việc'))
  );
END;
GO

IF OBJECT_ID(N'dbo.CustomerAddresses', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.CustomerAddresses (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_CustomerAddresses PRIMARY KEY,
    CustomerId INT NOT NULL,
    Label NVARCHAR(60) NOT NULL CONSTRAINT DF_CustomerAddresses_Label DEFAULT N'Nhà riêng',
    RecipientName NVARCHAR(160) NOT NULL,
    Phone NVARCHAR(24) NOT NULL,
    AddressLine NVARCHAR(300) NOT NULL,
    City NVARCHAR(120) NOT NULL,
    District NVARCHAR(120) NOT NULL CONSTRAINT DF_CustomerAddresses_District DEFAULT N'',
    Ward NVARCHAR(120) NOT NULL CONSTRAINT DF_CustomerAddresses_Ward DEFAULT N'',
    IsDefault BIT NOT NULL CONSTRAINT DF_CustomerAddresses_IsDefault DEFAULT 0,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_CustomerAddresses_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_CustomerAddresses_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Customers(Id) ON DELETE CASCADE
  );
  CREATE INDEX IX_CustomerAddresses_CustomerId ON dbo.CustomerAddresses (CustomerId, IsDefault DESC, Id DESC);
END;
GO

IF COL_LENGTH(N'dbo.CustomerAddresses', N'District') IS NULL
  ALTER TABLE dbo.CustomerAddresses ADD District NVARCHAR(120) NOT NULL CONSTRAINT DF_CustomerAddresses_District DEFAULT N'';
IF COL_LENGTH(N'dbo.CustomerAddresses', N'Ward') IS NULL
  ALTER TABLE dbo.CustomerAddresses ADD Ward NVARCHAR(120) NOT NULL CONSTRAINT DF_CustomerAddresses_Ward DEFAULT N'';
GO

IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Orders (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Orders PRIMARY KEY,
    OrderNumber NVARCHAR(32) NOT NULL CONSTRAINT UQ_Orders_OrderNumber UNIQUE,
    CustomerId INT NOT NULL,
    RecipientName NVARCHAR(160) NOT NULL,
    Phone NVARCHAR(24) NOT NULL,
    Email NVARCHAR(254) NOT NULL,
    AddressLine NVARCHAR(300) NOT NULL,
    City NVARCHAR(120) NOT NULL,
    District NVARCHAR(120) NOT NULL CONSTRAINT DF_Orders_District DEFAULT N'',
    Ward NVARCHAR(120) NOT NULL CONSTRAINT DF_Orders_Ward DEFAULT N'',
    PaymentMethod NVARCHAR(24) NOT NULL,
    Note NVARCHAR(500) NULL,
    Subtotal DECIMAL(18,2) NOT NULL,
    Discount DECIMAL(18,2) NOT NULL,
    Shipping DECIMAL(18,2) NOT NULL,
    Total DECIMAL(18,2) NOT NULL,
    Status NVARCHAR(40) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT N'Chờ xác nhận',
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Orders_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Customers(Id),
    CONSTRAINT CK_Orders_Totals CHECK (Subtotal >= 0 AND Discount >= 0 AND Shipping >= 0 AND Total >= 0)
  );
  CREATE INDEX IX_Orders_CustomerId_CreatedAt ON dbo.Orders (CustomerId, CreatedAt DESC) INCLUDE (OrderNumber, Status, Total);
END;
GO

IF COL_LENGTH(N'dbo.Orders', N'District') IS NULL
  ALTER TABLE dbo.Orders ADD District NVARCHAR(120) NOT NULL CONSTRAINT DF_Orders_District DEFAULT N'';
IF COL_LENGTH(N'dbo.Orders', N'Ward') IS NULL
  ALTER TABLE dbo.Orders ADD Ward NVARCHAR(120) NOT NULL CONSTRAINT DF_Orders_Ward DEFAULT N'';
IF COL_LENGTH(N'dbo.Orders', N'CouponId') IS NULL
  ALTER TABLE dbo.Orders ADD CouponId INT NULL;
IF COL_LENGTH(N'dbo.Orders', N'CouponCode') IS NULL
  ALTER TABLE dbo.Orders ADD CouponCode NVARCHAR(40) NULL;
IF COL_LENGTH(N'dbo.Orders', N'CouponDiscount') IS NULL
  ALTER TABLE dbo.Orders ADD CouponDiscount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Orders_CouponDiscount DEFAULT 0;
IF OBJECT_ID(N'dbo.DF_Orders_Status', N'D') IS NOT NULL
  ALTER TABLE dbo.Orders DROP CONSTRAINT DF_Orders_Status;
ALTER TABLE dbo.Orders ADD CONSTRAINT DF_Orders_Status DEFAULT N'Chờ xác nhận' FOR Status;
GO

IF OBJECT_ID(N'dbo.Coupons', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Coupons (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Coupons PRIMARY KEY,
    Code NVARCHAR(40) NOT NULL CONSTRAINT UQ_Coupons_Code UNIQUE,
    ProgramName NVARCHAR(160) NOT NULL,
    DiscountType NVARCHAR(20) NOT NULL,
    DiscountValue DECIMAL(18,2) NOT NULL,
    StartsAt DATE NOT NULL,
    EndsAt DATE NOT NULL,
    Quantity INT NOT NULL,
    UsedCount INT NOT NULL CONSTRAINT DF_Coupons_UsedCount DEFAULT 0,
    IsActive BIT NOT NULL CONSTRAINT DF_Coupons_IsActive DEFAULT 1,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Coupons_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Coupons_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Coupons_DiscountType CHECK (DiscountType IN (N'percent', N'fixed')),
    CONSTRAINT CK_Coupons_DiscountValue CHECK (DiscountValue > 0 AND (DiscountType <> N'percent' OR DiscountValue <= 100)),
    CONSTRAINT CK_Coupons_Dates CHECK (EndsAt >= StartsAt),
    CONSTRAINT CK_Coupons_Quantity CHECK (Quantity > 0 AND UsedCount >= 0),
    CONSTRAINT CK_Coupons_UsageLimit CHECK (UsedCount <= Quantity)
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Coupons_UsageLimit' AND parent_object_id = OBJECT_ID(N'dbo.Coupons'))
  ALTER TABLE dbo.Coupons WITH CHECK ADD CONSTRAINT CK_Coupons_UsageLimit CHECK (UsedCount <= Quantity);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Orders_Coupons' AND parent_object_id = OBJECT_ID(N'dbo.Orders'))
  ALTER TABLE dbo.Orders WITH CHECK ADD CONSTRAINT FK_Orders_Coupons FOREIGN KEY (CouponId) REFERENCES dbo.Coupons(Id);
GO

IF OBJECT_ID(N'dbo.OrderItems', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.OrderItems (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_OrderItems PRIMARY KEY,
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    Sku NVARCHAR(40) NOT NULL,
    ProductName NVARCHAR(200) NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    OriginalUnitPrice DECIMAL(18,2) NOT NULL,
    Quantity INT NOT NULL,
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id),
    CONSTRAINT CK_OrderItems_Quantity CHECK (Quantity > 0)
  );
  CREATE INDEX IX_OrderItems_OrderId ON dbo.OrderItems (OrderId);
END;
GO

IF EXISTS (SELECT 1 FROM dbo.Orders WHERE Status = N'Mới đặt')
  UPDATE dbo.Orders SET Status = N'Chờ xác nhận' WHERE Status = N'Mới đặt';
GO

IF OBJECT_ID(N'dbo.OrderStatusHistory', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.OrderStatusHistory (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_OrderStatusHistory PRIMARY KEY,
    OrderId INT NOT NULL,
    Status NVARCHAR(40) NOT NULL,
    Note NVARCHAR(300) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_OrderStatusHistory_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_OrderStatusHistory_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE
  );
  CREATE INDEX IX_OrderStatusHistory_OrderId ON dbo.OrderStatusHistory (OrderId, CreatedAt, Id);
END;
GO

INSERT INTO dbo.OrderStatusHistory (OrderId, Status, Note, CreatedAt)
SELECT o.Id, o.Status, N'Trạng thái đơn hàng', o.CreatedAt
FROM dbo.Orders o
WHERE NOT EXISTS (SELECT 1 FROM dbo.OrderStatusHistory h WHERE h.OrderId = o.Id);
GO

UPDATE dbo.Orders SET Status = N'Đang chuẩn bị' WHERE Status = N'Đang chuẩn bị hàng';
UPDATE dbo.OrderStatusHistory SET Status = N'Đang chuẩn bị' WHERE Status = N'Đang chuẩn bị hàng';
GO

IF OBJECT_ID(N'dbo.Reviews', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Reviews (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Reviews PRIMARY KEY,
    OrderItemId INT NOT NULL CONSTRAINT UQ_Reviews_OrderItem UNIQUE,
    CustomerId INT NOT NULL,
    ProductId INT NOT NULL,
    Rating TINYINT NOT NULL,
    Comment NVARCHAR(1000) NOT NULL,
    IsVisible BIT NOT NULL CONSTRAINT DF_Reviews_IsVisible DEFAULT 1,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Reviews_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Reviews_OrderItems FOREIGN KEY (OrderItemId) REFERENCES dbo.OrderItems(Id),
    CONSTRAINT FK_Reviews_Customers FOREIGN KEY (CustomerId) REFERENCES dbo.Customers(Id),
    CONSTRAINT FK_Reviews_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id),
    CONSTRAINT CK_Reviews_Rating CHECK (Rating BETWEEN 1 AND 5)
  );
  CREATE INDEX IX_Reviews_ProductId_Visible ON dbo.Reviews (ProductId, IsVisible, CreatedAt DESC);
END;
GO