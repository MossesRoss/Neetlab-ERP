// Define the exact roles operating within the NEETlab Internal ERP
export const ROLES = {
    ADMIN: 'ADMIN',                     // Full Access
    PRODUCT_MANAGER: 'PRODUCT_MANAGER', // Oversee Syllabus, Sims, and Dev Tasks
    DEVELOPER: 'DEVELOPER',             // Dev Team - Build/fix simulations
    TEACHER: 'TEACHER',                 // Subject Matter Experts - QA content & flag bugs
    STUDENT_SUCCESS: 'STUDENT_SUCCESS'  // Operations - Monitor student metrics via tracking
} as const;

export type UserRole = keyof typeof ROLES;

export const ROLE_LABELS = {
    [ROLES.ADMIN]: 'System Administrator',
    [ROLES.PRODUCT_MANAGER]: 'Product Manager',
    [ROLES.DEVELOPER]: 'Simulation Developer',
    [ROLES.TEACHER]: 'Subject Matter Expert',
    [ROLES.STUDENT_SUCCESS]: 'Student Success Agent'
};

// The Strict Lens Matrix: Maps exact module IDs from the UI to allowed roles
export const MODULE_PERMISSIONS = {
    'dashboard': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.DEVELOPER, ROLES.TEACHER, ROLES.STUDENT_SUCCESS],

    // Master Data Catalog
    'syllabus_master': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.TEACHER],
    'simulation_master': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.DEVELOPER, ROLES.TEACHER],

    // Tracking & Analytics
    'student_analytics': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.STUDENT_SUCCESS, ROLES.TEACHER],

    // Workflows
    'dev_tasks': [ROLES.ADMIN, ROLES.PRODUCT_MANAGER, ROLES.DEVELOPER, ROLES.TEACHER],

    // Admin
    'user_management': [ROLES.ADMIN],
} as const;

export function canAccess(role: string, moduleId: string): boolean {
    if (!role) return false;
    const allowedRoles = MODULE_PERMISSIONS[moduleId as keyof typeof MODULE_PERMISSIONS] as readonly string[] | undefined;
    if (!allowedRoles) return false;
    return allowedRoles.includes(role);
}