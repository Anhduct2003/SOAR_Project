const vi = {
  common: {
    actions: {
      filter: 'Lọc',
      refresh: 'Làm mới',
      export: 'Xuất',
      exportCsv: 'Xuất CSV',
      create: 'Tạo mới',
      save: 'Lưu',
      cancel: 'Hủy',
      clear: 'Xóa',
      edit: 'Chỉnh sửa',
      activate: 'Kích hoạt',
      deactivate: 'Vô hiệu hóa',
      viewAll: 'Xem tất cả',
      viewDetails: 'Xem chi tiết',
      blockIp: 'Chặn IP',
      muteAlert: 'Tắt cảnh báo',
      assignToMe: 'Giao cho tôi',
      editDepartment: 'Sửa phòng ban',
      search: 'Tìm kiếm',
      signOut: 'Đăng xuất',
      previous: 'Trước',
      next: 'Sau'
    },
    status: {
      loading: 'Đang tải...',
      active: 'Đang hoạt động',
      locked: 'Bị khóa',
      streaming: 'Đang phát',
      systemHealth: 'Sức khỏe hệ thống'
    },
    labels: {
      allSeverity: 'Tất cả mức độ',
      allStatus: 'Tất cả trạng thái',
      allRoles: 'Tất cả vai trò',
      allDepartments: 'Tất cả phòng ban',
      status: 'Trạng thái',
      page: 'Trang'
    },
    severity: {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      critical: 'Nghiêm trọng'
    },
    incidentStatus: {
      open: 'Mở',
      investigating: 'Đang điều tra',
      contained: 'Đã kiểm soát',
      resolved: 'Đã xử lý',
      closed: 'Đã đóng'
    },
    roles: {
      admin: 'Quản trị viên',
      analyst: 'Phân tích viên',
      viewer: 'Người xem'
    },
    timeRange: {
      last1Hour: '1 giờ gần nhất',
      last6Hours: '6 giờ gần nhất',
      last24Hours: '24 giờ gần nhất',
      last7Days: '7 ngày gần nhất'
    },
    table: {
      title: 'Tiêu đề',
      severity: 'Mức độ',
      status: 'Trạng thái',
      detectedAt: 'Thời điểm phát hiện',
      response: 'Phản hồi',
      email: 'Email',
      name: 'Tên',
      role: 'Vai trò',
      department: 'Phòng ban',
      actions: 'Thao tác'
    },
    messages: {
      noData: 'Không có dữ liệu.',
      notAvailable: 'Không có',
      noDepartment: '-',
      noResults: 'Không có kết quả tìm kiếm.',
      pageIndicator: 'Trang {{page}} / {{total}}'
    },
    errors: {
      generic: 'Có lỗi xảy ra.',
      auth: 'Xác thực thất bại.',
      alertsLoad: 'Không thể tải cảnh báo.',
      departmentsLoad: 'Không thể tải phòng ban.',
      incidentsLoad: 'Không thể tải sự cố.',
      usersLoad: 'Không thể tải người dùng.',
      updateFailed: 'Cập nhật thất bại.',
      departmentSave: 'Không thể lưu phòng ban.',
      blockIpFailed: 'Không thể chặn IP.',
      forbidden: 'Bạn không có quyền thực hiện thao tác này.',
      rateLimit: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
      invalidToken: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
    }
  },
  layout: {
    pages: {
      dashboard: 'Bảng điều khiển',
      incidents: 'Sự cố',
      alerts: 'Cảnh báo',
      departments: 'Phòng ban',
      users: 'Người dùng',
      settings: 'Cài đặt',
      default: 'Bảng điều khiển an ninh'
    },
    notifications: {
      buttonTitle: 'Thông báo hệ thống',
      title: 'Thông báo',
      recentActivity: 'Hoạt động hệ thống gần đây',
      loading: 'Đang tải cảnh báo...',
      empty: 'Hiện chưa có cảnh báo.',
      newEvents: '{{count}} sự kiện mới'
    },
    systemHealth: {
      backend: 'API backend',
      mongodb: 'MongoDB',
      elasticsearch: 'Elasticsearch'
    },
    controls: {
      toggleTheme: 'Đổi giao diện',
      language: 'Ngôn ngữ'
    }
  },
  login: {
    subtitle: 'Cổng đăng nhập SIEM/SOAR',
    email: 'Địa chỉ email',
    password: 'Mật khẩu',
    emailPlaceholder: 'name@company.com',
    submit: 'Đăng nhập vào cổng',
    authenticating: 'Đang xác thực...',
    secureChannel: 'Kênh bảo mật đã được mã hóa'
  },
  dashboard: {
    loading: 'Đang xác minh toàn vẹn hệ thống...',
    totalIncidents: 'Tổng số sự cố',
    securityPosture: 'Trạng thái an ninh',
    activeInvestigations: 'Sự cố đang điều tra',
    systemResolved: 'Sự cố đã xử lý',
    sinceLastHour: '{{trend}} so với giờ trước',
    systemHealthGauge: 'Sức khỏe hệ thống',
    liveEventBuzz: 'Dòng sự kiện trực tiếp',
    waitingEvents: 'Đang chờ sự kiện hệ thống...',
    threatTrend: 'Xu hướng hoạt động đe dọa (24h)',
    topAttackers: 'Phân tích nguồn tấn công hàng đầu',
    attemptsDetected: 'Phát hiện {{count}} lần thử',
    severityMatrix: 'Ma trận mức độ',
    geographicalMap: 'Bản đồ đe dọa theo khu vực',
    localizationOn: 'Bản địa hóa: bật',
    popupSeverity: 'Mức độ'
  },
  alerts: {
    highCritical: 'Cao + Nghiêm trọng',
    mediumHighCritical: 'Trung bình + Cao + Nghiêm trọng',
    allSeverity: 'Tất cả mức độ',
    loading: 'Đang giải mã dữ liệu cảnh báo...',
    empty: 'Hệ thống an toàn. Không phát hiện cảnh báo.'
  },
  incidents: {
    searchPlaceholder: 'Tìm kiếm sự cố...',
    loading: 'Đang phân tích dữ liệu sự cố...',
    empty: 'Không có sự cố nào khớp với bộ lọc.',
    showingIncidents: 'Hiển thị {{count}} sự cố',
    blockPrompt: 'Chặn IP {{ip}}? Nhập lý do:',
    blockSuccess: 'Đã chặn IP {{ip}}.'
  },
  users: {
    title: 'Người dùng',
    loading: 'Đang tải người dùng...',
    active: 'Đang hoạt động',
    locked: 'Bị khóa',
    allDepartments: 'Tất cả phòng ban',
    editDepartmentPrompt: 'Nhập phòng ban mới',
    previousPage: 'Trang trước',
    nextPage: 'Trang sau',
    departmentUpdated: 'Đã cập nhật phòng ban.',
    roleUpdated: 'Đã cập nhật vai trò.',
    userUpdated: 'Đã cập nhật người dùng.',
    userActivated: 'Đã kích hoạt người dùng.',
    userLocked: 'Đã cập nhật trạng thái người dùng.'
  },
  departments: {
    title: 'Phòng ban',
    loading: 'Đang tải phòng ban...',
    empty: 'Chưa có phòng ban nào.',
    adminOnly: 'Chỉ quản trị viên mới có thể quản lý phòng ban.',
    summary: '{{active}} phòng ban đang hoạt động trên tổng {{total}}.',
    hierarchyTitle: 'Cây phòng ban',
    hierarchyDescription: 'Cấu trúc cha-con dựa trên thiết lập phòng ban hiện tại.',
    hierarchyEmpty: 'Chưa có cấu trúc phân cấp phòng ban.',
    createTitle: 'Tạo phòng ban',
    editTitle: 'Chỉnh sửa phòng ban',
    created: 'Đã tạo phòng ban.',
    updated: 'Đã cập nhật phòng ban.',
    activated: 'Đã kích hoạt phòng ban.',
    deactivated: 'Đã vô hiệu hóa phòng ban.',
    noParent: 'Không có phòng ban cha',
    codePlaceholder: 'Không bắt buộc. Hệ thống sẽ tự tạo nếu để trống.',
    descriptionPlaceholder: 'Mô tả phạm vi hoạt động hoặc mục đích của phòng ban.',
    fields: {
      name: 'Tên',
      code: 'Mã',
      description: 'Mô tả',
      parentDepartment: 'Phòng ban cha',
      sortOrder: 'Thứ tự hiển thị'
    }
  },
  settings: {
    title: 'Cài đặt hệ thống',
    description: 'Tính năng đang được phát triển.'
  },
  auth: {
    loginSuccess: 'Đăng nhập thành công.',
    loginFailed: 'Đăng nhập thất bại.',
    registerSuccess: 'Đăng ký thành công.',
    registerFailed: 'Đăng ký thất bại.',
    logoutSuccess: 'Đăng xuất thành công.',
    profileUpdateSuccess: 'Cập nhật thông tin thành công.',
    profileUpdateFailed: 'Không thể cập nhật thông tin.',
    passwordChangeSuccess: 'Đổi mật khẩu thành công.',
    passwordChangeFailed: 'Không thể đổi mật khẩu.'
  },
  socket: {
    newIncident: 'Sự cố mới'
  }
};

export default vi;
