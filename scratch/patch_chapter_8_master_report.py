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
docx_alt_path = os.path.join(base_dir, 'FINAL_HOSTEL_INVENTORY_MANAGEMENT_SYSTEM_REPORT_PATCHED.docx')
pdf_path = os.path.join(base_dir, 'FINAL_HOSTEL_INVENTORY_MANAGEMENT_SYSTEM_REPORT.pdf')
pdf_alt_path = os.path.join(base_dir, 'FINAL_HOSTEL_INVENTORY_MANAGEMENT_SYSTEM_REPORT_PATCHED.pdf')
img_dir = os.path.join(base_dir, 'scratch', 'screenshots')

# Initialize Document
doc = docx.Document()

# Page Setup: A4, 1.0 inch margins all around
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
def add_p(text="", align=WD_ALIGN_PARAGRAPH.LEFT, space_before=0, space_after=6, line_spacing=1.15, bold=False, italic=False, font_size=12, color=None):
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
    return add_p(text, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=18, space_after=12, bold=True, font_size=16)

def add_heading_2(text):
    return add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=14, space_after=6, bold=True, font_size=14)

def add_heading_3(text):
    return add_p(text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=10, space_after=4, bold=True, italic=True, font_size=12)

def add_fig(caption_text, image_name, description_text=""):
    add_p(caption_text, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=12, space_after=6, bold=True, font_size=11)
    img_path = os.path.join(img_dir, image_name)
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(4)
        p_img.paragraph_format.space_after = Pt(6)
        run = p_img.add_run()
        run.add_picture(img_path, width=Inches(5.8))
    if description_text:
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
# FRONT MATTER (PRESERVED)
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
    ("9", "CONCLUSION", "45")
]

for idx, (ch, title, page) in enumerate(contents):
    row = toc_table.rows[idx + 1]
    row.cells[0].paragraphs[0].text = ch
    row.cells[1].paragraphs[0].text = title
    row.cells[2].paragraphs[0].text = page

style_table(toc_table)
doc.add_page_break()

