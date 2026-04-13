/** @odoo-module **/

/**
 * Patch for Invoice Lines, Sale Order Lines, Purchase Order Lines
 * These use product_label_section_and_note_field_o2m widget
 */

import { registry } from "@web/core/registry";
import { 
    ProductLabelSectionAndNoteOne2Many,
    ProductLabelSectionAndNoteListRender,
    productLabelSectionAndNoteOne2Many,
} from "@account/components/product_label_section_and_note_field/product_label_section_and_note_field_o2m";
import { 
    SectionAndNoteFieldOne2Many, 
    SectionAndNoteListRenderer,
    sectionAndNoteFieldOne2Many 
} from "@account/components/section_and_note_fields_backend/section_and_note_fields_backend";
import {
    SaleOrderLineOne2Many,
    SaleOrderLineListRenderer,
    saleOrderLineOne2Many,
} from "@sale/js/sale_order_line_field/sale_order_line_field";
import { useState, useEffect } from "@odoo/owl";
import { X2ManySearchBar } from "./x2many_search";

/**
 * Product Label Section and Note with Search (Invoice Lines, etc.)
 */
export class ProductLabelSearchField extends ProductLabelSectionAndNoteOne2Many {
    static template = "sm_x2many_search.SectionAndNoteSearchField";
    static components = {
        ...ProductLabelSectionAndNoteOne2Many.components,
        ListRenderer: ProductLabelSectionAndNoteListRender,
        X2ManySearchBar,
    };

    setup() {
        super.setup();
        this.searchState = useState({
            filters: [],
            mode: "or",
            hiddenCount: 0,
        });
        
        useEffect(
            () => {
                if (this.searchState?.filters?.length > 0) {
                    setTimeout(() => this.applyFilter(), 100);
                }
            },
            () => [this.props.record?.data?.[this.props.name]?.records?.length]
        );
    }

    get list() {
        if (!this.props.record?.data) return null;
        return this.props.record.data[this.props.name];
    }

    get searchableColumns() {
        const columns = [];
        const list = this.list;
        if (!list?.fields) return columns;

        for (const [name, field] of Object.entries(list.fields)) {
            if (name.startsWith("_") || name === "id" || name === "sequence") continue;
            columns.push({
                name: name,
                label: field.string || name,
                type: field.type,
                selection: field.selection,
            });
        }
        return columns;
    }

    get searchableRecords() {
        const list = this.list;
        if (!list?.records) return [];
        return list.records;
    }

    onSearchFilter({ filters, mode }) {
        this.searchState.filters = filters;
        this.searchState.mode = mode;
        this.applyFilter();
    }

    onClearFilter() {
        this.searchState.filters = [];
        this.searchState.hiddenCount = 0;
        this.showAllRows();
    }

    getDisplayValue(value, column) {
        if (value === null || value === undefined || value === false) {
            if (column.type === "boolean") return "No";
            return "";
        }

        switch (column.type) {
            case "many2one":
                return (value.display_name || value[1] || value.name || String(value)).toLowerCase();
            case "many2many":
            case "one2many":
                if (Array.isArray(value.records)) {
                    return value.records.map(r => r.data.display_name || r.data.name || "").join(" ").toLowerCase();
                }
                return "";
            case "selection":
                const sel = column.selection?.find(s => s[0] === value);
                return sel ? sel[1].toLowerCase() : String(value).toLowerCase();
            case "boolean":
                return value ? "yes" : "no";
            default:
                return String(value).toLowerCase();
        }
    }

    recordMatchesFilter(record, filter) {
        const col = filter.column;
        const rawValue = record.data[col.name];
        const displayValue = this.getDisplayValue(rawValue, col);
        const filterValue = String(filter.value || "").toLowerCase();

        switch (filter.operator) {
            case "is_set":
                return rawValue !== null && rawValue !== undefined && rawValue !== false && rawValue !== "";
            case "is_not_set":
                return rawValue === null || rawValue === undefined || rawValue === false || rawValue === "";
            case "contains":
                return displayValue.includes(filterValue);
            case "=":
                if (["integer", "float", "monetary"].includes(col.type)) {
                    return parseFloat(rawValue) === parseFloat(filter.value);
                }
                return displayValue === filterValue || rawValue === filter.value;
            case "!=":
                if (["integer", "float", "monetary"].includes(col.type)) {
                    return parseFloat(rawValue) !== parseFloat(filter.value);
                }
                return displayValue !== filterValue && rawValue !== filter.value;
            case ">":
                return parseFloat(rawValue) > parseFloat(filter.value);
            case ">=":
                return parseFloat(rawValue) >= parseFloat(filter.value);
            case "<":
                return parseFloat(rawValue) < parseFloat(filter.value);
            case "<=":
                return parseFloat(rawValue) <= parseFloat(filter.value);
            default:
                return displayValue.includes(filterValue);
        }
    }

