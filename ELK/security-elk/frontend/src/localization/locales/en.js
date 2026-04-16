const en = {
  common: {
    actions: {
      filter: 'Filter',
      refresh: 'Refresh',
      export: 'Export',
      exportCsv: 'Export CSV',
      create: 'Create',
      save: 'Save',
      cancel: 'Cancel',
      clear: 'Clear',
      edit: 'Edit',
      activate: 'Activate',
      deactivate: 'Deactivate',
      viewAll: 'View all',
      viewDetails: 'View details',
      blockIp: 'Block IP',
      muteAlert: 'Mute alert',
      assignToMe: 'Assign to me',
      editDepartment: 'Edit department',
      search: 'Search',
      signOut: 'Sign out',
      previous: 'Previous',
      next: 'Next',
      apply: 'Apply',
      reset: 'Reset'
    },
    status: {
      loading: 'Loading...',
      active: 'Active',
      locked: 'Locked',
      streaming: 'Streaming',
      systemHealth: 'System health'
    },
    labels: {
      allSeverity: 'All severity',
      allStatus: 'All status',
      allRoles: 'All roles',
      allDepartments: 'All departments',
      status: 'Status',
      page: 'Page'
    },
    severity: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical'
    },
    incidentStatus: {
      open: 'Open',
      investigating: 'Investigating',
      contained: 'Contained',
      resolved: 'Resolved',
      closed: 'Closed'
    },
    roles: {
      admin: 'Admin',
      analyst: 'Analyst',
      viewer: 'Viewer'
    },
    timeRange: {
      last1Hour: 'Last 1 hour',
      last6Hours: 'Last 6 hours',
      last24Hours: 'Last 24 hours',
      last7Days: 'Last 7 days'
    },
    table: {
      title: 'Title',
      severity: 'Severity',
      status: 'Status',
      detectedAt: 'Detected at',
      response: 'Response',
      email: 'Email',
      name: 'Name',
      role: 'Role',
      department: 'Department',
      actions: 'Actions'
    },
    messages: {
      noData: 'No data available.',
      notAvailable: 'N/A',
      noDepartment: '-',
      noResults: 'No results found.',
      pageIndicator: 'Page {{page}} of {{total}}'
    },
    errors: {
      generic: 'Something went wrong.',
      auth: 'Authentication failed.',
      alertsLoad: 'Unable to load alerts.',
      departmentsLoad: 'Unable to load departments.',
      incidentsLoad: 'Unable to load incidents.',
      usersLoad: 'Unable to load users.',
      updateFailed: 'Update failed.',
      departmentSave: 'Unable to save the department.',
      blockIpFailed: 'Unable to block the IP.',
      forbidden: 'You do not have permission to perform this action.',
      rateLimit: 'Too many requests. Please try again later.',
      invalidToken: 'Your session is invalid. Please sign in again.'
    }
  },
  layout: {
    pages: {
      dashboard: 'Dashboard',
      incidents: 'Incidents',
      alerts: 'Alerts',
      departments: 'Departments',
      users: 'Users',
      settings: 'Settings',
      default: 'Security Dashboard'
    },
    notifications: {
      buttonTitle: 'System notifications',
      title: 'Notifications',
      recentActivity: 'Recent system activity',
      loading: 'Loading alerts...',
      empty: 'No alerts at the moment.',
      newEvents: '{{count}} new events'
    },
    systemHealth: {
      backend: 'Backend API',
      mongodb: 'MongoDB',
      elasticsearch: 'Elasticsearch'
    },
    controls: {
      toggleTheme: 'Toggle theme',
      language: 'Language'
    }
  },
  login: {
    subtitle: 'SIEM/SOAR portal login',
    email: 'Email address',
    password: 'Password',
    emailPlaceholder: 'name@company.com',
    submit: 'Sign In to Portal',
    authenticating: 'Authenticating...',
    secureChannel: 'Secure channel encrypted'
  },
  dashboard: {
    loading: 'Verifying system integrity...',
    totalIncidents: 'Total Incidents',
    securityPosture: 'Security Posture',
    activeInvestigations: 'Active Investigations',
    systemResolved: 'System Resolved',
    sinceLastHour: '{{trend}} since last hour',
    systemHealthGauge: 'System health',
    liveEventBuzz: 'Live Event Buzz',
    waitingEvents: 'Waiting for system events...',
    threatTrend: 'Threat Activity Trend (24h)',
    topAttackers: 'Top Attacker Analysis',
    attemptsDetected: '{{count}} attempts detected',
    severityMatrix: 'Severity Matrix',
    geographicalMap: 'Geographical Threat Map',
    localizationOn: 'Localization: on',
    popupSeverity: 'Severity'
  },
  alerts: {
    highCritical: 'High + Critical',
    mediumHighCritical: 'Medium + High + Critical',
    allSeverity: 'All severity',
    loading: 'Decrypting alert telemetry...',
    empty: 'System secure. No alerts detected.'
  },
  incidents: {
    searchPlaceholder: 'Search incidents...',
    loading: 'Analyzing incident telemetry...',
    empty: 'No incidents match the current filters.',
    showingIncidents: 'Showing {{count}} incidents',
    blockPrompt: 'Block IP {{ip}}? Enter a reason:',
    blockSuccess: 'IP {{ip}} has been blocked.'
  },
  users: {
    title: 'Users',
    loading: 'Loading users...',
    active: 'Active',
    locked: 'Locked',
    allDepartments: 'All departments',
    editDepartmentPrompt: 'Enter a new department',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    editUserTitle: 'Edit User',
    passwordResetTitle: 'Reset Password',
    passwordResetSubtitle: 'Leave blank to keep current password',
    fields: {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      role: 'Role',
      department: 'Department',
      status: 'Status',
      newPassword: 'New Password'
    },
    departmentUpdated: 'Department updated.',
    roleUpdated: 'Role updated.',
    userUpdated: 'User updated.',
    userActivated: 'User activated.',
    userLocked: 'User status updated.'
  },
  departments: {
    title: 'Departments',
    loading: 'Loading departments...',
    empty: 'No departments found.',
    adminOnly: 'Only administrators can manage departments.',
    summary: '{{active}} active departments out of {{total}} total.',
    hierarchyTitle: 'Department hierarchy',
    hierarchyDescription: 'Parent-child structure based on the current department assignments.',
    hierarchyEmpty: 'No department hierarchy configured yet.',
    createTitle: 'Create department',
    editTitle: 'Edit department',
    created: 'Department created.',
    updated: 'Department updated.',
    activated: 'Department activated.',
    deactivated: 'Department deactivated.',
    noParent: 'No parent',
    codePlaceholder: 'Optional. Generated automatically if left empty.',
    descriptionPlaceholder: 'Describe the department scope or purpose.',
    fields: {
      name: 'Name',
      code: 'Code',
      description: 'Description',
      parentDepartment: 'Parent department',
      sortOrder: 'Sort order'
    }
  },
  settings: {
    title: 'System Settings',
    description: 'This feature is under development.'
  },
  auth: {
    loginSuccess: 'Signed in successfully.',
    loginFailed: 'Sign-in failed.',
    registerSuccess: 'Registration completed successfully.',
    registerFailed: 'Registration failed.',
    logoutSuccess: 'Signed out successfully.',
    profileUpdateSuccess: 'Profile updated successfully.',
    profileUpdateFailed: 'Unable to update profile.',
    passwordChangeSuccess: 'Password changed successfully.',
    passwordChangeFailed: 'Unable to change password.'
  },
  socket: {
    newIncident: 'New incident'
  }
};

export default en;
