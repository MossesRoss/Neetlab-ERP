// Define the exact roles operating within TankTech Asia
export const ROLES = {
    ADMIN: 'ADMIN',                     // The CEO/CTO - Full Access
    PRODUCT_MANAGER: 'PRODUCT_MANAGER', // PMs - Oversee Syllabus, Sims, and Dev Tasks
    DEVELOPER: 'DEVELOPER',             // Dev Team - Build the simulations
    TEACHER: 'TEACHER',                 // Subject Matter Experts - QA content
    STUDENT_SUCCESS: 'STUDENT_SUCCESS'  // Operations - Monitor student metrics & churn
} as const;

export type UserRole = keyof typeof ROLES;

export const ROLE_LABELS = {
    [ROLES.ADMIN]: 'System Administrator (Full Access)',
    [ROLES.PRODUCT_MANAGER]: 'Product Manager (Roadmap & Scoping)',
    [ROLES.DEVELOPER]: 'Simulation Developer (Engineering)',
    [ROLES.TEACHER]: 'Subject Matter Expert (Content QA)',
    [ROLES.STUDENT_SUCCESS]: 'Student Success Agent (CRM & Analytics)'
};

// The Strict Lens Matrix: Maps exact module IDs from the UI to allowed roles
export const MODULE_PERMISSIONS = {
    'dashboard': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.DEVELOPER, ROLES.TEACHER, ROLES.STUDENT_SUCCESS],

    // Phase 1: Foundation & Master Data
    'syllabus_master': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.TEACHER],
    'simulation_master': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.DEVELOPER, ROLES.TEACHER],

    // Phase 2: CRM & Analytics ("Insta-tracking")
    'student_directory': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.STUDENT_SUCCESS],
    'behavioral_analytics': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.TEACHER, ROLES.STUDENT_SUCCESS],

    // Phase 3: Dev Team Management
    'dev_tasks': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.DEVELOPER],
    'bug_reports': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.DEVELOPER, ROLES.TEACHER, ROLES.STUDENT_SUCCESS],

    // Phase 4: Financials & Subscriptions (Keeping limited access)
    'subscriptions': [ROLES.ADMIN, ROLES.STUDENT_SUCCESS],
    'invoices': [ROLES.ADMIN],

    // Admin
    'user_management': [ROLES.ADMIN],
} as const;

export function canAccess(role: string, moduleId: string): boolean {
    // ... existing code ...
    if (!role) return false;
    const allowedRoles = MODULE_PERMISSIONS[moduleId as keyof typeof MODULE_PERMISSIONS] as readonly string[] | undefined;
    if (!allowedRoles) return false;
    return allowedRoles.includes(role);
}