    applyFilter() {
        const filters = this.searchState.filters;
        const records = this.searchableRecords;
        const mode = this.searchState.mode;

        if (!filters.length) {
            this.showAllRows();
            return;
        }

        const visibleIds = new Set();
        let hiddenCount = 0;

        records.forEach((record, index) => {
            const matches = filters.map(f => this.recordMatchesFilter(record, f));
            const visible = mode === "or" 
                ? matches.some(m => m) 
                : matches.every(m => m);

            if (visible) {
                visibleIds.add(index);
            } else {
                hiddenCount++;
            }
        });

        this.searchState.hiddenCount = hiddenCount;
        this.applyDomVisibility(visibleIds);
    }

    applyDomVisibility(visibleIds) {
        setTimeout(() => {
            const fieldEl = document.querySelector(`[name="${this.props.name}"]`);
            if (!fieldEl) return;

            const rows = fieldEl.querySelectorAll("tr.o_data_row");
            rows.forEach((row, index) => {
                row.style.display = visibleIds.has(index) ? "" : "none";
            });
        }, 50);
    }

    showAllRows() {
        setTimeout(() => {
            const fieldEl = document.querySelector(`[name="${this.props.name}"]`);
            if (!fieldEl) return;

            fieldEl.querySelectorAll("tr.o_data_row").forEach(row => {
                row.style.display = "";
            });
        }, 10);
    }
}

/**
 * Section and Note with Search (Journal Items, etc.)
 */
export class SectionAndNoteSearchField extends SectionAndNoteFieldOne2Many {
    static template = "sm_x2many_search.SectionAndNoteSearchField";
    static components = {
        ...SectionAndNoteFieldOne2Many.components,
        ListRenderer: SectionAndNoteListRenderer,
        X2ManySearchBar,
    };

    setup() {
        super.setup();
        this.searchState = useState({
            filters: [],
            mode: "or",
            hiddenCount: 0,
        });
        
        useEffect(
            () => {
                if (this.searchState?.filters?.length > 0) {
                    setTimeout(() => this.applyFilter(), 100);
                }
            },
            () => [this.props.record?.data?.[this.props.name]?.records?.length]
        );
    }

    get list() {
        if (!this.props.record?.data) return null;
        return this.props.record.data[this.props.name];
    }

    get searchableColumns() {
        const columns = [];
        const list = this.list;
        if (!list?.fields) return columns;

        for (const [name, field] of Object.entries(list.fields)) {
            if (name.startsWith("_") || name === "id" || name === "sequence") continue;
            columns.push({
                name: name,
                label: field.string || name,
                type: field.type,
                selection: field.selection,
            });
        }
        return columns;
    }

    get searchableRecords() {
        const list = this.list;
        if (!list?.records) return [];
        return list.records;
    }

    onSearchFilter({ filters, mode }) {
        this.searchState.filters = filters;
        this.searchState.mode = mode;
        this.applyFilter();
    }

    onClearFilter() {
        this.searchState.filters = [];
        this.searchState.hiddenCount = 0;
        this.showAllRows();
    }

    getDisplayValue(value, column) {
        if (value === null || value === undefined || value === false) {
            if (column.type === "boolean") return "No";
            return "";
        }

        switch (column.type) {
            case "many2one":
                return (value.display_name || value[1] || value.name || String(value)).toLowerCase();
            case "many2many":
            case "one2many":
                if (Array.isArray(value.records)) {
                    return value.records.map(r => r.data.display_name || r.data.name || "").join(" ").toLowerCase();
                }
                return "";
            case "selection":
                const sel = column.selection?.find(s => s[0] === value);
                return sel ? sel[1].toLowerCase() : String(value).toLowerCase();
            case "boolean":
                return value ? "yes" : "no";
            default:
                return String(value).toLowerCase();
        }
    }

