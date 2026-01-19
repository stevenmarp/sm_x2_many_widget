# X2Many Search Widget for Odoo

## Overview

A powerful and elegant search widget that adds instant search capabilities to all One2Many and Many2Many fields in Odoo. Search through invoice lines, sale order lines, purchase order lines, stock moves, and any other x2many field with a native-like experience.

## 🚀 Features

- ✅ **Instant Search** - Filter x2many records in real-time without database queries
- ✅ **Universal Support** - Works on Invoice Lines, Sale Order Lines, Purchase Order Lines, Stock Moves, and ALL x2many fields
- ✅ **Multi-Column Search** - Search across any visible column (product, description, quantity, price, etc.)
- ✅ **Smart Suggestions** - Auto-complete suggestions based on actual data values
- ✅ **Advanced Operators** - Support for =, !=, >, <, >=, <= operators for numeric/date fields
- ✅ **Multiple Filters** - Combine multiple filters with AND/OR logic
- ✅ **Filter Tags** - Visual tags showing active filters with easy removal
- ✅ **Row Counter Badge** - Shows filtered count vs total (e.g., "5/100")
- ✅ **Keyboard Shortcuts** - Full keyboard navigation support
- ✅ **Modern UI** - Beautiful glassmorphism design that matches Odoo 18 aesthetics
- ✅ **Zero Configuration** - Works automatically after installation, no XML changes needed!

## 📸 Screenshots

### Search Bar in Invoice Lines
![Invoice Lines Search](static/description/screenshot_invoice.png)

### Multi-Filter with Tags
![Filter Tags](static/description/screenshot_filters.png)

### Sale Order Lines
![Sale Order Lines](static/description/screenshot_sale.png)

## 📦 Installation

1. Download the module from Odoo Apps Store
2. Place the module in your Odoo addons directory
3. Update the apps list: `Settings > Apps > Update Apps List`
4. Search for "X2Many Search Widget" and click Install
5. **Done!** All x2many fields now have search capability

## 📱 How to Use

1. Open any form with x2many lines (Invoice, Sale Order, Purchase Order, etc.)
2. You'll see a search bar above the lines table
3. Click the search bar or type to start searching
4. Select a column from suggestions or type to search all columns
5. Add multiple filters and toggle AND/OR mode as needed
6. Click the X on filter tags to remove individual filters
7. Press Escape or click "Clear All" to reset

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Type | Start searching |
| Enter | Apply first suggestion |
| Escape | Clear filters / Close dropdown |
| Alt+Shift+W | Toggle AND/OR mode |
| ↑ / ↓ | Navigate suggestions |

## 🔧 Supported Field Types

| Field Type | Search Method |
|------------|--------------|
| Char / Text | Contains (case-insensitive) |
| Integer / Float | Exact match or operators (>, <, >=, <=, !=) |
| Many2One | Display name search |
| Selection | Both value and display label |
| Boolean | Yes / No |
| Date / DateTime | Date comparison with operators |
| Monetary | Amount comparison |

## 🎯 Supported Widgets (Auto-Applied)

This module automatically patches ALL these x2many widgets:

- ✅ `one2many` - All default one2many fields
- ✅ `many2many` - All default many2many fields
- ✅ `product_label_section_and_note_field_o2m` - Invoice Lines, Purchase Lines
- ✅ `section_and_note_one2many` - Journal Items
- ✅ `sol_o2m` - Sale Order Lines
- ✅ `stock_move_one2many` - Manufacturing Components, Stock Moves
- ✅ `sml_x2_many` - Stock Move Lines (Detailed Operations)

## 💡 Perfect For

- Searching through large invoice/order lines
- Finding specific products in manufacturing orders
- Filtering journal items by account or amount
- Quick lookup in stock move operations
- Any scenario with many x2many records!

## 🔧 Technical Details

- **Pure Frontend** - No backend dependencies, instant filtering
- **OWL 2.x Framework** - Modern component-based architecture
- **Registry Override** - Auto-applies using `{ force: true }`
- **Efficient Filtering** - Filters in-memory without API calls
- **Lightweight** - Minimal performance impact

## 📋 Requirements

- Odoo 18.0 (Community or Enterprise)

## 📄 License

This module is licensed under Odoo Proprietary License v1.0 (OPL-1).

## 👤 Author

**Steven Marp**

- Odoo Apps: [https://apps.odoo.com/apps/browse?repo_maintainer_id=512936](https://apps.odoo.com/apps/browse?repo_maintainer_id=512936)
- GitHub: [https://github.com/stevenmarp](https://github.com/stevenmarp)

## 🆘 Support

For support, please contact through Odoo Apps Store or create an issue on GitHub.

---

*Make your Odoo experience faster with instant x2many search!*
