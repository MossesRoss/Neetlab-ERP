// Define the exact roles operating within TankTech Asia
export const ROLES = {
    ADMIN: 'ADMIN',               // The CEO/CTO - Full Access
    ACCOUNTANT: 'ACCOUNTANT',     // The CFO - GL, Dashboard, Payables, Receivables
    WAREHOUSE: 'WAREHOUSE',       // Floor Manager - Job Cards, Subcontracting (DCs), Stock
    PROCUREMENT: 'PROCUREMENT',   // Purchasing Officer - POs, Vendors, GRNs
    SALES: 'SALES'                // Sales Rep - Sales Orders, Customers
} as const;

export type UserRole = keyof typeof ROLES;

export const ROLE_LABELS = {
    [ROLES.ADMIN]: 'System Administrator (Full Access)',
    [ROLES.ACCOUNTANT]: 'Finance & Controller (GL, A/P, A/R)',
    [ROLES.WAREHOUSE]: 'Floor Manager (Production & Stock)',
    [ROLES.PROCUREMENT]: 'Purchasing Officer (P2P Pipeline)',
    [ROLES.SALES]: 'Sales Representative (O2C Pipeline)'
};

// The Strict Lens Matrix: Maps exact module IDs from the UI to allowed roles
export const MODULE_PERMISSIONS = {
    'dashboard': [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.WAREHOUSE, ROLES.PROCUREMENT, ROLES.SALES],

    // Financials
    'chart_of_accounts': [ROLES.ADMIN, ROLES.ACCOUNTANT],
    'journal_entries': [ROLES.ADMIN, ROLES.ACCOUNTANT],
    'general_ledger': [ROLES.ADMIN, ROLES.ACCOUNTANT], // SARGENT FIX: Added GL Report Access
    'period_close': [ROLES.ADMIN, ROLES.ACCOUNTANT],

    // P2P & Inventory
    'purchase_orders': [ROLES.ADMIN, ROLES.PROCUREMENT],
    'bills': [ROLES.ADMIN, ROLES.ACCOUNTANT],
    'payments_out': [ROLES.ADMIN, ROLES.ACCOUNTANT],
    'grns': [ROLES.ADMIN, ROLES.PROCUREMENT, ROLES.WAREHOUSE],
    'stock_reports': [ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.PROCUREMENT, ROLES.ACCOUNTANT],

    // O2C
    'sales_orders': [ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTANT],
    'invoices': [ROLES.ADMIN, ROLES.ACCOUNTANT],
    'payments_in': [ROLES.ADMIN, ROLES.ACCOUNTANT],

    // Manufacturing
    'item_master': [ROLES.ADMIN, ROLES.WAREHOUSE, ROLES.PROCUREMENT, ROLES.ACCOUNTANT],
    'job_cards': [ROLES.ADMIN, ROLES.WAREHOUSE],
    'delivery_challans': [ROLES.ADMIN, ROLES.WAREHOUSE],

    // Admin
    'entity_directory': [ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTANT, ROLES.PROCUREMENT],
    'user_management': [ROLES.ADMIN],
} as const;

export function canAccess(role: string, moduleId: string): boolean {
    if (!role) return false;
    const allowedRoles = MODULE_PERMISSIONS[moduleId as keyof typeof MODULE_PERMISSIONS] as readonly string[] | undefined;
    if (!allowedRoles) return false;
    return allowedRoles.includes(role);
}