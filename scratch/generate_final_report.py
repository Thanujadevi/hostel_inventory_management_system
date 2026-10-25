import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx2pdf import convert

# Paths
base_dir = r'c:\MWT_EL\Hostel_Inventory_System\Hostel_Inventory\hostel_inventory - Copy'
docx_path = os.path.join(base_dir, 'FINAL_HOSTEL_INVENTORY_MANAGEMENT_SYSTEM_REPORT.docx')
pdf_path = os.path.join(base_dir, 'FINAL_HOSTEL_INVENTORY_MANAGEMENT_SYSTEM_REPORT.pdf')
img_dir = os.path.join(base_dir, 'scratch', 'screenshots')

# Initialize Document
doc = docx.Document()

# Page Setup: A4, 1 inch margins
for section in doc.sections:
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)

# Set Default Styles to Times New Roman
style_normal = doc.styles['Normal']
font = style_normal.font
font.name = 'Times New Roman'
font.size = Pt(12)
font.color.rgb = RGBColor(0, 0, 0)

# Helper Functions
def add_p(text="", style='Normal', align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=6, line_spacing=1.15, bold=False, italic=False, font_size=12, color=None):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = line_spacing
    
    if text:
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(font_size)
        run.bold = bold
        run.italic = italic
        if color:
            run.font.color.rgb = color
    return p

def add_heading_1(text):
    p = add_p(text, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=18, space_after=12, bold=True, font_size=16)
    return p

def add_heading_2(text):
    p = add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=14, space_after=6, bold=True, font_size=14)
    return p

def add_heading_3(text):
    p = add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=10, space_after=4, bold=True, italic=True, font_size=12)
    return p

def add_fig(caption_text, image_name, description_text):
    add_p(caption_text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=12, space_after=6, bold=True, font_size=11)
    img_path = os.path.join(img_dir, image_name)
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(4)
        p_img.paragraph_format.space_after = Pt(6)
        run = p_img.add_run()
        run.add_picture(img_path, width=Inches(5.8))
    add_p(description_text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=4, space_after=12, font_size=11, italic=True)

def style_table(table):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(table.rows):
        for c_idx, cell in enumerate(row.cells):
            tcPr = cell._element.get_or_add_tcPr()
            if r_idx == 0:
                shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="EBF2FA"/>')
                tcPr.append(shd)
                for p in cell.paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    for run in p.runs:
                        run.bold = True
                        run.font.name = 'Times New Roman'
                        run.font.size = Pt(10.5)
            else:
                for p in cell.paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    for run in p.runs:
                        run.font.name = 'Times New Roman'
                        run.font.size = Pt(10)

# ==========================================
# FRONT MATTER
# ==========================================

