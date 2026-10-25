import os
import json
import time
from playwright.sync_api import sync_playwright

output_dir = r'c:\MWT_EL\Hostel_Inventory_System\Hostel_Inventory\hostel_inventory - Copy\scratch\screenshots'
os.makedirs(output_dir, exist_ok=True)

AUTH_KEY = 'hostel_ims_auth_v5'

admin_auth = {
    "isLoggedIn": True,
    "role": "admin",
    "user": {
        "id": 1,
        "name": "Chief Warden / Admin",
        "roleTitle": "Chief Warden / Admin",
        "code": "ADM001",
        "email": "24104063@nec.edu.in"
    },
    "currentStore": None
}

store_auth = {
    "isLoggedIn": True,
    "role": "store",
    "user": {
        "id": 1,
        "code": "STR-2026-001",
        "name": "Boys Hostel Store",
        "campus": "Boys Hostel",
        "incharge": "John",
        "email": "store001@hostel.edu",
        "roleTitle": "Store Manager (Boys Hostel Store)"
    },
    "currentStore": 1
}

supplier_auth = {
    "isLoggedIn": True,
    "role": "supplier",
    "user": {
        "id": 1,
        "code": "SUP-001",
        "name": "Ramesh Patel",
        "company": "Apex Traders",
        "phone": "9988776655",
        "email": "apex@traders.com",
        "roleTitle": "Supplier (Apex Traders)",
        "profileCompleted": True
    },
    "currentStore": None
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()

    # 1. Login Page (Logged Out)
    page.goto('http://localhost:3000/#login')
    page.evaluate('sessionStorage.clear()')
    page.reload()
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_1_1_login.png'))
    print('Captured fig_8_1_1_login.png')

    # Helper function to capture a page with auth and hash URL
    def capture_auth_page(hash_url, auth_obj, file_name, active_tab_key='admin'):
        page.goto('http://localhost:3000')
        auth_json = json.dumps(auth_obj)
        page.evaluate(f'sessionStorage.setItem("{AUTH_KEY}", \'{auth_json}\')')
        tab_name = hash_url.replace('#', '')
        page.evaluate(f'localStorage.setItem("app_active_tab_{active_tab_key}", "{tab_name}")')
        page.goto(f'http://localhost:3000/{hash_url}')
        page.reload()
        page.wait_for_timeout(1500)
        page.screenshot(path=os.path.join(output_dir, file_name))
        print(f'Captured {file_name} for {hash_url}')

    # --- ADMIN PAGES ---
    capture_auth_page('#dashboard', admin_auth, 'fig_8_2_1_admin_dashboard.png', 'admin')
    capture_auth_page('#stores', admin_auth, 'fig_8_3_1_stores_master.png', 'admin')
    capture_auth_page('#suppliers', admin_auth, 'fig_8_3_2_suppliers_master.png', 'admin')
    capture_auth_page('#inventory', admin_auth, 'fig_8_3_3_items_master.png', 'admin')
    capture_auth_page('#requirements', admin_auth, 'fig_8_4_1_admin_requirements.png', 'admin')
    capture_auth_page('#quotations', admin_auth, 'fig_8_5_1_quotation_compare.png', 'admin')
    capture_auth_page('#purchases', admin_auth, 'fig_8_6_1_purchase_orders.png', 'admin')
    capture_auth_page('#payments', admin_auth, 'fig_8_7_1_payments_master.png', 'admin')
    capture_auth_page('#reports', admin_auth, 'fig_8_8_1_reports_analytics.png', 'admin')

    # --- STORE PAGES ---
    capture_auth_page('#dashboard', store_auth, 'fig_8_4_2_store_dashboard.png', 'store')
    capture_auth_page('#raise', store_auth, 'fig_8_4_3_raise_requirement.png', 'store')
    capture_auth_page('#stock-update', store_auth, 'fig_8_6_2_store_stock_update.png', 'store')

    # --- SUPPLIER PAGES ---
    capture_auth_page('#dashboard', supplier_auth, 'fig_8_5_2_supplier_dashboard.png', 'supplier')
    capture_auth_page('#open-reqs', supplier_auth, 'fig_8_5_3_supplier_quote_entry.png', 'supplier')

    browser.close()
    print('Clean distinct screen captures completed successfully!')