# ==========================================
# CHAPTERS 1 TO 7 (PRESERVED EXACTLY)
# ==========================================
add_heading_1("CHAPTER 1\nINTRODUCTION")
add_p("The Hostel Inventory Management System is a web-based application developed to digitize the procurement and stock management of hostel stores in an educational institution. It replaces manual registers, phone calls and paper quotations with a single platform that connects the central administration, the individual hostel stores and the external suppliers.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, line_spacing=1.2, space_after=12)
add_p("The system provides three types of users: Admin (Chief Warden), Store (hostel store in-charge) and Supplier. The Admin manages hostel stores, items, categories and suppliers, opens and closes the monthly requirement window, approves store requirements, consolidates demand, compares supplier quotations, issues purchase orders and records payments. The Store user views the stock of its hostel, raises monthly requirements, tracks request history and purchase orders, and updates stock when goods are received. The Supplier updates their profile, views open requirements, submits itemized price quotes, and tracks awarded orders.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, line_spacing=1.2, space_after=12)

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
    "To provide a dashboard, search with highlighting, and printable PDF reports for decision making."
]
for obj in objs:
    add_p(f"•  {obj}", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6, line_spacing=1.15)

add_heading_1("CHAPTER 3\nDESCRIPTION")
add_p("The Hostel Inventory Management System is built as a single-page React application that communicates with a Node.js and Express REST API backed by a MySQL database. After login, each user is shown a role-specific interface.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12, line_spacing=1.2)
add_p("Procurement workflow. (1) The Admin opens the requirement period with a deadline. (2) Each hostel store raises its monthly requirement with items and quantities. (3) The Admin reviews and approves requirements, and the system consolidates them into product-wise demand. (4) The approved requirement is opened for quotation to suppliers. (5) Suppliers submit unit prices, transport cost and delivery days. (6) The Admin compares the quotations and awards a purchase order. (7) The supplier receives the order and dispatches goods. (8) The store confirms receipt, updates stock and rates the supplier. (9) The Admin records the payment against the purchase order.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12, line_spacing=1.2)

add_heading_1("CHAPTER 4\nCLASS DIAGRAM")
add_p("The system architecture follows a clean Controller-Service-Model design pattern. Key controller classes manage business logic for Admin, Store, Supplier, Items, Requirements, Quotations, Purchases, and Payments.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=18)

add_heading_1("CHAPTER 5\nTABLE STRUCTURES")
add_p("The Hostel Inventory Management System is backed by 13 relational MySQL database tables defined in schema.sql.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12)

add_heading_1("CHAPTER 6\nER DIAGRAM")
add_p("The Entity-Relationship (ER) diagram establishes key relational dependencies between Admin, Stores, Suppliers, Items, Requirements, Quotations, POs, Payments, and Stock.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=18)

add_heading_1("CHAPTER 7\nTECH STACK")
add_p("Frontend: React 18 + Vite, Custom CSS variables, Context API. Backend: Node.js + Express 4. Database: MySQL (hostel_inventory_db) via mysql2 connection pool.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=18)

doc.add_page_break()

# ==========================================
# CHAPTER 8: MODULES (PATCHED WITH COMPLETE SECTIONS & UI FIGURES)
# ==========================================
add_heading_1("CHAPTER 8\nMODULES")

# 8.0 Design Approach
add_heading_2("8.0 Design Approach")
add_p("Each module of the Hostel Inventory Management System is described using a standardized seven-step system design framework. This ensures that every functional module is comprehensively analyzed from requirement formulation to database schema mapping, low-level architecture diagramming, and user interface implementation.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12)

da_table = doc.add_table(rows=8, cols=3)
da_headers = ["Step", "Question it answers", "Presented in each module as"]
for i, h in enumerate(da_headers):
    da_table.rows[0].cells[i].paragraphs[0].text = h

da_data = [
    ["1. Functional requirements", "What must the module do?", "Section 8.x.1"],
    ["2. Non-functional requirements", "How fast, how secure, how available? CAP trade-offs?", "Section 8.x.2"],
    ["3. Tech stack", "Which tools suit this problem, and why?", "Section 8.x.3"],
    ["4. Back-of-the-envelope", "How many users, requests and storage?", "Section 8.x.4"],
    ["5. Low-level architecture", "Which components exist and who talks to whom?", "Section 8.x.5"],
    ["6. API design", "What is the REST contract between client and server?", "Section 8.x.6"],
    ["7. DB design", "Which tables, keys and indexes store the data?", "Section 8.x.7"]
]

for idx, row in enumerate(da_data):
    for c_idx, val in enumerate(row):
        da_table.rows[idx+1].cells[c_idx].paragraphs[0].text = val

style_table(da_table)

add_p("\nShared baseline for all modules", bold=True, font_size=13, space_before=14, space_after=6)
add_p("Non-functional baseline. Every request travels through CORS middleware and JSON body parser before reaching express routes. Credentials are checked on the server, database access is performed exclusively using parameterized raw SQL queries via a connection pool of 10 connections, and role-based access control enforces URL and action permissions. All relational data lives in MySQL (hostel_inventory_db) choosing consistency over availability in CAP terms (CP). All monetary amounts use DECIMAL(12,2) to eliminate floating point rounding errors.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=18)


# Helper function to generate a complete module section with ALL design sections + multi-figure UI screenshots
def build_module_section_full(mod_num, title, purpose, funcs, non_funcs, ts_rows, bote_rows, flow_steps, arch_img, arch_title, apis, dbs, ui_figures):
    add_heading_2(f"8.{mod_num} {title.upper()}")
    
    # 8.x.0 Purpose & Scope
    add_heading_3(f"8.{mod_num}.0 Purpose & Scope")
    add_p(purpose, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=8)
    
    # 8.x.1 Functional Requirements
    add_heading_3(f"8.{mod_num}.1 Functional Requirements")
    for f in funcs:
        add_p(f"•  {f}", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)
        
    # 8.x.2 Non-Functional Requirements
    add_heading_3(f"8.{mod_num}.2 Non-Functional Requirements")
    for nf in non_funcs:
        add_p(f"•  {nf}", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)
        
    # 8.x.3 Tech Stack
    add_heading_3(f"8.{mod_num}.3 Tech Stack")
    t_ts = doc.add_table(rows=len(ts_rows)+1, cols=3)
    for i, h in enumerate(["Concern", "Choice", "Why it fits this module"]):
        t_ts.rows[0].cells[i].paragraphs[0].text = h
    for r_i, r in enumerate(ts_rows):
        for c_i, v in enumerate(r):
            t_ts.rows[r_i+1].cells[c_i].paragraphs[0].text = v
    style_table(t_ts)
    add_p("", space_after=6)
    
    # 8.x.4 Back-of-the-Envelope Estimation
    add_heading_3(f"8.{mod_num}.4 Back-of-the-Envelope Estimation")
    t_bote = doc.add_table(rows=len(bote_rows)+1, cols=3)
    for i, h in enumerate(["Quantity", "Estimate", "Basis"]):
        t_bote.rows[0].cells[i].paragraphs[0].text = h
    for r_i, r in enumerate(bote_rows):
        for c_i, v in enumerate(r):
            t_bote.rows[r_i+1].cells[c_i].paragraphs[0].text = v
    style_table(t_bote)
    add_p("", space_after=6)
    
    # 8.x.5 Low-Level Architecture
    add_heading_3(f"8.{mod_num}.5 Low-Level Architecture")
    add_fig(f"Fig 8.{mod_num}.A {arch_title}", arch_img, "")
    add_p("Request flow:", bold=True, space_after=4)
    for fs in flow_steps:
        add_p(f"•  {fs}", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=3)
        
    # 8.x.6 API Design
    add_heading_3(f"8.{mod_num}.6 API Design")
    t_api = doc.add_table(rows=len(apis)+1, cols=3)
    for i, h in enumerate(["Method", "Endpoint", "Purpose / Contract"]):
        t_api.rows[0].cells[i].paragraphs[0].text = h
    for r_i, r in enumerate(apis):
        for c_i, v in enumerate(r):
            t_api.rows[r_i+1].cells[c_i].paragraphs[0].text = v
    style_table(t_api)
    add_p("", space_after=6)
    
    # 8.x.7 DB Design
    add_heading_3(f"8.{mod_num}.7 DB Design")
    t_db = doc.add_table(rows=len(dbs)+1, cols=4)
    for i, h in enumerate(["Table", "Important Fields", "Key / Relationship", "Purpose in Module"]):
        t_db.rows[0].cells[i].paragraphs[0].text = h
    for r_i, r in enumerate(dbs):
        for c_i, v in enumerate(r):
            t_db.rows[r_i+1].cells[c_i].paragraphs[0].text = v
    style_table(t_db)
    add_p("", space_after=8)
    
    # 8.x.8 Screenshots & UI
    add_heading_3(f"8.{mod_num}.8 User Interface Implementation")
    for fig_num, fig_title, screenshot_img, fig_desc in ui_figures:
        add_fig(f"Fig {fig_num} {fig_title}", screenshot_img, fig_desc)


# ==========================================
# MODULE 8.1: USER AUTHENTICATION
# ==========================================
build_module_section_full(
    mod_num=1,
    title="User Authentication & Role Selection",
    purpose="Provides role-based login and access control for Admin, Store In-Charge, and Supplier users. Supports multi-modal authentication options.",
    funcs=[
        "Support username and password login for Admin and Store users.",
        "Support Google OAuth 2.0 sign-in for Chief Warden / Admin using verified email.",
        "Support mobile phone OTP authentication for Suppliers via Firebase / SMS gateway.",
        "Store session details securely in sessionStorage and prevent unauthorized role access."
    ],
    non_funcs=[
        "Authentication response time < 200ms.",
        "Passwords hashed on server using bcrypt.",
        "OTP codes expire strictly after 10 minutes."
    ],
    ts_rows=[
        ["Authentication", "Firebase Auth / Google OAuth", "Secure phone OTP and Google sign-in"],
        ["Token Handling", "Firebase Admin SDK", "Server-side token verification"],
        ["Session State", "React Context API", "Client-side session management"]
    ],
    bote_rows=[
        ["Registered Users", "15 Stores, 2 Suppliers, 1 Admin", "Seeded system accounts"],
        ["Daily Logins", "50 requests/day", "Assumed active user logins"],
        ["Session Duration", "8 hours", "Default browser session lifetime"]
    ],
    flow_steps=[
        "User selects role tab (Admin, Store, Supplier) on Login.jsx.",
        "Form submits credentials or OTP to Express endpoint /api/auth/login or /api/auth/verify-otp.",
        "Controller verifies password against tbl_Admin, tbl_Store, or tbl_Supplier.",
        "On success, AuthContext sets session state and redirects user to role-specific dashboard."
    ],
    arch_img="fig_8_1_A_auth_arch.png",
    arch_title="Low-level architecture – USER AUTHENTICATION & ROLE SELECTION",
    apis=[
        ["POST", "/api/auth/login", "Authenticate via username and password"],
        ["POST", "/api/auth/google-admin", "Verify Google OAuth token and authenticate Admin"],
        ["POST", "/api/auth/send-otp", "Send SMS OTP to registered supplier mobile number"],
        ["POST", "/api/auth/verify-otp", "Verify mobile OTP and initiate supplier session"]
    ],
    dbs=[
        ["tbl_Admin", "int_Admin_Id, txt_Email, txt_Password", "PRI, UNI", "Stores Admin credentials"],
        ["tbl_Store", "int_Store_Id, txt_Username, txt_Password", "PRI, UNI", "Stores Hostel Store login credentials"],
        ["tbl_Supplier", "int_Supplier_Id, txt_Phone, txt_Password", "PRI, UNI", "Stores Supplier mobile OTP details"]
    ],
    ui_figures=[
        ("8.1.1", "User Login & Authentication Interface", "fig_8_1_1_login.png", "The login interface allows users to authenticate into the system. It supports role selection tabs for Admin, Store In-Charge, and Supplier. It provides username/password authentication, Google OAuth sign-in for Admins, and mobile OTP sign-in for Suppliers.")
    ]
)

# ==========================================
# MODULE 8.2: ADMIN DASHBOARD
# ==========================================
build_module_section_full(
    mod_num=2,
    title="Admin Dashboard & Operations Control",
    purpose="Centralized executive view for Chief Warden to monitor all hostel inventory operations, pending store requests, open quotation calls, and email reminder logs.",
    funcs=[
        "Display KPI metrics for total hostel stores, active suppliers, catalog items, and pending requisitions.",
        "Provide quick navigation shortcuts to master data registers and quotation compare views.",
        "Display live audit logs of sent automated email reminders."
    ],
    non_funcs=[
        "Dashboard load time < 300ms.",
        "Real-time state synchronization via React DataContext."
    ],
    ts_rows=[
        ["Dashboard Analytics", "React 18 + Lucide Icons", "Visual stat metric cards"],
        ["Email Logging", "Nodemailer + MySQL", "Tracking email reminder history"]
    ],
    bote_rows=[
        ["Dashboard Views", "100 views/day", "Daily admin activity"],
        ["Metric Query Time", "15ms", "Aggregated MySQL queries"]
    ],
    flow_steps=[
        "Admin navigates to /admin/dashboard.",
        "Dashboard.jsx fetches summary counts from backend services.",
        "Queries aggregated counts from tbl_Store, tbl_Supplier, tbl_Inventory_Request, and tbl_Purchase.",
        "Renders metric summary cards and automated email log tables."
    ],
    arch_img="fig_8_2_A_dashboard_arch.png",
    arch_title="Low-level architecture – ADMIN DASHBOARD & SYSTEM ANALYTICS",
    apis=[
        ["GET", "/api/reminders/logs", "Fetch historical email reminder logs"],
        ["GET", "/api/reports/summary", "Retrieve overall institutional KPI statistics"]
    ],
    dbs=[
        ["tbl_Admin", "int_Admin_Id, txt_Admin_Name", "PRI", "Admin user identity"],
        ["tbl_Store", "int_Store_Id, txt_Store_Name", "PRI", "Hostel store counts"],
        ["tbl_Inventory_Request", "int_Request_Id, txt_Status", "PRI", "Pending requisition status tracking"]
    ],
    ui_figures=[
        ("8.2.1", "Executive Dashboard & System Analytics", "fig_8_2_1_admin_dashboard.png", "The operational dashboard presents key metrics including total hostel stores, active suppliers, catalog items, pending store requisitions, open quotation calls, and recent transaction logs.")
    ]
)

# ==========================================
# MODULE 8.3: MASTER DATA MANAGEMENT
# ==========================================
build_module_section_full(
    mod_num=3,
    title="Master Data Management",
    purpose="Maintains master records for Hostel Stores, Registered Suppliers, Item Categories, and Global Item Catalog.",
    funcs=[
        "Admin can register, edit, and deactivate Hostel Stores across campus blocks.",
        "Admin can manage Supplier profiles, GSTIN numbers, bank details, and view star ratings.",
        "Admin can maintain Item Categories and Global Item catalog with default units and reorder levels."
    ],
    non_funcs=[
        "Unique constraint enforcement on Store Code, Supplier GSTIN, and Item Code.",
        "Paginated or filtered table rendering for large datasets."
    ],
    ts_rows=[
        ["Master Data Storage", "MySQL Relational Tables", "Normalized database schema"],
        ["UI Components", "React Table & Modal", "Interactive CRUD registers"]
    ],
    bote_rows=[
        ["Hostel Stores", "15 stores", "Seeded institution stores"],
        ["Suppliers", "10 suppliers", "Registered vendors"],
        ["Catalog Items", "10 items", "Global item master"]
    ],
    flow_steps=[
        "Admin submits store/supplier/item creation modal.",
        "Form sends POST request to /api/stores, /api/suppliers, or /api/items.",
        "Express controller performs parameter validation and inserts row into MySQL.",
        "UI table refreshes automatically with updated master records."
    ],
    arch_img="fig_8_3_A_masterdata_arch.png",
    arch_title="Low-level architecture – MASTER DATA MANAGEMENT",
    apis=[
        ["GET", "/api/stores", "Fetch all hostel store records"],
        ["POST", "/api/stores", "Create a new hostel store master record"],
        ["GET", "/api/suppliers", "Fetch supplier directory and ratings"],
        ["GET", "/api/items", "Fetch global item catalog with categories"]
    ],
    dbs=[
        ["tbl_Store", "int_Store_Id, txt_Store_Code, txt_Store_Name", "PRI, UNI", "Hostel store details"],
        ["tbl_Supplier", "int_Supplier_Id, txt_Supplier_Code, txt_GSTIN", "PRI, UNI", "Supplier directory"],
        ["tbl_Category", "int_Category_Id, txt_Category_Name", "PRI, UNI", "Item categorization"],
        ["tbl_Item", "int_Item_Id, txt_Item_Code, int_Category_Id", "PRI, FK", "Global item catalog"]
    ],
    ui_figures=[
        ("8.3.1", "Hostel Stores Master Register", "fig_8_3_1_stores_master.png", "The Hostel Stores management interface allows the Chief Warden to register, edit, and view all 15 hostel store locations across campus blocks along with in-charge contact details."),
        ("8.3.2", "Registered Supplier Directory", "fig_8_3_2_suppliers_master.png", "The Supplier directory interface maintains vendor contact profiles, GSTIN numbers, bank details, active status, and overall star ratings calculated from store feedback."),
        ("8.3.3", "Global Item Catalog & Inventory Master", "fig_8_3_3_items_master.png", "The Global Item master catalog displays items organized by categories (Furniture, Kitchen, Electricals, Stationery), specifying measurement units, unit prices, and minimum stock threshold levels.")
    ]
)

# ==========================================
# MODULE 8.4: STORE REQUISITIONS & REQUIREMENT PERIOD
# ==========================================
build_module_section_full(
    mod_num=4,
    title="Store Requisitions & Requirement Period Management",
    purpose="Enables Admin to control monthly requirement windows and allows hostel stores to submit itemized requisitions.",
    funcs=[
        "Admin opens and closes requirement window with a submission deadline date.",
        "Hostel store in-charges submit monthly item requirements with quantities and priority.",
        "System automatically consolidates store requisitions into bulk institution demand."
    ],
    non_funcs=[
        "Deadline enforcement preventing late store submissions.",
        "Automatic background email reminders sent before deadline."
    ],
    ts_rows=[
        ["Requisition Engine", "React Context + Express", "Requisition processing"],
        ["Email Reminders", "Nodemailer + node-cron", "Automated deadline alerts"]
    ],
    bote_rows=[
        ["Monthly Requests", "15 requests/month", "1 request per hostel store"],
        ["Requisition Items", "10 items/request", "Line items requested per store"]
    ],
    flow_steps=[
        "Admin configures requirement period deadline in /admin/requirements.",
        "Hostel store in-charge submits requisition on RaiseRequirement.jsx.",
        "Express inserts header in tbl_Inventory_Request and line items in tbl_Request_Item.",
        "Admin reviews incoming requests and triggers product-wise demand consolidation."
    ],
    arch_img="fig_8_4_A_requisitions_arch.png",
    arch_title="Low-level architecture – STORE REQUISITIONS & REQUIREMENT PERIOD",
    apis=[
        ["GET", "/api/requirement-period", "Fetch current requirement window configuration"],
        ["POST", "/api/requirement-period", "Set requirement period start date and deadline"],
        ["POST", "/api/requirements", "Submit a new hostel store requisition"],
        ["GET", "/api/requirements/consolidated", "Get product-wise consolidated demand"]
    ],
    dbs=[
        ["tbl_Requirement_Period", "int_Period_Id, dte_Deadline, txt_Status", "PRI", "Window configuration"],
        ["tbl_Inventory_Request", "int_Request_Id, int_Store_Id, dec_Budget", "PRI, FK", "Requisition header"],
        ["tbl_Request_Item", "int_Req_Item_Id, int_Request_Id, int_Quantity", "PRI, FK", "Requisition line items"]
    ],
    ui_figures=[
        ("8.4.1", "Admin Requirement Period & Store Request Approvals", "fig_8_4_1_admin_requirements.png", "The Admin requirement control interface enables opening and closing monthly requirement periods, setting submission deadlines, approving store requisitions, and consolidating institution-wide item demand."),
        ("8.4.2", "Store In-Charge Dashboard", "fig_8_4_2_store_dashboard.png", "The Hostel Store dashboard displays local stock levels, low-stock warnings, active requirement deadline countdowns, and quick access to raise monthly requisitions."),
        ("8.4.3", "Store Monthly Requirement Entry Form", "fig_8_4_3_raise_requirement.png", "The store requisition entry form allows hostel store in-charges to select items from the master catalog, enter required quantities, assign priority, and submit requisitions before the active deadline.")
    ]
)

# ==========================================
# MODULE 8.5: SUPPLIER QUOTATIONS & L1 COMPARISON
# ==========================================
build_module_section_full(
    mod_num=5,
    title="Supplier Quotations & L1 Comparison",
    purpose="Collects supplier quotation bids and executes an automated L1 comparison algorithm to determine the lowest bidder.",
    funcs=[
        "Suppliers submit unit prices, freight charges, delivery days, and payment terms.",
        "System calculates item coverage and total cost per supplier bid.",
        "L1 Comparison algorithm automatically highlights lowest bidder for single-click PO award."
    ],
    non_funcs=[
        "Sub-second L1 bid evaluation calculation.",
        "Strict decimal accuracy for financial comparisons."
    ],
    ts_rows=[
        ["Bidding Engine", "Express API + MySQL", "Quotation evaluation logic"],
        ["Comparison UI", "React Table with Highlight", "Visual L1 winner identification"]
    ],
    bote_rows=[
        ["Quotations/Call", "3 - 5 bids per call", "Expected vendor responses"],
        ["Comparison Ops", "< 10ms computation", "Fast L1 algorithm execution"]
    ],
    flow_steps=[
        "Supplier opens requirements call and submits quote on /supplier/requirements.",
        "Express saves bid headers in tbl_Quotation and line items in tbl_Quotation_Item.",
        "Admin opens QuotationCompare.jsx.",
        "Algorithm calculates total cost per supplier bid and flags L1 lowest total bidder."
    ],
    arch_img="fig_8_5_A_quotations_arch.png",
    arch_title="Low-level architecture – SUPPLIER QUOTATIONS & L1 COMPARISON",
    apis=[
        ["POST", "/api/quotations", "Submit supplier quotation bid"],
        ["GET", "/api/quotations/compare/:requestId", "Execute L1 comparison for a consolidated requirement"]
    ],
    dbs=[
        ["tbl_Quotation", "int_Quotation_Id, int_Supplier_Id, dbl_Total_Amount", "PRI, FK", "Quotation bid header"],
        ["tbl_Quotation_Item", "int_Quo_Item_Id, int_Quotation_Id, dbl_Unit_Price", "PRI, FK", "Item pricing breakdown"]
    ],
    ui_figures=[
        ("8.5.1", "Automated L1 Supplier Quotation Comparison Engine", "fig_8_5_1_quotation_compare.png", "The L1 quotation comparison engine evaluates supplier bids based on item coverage and lowest total cost, highlighting the L1 winning supplier for transparent Purchase Order award."),
        ("8.5.2", "Supplier Dashboard", "fig_8_5_2_supplier_dashboard.png", "The supplier dashboard presents open institutional requirement calls, awarded purchase orders, profile completion status, and bidding history."),
        ("8.5.3", "Supplier Quotation Bidding Form", "fig_8_5_3_supplier_quote_entry.png", "The supplier quotation form enables registered vendors to submit unit prices, freight charges, payment terms, and delivery days for published requirements.")
    ]
)

# ==========================================
# MODULE 8.6: PURCHASE ORDERS & GOODS RECEIPT
# ==========================================
build_module_section_full(
    mod_num=6,
    title="Purchase Orders & Goods Receipt / Stock Reception",
    purpose="Generates Purchase Orders for awarded suppliers and updates per-store inventory upon goods delivery confirmation.",
    funcs=[
        "Admin issues Purchase Order (PO) to winning L1 supplier.",
        "Supplier tracks issued POs and updates dispatch status.",
        "Store in-charge confirms receipt of delivered goods, updating local store stock automatically.",
        "Store in-charge rates supplier performance (1 to 5 stars)."
    ],
    non_funcs=[
        "Atomic database transaction during stock update.",
        "Inventory level precision to prevent negative balances."
    ],
    ts_rows=[
        ["Order Management", "Express REST API", "PO lifecycle handling"],
        ["Stock Updating", "MySQL Transactions", "Atomic store inventory balance updates"]
    ],
    bote_rows=[
        ["POs / Month", "5 - 10 POs monthly", "Issued purchase orders"],
        ["Stock Updates", "Instant batch update", "Receipt stock increments"]
    ],
    flow_steps=[
        "Admin awards PO from L1 comparison screen.",
        "Express creates record in tbl_Purchase.",
        "Store in-charge receives shipment and clicks 'Confirm Receipt' on StockUpdate.jsx.",
        "Backend increments quantity in tbl_Store_Stock and updates supplier rating in tbl_Supplier."
    ],
    arch_img="fig_8_6_A_purchases_arch.png",
    arch_title="Low-level architecture – PURCHASE ORDERS & GOODS RECEIPT",
    apis=[
        ["POST", "/api/purchases", "Issue a new Purchase Order to supplier"],
        ["POST", "/api/purchases/:id/receive", "Confirm goods receipt, update store stock, and rate supplier"]
    ],
    dbs=[
        ["tbl_Purchase", "int_Purchase_Id, txt_PO_Code, dbl_Total_Amount", "PRI, UNI", "Purchase Order record"],
        ["tbl_Store_Stock", "int_Stock_Id, int_Store_Id, int_Current_Stock", "PRI, FK", "Per-store inventory stock balance"]
    ],
    ui_figures=[
        ("8.6.1", "Purchase Orders Management Register", "fig_8_6_1_purchase_orders.png", "The Purchase Order register tracks issued PO numbers, vendor details, total order values, delivery statuses, and dispatch confirmations."),
        ("8.6.2", "Store Goods Receipt & Stock Level Increment", "fig_8_6_2_store_stock_update.png", "The store receipt interface allows store in-charges to confirm delivered shipments, automatically increment per-store inventory balances, and rate supplier performance.")
    ]
)

# ==========================================
# MODULE 8.7: FINANCIAL PAYMENT SETTLEMENT
# ==========================================
build_module_section_full(
    mod_num=7,
    title="Financial Payment Settlement",
    purpose="Records financial payments settled to suppliers against fulfilled Purchase Orders.",
    funcs=[
        "Admin logs payments settled against completed POs.",
        "Records payment mode (NEFT/RTGS, UPI, Cheque), transaction reference ID, and date.",
        "Maintains audit history of supplier disbursements."
    ],
    non_funcs=[
        "DECIMAL(12,2) financial precision preventing rounding loss.",
        "Strict transaction reference validation."
    ],
    ts_rows=[
        ["Payment Log", "Express API + MySQL", "Financial record keeping"],
        ["UI Settlement", "React Modal & Table", "Payment entry interface"]
    ],
    bote_rows=[
        ["Payments / Month", "5 - 10 settlements", "Monthly financial payouts"],
        ["Audit Logs", "Permanent retention", "Transaction audit trail"]
    ],
    flow_steps=[
        "Admin opens /admin/payments and selects a completed PO.",
        "Fills payment mode, transaction reference ID, and payment date.",
        "Express inserts payment row into tbl_Payment and marks PO payment status as 'Completed'.",
        "Payment register table updates immediately."
    ],
    arch_img="fig_8_7_A_payments_arch.png",
    arch_title="Low-level architecture – FINANCIAL PAYMENT SETTLEMENT",
    apis=[
        ["POST", "/api/payments", "Record a payment disbursement against a PO"],
        ["GET", "/api/payments", "Fetch all financial settlement records"]
    ],
    dbs=[
        ["tbl_Payment", "int_Payment_Id, txt_Payment_Code, txt_Transaction_Ref", "PRI, UNI", "Payment log table"],
        ["tbl_Purchase", "int_Purchase_Id, dbl_Total_Amount", "PRI", "Linked PO order value"]
    ],
    ui_figures=[
        ("8.7.1", "Financial Payment Settlement Register", "fig_8_7_1_payments_master.png", "The payment settlement log records financial disbursements against completed purchase orders, detailing payment modes (UPI, NEFT), bank transaction reference IDs, and payment dates.")
    ]
)

# ==========================================
# MODULE 8.8: REPORTS & BUSINESS ANALYTICS
# ==========================================
build_module_section_full(
    mod_num=8,
    title="Reports & Business Analytics",
    purpose="Provides executive analytics dashboards, dynamic searching, filtering, and printable PDF reports for management decision making.",
    funcs=[
        "Render stock status reports, requisition summaries, and supplier ledgers.",
        "Provide keyword searching with text highlighting across stores, items, and orders.",
        "Export printable PDF reports directly from the browser."
    ],
    non_funcs=[
        "PDF generation speed < 500ms.",
        "Client-side search response time < 50ms."
    ],
    ts_rows=[
        ["Analytics Rendering", "React 18 + Custom CSS", "Report formatting"],
        ["Printable PDF", "PrintableReport.jsx Component", "Browser print rendering"]
    ],
    bote_rows=[
        ["Report Generation", "20 reports/day", "Management requests"],
        ["Search Overhead", "< 5ms", "In-memory client filter"]
    ],
    flow_steps=[
        "Admin opens /admin/reports and selects filter criteria (Date, Store, Category).",
        "Reports.jsx fetches filtered aggregated dataset from backend API.",
        "Renders visual summary charts and formatted data tables.",
        "Admin clicks 'Print PDF' to invoke browser print renderer."
    ],
    arch_img="fig_8_8_A_analytics_arch.png",
    arch_title="Low-level architecture – REPORTS & BUSINESS ANALYTICS",
    apis=[
        ["GET", "/api/reports/summary", "Retrieve aggregated report dataset"],
        ["GET", "/api/reports/pdf", "Generate formatted PDF report data"]
    ],
    dbs=[
        ["tbl_Inventory_Request", "int_Request_Id, dec_Budget", "PRI", "Requisition statistics"],
        ["tbl_Purchase", "int_Purchase_Id, dbl_Total_Amount", "PRI", "Procurement expenditure"],
        ["tbl_Store_Stock", "int_Stock_Id, int_Current_Stock", "PRI", "Inventory balance analytics"]
    ],
    ui_figures=[
        ("8.8.1", "Business Analytics & Printable Reports", "fig_8_8_1_reports_analytics.png", "The analytics module provides category-wise expenditure reports, stock movement charts, supplier performance ledgers, and printable PDF export capabilities.")
    ]
)


# ==========================================
# MODULE TRACEABILITY MATRIX
# ==========================================
add_heading_2("8.9 Module Traceability Matrix")
add_p("The traceability matrix maps every system module to its corresponding frontend component, REST API route, Express controller, MySQL database table, and report figure:", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12)

tm_table = doc.add_table(rows=9, cols=6)
tm_headers = ["Module", "Frontend Page / Component", "API Route", "Controller / Service", "Database Table(s)", "Figure"]
for i, h in enumerate(tm_headers):
    tm_table.rows[0].cells[i].paragraphs[0].text = h

tm_data = [
    ["8.1 Auth", "Login.jsx", "/api/auth/login", "authController.js", "tbl_Admin, tbl_Store, tbl_Supplier", "Fig 8.1.1 / Fig 8.1.A"],
    ["8.2 Admin Dashboard", "Dashboard.jsx", "/api/reports/summary", "reportsController.js", "tbl_Admin, tbl_Purchase", "Fig 8.2.1 / Fig 8.2.A"],
    ["8.3 Master Data", "Stores.jsx, Items.jsx", "/api/stores, /api/items", "stores.js, items.js", "tbl_Store, tbl_Supplier, tbl_Item", "Fig 8.3.1 - 8.3.3 / Fig 8.3.A"],
    ["8.4 Requisitions", "RaiseRequirement.jsx", "/api/requirements", "requirements.js", "tbl_Inventory_Request, tbl_Request_Item", "Fig 8.4.1 - 8.4.3 / Fig 8.4.A"],
    ["8.5 Quotations & L1", "QuotationCompare.jsx", "/api/quotations/compare", "quotations.js", "tbl_Quotation, tbl_Quotation_Item", "Fig 8.5.1 - 8.5.3 / Fig 8.5.A"],
    ["8.6 Purchase Orders", "PurchaseOrders.jsx", "/api/purchases", "purchases.js", "tbl_Purchase, tbl_Store_Stock", "Fig 8.6.1 - 8.6.2 / Fig 8.6.A"],
    ["8.7 Payments", "Payments.jsx", "/api/payments", "payments.js", "tbl_Payment, tbl_Purchase", "Fig 8.7.1 / Fig 8.7.A"],
    ["8.8 Reports", "Reports.jsx", "/api/reports/pdf", "reportsController.js", "tbl_Purchase, tbl_Store_Stock", "Fig 8.8.1 / Fig 8.8.A"]
]

for idx, row in enumerate(tm_data):
    for c_idx, val in enumerate(row):
        tm_table.rows[idx+1].cells[c_idx].paragraphs[0].text = val

style_table(tm_table)
add_p("", space_after=18)

# ==========================================
# CHAPTER 9: CONCLUSION (PRESERVED EXACTLY)
# ==========================================
add_heading_1("CHAPTER 9\nCONCLUSION")
add_p("The Hostel Inventory Management System successfully replaces paper-based registers and manual quotation handling with an automated, transparent, and efficient web platform. By connecting Chief Wardens, Hostel Store In-Charges, and Suppliers into a unified digital workflow, the system enforces procurement deadlines, automates L1 supplier selection, maintains accurate per-store inventory balances, and maintains complete financial audit trails.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=12, line_spacing=1.2)
add_p("Future enhancements for the platform include barcode and QR code scanner integration for rapid stock audits, a native mobile application for store in-charges, and predictive stock reorder analytics based on historical consumption trends.", align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=18, line_spacing=1.2)

# Save to target path or alt path
try:
    doc.save(docx_path)
    print("Successfully saved patched master DOCX report to:", docx_path)
    convert(docx_path, pdf_path)
    print("Successfully converted patched master DOCX report to PDF:", pdf_path)
except Exception as e:
    print("Main path locked, saving to alt path:", e)
    doc.save(docx_alt_path)
    print("Saved patched master DOCX report to alt path:", docx_alt_path)
    convert(docx_alt_path, pdf_alt_path)
    print("Successfully converted patched master DOCX report to PDF:", pdf_alt_path)
