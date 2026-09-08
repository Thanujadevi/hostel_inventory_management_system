-- MySQL Database Schema for Hostel Inventory Management System

CREATE DATABASE IF NOT EXISTS hostel_inventory_db;
USE hostel_inventory_db;

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS tbl_Admin (
  int_Admin_Id INT AUTO_INCREMENT PRIMARY KEY,
  txt_Admin_Code VARCHAR(20) UNIQUE NOT NULL,
  txt_Admin_Name VARCHAR(100) NOT NULL,
  txt_Email VARCHAR(100) UNIQUE NOT NULL,
  txt_Password VARCHAR(255) NOT NULL,
  txt_Role VARCHAR(50) DEFAULT 'Chief Warden / Admin',
  txt_Active CHAR(1) DEFAULT 'Y',
  dte_Created_Date DATE,
  txt_Created_By VARCHAR(50),
  dte_Updated_Date DATE,
  txt_Updated_By VARCHAR(50)
);

-- Seed Default Admin
INSERT IGNORE INTO tbl_Admin 
(int_Admin_Id, txt_Admin_Code, txt_Admin_Name, txt_Email, txt_Password, txt_Role, txt_Active, dte_Created_Date, txt_Created_By) 
VALUES 
(1, 'ADM001', 'Chief Warden / Admin', '24104063@nec.edu.in', 'admin', 'Chief Warden / Admin', 'Y', CURDATE(), 'System');


-- 2. Store Table
CREATE TABLE IF NOT EXISTS tbl_Store (
  int_Store_Id INT AUTO_INCREMENT PRIMARY KEY,
  txt_Store_Code VARCHAR(20) UNIQUE NOT NULL,
  txt_Store_Name VARCHAR(100) NOT NULL,
  txt_Campus VARCHAR(100),
  txt_Incharge VARCHAR(100),
  txt_Email VARCHAR(100),
  txt_Phone VARCHAR(20),
  txt_Username VARCHAR(50) UNIQUE NOT NULL,
  txt_Password VARCHAR(255) NOT NULL,
  txt_Active CHAR(1) DEFAULT 'Y',
  dte_Created_Date DATE,
  txt_Created_By VARCHAR(50),
  dte_Updated_Date DATE,
  txt_Updated_By VARCHAR(50)
);

-- Seed Initial Stores
INSERT IGNORE INTO tbl_Store 
(int_Store_Id, txt_Store_Code, txt_Store_Name, txt_Campus, txt_Incharge, txt_Email, txt_Phone, txt_Username, txt_Password, txt_Active, dte_Created_Date, txt_Created_By)
VALUES 
(1, 'STR-2026-001', 'Boys Hostel Store', 'Boys Hostel', 'John', 'store001@hostel.edu', '9876543210', 'str-2026-001', 'storepassword', 'Y', CURDATE(), 'System'),
(2, 'STR-2026-002', 'Girls Hostel Store', 'Girls Hostel', 'Alice', 'store002@hostel.edu', '9876543211', 'str-2026-002', 'storepassword', 'Y', CURDATE(), 'System'),
(3, 'STR-2026-003', 'Subash Hostel Store', 'West Campus - Block A', 'David Raj', 'store003@hostel.edu', '9876543212', 'str-2026-003', 'storepassword', 'Y', CURDATE(), 'System'),
(4, 'STR-2026-004', 'Bharathi Hostel Store', 'East Campus - Block B', 'Saravanan M', 'store004@hostel.edu', '9876543213', 'str-2026-004', 'storepassword', 'Y', CURDATE(), 'System'),
(5, 'STR-2026-005', 'Vivekanandar Hostel Store', 'Main Campus - Block C', 'Anitha K', 'store005@hostel.edu', '9876543214', 'str-2026-005', 'storepassword', 'Y', CURDATE(), 'System'),
(6, 'STR-2026-006', 'Kalam Hostel Store', 'Science Block Campus', 'Vigneshwaran R', 'store006@hostel.edu', '9876543215', 'str-2026-006', 'storepassword', 'Y', CURDATE(), 'System'),
(7, 'STR-2026-007', 'Ramanujan Hostel Store', 'Engineering Wing Campus', 'Meenakshi S', 'store007@hostel.edu', '9876543216', 'str-2026-007', 'storepassword', 'Y', CURDATE(), 'System'),
(8, 'STR-2026-008', 'Mother Teresa Hostel Store', 'Ladies Hostel Block 2', 'Soundarya P', 'store008@hostel.edu', '9876543217', 'str-2026-008', 'storepassword', 'Y', CURDATE(), 'System'),
(9, 'STR-2026-009', 'PG & Research Scholars Store', 'PG Block Campus', 'Murugan T', 'store009@hostel.edu', '9876543218', 'str-2026-009', 'storepassword', 'Y', CURDATE(), 'System'),
(10, 'STR-2026-010', 'International Students Store', 'Global Block Campus', 'Radhika N', 'store010@hostel.edu', '9876543219', 'str-2026-010', 'storepassword', 'Y', CURDATE(), 'System');


