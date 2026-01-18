/** @odoo-module **/

import { registry } from "@web/core/registry";
import { X2ManyField, x2ManyField } from "@web/views/fields/x2many/x2many_field";
import { Component, useState, useRef, onMounted, onWillUnmount, useEffect } from "@odoo/owl";
import { formatDate, formatDateTime } from "@web/core/l10n/dates";

/**
 * X2Many Search Widget - Native-like Search Bar
 * 
 * Flow (exactly like the paid module):
 * 1. Type in search bar
 * 2. Show suggestions: "Search [Column] for: [query]" for each column
 * 3. Show sub-options: actual values from data that match
 * 4. For numeric/date: show comparison operators (>, <, =, >=, <=, !=)
 * 5. Click suggestion to add filter tag
 * 6. Multiple filters with OR/AND mode
 */

/**
 * Search Bar Component
 */
export class X2ManySearchBar extends Component {
    static template = "sm_x2many_search.SearchBar";
    static props = {
        columns: { type: Array },
        records: { type: Array },
        onSearch: { type: Function },
        onClear: { type: Function },
        keyStore: { type: String, optional: true },
        placeholder: { type: String, optional: true },
        hiddenCount: { type: Number, optional: true },
    };

    setup() {
        this.state = useState({
            query: "",
            showDropdown: false,
            filters: [],
            mode: "or",
            suggestions: [],
            expandedColumn: null,
        });
        
        this.inputRef = useRef("searchInput");
        this.containerRef = useRef("container");
        
        this._onDocumentClick = this.onDocumentClick.bind(this);
        this._onKeydown = this.onGlobalKeydown.bind(this);
        
        onMounted(() => {
            document.addEventListener("click", this._onDocumentClick);
            document.addEventListener("keydown", this._onKeydown);
            this.loadSavedFilters();
        });
        
        onWillUnmount(() => {
            document.removeEventListener("click", this._onDocumentClick);
            document.removeEventListener("keydown", this._onKeydown);
        });
    }

    // ==================== Storage ====================
    
    get storageKey() {
        return this.props.keyStore ? `x2m_filter_${this.props.keyStore}` : null;
    }