    recordMatchesFilter(record, filter) {
        const col = filter.column;
        const rawValue = record.data[col.name];
        const displayValue = this.getDisplayValue(rawValue, col);
        const filterValue = String(filter.value || "").toLowerCase();

        switch (filter.operator) {
            case "is_set":
                return rawValue !== null && rawValue !== undefined && rawValue !== false && rawValue !== "";
            case "is_not_set":
                return rawValue === null || rawValue === undefined || rawValue === false || rawValue === "";
            case "contains":
                return displayValue.includes(filterValue);
            case "=":
                if (["integer", "float", "monetary"].includes(col.type)) {
                    return parseFloat(rawValue) === parseFloat(filter.value);
                }
                return displayValue === filterValue || rawValue === filter.value;
            case "!=":
                if (["integer", "float", "monetary"].includes(col.type)) {
                    return parseFloat(rawValue) !== parseFloat(filter.value);
                }
                return displayValue !== filterValue && rawValue !== filter.value;
            case ">":
                return parseFloat(rawValue) > parseFloat(filter.value);
            case ">=":
                return parseFloat(rawValue) >= parseFloat(filter.value);
            case "<":
                return parseFloat(rawValue) < parseFloat(filter.value);
            case "<=":
                return parseFloat(rawValue) <= parseFloat(filter.value);
            default:
                return displayValue.includes(filterValue);
        }
    }

    applyFilter() {
        const filters = this.searchState.filters;
        const records = this.searchableRecords;
        const mode = this.searchState.mode;

        if (!filters.length) {
            this.showAllRows();
            return;
        }

        const visibleIds = new Set();
        let hiddenCount = 0;

        records.forEach((record, index) => {
            const matches = filters.map(f => this.recordMatchesFilter(record, f));
            const visible = mode === "or" 
                ? matches.some(m => m) 
                : matches.every(m => m);

            if (visible) {
                visibleIds.add(index);
            } else {
                hiddenCount++;
            }
        });

        this.searchState.hiddenCount = hiddenCount;
        this.applyDomVisibility(visibleIds);
    }

    applyDomVisibility(visibleIds) {
        setTimeout(() => {
            const fieldEl = document.querySelector(`[name="${this.props.name}"]`);
            if (!fieldEl) return;

            const rows = fieldEl.querySelectorAll("tr.o_data_row");
            rows.forEach((row, index) => {
                row.style.display = visibleIds.has(index) ? "" : "none";
            });
        }, 50);
    }

    showAllRows() {
        setTimeout(() => {
            const fieldEl = document.querySelector(`[name="${this.props.name}"]`);
            if (!fieldEl) return;

            fieldEl.querySelectorAll("tr.o_data_row").forEach(row => {
                row.style.display = "";
            });
        }, 10);
    }
}

// Register custom widget names
export const productLabelSearchField = {
    ...productLabelSectionAndNoteOne2Many,
    component: ProductLabelSearchField,
};

export const sectionAndNoteSearchField = {
    ...sectionAndNoteFieldOne2Many,
    component: SectionAndNoteSearchField,
};

/**
 * Sale Order Line with Search
 */
export class SaleOrderLineSearchField extends SaleOrderLineOne2Many {
    static template = "sm_x2many_search.SectionAndNoteSearchField";
    static components = {
        ...SaleOrderLineOne2Many.components,
        ListRenderer: SaleOrderLineListRenderer,
        X2ManySearchBar,
    };

    setup() {
        super.setup();
        this.searchState = useState({
            filters: [],
            mode: "or",
            hiddenCount: 0,
        });
        
        useEffect(
            () => {
                if (this.searchState?.filters?.length > 0) {
                    setTimeout(() => this.applyFilter(), 100);
                }
            },
            () => [this.props.record?.data?.[this.props.name]?.records?.length]
        );
    }

    get list() {
        if (!this.props.record?.data) return null;
        return this.props.record.data[this.props.name];
    }

    get searchableColumns() {
        const columns = [];
        const list = this.list;
        if (!list?.fields) return columns;

        for (const [name, field] of Object.entries(list.fields)) {
            if (name.startsWith("_") || name === "id" || name === "sequence") continue;
            columns.push({
                name: name,
                label: field.string || name,
                type: field.type,
                selection: field.selection,
            });
        }
        return columns;
    }

