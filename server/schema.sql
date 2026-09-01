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
(1, 'STR-001', 'Boys Hostel Main Store', 'North Campus', 'Rajesh Kumar', 'store1@hostel.edu', '9876543210', 'str-001', 'storepassword', 'Y', CURDATE(), 'System'),
(2, 'STR-002', 'Girls Hostel Store', 'South Campus', 'Priya Sharma', 'store2@hostel.edu', '9876543211', 'str-002', 'storepassword', 'Y', CURDATE(), 'System');


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
(1, 'CAT-001', 'Cleaning Supplies', 'Detergents, brooms, disinfectants and cleaning tools', 'Active', CURDATE(), 'System'),
(2, 'CAT-002', 'Electrical Items', 'Bulbs, switches, wires and extension boards', 'Active', CURDATE(), 'System'),
(3, 'CAT-003', 'Furniture & Fittings', 'Chairs, tables, mattresses and bedframes', 'Active', CURDATE(), 'System');


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
(1, 'ITM-001', 'Floor Cleaner 5L', 1, 'Cans', 5, 25, 450.00, 'Active', CURDATE(), 'System'),
(2, 'ITM-002', 'LED Tube Light 20W', 2, 'Pcs', 20, 50, 220.00, 'Active', CURDATE(), 'System'),
(3, 'ITM-003', 'Study Desk Chair', 3, 'Pcs', 10, 0, 1500.00, 'Active', CURDATE(), 'System');


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

