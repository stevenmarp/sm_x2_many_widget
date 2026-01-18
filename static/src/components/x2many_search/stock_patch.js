/** @odoo-module **/

/**
 * Patch for Stock and MRP widgets
 * - stock_move_one2many (MRP Components, Stock Moves)
 * - sml_x2_many (Stock Move Lines)
 */

import { registry } from "@web/core/registry";
import { 
    StockMoveX2ManyField,
    MovesListRenderer,
    stockMoveX2ManyField,
} from "@stock/views/picking_form/stock_move_one2many";
import {
    SMLX2ManyField,
} from "@stock/fields/stock_move_line_x2_many_field";
import { x2ManyField } from "@web/views/fields/x2many/x2many_field";
import { useState, useEffect } from "@odoo/owl";
import { X2ManySearchBar } from "./x2many_search";

/**
 * Stock Move with Search (MRP Components, etc.)
 */
export class StockMoveSearchField extends StockMoveX2ManyField {
    static template = "sm_x2many_search.SectionAndNoteSearchField";
    static components = {
        ...StockMoveX2ManyField.components,
        ListRenderer: MovesListRenderer,
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
 * Stock Move Line with Search
 */
export class SMLSearchField extends SMLX2ManyField {
    static template = "sm_x2many_search.SectionAndNoteSearchField";
    static components = {
        ...SMLX2ManyField.components,
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

// Register widgets
export const stockMoveSearchField = {
    ...stockMoveX2ManyField,
    component: StockMoveSearchField,
};

export const smlSearchField = {
    ...x2ManyField,
    component: SMLSearchField,
    additionalClasses: [...x2ManyField.additionalClasses || [], "o_field_one2many"],
};

// Override default widgets
registry.category("fields").add("stock_move_one2many", stockMoveSearchField, { force: true });
registry.category("fields").add("sml_x2_many", smlSearchField, { force: true });
