import os
import time
from playwright.sync_api import sync_playwright

output_dir = r'c:\MWT_EL\Hostel_Inventory_System\Hostel_Inventory\hostel_inventory - Copy\scratch\screenshots'
os.makedirs(output_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()

    # 1. Login Page
    page.goto('http://localhost:3000')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_2_1_login.png'))
    print('Captured fig_8_2_1_login.png')

    # --- ADMIN ROLE CAPTURES ---
    page.goto('http://localhost:3000')
    page.wait_for_timeout(500)
    
    try:
        page.fill('input[type="email"], input[type="text"]', '24104063@nec.edu.in')
        page.fill('input[type="password"]', 'admin')
        page.click('button[type="submit"]')
        page.wait_for_timeout(1500)
    except Exception as e:
        print('Admin login click error:', e)

    page.goto('http://localhost:3000/admin/dashboard')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_8_1_admin_dashboard.png'))
    print('Captured fig_8_8_1_admin_dashboard.png')

    page.goto('http://localhost:3000/admin/stores')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_3_1_stores_master.png'))
    print('Captured fig_8_3_1_stores_master.png')

    page.goto('http://localhost:3000/admin/suppliers')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_3_4_suppliers_master.png'))
    print('Captured fig_8_3_4_suppliers_master.png')

    page.goto('http://localhost:3000/admin/inventory')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_3_7_items_master.png'))
    print('Captured fig_8_3_7_items_master.png')

    page.goto('http://localhost:3000/admin/requirements')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_4_1_admin_requirements.png'))
    print('Captured fig_8_4_1_admin_requirements.png')

    page.goto('http://localhost:3000/admin/quotations/compare')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_5_1_quotation_compare.png'))
    print('Captured fig_8_5_1_quotation_compare.png')

    page.goto('http://localhost:3000/admin/purchases')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_6_1_purchase_orders.png'))
    print('Captured fig_8_6_1_purchase_orders.png')

    page.goto('http://localhost:3000/admin/payments')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_7_1_payments_master.png'))
    print('Captured fig_8_7_1_payments_master.png')

    page.goto('http://localhost:3000/admin/reports')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_8_2_reports_analytics.png'))
    print('Captured fig_8_8_2_reports_analytics.png')

    # --- STORE ROLE CAPTURES ---
    page.evaluate('localStorage.clear(); sessionStorage.clear();')
    page.goto('http://localhost:3000')
    page.wait_for_timeout(500)

    try:
        if page.locator('button:has-text("Store")').count() > 0:
            page.click('button:has-text("Store")')
        page.fill('input[type="email"], input[type="text"]', 'str-2026-001')
        page.fill('input[type="password"]', 'storepassword')
        page.click('button[type="submit"]')
        page.wait_for_timeout(1000)
    except Exception as e:
        print('Store login error:', e)

    page.goto('http://localhost:3000/store/dashboard')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_4_2_store_dashboard.png'))
    print('Captured fig_8_4_2_store_dashboard.png')

    page.goto('http://localhost:3000/store/raise-requirement')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_4_3_raise_requirement.png'))
    print('Captured fig_8_4_3_raise_requirement.png')

    page.goto('http://localhost:3000/store/stock-update')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_6_2_store_stock_update.png'))
    print('Captured fig_8_6_2_store_stock_update.png')

    # --- SUPPLIER ROLE CAPTURES ---
    page.evaluate('localStorage.clear(); sessionStorage.clear();')
    page.goto('http://localhost:3000')
    page.wait_for_timeout(500)

    try:
        if page.locator('button:has-text("Supplier")').count() > 0:
            page.click('button:has-text("Supplier")')
        page.fill('input[type="email"], input[type="text"]', 'apex@traders.com')
        page.fill('input[type="password"]', 'supplier123')
        page.click('button[type="submit"]')
        page.wait_for_timeout(1000)
    except Exception as e:
        print('Supplier login error:', e)

    page.goto('http://localhost:3000/supplier/dashboard')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_5_2_supplier_dashboard.png'))
    print('Captured fig_8_5_2_supplier_dashboard.png')

    page.goto('http://localhost:3000/supplier/requirements')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(output_dir, 'fig_8_5_3_supplier_quote_entry.png'))
    print('Captured fig_8_5_3_supplier_quote_entry.png')

    browser.close()
    print('All screen captures completed successfully!')