-- 3. Supplier Table
CREATE TABLE IF NOT EXISTS tbl_Supplier (
  int_Supplier_Id INT AUTO_INCREMENT PRIMARY KEY,
  txt_Supplier_Code VARCHAR(20) UNIQUE NOT NULL,
  txt_Supplier_Name VARCHAR(100) NOT NULL,
  txt_Contact_Person VARCHAR(100),
  txt_Email VARCHAR(100) UNIQUE NOT NULL,
  txt_Phone VARCHAR(20),
  txt_GSTIN VARCHAR(50),
  txt_Address TEXT,
  txt_City VARCHAR(50),
  txt_State VARCHAR(50),
  txt_Pincode VARCHAR(20),
  txt_Country VARCHAR(50) DEFAULT 'India',
  txt_Bank_Name VARCHAR(100),
  txt_Account_No VARCHAR(50),
  txt_IFSC VARCHAR(20),
  dbl_Rating DECIMAL(3,2) DEFAULT 0.00,
  txt_Password VARCHAR(255) DEFAULT 'supplier123',
  txt_Active CHAR(1) DEFAULT 'Y',
  txt_Profile_Completed CHAR(1) DEFAULT 'Y',
  dte_Created_Date DATE,
  txt_Created_By VARCHAR(50),
  dte_Updated_Date DATE,
  txt_Updated_By VARCHAR(50)
);

-- Seed Initial Suppliers
INSERT IGNORE INTO tbl_Supplier
(int_Supplier_Id, txt_Supplier_Code, txt_Supplier_Name, txt_Contact_Person, txt_Email, txt_Phone, txt_GSTIN, txt_Address, txt_City, txt_State, txt_Pincode, txt_Country, dbl_Rating, txt_Password, txt_Active, txt_Profile_Completed, dte_Created_Date, txt_Created_By)
VALUES
(1, 'SUP-001', 'Apex Traders', 'Ramesh Patel', 'apex@traders.com', '9988776655', '33AAACA1234A1Z5', '12 Industrial Area', 'Chennai', 'Tamil Nadu', '600001', 'India', 0.00, 'supplier123', 'Y', 'Y', CURDATE(), 'System'),
(2, 'SUP-002', 'Global Supplies', 'Anita Roy', 'global@supplies.com', '9876501234', '33BBBCA5678B1Z2', '45 Commercial Complex', 'Coimbatore', 'Tamil Nadu', '641001', 'India', 0.00, 'supplier123', 'Y', 'Y', CURDATE(), 'System');


