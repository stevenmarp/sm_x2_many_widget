{
    'name': 'X2Many Search Widget',
    'version': '18.0.1.0.0',
    'category': 'Extra Tools',
    'summary': 'Instant search for One2Many and Many2Many fields - Invoice Lines, Sale Orders, Purchase Orders, Stock Moves & more!',
    'description': """
X2Many Search Widget
====================

A powerful and elegant search widget that adds instant search capabilities to ALL One2Many and Many2Many fields in Odoo.

🚀 Key Features
---------------
* ⚡ Instant Filtering - Real-time search without database queries
* 🔄 Zero Configuration - Just install and it works automatically!
* 📊 Multi-Column Search - Search across any visible column
* 🏷️ Smart Filter Tags - Visual tags with easy removal
* 🔢 Advanced Operators - Support >, <, >=, <=, != for numeric/date fields
* 🔀 AND/OR Mode - Combine multiple filters with logic operators
* 📱 Row Counter Badge - Shows filtered count vs total (e.g., "5/100")
* ⌨️ Keyboard Shortcuts - Full keyboard navigation support
* 🎨 Modern UI - Beautiful glassmorphism design matching Odoo 18

✅ Automatically Works With
--------------------------
* Invoice Lines (Customer Invoices, Vendor Bills)
* Sale Order Lines (Quotations, Sales Orders)
* Purchase Order Lines (RFQs, Purchase Orders)
* Journal Items (Accounting Entries)
* Manufacturing Components (BoM Lines, Work Orders)
* Stock Move Lines (Delivery, Receipt Operations)
* ANY One2Many/Many2Many Field!

⌨️ Keyboard Shortcuts
--------------------
* Type anything: Start searching
* Enter: Apply first suggestion
* Escape: Clear filters / Close dropdown
* Alt+Shift+W: Toggle AND/OR mode
* ↑/↓: Navigate suggestions

🔧 Supported Field Types
-----------------------
* Text / Char: Contains search (case-insensitive)
* Integer / Float / Monetary: Exact match or comparison
* Many2One: Display name search
* Selection: Value and label search
* Boolean: Yes / No keywords
* Date / DateTime: Date comparison

📋 Requirements
--------------
* Odoo 18.0 (Community or Enterprise)

    """,
    'author': 'Steven Marp',
    'website': 'https://apps.odoo.com/apps/browse?repo_maintainer_id=512936',
    'license': 'OPL-1',
    'price': 120,
    'currency': 'USD',
    'depends': ['web', 'account', 'sale', 'stock'],
    'assets': {
        'web.assets_backend': [
            'sm_x2_many_widget/static/src/components/x2many_search/x2many_search.js',
            'sm_x2_many_widget/static/src/components/x2many_search/x2many_search.xml',
            'sm_x2_many_widget/static/src/components/x2many_search/x2many_search.scss',
            'sm_x2_many_widget/static/src/components/x2many_search/section_and_note_patch.js',
            'sm_x2_many_widget/static/src/components/x2many_search/stock_patch.js',
        ],
    },
    'images': [
        'static/description/banner.gif',
        'static/description/icon.png',
    ],
    'installable': True,
    'auto_install': False,
    'application': False,
}