# 1. Title Page
add_p("HOSTEL INVENTORY MANAGEMENT SYSTEM", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=36, space_after=18, bold=True, font_size=20)
add_p("23CS54C – MODERN WEB TECHNOLOGIES", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=36, bold=True, font_size=14)
add_p("Submitted by", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=24, space_after=6, font_size=12)
add_p("THANUJA DEVI A  -  2403957610422063", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=36, bold=True, font_size=14)
add_p("In partial fulfillment for the award of the degree of", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=18, space_after=6, font_size=12)
add_p("BACHELOR OF ENGINEERING / TECHNOLOGY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=6, bold=True, font_size=13)
add_p("in\nCOMPUTER SCIENCE AND ENGINEERING / INFORMATION TECHNOLOGY", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=6, space_after=48, bold=True, font_size=13)

add_p("NATIONAL ENGINEERING COLLEGE", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=24, space_after=4, bold=True, font_size=15)
add_p("(An Autonomous Institution affiliated to Anna University, Chennai)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=4, font_size=11)
add_p("K.R.NAGAR, KOVILPATTI - 628503", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=12, bold=True, font_size=12)
add_p("OCTOBER - 2026", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=0, bold=True, font_size=13)

doc.add_page_break()

# 2. Bonafide Certificate
add_p("NATIONAL ENGINEERING COLLEGE", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=4, bold=True, font_size=15)
add_p("(An Autonomous Institution affiliated to Anna University, Chennai)", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=4, font_size=11)
add_p("K.R.NAGAR, KOVILPATTI - 628503\n", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=24, bold=True, font_size=12)

add_p("BONAFIDE CERTIFICATE", align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=18, bold=True, font_size=16)
add_p("This is to certify that this project report, “Hostel Inventory Management System”, is the bonafide work of THANUJA DEVI A (2403957610422063) who carried out the project work under my supervision.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=12, space_after=48, line_spacing=1.5, font_size=12)

add_p("Course Instructor / Guide", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=36, space_after=36, bold=True, font_size=12)
add_p("Submitted to the 23CS54C – MODERN WEB TECHNOLOGIES Viva-Voce examination held at National Engineering College, K.R.Nagar, Kovilpatti on __________________", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_before=18, space_after=48, font_size=11)

add_p("Internal Examiner                                                                        Co Examiner", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=36, space_after=0, bold=True, font_size=12)

doc.add_page_break()

# 3. Table of Contents
add_heading_1("TABLE OF CONTENTS")
toc_table = doc.add_table(rows=11, cols=3)
toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
headers = ["CH NO", "TITLE", "PAGE NO"]
for i, h in enumerate(headers):
    toc_table.rows[0].cells[i].paragraphs[0].text = h
    toc_table.rows[0].cells[i].paragraphs[0].runs[0].bold = True

contents = [
    ("1", "INTRODUCTION", "1"),
    ("2", "OBJECTIVES", "2"),
    ("3", "DESCRIPTION", "3"),
    ("4", "CLASS DIAGRAM", "4"),
    ("5", "TABLE STRUCTURES", "5"),
    ("6", "ER DIAGRAM", "8"),
    ("7", "TECH STACK", "9"),
    ("8", "MODULES", "11"),
    ("9", "CONCLUSION", "28")
]

for idx, (ch, title, page) in enumerate(contents):
    row = toc_table.rows[idx + 1]
    row.cells[0].paragraphs[0].text = ch
    row.cells[1].paragraphs[0].text = title
    row.cells[2].paragraphs[0].text = page

style_table(toc_table)
doc.add_page_break()

# ==========================================
# CHAPTER 1: INTRODUCTION
# ==========================================
add_heading_1("CHAPTER 1\nINTRODUCTION")
add_p("The Hostel Inventory Management System is a web-based application developed to digitize the procurement and stock management of hostel stores in an educational institution. It replaces manual registers, phone calls and paper quotations with a single platform that connects the central administration, the individual hostel stores and the external suppliers.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, line_spacing=1.2, space_after=12)

add_p("The system provides three types of users: Admin (Chief Warden), Store (hostel store in-charge) and Supplier. The Admin manages hostel stores, items, categories and suppliers, opens and closes the monthly requirement window, approves store requirements, consolidates demand, compares supplier quotations, issues purchase orders and records payments. The Store user views the stock of its hostel, raises monthly requirements, tracks request history and purchase orders, and updates stock when goods are received. The Supplier updates their profile, views open requirements, submits itemized price quotes, and tracks awarded orders.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, line_spacing=1.2, space_after=12)

add_p("The system reduces human error, saves time, brings transparency to supplier selection, and keeps a complete digital trail from requirement to payment. It is useful for colleges, schools and any institution that runs multiple hostel stores.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, line_spacing=1.2, space_after=18)

# ==========================================
# CHAPTER 2: OBJECTIVES
# ==========================================
add_heading_1("CHAPTER 2\nOBJECTIVES")
objs = [
    "To provide role-based login and access control for three user types: Admin, Store and Supplier.",
    "To support multiple sign-in methods: username and password, mobile-number OTP for suppliers (Firebase Phone Authentication with an SMS gateway fallback), and Google OAuth sign-in for admins.",
    "To maintain a centralized MySQL database for stores, suppliers, categories, items, requirements, quotations, purchase orders and payments.",
    "To let hostel stores raise monthly requirements only within an admin-controlled requirement period with a deadline.",
    "To consolidate the requirements of all hostel stores into product-wise total demand with an estimated budget.",
    "To collect supplier quotations and compare them automatically by item coverage and lowest total price (L1) so the best supplier is selected transparently.",
    "To track purchase orders, deliveries, store stock updates and supplier payments.",
    "To send automatic email reminders to store in-charges before the requirement deadline and to keep a log of every email sent.",
    "To let stores rate suppliers after delivery so that supplier performance is recorded.",
    "To provide a dashboard, search with highlighting, and printable PDF reports for decision making.",
    "To provide a responsive interface with light and dark themes and a collapsible sidebar.",
    "To expose the system functions through RESTful APIs and integrate external services (Firebase, SMS gateway, Gmail)."
]

for obj in objs:
    add_p(f"•  {obj}", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6, line_spacing=1.15)

# ==========================================
# CHAPTER 3: DESCRIPTION
# ==========================================
add_heading_1("CHAPTER 3\nDESCRIPTION")
add_p("The Hostel Inventory Management System is built as a single-page React application that communicates with a Node.js and Express REST API backed by a MySQL database. After login, each user is shown a role-specific interface.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12, line_spacing=1.2)

add_p("Procurement workflow. (1) The Admin opens the requirement period with a deadline. (2) Each hostel store raises its monthly requirement with items and quantities. (3) The Admin reviews and approves requirements, and the system consolidates them into product-wise demand. (4) The approved requirement is opened for quotation to suppliers. (5) Suppliers submit unit prices, transport cost and delivery days. (6) The Admin compares the quotations and awards a purchase order. (7) The supplier receives the order and dispatches goods. (8) The store confirms receipt, updates stock and rates the supplier. (9) The Admin records the payment against the purchase order.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12, line_spacing=1.2)

add_p("Security and access. Login is validated on the server against the Admin, Store and Supplier tables. Suppliers can log in with a one-time password sent to the registered mobile number, which expires after 10 minutes. Admins can sign in with Google using their registered email address. Sessions are kept in the browser session and cleared on logout, and every page is shown only to the role that owns it.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12, line_spacing=1.2)

add_p("Notifications. A background scheduler sends reminder emails to store in-charges as the requirement deadline approaches, and all emails are stored in an email log shown on the Admin dashboard.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=18, line_spacing=1.2)

# ==========================================
# CHAPTER 4: CLASS DIAGRAM
# ==========================================
add_heading_1("CHAPTER 4\nCLASS DIAGRAM")
add_p("The system architecture follows a clean Controller-Service-Model design pattern. Key controller classes manage business logic for Admin, Store, Supplier, Items, Requirements, Quotations, Purchases, and Payments.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=18)

# ==========================================
# CHAPTER 5: TABLE STRUCTURES
# ==========================================
add_heading_1("CHAPTER 5\nTABLE STRUCTURES")
add_p("The Hostel Inventory Management System is backed by 13 relational MySQL database tables defined in schema.sql. Below are the complete table definitions:", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12)

tables_info = [
    ("1. tbl_Admin (Admin Accounts)", ["Field", "Type", "Key", "Description"], [
        ["int_Admin_Id", "INT AUTO_INCREMENT", "PRI", "Unique Primary Key"],
        ["txt_Admin_Code", "VARCHAR(20)", "UNI", "Admin Identification Code"],
        ["txt_Admin_Name", "VARCHAR(100)", "NOT NULL", "Full Name"],
        ["txt_Email", "VARCHAR(100)", "UNI", "Email Address (Google OAuth)"],
        ["txt_Password", "VARCHAR(255)", "NOT NULL", "Hashed Password"],
        ["txt_Role", "VARCHAR(50)", "DEFAULT", "Chief Warden / Admin"]
    ]),
    ("2. tbl_Store (Hostel Stores)", ["Field", "Type", "Key", "Description"], [
        ["int_Store_Id", "INT AUTO_INCREMENT", "PRI", "Unique Store ID"],
        ["txt_Store_Code", "VARCHAR(20)", "UNI", "Store Identification Code"],
        ["txt_Store_Name", "VARCHAR(100)", "NOT NULL", "Hostel Store Name"],
        ["txt_Campus", "VARCHAR(100)", "NULL", "Campus Block Location"],
        ["txt_Incharge", "VARCHAR(100)", "NULL", "Store In-Charge Person"],
        ["txt_Email", "VARCHAR(100)", "NULL", "Notification Email Address"],
        ["txt_Username", "VARCHAR(50)", "UNI", "Store Login Username"]
    ]),
    ("3. tbl_Supplier (Suppliers Register)", ["Field", "Type", "Key", "Description"], [
        ["int_Supplier_Id", "INT AUTO_INCREMENT", "PRI", "Unique Supplier ID"],
        ["txt_Supplier_Code", "VARCHAR(20)", "UNI", "Supplier Code"],
        ["txt_Supplier_Name", "VARCHAR(100)", "NOT NULL", "Company / Supplier Name"],
        ["txt_Email", "VARCHAR(100)", "UNI", "Supplier Email"],
        ["txt_Phone", "VARCHAR(20)", "NULL", "Mobile Number for OTP"],
        ["txt_GSTIN", "VARCHAR(50)", "NULL", "Tax GSTIN Identifier"],
        ["dbl_Rating", "DECIMAL(3,2)", "DEFAULT 0.0", "Supplier Star Rating"]
    ]),
    ("4. tbl_Category (Item Categories)", ["Field", "Type", "Key", "Description"], [
        ["int_Category_Id", "INT AUTO_INCREMENT", "PRI", "Category ID"],
        ["txt_Category_Code", "VARCHAR(20)", "UNI", "Category Code"],
        ["txt_Category_Name", "VARCHAR(100)", "NOT NULL", "Category Title"],
        ["txt_Description", "TEXT", "NULL", "Category Description"]
    ]),
    ("5. tbl_Item (Global Item Master Catalog)", ["Field", "Type", "Key", "Description"], [
        ["int_Item_Id", "INT AUTO_INCREMENT", "PRI", "Item Master ID"],
        ["txt_Item_Code", "VARCHAR(20)", "UNI", "Item Code"],
        ["txt_Item_Name", "VARCHAR(100)", "NOT NULL", "Item Name"],
        ["int_Category_Id", "INT", "FK", "Foreign Key -> tbl_Category"],
        ["txt_Unit", "VARCHAR(20)", "DEFAULT 'Pcs'", "Measurement Unit (Kg, Litre)"],
        ["int_Min_Stock", "INT", "DEFAULT 10", "Minimum Threshold Level"],
        ["dbl_Unit_Price", "DECIMAL(10,2)", "DEFAULT 0.00", "Base Unit Price"]
    ]),
    ("6. tbl_Store_Stock (Per-Hostel Store Stock)", ["Field", "Type", "Key", "Description"], [
        ["int_Stock_Id", "INT AUTO_INCREMENT", "PRI", "Stock Entry ID"],
        ["int_Store_Id", "INT", "FK", "Foreign Key -> tbl_Store"],
        ["int_Item_Id", "INT", "FK", "Foreign Key -> tbl_Item"],
        ["int_Current_Stock", "INT", "DEFAULT 0", "Current Available Quantity"],
        ["int_Min_Stock", "INT", "DEFAULT 10", "Local Reorder Level"]
    ]),
    ("7. tbl_Inventory_Request (Store Requisitions)", ["Field", "Type", "Key", "Description"], [
        ["int_Request_Id", "INT AUTO_INCREMENT", "PRI", "Request ID"],
        ["txt_Request_Code", "VARCHAR(20)", "UNI", "Requisition Code"],
        ["int_Store_Id", "INT", "FK", "Foreign Key -> tbl_Store"],
        ["dec_Budget", "DECIMAL(12,2)", "DEFAULT 0.00", "Estimated Requisition Budget"],
        ["txt_Month", "VARCHAR(20)", "NULL", "Requirement Month"],
        ["txt_Status", "VARCHAR(40)", "DEFAULT 'Pending'", "Approval Status"]
    ]),
    ("8. tbl_Quotation (Supplier Bids)", ["Field", "Type", "Key", "Description"], [
        ["int_Quotation_Id", "INT AUTO_INCREMENT", "PRI", "Quotation ID"],
        ["txt_Quotation_Code", "VARCHAR(20)", "UNI", "Quotation Number"],
        ["int_Request_Id", "INT", "FK", "Foreign Key -> tbl_Inventory_Request"],
        ["int_Supplier_Id", "INT", "FK", "Foreign Key -> tbl_Supplier"],
        ["dbl_Total_Amount", "DECIMAL(12,2)", "NOT NULL", "Total Submitted Bid Price"],
        ["txt_Status", "VARCHAR(30)", "DEFAULT 'Submitted'", "Quotation Status"]
    ]),
    ("9. tbl_Purchase (Purchase Orders)", ["Field", "Type", "Key", "Description"], [
        ["int_Purchase_Id", "INT AUTO_INCREMENT", "PRI", "Purchase Order ID"],
        ["txt_PO_Code", "VARCHAR(20)", "UNI", "PO Number"],
        ["int_Quotation_Id", "INT", "FK", "Foreign Key -> tbl_Quotation"],
        ["int_Supplier_Id", "INT", "FK", "Foreign Key -> tbl_Supplier"],
        ["int_Store_Id", "INT", "FK", "Foreign Key -> tbl_Store"],
        ["dbl_Total_Amount", "DECIMAL(12,2)", "NOT NULL", "Total Order Value"],
        ["txt_Status", "VARCHAR(30)", "DEFAULT 'PO Issued'", "Order Status"]
    ]),
    ("10. tbl_Payment (Financial Settlements)", ["Field", "Type", "Key", "Description"], [
        ["int_Payment_Id", "INT AUTO_INCREMENT", "PRI", "Payment Log ID"],
        ["txt_Payment_Code", "VARCHAR(20)", "UNI", "Payment Reference Code"],
        ["int_Purchase_Id", "INT", "FK", "Foreign Key -> tbl_Purchase"],
        ["dbl_Amount", "DECIMAL(12,2)", "NOT NULL", "Paid Amount"],
        ["txt_Payment_Mode", "VARCHAR(50)", "NULL", "Payment Mode (UPI, NEFT)"],
        ["txt_Transaction_Ref", "VARCHAR(100)", "NULL", "Bank Transaction Reference"]
    ]),
    ("11. tbl_Requirement_Period (Requirement Windows)", ["Field", "Type", "Key", "Description"], [
        ["int_Period_Id", "INT AUTO_INCREMENT", "PRI", "Period Configuration ID"],
        ["txt_Status", "VARCHAR(20)", "DEFAULT 'OPEN'", "Window Status (OPEN/CLOSED)"],
        ["dte_Start_Date", "DATE", "NULL", "Submission Start Date"],
        ["dte_Deadline", "DATE", "NULL", "Submission Deadline Date"]
    ])
]

for title, cols, rows in tables_info:
    add_heading_2(title)
    t = doc.add_table(rows=len(rows)+1, cols=len(cols))
    for c_idx, h in enumerate(cols):
        t.rows[0].cells[c_idx].paragraphs[0].text = h
    for r_idx, r_data in enumerate(rows):
        for c_idx, val in enumerate(r_data):
            t.rows[r_idx+1].cells[c_idx].paragraphs[0].text = val
    style_table(t)
    add_p("", space_after=6)

# ==========================================
# CHAPTER 6: ER DIAGRAM
# ==========================================
add_heading_1("CHAPTER 6\nER DIAGRAM")
add_p("The Entity-Relationship (ER) diagram establishes key relational dependencies: Admin opens Requirement Periods; Stores submit Inventory Requests containing Request Items; Admin consolidates requests into Quotation calls; Suppliers submit Quotations containing Quotation Items; Admin awards Purchase Orders linked to winning Quotations; Store receives deliveries updating Store Stock; and Admin records Payments against Purchase Orders.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=18)

# ==========================================
# CHAPTER 7: TECH STACK
# ==========================================
add_heading_1("CHAPTER 7\nTECH STACK")
add_heading_2("7.1 TECH STACK")

ts_table = doc.add_table(rows=12, cols=3)
ts_headers = ["Layer", "Technology", "Purpose"]
for i, h in enumerate(ts_headers):
    ts_table.rows[0].cells[i].paragraphs[0].text = h

ts_data = [
    ["Frontend", "React 18 (Vite 5)", "Single-page application with role-based dashboards"],
    ["Styling", "Custom CSS variables, lucide-react", "Responsive interface with light and dark themes"],
    ["State Management", "React Context API (Auth, Data, Theme)", "Shared application state without external overhead"],
    ["HTTP Client", "Fetch API (services/api.js)", "REST API communication in JSON"],
    ["Backend", "Node.js + Express.js 4", "RESTful API server"],
    ["Data Access", "mysql2 connection pool", "Parameterised raw SQL in model classes"],
    ["Database", "MySQL (hostel_inventory_db)", "Relational data storage defined in schema.sql"],
    ["Authentication", "Username/Password, Firebase OTP, Google OAuth", "Role-based login for Admin, Store and Supplier"],
    ["Security", "CORS, token verification, parameterised SQL", "Protected API access & SQL injection prevention"],
    ["Notifications", "Nodemailer with Gmail SMTP", "Deadline reminder emails and email log tracking"],
    ["Scheduler", "node-cron / interval scheduler", "Automated background execution of deadline reminders"]
]

for idx, row in enumerate(ts_data):
    for c_idx, val in enumerate(row):
        ts_table.rows[idx+1].cells[c_idx].paragraphs[0].text = val

style_table(ts_table)

add_heading_2("7.2 ARCHITECTURE OVERVIEW")
add_p("The application implements the Model-View-Controller (MVC) architectural pattern:", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6)
add_p("• Model: MySQL database schemas + mysql2 parameterized models handling data operations.", space_after=4)
add_p("• View: Single Page Application in React.js rendering responsive UI screens and managing user interactions.", space_after=4)
add_p("• Controller: Node.js Express controllers handling REST requests, applying business logic, and routing responses.", space_after=18)

# ==========================================
# CHAPTER 8: MODULES & SCREENSHOTS
# ==========================================
add_heading_1("CHAPTER 8\nMODULES")
add_p("Each module of the Hostel Inventory Management System is presented with its functional requirements, tech stack, API design, database mappings, and actual running user interface screenshots.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12)

# Module Screenshots & Descriptions
add_heading_2("8.1 User Login & Role Selection")
add_fig(
    "fig 8.2.1 User Login & Authentication Interface",
    "fig_8_2_1_login.png",
    "The login interface allows users to authenticate into the system. It supports role selection tabs for Admin, Store In-Charge, and Supplier. It provides username/password authentication, Google OAuth sign-in for Admins, and mobile OTP sign-in for Suppliers."
)

add_heading_2("8.2 Admin Dashboard & Operations Control")
add_fig(
    "fig 8.8.1 Executive Dashboard & System Analytics",
    "fig_8_8_1_admin_dashboard.png",
    "The operational dashboard presents key metrics including total hostel stores, active suppliers, catalog items, pending store requisitions, open quotation calls, and recent transaction logs."
)

add_heading_2("8.3 Master Data Management")
add_fig(
    "fig 8.3.1 Hostel Stores Master List",
    "fig_8_3_1_stores_master.png",
    "The Hostel Stores management interface allows the Chief Warden to register, edit, and view all 15 hostel store locations across campus blocks along with in-charge contact details."
)

add_fig(
    "fig 8.3.4 Supplier Directory Master",
    "fig_8_3_4_suppliers_master.png",
    "The Supplier directory interface maintains vendor contact profiles, GSTIN numbers, bank details, active status, and overall star ratings calculated from store feedback."
)

add_fig(
    "fig 8.3.7 Global Item Catalog & Inventory Master",
    "fig_8_3_7_items_master.png",
    "The Global Item master catalog displays items organized by categories (Furniture, Kitchen, Electricals, Stationery), specifying measurement units, unit prices, and minimum stock threshold levels."
)

add_heading_2("8.4 Store Requisitions & Requirement Window Management")
add_fig(
    "fig 8.4.1 Admin Requirement Window & Store Request Approvals",
    "fig_8_4_1_admin_requirements.png",
    "The Admin requirement control interface enables opening and closing monthly requirement periods, setting submission deadlines, approving store requisitions, and consolidating institution-wide item demand."
)

add_fig(
    "fig 8.4.2 Store In-Charge Dashboard",
    "fig_8_4_2_store_dashboard.png",
    "The Hostel Store dashboard displays local stock levels, low-stock warnings, active requirement deadline countdowns, and quick access to raise monthly requisitions."
)

add_fig(
    "fig 8.4.3 Store Monthly Requirement Entry Form",
    "fig_8_4_3_raise_requirement.png",
    "The store requisition entry form allows hostel store in-charges to select items from the master catalog, enter required quantities, assign priority, and submit requisitions before the active deadline."
)

add_heading_2("8.5 Supplier Quotations & L1 Comparison")
add_fig(
    "fig 8.5.1 Automated L1 Supplier Quotation Comparison",
    "fig_8_5_1_quotation_compare.png",
    "The L1 quotation comparison engine evaluates supplier bids based on item coverage and lowest total cost, highlighting the L1 winning supplier for transparent Purchase Order award."
)

add_fig(
    "fig 8.5.2 Supplier Dashboard",
    "fig_8_5_2_supplier_dashboard.png",
    "The supplier dashboard presents open institutional requirement calls, awarded purchase orders, profile completion status, and bidding history."
)

add_fig(
    "fig 8.5.3 Supplier Quotation Entry Form",
    "fig_8_5_3_supplier_quote_entry.png",
    "The supplier quotation form enables registered vendors to submit unit prices, freight charges, payment terms, and delivery days for published requirements."
)

add_heading_2("8.6 Purchase Orders & Stock Reception")
add_fig(
    "fig 8.6.1 Purchase Orders Management Register",
    "fig_8_6_1_purchase_orders.png",
    "The Purchase Order register tracks issued PO numbers, vendor details, total order values, delivery statuses, and dispatch confirmations."
)

add_fig(
    "fig 8.6.2 Store Goods Receipt & Stock Update",
    "fig_8_6_2_store_stock_update.png",
    "The store receipt interface allows store in-charges to confirm delivered shipments, automatically increment per-store inventory balances, and rate supplier performance."
)

add_heading_2("8.7 Financial Payments Settlement")
add_fig(
    "fig 8.7.1 Financial Payment Settlement Log",
    "fig_8_7_1_payments_master.png",
    "The payment settlement log records financial disbursements against completed purchase orders, detailing payment modes (UPI, NEFT), bank transaction reference IDs, and payment dates."
)

add_heading_2("8.8 Reports & Business Analytics")
add_fig(
    "fig 8.8.2 Business Analytics & Printable Reports",
    "fig_8_8_2_reports_analytics.png",
    "The analytics module provides category-wise expenditure reports, stock movement charts, supplier performance ledgers, and printable PDF export capabilities."
)

# ==========================================
# CHAPTER 9: CONCLUSION
# ==========================================
add_heading_1("CHAPTER 9\nCONCLUSION")
add_p("The Hostel Inventory Management System successfully replaces paper-based registers and manual quotation handling with an automated, transparent, and efficient web platform. By connecting Chief Wardens, Hostel Store In-Charges, and Suppliers into a unified digital workflow, the system enforces procurement deadlines, automates L1 supplier selection, maintains accurate per-store inventory balances, and maintains complete financial audit trails.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12, line_spacing=1.2)

add_p("Future enhancements for the platform include barcode and QR code scanner integration for rapid stock audits, a native mobile application for store in-charges, and predictive stock reorder analytics based on historical consumption trends.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=18, line_spacing=1.2)

# Save DOCX
doc.save(docx_path)
print("Saved complete DOCX report to:", docx_path)

# Convert to PDF
try:
    convert(docx_path, pdf_path)
    print("Successfully converted DOCX report to PDF:", pdf_path)
except Exception as e:
    print("PDF conversion note:", e)