-- 4. Category Table
CREATE TABLE IF NOT EXISTS tbl_Category (
  int_Category_Id INT AUTO_INCREMENT PRIMARY KEY,
  txt_Category_Code VARCHAR(20) UNIQUE NOT NULL,
  txt_Category_Name VARCHAR(100) NOT NULL,
  txt_Description TEXT,
  txt_status VARCHAR(20) DEFAULT 'Active',
  dte_Created_Date DATE,
  txt_Created_By VARCHAR(50),
  dte_Updated_Date DATE,
  txt_Updated_By VARCHAR(50)
);

-- Seed Categories
INSERT IGNORE INTO tbl_Category
(int_Category_Id, txt_Category_Code, txt_Category_Name, txt_Description, txt_status, dte_Created_Date, txt_Created_By)
VALUES
(1, 'CAT-2026-001', 'Room & Furniture', 'Chairs, tables, mattresses and bedframes', 'Active', CURDATE(), 'System'),
(2, 'CAT-2026-003', 'Bathroom Supplies', 'Detergents, brooms, disinfectants and cleaning tools', 'Active', CURDATE(), 'System'),
(3, 'CAT-2026-004', 'Kitchen & Dining', 'Groceries, oils, rice, cooking utensils and dining tools', 'Active', CURDATE(), 'System'),
(4, 'CAT-2026-005', 'Stationery & Office', 'Registers, pens, papers and office supplies', 'Active', CURDATE(), 'System'),
(5, 'CAT-2026-006', 'Electricals', 'Bulbs, switches, wires and extension boards', 'Active', CURDATE(), 'System'),
(6, 'CAT-2026-007', 'Medical & First Aid', 'Emergency medicines, band-aids, antiseptics, and health kits', 'Active', CURDATE(), 'System'),
(7, 'CAT-2026-008', 'Sports & Recreation', 'Badminton racquets, volleyballs, carrom boards, and sports gear', 'Active', CURDATE(), 'System'),
(8, 'CAT-2026-009', 'Plumbing & Hardware', 'Water pipes, taps, valves, sealant tapes, and plumbing fittings', 'Active', CURDATE(), 'System'),
(9, 'CAT-2026-010', 'Laundry & Linen', 'Washing powder, bedsheets, pillow covers, and towels', 'Active', CURDATE(), 'System'),
(10, 'CAT-2026-011', 'Safety & Security', 'Fire extinguishers, padlocks, CCTV cables, and security gear', 'Active', CURDATE(), 'System');


-- 5. Item Table
CREATE TABLE IF NOT EXISTS tbl_Item (
  int_Item_Id INT AUTO_INCREMENT PRIMARY KEY,
  txt_Item_Code VARCHAR(20) UNIQUE NOT NULL,
  txt_Item_Name VARCHAR(100) NOT NULL,
  int_Category_Id INT,
  txt_Unit VARCHAR(20) DEFAULT 'Pcs',
  int_Min_Stock INT DEFAULT 10,
  int_Current_Stock INT DEFAULT 0,
  dbl_Unit_Price DECIMAL(10,2) DEFAULT 0.00,
  txt_Status VARCHAR(20) DEFAULT 'Active',
  dte_Created_Date DATE,
  txt_Created_By VARCHAR(50),
  dte_Updated_Date DATE,
  txt_Updated_By VARCHAR(50),
  FOREIGN KEY (int_Category_Id) REFERENCES tbl_Category(int_Category_Id) ON DELETE SET NULL
);

