import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

output_dir = r'c:\MWT_EL\Hostel_Inventory_System\Hostel_Inventory\hostel_inventory - Copy\scratch\screenshots'
os.makedirs(output_dir, exist_ok=True)

# Function to draw a clean low-level architectural flowchart using matplotlib
def draw_architecture_diagram(filename, title, boxes, flow_arrows):
    fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')
    
    # Title Banner
    ax.text(5, 4.6, title, fontsize=12, fontweight='bold', ha='center', va='center', fontfamily='sans-serif', color='#1E293B')
    
    # Colors for layers
    colors = {
        'Client': '#E0F2FE',     # Light Blue
        'Service': '#FFE4E6',    # Light Red/Pink
        'Controller': '#FEF3C7', # Light Yellow
        'Database': '#DCFCE7'    # Light Green
    }
    borders = {
        'Client': '#0284C7',
        'Service': '#E11D48',
        'Controller': '#D97706',
        'Database': '#16A34A'
    }
    
    # Render Boxes
    # format of box: (x, y, w, h, text, layer_type)
    for box in boxes:
        x, y, w, h, text, ltype = box
        c_bg = colors.get(ltype, '#F1F5F9')
        c_bd = borders.get(ltype, '#475569')
        
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1,rounding_size=0.15", ec=c_bd, fc=c_bg, lw=1.5)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, fontsize=9, fontweight='bold', ha='center', va='center', color='#0F172A', wrap=True)
        
    # Render Arrows
    # format of arrow: (x1, y1, x2, y2, label)
    for arr in flow_arrows:
        x1, y1, x2, y2, label = arr
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color="#334155", lw=1.8, mutation_scale=15))
        if label:
            mx, my = (x1 + x2)/2, (y1 + y2)/2
            ax.text(mx, my + 0.15, label, fontsize=8, color="#0F172A", ha='center', va='bottom', fontweight='bold', bbox=dict(boxstyle="square,pad=0.1", fc="#FFFFFF", ec="none", alpha=0.8))
            
    plt.tight_layout()
    save_path = os.path.join(output_dir, filename)
    plt.savefig(save_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f'Generated diagram image: {filename}')


# 1. Module 8.1 Auth Arch Diagram
boxes_81 = [
    (0.5, 2.8, 1.8, 1.0, "React UI Page\n(Login.jsx)", "Client"),
    (0.5, 1.0, 1.8, 1.0, "Auth State\n(AuthContext.jsx)", "Client"),
    (3.8, 2.8, 2.4, 1.0, "Express Auth Router\n(/api/auth/login & OTP)", "Controller"),
    (3.8, 1.0, 2.4, 1.0, "Auth & SMS Service\n(smsService.js)", "Service"),
    (7.5, 2.8, 2.0, 1.0, "MySQL User Tables\n(tbl_Admin / Store)", "Database"),
    (7.5, 1.0, 2.0, 1.0, "Supplier Register\n(tbl_Supplier)", "Database")
]
arrows_81 = [
    (2.3, 3.3, 3.8, 3.3, "POST Auth Creds"),
    (1.4, 2.8, 1.4, 2.0, "Save Session"),
    (6.2, 3.3, 7.5, 3.3, "Verify SQL Creds"),
    (3.8, 1.5, 2.3, 1.5, "Verify Mobile OTP"),
    (6.2, 1.5, 7.5, 1.5, "Update OTP Status")
]
draw_architecture_diagram("fig_8_1_A_auth_arch.png", "Fig 8.1.A Low-level architecture – USER AUTHENTICATION & ROLE SELECTION", boxes_81, arrows_81)


# 2. Module 8.2 Admin Dashboard Arch Diagram
boxes_82 = [
    (0.5, 2.0, 2.0, 1.2, "Admin Dashboard\n(Dashboard.jsx)", "Client"),
    (3.8, 2.0, 2.4, 1.2, "Express Controller\n(reportsController.js)", "Controller"),
    (7.5, 3.0, 2.0, 1.0, "MySQL Analytics\n(tbl_Store / Supplier)", "Database"),
    (7.5, 1.0, 2.0, 1.0, "Email Audit Logs\n(tbl_Email_Log)", "Database")
]
arrows_82 = [
    (2.5, 2.6, 3.8, 2.6, "GET /reports/summary"),
    (6.2, 2.8, 7.5, 3.5, "Aggregate Counts"),
    (6.2, 2.4, 7.5, 1.5, "Query Email Logs")
]
draw_architecture_diagram("fig_8_2_A_dashboard_arch.png", "Fig 8.2.A Low-level architecture – ADMIN DASHBOARD & SYSTEM ANALYTICS", boxes_82, arrows_82)


# 3. Module 8.3 Master Data Arch Diagram
boxes_83 = [
    (0.5, 2.0, 2.0, 1.2, "Master Data UI\n(Stores / Items.jsx)", "Client"),
    (3.8, 2.0, 2.4, 1.2, "Express Controllers\n(stores.js / items.js)", "Controller"),
    (7.5, 3.0, 2.0, 1.0, "Master Catalog\n(tbl_Store / Supplier)", "Database"),
    (7.5, 1.0, 2.0, 1.0, "Items & Stock\n(tbl_Item / Store_Stock)", "Database")
]
arrows_83 = [
    (2.5, 2.6, 3.8, 2.6, "CRUD /api/items"),
    (6.2, 2.8, 7.5, 3.5, "SELECT / INSERT"),
    (6.2, 2.4, 7.5, 1.5, "Update Thresholds")
]
draw_architecture_diagram("fig_8_3_A_masterdata_arch.png", "Fig 8.3.A Low-level architecture – MASTER DATA MANAGEMENT", boxes_83, arrows_83)