    loadSavedFilters() {
        if (!this.storageKey) return;
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.state.filters = data.filters || [];
                this.state.mode = data.mode || "or";
                if (this.state.filters.length) {
                    this.applyFilters();
                }
            }
        } catch (e) {}
    }

    saveFilters() {
        if (!this.storageKey) return;
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({
                filters: this.state.filters,
                mode: this.state.mode,
            }));
        } catch (e) {}
    }

    // ==================== Event Handlers ====================

    onDocumentClick(ev) {
        const el = this.containerRef.el;
        if (el && !el.contains(ev.target)) {
            this.closeDropdown();
        }
    }

    onGlobalKeydown(ev) {
        // Alt + Shift + W to toggle mode
        if (ev.altKey && ev.shiftKey && ev.key.toLowerCase() === "w") {
            ev.preventDefault();
            this.toggleMode();
        }
    }

    toggleMode() {
        this.state.mode = this.state.mode === "or" ? "and" : "or";
        if (this.state.filters.length) {
            this.applyFilters();
        }
    }

    closeDropdown() {
        this.state.showDropdown = false;
        this.state.expandedColumn = null;
    }

    // ==================== Input ====================

    onFocus() {
        if (this.state.query) {
            this.state.showDropdown = true;
            this.generateSuggestions();
        }
    }

    onInput(ev) {
        this.state.query = ev.target.value;
        this.state.showDropdown = this.state.query.length > 0;
        this.state.expandedColumn = null;
        this.generateSuggestions();
    }

    onKeydown(ev) {
        if (ev.key === "Escape") {
            this.closeDropdown();
            this.state.query = "";
        }
        if (ev.key === "Backspace" && !this.state.query && this.state.filters.length) {
            this.state.filters.pop();
            this.applyFilters();
        }
    }

    // ==================== Suggestions ====================

    generateSuggestions() {
        const query = this.state.query.toLowerCase().trim();
        if (!query) {
            this.state.suggestions = [];
            return;
        }

        const suggestions = [];
        const columns = this.props.columns;
        const records = this.props.records;

        // Check for "is set" / "is not set"
        if (query === "set" || query.includes("is set") || query.includes("not set")) {
            columns.forEach(col => {
                suggestions.push({
                    type: "is_set",
                    column: col,
                    label: `Search ${col.label} value:`,
                    value: "is set",
                    displayValue: "is set",
                    hasSubOptions: false,
                });
                suggestions.push({
                    type: "is_not_set",
                    column: col,
                    label: `Search ${col.label} value:`,
                    value: "is not set",
                    displayValue: "is not set",
                    hasSubOptions: false,
                });
            });
            this.state.suggestions = suggestions;
            return;
        }

        // For each column, generate suggestions
        columns.forEach(col => {
            const colType = col.type;
            const isNumeric = ["integer", "float", "monetary"].includes(colType);
            const isDate = ["date", "datetime"].includes(colType);
            
            // Get unique values for this column that match query
            const matchingValues = this.getMatchingValuesForColumn(col, query, records);
            
            // Main suggestion: "Search [Column] for: [query]"
            const suggestion = {
                type: "column_search",
                column: col,
                label: `Search ${col.label} for:`,
                query: query,
                hasSubOptions: matchingValues.length > 0 || isNumeric || isDate,
                subOptions: [],
            };

            // For numeric fields, add comparison operators
            if (isNumeric && !isNaN(parseFloat(query))) {
                const num = query;
                suggestion.subOptions = [
                    { operator: "=", label: `= ${num}`, value: num },
                    { operator: ">", label: `> ${num}`, value: num },
                    { operator: "<", label: `< ${num}`, value: num },
                    { operator: ">=", label: `≥ ${num}`, value: num },
                    { operator: "<=", label: `≤ ${num}`, value: num },
                    { operator: "!=", label: `≠ ${num}`, value: num },
                ];
            }
            // For date fields
            else if (isDate) {
                suggestion.subOptions = [
                    { operator: "=", label: `at: ${query}`, value: query },
                    { operator: ">", label: `after: ${query}`, value: query },
                    { operator: "<", label: `before: ${query}`, value: query },
                ];
            }
            // For other fields, show matching values
            else if (matchingValues.length > 0) {
                suggestion.subOptions = matchingValues.slice(0, 10).map(v => ({
                    operator: "=",
                    label: v.display,
                    value: v.raw,
                    displayValue: v.display,
                }));
            }

            suggestions.push(suggestion);
        });

        this.state.suggestions = suggestions;
    }

    getMatchingValuesForColumn(column, query, records) {
        const values = [];
        const seen = new Set();

        records.forEach(record => {
            const rawValue = record.data[column.name];
            const displayValue = this.getDisplayValue(rawValue, column);
            
            if (displayValue && 
                displayValue.toString().toLowerCase().includes(query) && 
                !seen.has(displayValue)) {
                seen.add(displayValue);
                values.push({
                    raw: rawValue,
                    display: displayValue,
                });
            }
        });

        // For selection fields, also check selection options
        if (column.type === "selection" && column.selection) {
            column.selection.forEach(([val, label]) => {
                if (label.toLowerCase().includes(query) && !seen.has(label)) {
                    seen.add(label);
                    values.push({ raw: val, display: label });
                }
            });
        }

        // For boolean
        if (column.type === "boolean") {
            if ("yes".includes(query) || "true".includes(query)) {
                values.push({ raw: true, display: "Yes" });
            }
            if ("no".includes(query) || "false".includes(query)) {
                values.push({ raw: false, display: "No" });
            }
        }

        return values;
    }

    getDisplayValue(value, column) {
        if (value === null || value === undefined || value === false) {
            if (column.type === "boolean") return "No";
            return "";
        }

        switch (column.type) {
            case "many2one":
                return value.display_name || value[1] || value.name || String(value);
            case "many2many":
            case "one2many":
                if (Array.isArray(value.records)) {
                    return value.records.map(r => r.data.display_name || r.data.name || "").join(", ");
                }
                if (Array.isArray(value)) {
                    return value.map(v => v.display_name || v.name || v[1] || "").join(", ");
                }
                return "";
            case "selection":
                const sel = column.selection?.find(s => s[0] === value);
                return sel ? sel[1] : String(value);
            case "boolean":
                return value ? "Yes" : "No";
            case "date":
                try { return formatDate(value); } catch { return String(value); }
            case "datetime":
                try { return formatDateTime(value); } catch { return String(value); }
            case "float":
            case "monetary":
                return typeof value === "number" ? value.toFixed(2) : String(value);
            default:
                return String(value);
        }
    }

    // ==================== Selection ====================

    toggleExpand(columnName) {
        if (this.state.expandedColumn === columnName) {
            this.state.expandedColumn = null;
        } else {
            this.state.expandedColumn = columnName;
        }
    }

    selectSuggestion(suggestion, subOption = null) {
        let filter;

        if (suggestion.type === "is_set" || suggestion.type === "is_not_set") {
            filter = {
                id: Date.now(),
                column: suggestion.column,
                columnName: suggestion.column.label,
                operator: suggestion.type === "is_set" ? "is_set" : "is_not_set",
                value: null,
                displayValue: suggestion.displayValue,
            };
        } else if (subOption) {
            // Selected a sub-option (specific value or operator)
            filter = {
                id: Date.now(),
                column: suggestion.column,
                columnName: suggestion.column.label,
                operator: subOption.operator,
                value: subOption.value,
                displayValue: subOption.displayValue || subOption.label,
            };
        } else {
            // Selected main suggestion - search for query as contains
            filter = {
                id: Date.now(),
                column: suggestion.column,
                columnName: suggestion.column.label,
                operator: "contains",
                value: this.state.query,
                displayValue: this.state.query,
            };
        }

        this.state.filters.push(filter);
        this.state.query = "";
        this.closeDropdown();
        this.applyFilters();
    }

    removeFilter(filterId) {
        this.state.filters = this.state.filters.filter(f => f.id !== filterId);
        this.applyFilters();
    }

    clearAll() {
        this.state.filters = [];
        this.state.query = "";
        this.closeDropdown();
        this.props.onClear();
        this.saveFilters();
    }

    applyFilters() {
        this.saveFilters();
        this.props.onSearch({
            filters: this.state.filters,
            mode: this.state.mode,
        });
    }

    // ==================== Getters ====================

    get modeIcon() {
        return this.state.mode === "or" ? "fa-search" : "fa-plus-circle";
    }

    get visibleRowsCount() {
        // Will be computed by parent
        return 0;
    }

    get totalRowsCount() {
        return this.props.records.length;
    }

    get visibleCount() {
        const hidden = this.props.hiddenCount || 0;
        return this.props.records.length - hidden;
    }
}