-- Seed Items
INSERT IGNORE INTO tbl_Item
(int_Item_Id, txt_Item_Code, txt_Item_Name, int_Category_Id, txt_Unit, int_Min_Stock, int_Current_Stock, dbl_Unit_Price, txt_Status, dte_Created_Date, txt_Created_By)
VALUES
(1, 'ITM-2026-001', 'Basmati Rice 25kg Bag', 3, 'Kg', 10, 250, 85.00, 'Active', CURDATE(), 'System'),
(2, 'ITM-2026-002', 'Cooking Oil', 3, 'Litre', 10, 100, 150.00, 'Active', CURDATE(), 'System'),
(3, 'ITM-2026-003', 'Mattress', 1, 'Nos', 10, 5, 3500.00, 'Active', CURDATE(), 'System'),
(4, 'ITM-2026-004', 'Floor Cleaner', 2, 'Litre', 10, 50, 180.00, 'Active', CURDATE(), 'System'),
(5, 'ITM-2026-005', 'Wire', 5, 'Rolls', 10, 10, 50.00, 'Active', CURDATE(), 'System'),
(6, 'ITM-2026-006', 'First Aid Kit Complete', 6, 'Set', 5, 15, 650.00, 'Active', CURDATE(), 'System'),
(7, 'ITM-2026-007', 'Volleyball Tournament Leather', 7, 'Nos', 5, 8, 950.00, 'Active', CURDATE(), 'System'),
(8, 'ITM-2026-008', 'Brass Tap 1/2 Inch', 8, 'Pcs', 10, 30, 240.00, 'Active', CURDATE(), 'System'),
(9, 'ITM-2026-009', 'Cotton Bedsheet Double', 9, 'Pcs', 15, 45, 480.00, 'Active', CURDATE(), 'System'),
(10, 'ITM-2026-010', 'Heavy Duty Brass Padlock 50mm', 10, 'Pcs', 10, 25, 320.00, 'Active', CURDATE(), 'System');


-- 6. Store Stock (Per-store stock levels)
CREATE TABLE IF NOT EXISTS tbl_Store_Stock (
  int_Stock_Id INT AUTO_INCREMENT PRIMARY KEY,
  int_Store_Id INT NOT NULL,
  int_Item_Id INT NOT NULL,
  int_Current_Stock INT DEFAULT 0,
  int_Min_Stock INT DEFAULT 10,
  UNIQUE KEY unique_store_item (int_Store_Id, int_Item_Id),
  FOREIGN KEY (int_Store_Id) REFERENCES tbl_Store(int_Store_Id) ON DELETE CASCADE,
  FOREIGN KEY (int_Item_Id) REFERENCES tbl_Item(int_Item_Id) ON DELETE CASCADE
);

INSERT IGNORE INTO tbl_Store_Stock (int_Store_Id, int_Item_Id, int_Current_Stock, int_Min_Stock)
VALUES 
(1, 1, 15, 5),
(1, 2, 30, 20),
(1, 3, 5, 10),
(2, 1, 10, 5),
(2, 2, 20, 20);


-- 7. Inventory Request Table (Requisitions raised by Stores)
CREATE TABLE IF NOT EXISTS tbl_Inventory_Request (
  int_Request_Id INT AUTO_INCREMENT PRIMARY KEY,
  txt_Request_Code VARCHAR(20) UNIQUE NOT NULL,
  int_Store_Id INT NOT NULL,
  dec_Budget DECIMAL(12,2) DEFAULT 0.00,
  txt_Month VARCHAR(20) DEFAULT 'August',
  int_Year INT DEFAULT 2026,
  txt_Priority VARCHAR(20) DEFAULT 'Medium',
  txt_Status VARCHAR(40) DEFAULT 'Pending Approval',
  txt_Remarks TEXT,
  dte_Request_Date DATE,
  dte_Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
  txt_Created_By VARCHAR(50) DEFAULT 'System',
  dte_Updated_Date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  txt_Updated_By VARCHAR(50) DEFAULT 'System',
  FOREIGN KEY (int_Store_Id) REFERENCES tbl_Store(int_Store_Id)
);


-- 8. Request Item Table (Line Items for Inventory Requests)
CREATE TABLE IF NOT EXISTS tbl_Request_Item (
  int_Req_Item_Id INT AUTO_INCREMENT PRIMARY KEY,
  int_Request_Id INT NOT NULL,
  int_Item_Id INT NOT NULL,
  int_Quantity INT NOT NULL,
  FOREIGN KEY (int_Request_Id) REFERENCES tbl_Inventory_Request(int_Request_Id) ON DELETE CASCADE,
  FOREIGN KEY (int_Item_Id) REFERENCES tbl_Item(int_Item_Id)
);