# 4. Module 8.4 Requisitions Arch Diagram
boxes_84 = [
    (0.5, 3.0, 2.0, 1.0, "Admin Requisitions\n(Requirements.jsx)", "Client"),
    (0.5, 1.0, 2.0, 1.0, "Store Requisition\n(RaiseRequirement.jsx)", "Client"),
    (3.8, 2.0, 2.4, 1.2, "Requisition Controller\n(requirements.js)", "Controller"),
    (7.5, 3.0, 2.0, 1.0, "Window Settings\n(tbl_Requirement_Period)", "Database"),
    (7.5, 1.0, 2.0, 1.0, "Store Requests\n(tbl_Inventory_Request)", "Database")
]
arrows_84 = [
    (2.5, 3.5, 3.8, 2.8, "Configure Window"),
    (2.5, 1.5, 3.8, 2.2, "POST Requisition"),
    (6.2, 2.8, 7.5, 3.5, "Check Deadline"),
    (6.2, 2.2, 7.5, 1.5, "Save Request & Items")
]
draw_architecture_diagram("fig_8_4_A_requisitions_arch.png", "Fig 8.4.A Low-level architecture – STORE REQUISITIONS & REQUIREMENT PERIOD", boxes_84, arrows_84)


# 5. Module 8.5 Quotations Arch Diagram
boxes_85 = [
    (0.5, 3.0, 2.0, 1.0, "L1 Compare Engine\n(QuotationCompare.jsx)", "Client"),
    (0.5, 1.0, 2.0, 1.0, "Supplier Bidding\n(Requirements.jsx)", "Client"),
    (3.8, 2.0, 2.4, 1.2, "L1 Evaluation Engine\n(quotations.js)", "Controller"),
    (7.5, 2.0, 2.0, 1.2, "Supplier Bids\n(tbl_Quotation & Item)", "Database")
]
arrows_85 = [
    (2.5, 1.5, 3.8, 2.2, "POST Supplier Quote"),
    (2.5, 3.5, 3.8, 2.8, "Execute L1 Algorithm"),
    (6.2, 2.6, 7.5, 2.6, "Compare Unit Prices")
]
draw_architecture_diagram("fig_8_5_A_quotations_arch.png", "Fig 8.5.A Low-level architecture – SUPPLIER QUOTATIONS & L1 COMPARISON", boxes_85, arrows_85)


# 6. Module 8.6 Purchase Orders Arch Diagram
boxes_86 = [
    (0.5, 3.0, 2.0, 1.0, "PO Management\n(PurchaseOrders.jsx)", "Client"),
    (0.5, 1.0, 2.0, 1.0, "Stock Update UI\n(StockUpdate.jsx)", "Client"),
    (3.8, 2.0, 2.4, 1.2, "PO & Receipt Controller\n(purchases.js)", "Controller"),
    (7.5, 3.0, 2.0, 1.0, "Purchase Register\n(tbl_Purchase)", "Database"),
    (7.5, 1.0, 2.0, 1.0, "Atomic Store Stock\n(tbl_Store_Stock)", "Database")
]
arrows_86 = [
    (2.5, 3.5, 3.8, 2.8, "Issue PO to L1"),
    (2.5, 1.5, 3.8, 2.2, "Confirm Receipt"),
    (6.2, 2.8, 7.5, 3.5, "Save PO Record"),
    (6.2, 2.2, 7.5, 1.5, "Increment Stock Balance")
]
draw_architecture_diagram("fig_8_6_A_purchases_arch.png", "Fig 8.6.A Low-level architecture – PURCHASE ORDERS & GOODS RECEIPT", boxes_86, arrows_86)


# 7. Module 8.7 Payments Arch Diagram
boxes_87 = [
    (0.5, 2.0, 2.0, 1.2, "Payment Settlement\n(Payments.jsx)", "Client"),
    (3.8, 2.0, 2.4, 1.2, "Payment Controller\n(payments.js)", "Controller"),
    (7.5, 3.0, 2.0, 1.0, "PO Financial Status\n(tbl_Purchase)", "Database"),
    (7.5, 1.0, 2.0, 1.0, "Payment Records\n(tbl_Payment)", "Database")
]
arrows_87 = [
    (2.5, 2.6, 3.8, 2.6, "POST /api/payments"),
    (6.2, 2.8, 7.5, 3.5, "Update PO Status"),
    (6.2, 2.4, 7.5, 1.5, "Insert Transaction Log")
]
draw_architecture_diagram("fig_8_7_A_payments_arch.png", "Fig 8.7.A Low-level architecture – FINANCIAL PAYMENT SETTLEMENT", boxes_87, arrows_87)


# 8. Module 8.8 Analytics Arch Diagram
boxes_88 = [
    (0.5, 2.0, 2.0, 1.2, "Reports & Analytics\n(Reports.jsx)", "Client"),
    (3.8, 2.0, 2.4, 1.2, "Reports Controller\n(reportsController.js)", "Controller"),
    (7.5, 3.0, 2.0, 1.0, "Expenditure Data\n(tbl_Purchase / Payment)", "Database"),
    (7.5, 1.0, 2.0, 1.0, "Stock Analytics\n(tbl_Store_Stock)", "Database")
]
arrows_88 = [
    (2.5, 2.6, 3.8, 2.6, "GET /reports/pdf"),
    (6.2, 2.8, 7.5, 3.5, "Query Spending Stats"),
    (6.2, 2.4, 7.5, 1.5, "Query Inventory Balance")
]
draw_architecture_diagram("fig_8_8_A_analytics_arch.png", "Fig 8.8.A Low-level architecture – REPORTS & BUSINESS ANALYTICS", boxes_88, arrows_88)

print("All 8 low-level architecture diagram images generated successfully!")
