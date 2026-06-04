export const ROLE_LEVEL = {
  employee: 10,
  manager: 20,
  admin: 30,
  ceo: 40,
  owner: 40,
}

export const ROLE_LABEL = {
  employee: 'Employee',
  manager: 'Manager',
  admin: 'Admin',
  ceo: 'CEO',
  owner: 'CEO',
}

export const DEFAULT_PERMISSIONS = {
  employee: {
    viewTeam: true,
    approveUsers: false,
    manageUsers: false,
    deleteUsers: false,
    managePermissions: false,
    createProjects: false,
    manageProjects: false,
    deleteProjects: false,
    createTasks: true,
    assignTasks: false,
    deleteTasks: false,
    viewEmployeeSummary: false,
    manageDailyTodos: false,
    manageDepartments: false,
  },
  manager: {
    viewTeam: true,
    approveUsers: true,
    manageUsers: false,
    deleteUsers: false,
    managePermissions: false,
    createProjects: true,
    manageProjects: true,
    deleteProjects: false,
    createTasks: true,
    assignTasks: true,
    deleteTasks: false,
    viewEmployeeSummary: true,
    manageDailyTodos: true,
    manageDepartments: false,
  },
  admin: {
    viewTeam: true,
    approveUsers: true,
    manageUsers: true,
    deleteUsers: true,
    managePermissions: true,
    createProjects: true,
    manageProjects: true,
    deleteProjects: true,
    createTasks: true,
    assignTasks: true,
    deleteTasks: true,
    viewEmployeeSummary: true,
    manageDailyTodos: true,
    manageDepartments: true,
  },
  ceo: {
    viewTeam: true,
    approveUsers: true,
    manageUsers: true,
    deleteUsers: true,
    managePermissions: true,
    createProjects: true,
    manageProjects: true,
    deleteProjects: true,
    createTasks: true,
    assignTasks: true,
    deleteTasks: true,
    viewEmployeeSummary: true,
    manageDailyTodos: true,
    manageDepartments: true,
  },
}

DEFAULT_PERMISSIONS.owner = DEFAULT_PERMISSIONS.ceo

export const normalizeRole = role => role === 'owner' ? 'ceo' : (role || 'employee')

export const roleLevel = role => ROLE_LEVEL[role] || ROLE_LEVEL.employee

export const hasRoleAtLeast = (user, role) => roleLevel(user?.role) >= roleLevel(role)

export const permissionsFor = user => ({
  ...(DEFAULT_PERMISSIONS[normalizeRole(user?.role)] || DEFAULT_PERMISSIONS.employee),
  ...(normalizeRole(user?.role) === 'manager' ? (user?.permissions?.toObject ? user.permissions.toObject() : user?.permissions || {}) : {}),
})

export const can = (user, permission) => Boolean(permissionsFor(user)[permission])