-- 9. Quotation Table (Quotations submitted by Suppliers)
CREATE TABLE IF NOT EXISTS tbl_Quotation (
  int_Quotation_Id INT AUTO_INCREMENT PRIMARY KEY,
  txt_Quotation_Code VARCHAR(20) UNIQUE NOT NULL,
  int_Request_Id INT NOT NULL,
  int_Supplier_Id INT NOT NULL,
  dbl_Total_Amount DECIMAL(12,2) DEFAULT 0.00,
  txt_Status VARCHAR(30) DEFAULT 'Submitted',
  txt_Delivery_Days VARCHAR(30),
  txt_Payment_Terms VARCHAR(100),
  dte_Submitted_Date DATE,
  FOREIGN KEY (int_Request_Id) REFERENCES tbl_Inventory_Request(int_Request_Id),
  FOREIGN KEY (int_Supplier_Id) REFERENCES tbl_Supplier(int_Supplier_Id)
);


-- 10. Quotation Line Items
CREATE TABLE IF NOT EXISTS tbl_Quotation_Item (
  int_Quo_Item_Id INT AUTO_INCREMENT PRIMARY KEY,
  int_Quotation_Id INT NOT NULL,
  int_Item_Id INT NOT NULL,
  int_Quantity INT NOT NULL,
  dbl_Unit_Price DECIMAL(10,2) NOT NULL,
  dbl_Total_Price DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (int_Quotation_Id) REFERENCES tbl_Quotation(int_Quotation_Id) ON DELETE CASCADE,
  FOREIGN KEY (int_Item_Id) REFERENCES tbl_Item(int_Item_Id)
);


-- 11. Purchase Order Table
CREATE TABLE IF NOT EXISTS tbl_Purchase (
  int_Purchase_Id INT AUTO_INCREMENT PRIMARY KEY,
  txt_PO_Code VARCHAR(20) UNIQUE NOT NULL,
  int_Quotation_Id INT,
  int_Request_Id INT,
  int_Supplier_Id INT NOT NULL,
  int_Store_Id INT NOT NULL,
  dbl_Total_Amount DECIMAL(12,2) NOT NULL,
  txt_Status VARCHAR(30) DEFAULT 'PO Issued',
  dte_PO_Date DATE,
  FOREIGN KEY (int_Supplier_Id) REFERENCES tbl_Supplier(int_Supplier_Id),
  FOREIGN KEY (int_Store_Id) REFERENCES tbl_Store(int_Store_Id)
);


-- 12. Payment Table
CREATE TABLE IF NOT EXISTS tbl_Payment (
  int_Payment_Id INT AUTO_INCREMENT PRIMARY KEY,
  txt_Payment_Code VARCHAR(20) UNIQUE NOT NULL,
  int_Purchase_Id INT NOT NULL,
  dbl_Amount DECIMAL(12,2) NOT NULL,
  txt_Payment_Mode VARCHAR(50),
  txt_Transaction_Ref VARCHAR(100),
  txt_Status VARCHAR(30) DEFAULT 'Completed',
  dte_Payment_Date DATE,
  FOREIGN KEY (int_Purchase_Id) REFERENCES tbl_Purchase(int_Purchase_Id)
);


-- 13. Requirement Period Settings Table
CREATE TABLE IF NOT EXISTS tbl_Requirement_Period (
  int_Period_Id INT AUTO_INCREMENT PRIMARY KEY,
  txt_Status VARCHAR(20) DEFAULT 'OPEN',
  dte_Start_Date DATE,
  dte_Deadline DATE,
  txt_Remarks TEXT,
  dte_Updated_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