    get searchableRecords() {
        const list = this.list;
        if (!list?.records) return [];
        return list.records;
    }

    onSearchFilter({ filters, mode }) {
        this.searchState.filters = filters;
        this.searchState.mode = mode;
        this.applyFilter();
    }

    onClearFilter() {
        this.searchState.filters = [];
        this.searchState.hiddenCount = 0;
        this.showAllRows();
    }

    getDisplayValue(value, column) {
        if (value === null || value === undefined || value === false) {
            if (column.type === "boolean") return "No";
            return "";
        }

        switch (column.type) {
            case "many2one":
                return (value.display_name || value[1] || value.name || String(value)).toLowerCase();
            case "many2many":
            case "one2many":
                if (Array.isArray(value.records)) {
                    return value.records.map(r => r.data.display_name || r.data.name || "").join(" ").toLowerCase();
                }
                return "";
            case "selection":
                const sel = column.selection?.find(s => s[0] === value);
                return sel ? sel[1].toLowerCase() : String(value).toLowerCase();
            case "boolean":
                return value ? "yes" : "no";
            default:
                return String(value).toLowerCase();
        }
    }

    recordMatchesFilter(record, filter) {
        const col = filter.column;
        const rawValue = record.data[col.name];
        const displayValue = this.getDisplayValue(rawValue, col);
        const filterValue = String(filter.value || "").toLowerCase();

        switch (filter.operator) {
            case "is_set":
                return rawValue !== null && rawValue !== undefined && rawValue !== false && rawValue !== "";
            case "is_not_set":
                return rawValue === null || rawValue === undefined || rawValue === false || rawValue === "";
            case "contains":
                return displayValue.includes(filterValue);
            case "=":
                if (["integer", "float", "monetary"].includes(col.type)) {
                    return parseFloat(rawValue) === parseFloat(filter.value);
                }
                return displayValue === filterValue || rawValue === filter.value;
            case "!=":
                if (["integer", "float", "monetary"].includes(col.type)) {
                    return parseFloat(rawValue) !== parseFloat(filter.value);
                }
                return displayValue !== filterValue && rawValue !== filter.value;
            case ">":
                return parseFloat(rawValue) > parseFloat(filter.value);
            case ">=":
                return parseFloat(rawValue) >= parseFloat(filter.value);
            case "<":
                return parseFloat(rawValue) < parseFloat(filter.value);
            case "<=":
                return parseFloat(rawValue) <= parseFloat(filter.value);
            default:
                return displayValue.includes(filterValue);
        }
    }

    applyFilter() {
        const filters = this.searchState.filters;
        const records = this.searchableRecords;
        const mode = this.searchState.mode;

        if (!filters.length) {
            this.showAllRows();
            return;
        }

        const visibleIds = new Set();
        let hiddenCount = 0;

        records.forEach((record, index) => {
            const matches = filters.map(f => this.recordMatchesFilter(record, f));
            const visible = mode === "or" 
                ? matches.some(m => m) 
                : matches.every(m => m);

            if (visible) {
                visibleIds.add(index);
            } else {
                hiddenCount++;
            }
        });

        this.searchState.hiddenCount = hiddenCount;
        this.applyDomVisibility(visibleIds);
    }

    applyDomVisibility(visibleIds) {
        setTimeout(() => {
            const fieldEl = document.querySelector(`[name="${this.props.name}"]`);
            if (!fieldEl) return;

            const rows = fieldEl.querySelectorAll("tr.o_data_row");
            rows.forEach((row, index) => {
                row.style.display = visibleIds.has(index) ? "" : "none";
            });
        }, 50);
    }

    showAllRows() {
        setTimeout(() => {
            const fieldEl = document.querySelector(`[name="${this.props.name}"]`);
            if (!fieldEl) return;

            fieldEl.querySelectorAll("tr.o_data_row").forEach(row => {
                row.style.display = "";
            });
        }, 10);
    }
}

export const saleOrderLineSearchField = {
    ...saleOrderLineOne2Many,
    component: SaleOrderLineSearchField,
};

// Override default widgets with search-enabled versions
registry.category("fields").add("product_label_section_and_note_field_o2m", productLabelSearchField, { force: true });
registry.category("fields").add("section_and_note_one2many", sectionAndNoteSearchField, { force: true });
registry.category("fields").add("sol_o2m", saleOrderLineSearchField, { force: true });