/**
 * One2Many Field with Search
 */
export class One2ManySearchField extends X2ManyField {
    static template = "sm_x2many_search.One2ManySearchField";
    static components = {
        ...X2ManyField.components,
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
                if (this.searchState.filters.length > 0) {
                    setTimeout(() => this.applyFilter(), 100);
                }
            },
            () => [this.list?.records?.length]
        );
    }

    get list() {
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
        return this.list?.records || [];
    }

    get keyStore() {
        return this.props.attrs?.keyStore || null;
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

        // Calculate which records match
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
        
        // Apply to DOM
        this.applyDomVisibility(visibleIds);
    }

    applyDomVisibility(visibleIds) {
        setTimeout(() => {
            const fieldEl = document.querySelector(`[name="${this.props.name}"]`);
            if (!fieldEl) return;

            // Handle list rows
            const rows = fieldEl.querySelectorAll("tr.o_data_row");
            rows.forEach((row, index) => {
                row.style.display = visibleIds.has(index) ? "" : "none";
            });

            // Handle kanban cards
            const cards = fieldEl.querySelectorAll(".o_kanban_record");
            cards.forEach((card, index) => {
                card.style.display = visibleIds.has(index) ? "" : "none";
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
            fieldEl.querySelectorAll(".o_kanban_record").forEach(card => {
                card.style.display = "";
            });
        }, 10);
    }
}

/**
 * Many2Many Field with Search
 */
export class Many2ManySearchField extends One2ManySearchField {
    static template = "sm_x2many_search.Many2ManySearchField";
}

// Register as custom widget names (for manual use)
export const one2manySearchField = {
    ...x2ManyField,
    component: One2ManySearchField,
    displayName: "One2Many with Search",
};

export const many2manySearchField = {
    ...x2ManyField,
    component: Many2ManySearchField,
    displayName: "Many2Many with Search",
};

registry.category("fields").add("one2many_search", one2manySearchField);
registry.category("fields").add("many2many_search", many2manySearchField);

// ============================================================
// AUTO-APPLY: Override default x2many widgets
// This makes the search bar appear on ALL one2many/many2many 
// fields automatically after installing the module.
// No need to manually change widget="one2many_search" in views!
// ============================================================
registry.category("fields").add("one2many", one2manySearchField, { force: true });
registry.category("fields").add("many2many", many2manySearchField, { force: true });
