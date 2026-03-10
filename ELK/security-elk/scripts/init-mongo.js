// Script khởi tạo MongoDB cho Security Incident Response System

// Tạo database
db = db.getSiblingDB('security_incidents');

// Tạo collections
db.createCollection('users');
db.createCollection('incidents');
db.createCollection('alerts');
db.createCollection('audit_logs');

// Tạo indexes cho performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });

db.incidents.createIndex({ "severity": 1 });
db.incidents.createIndex({ "status": 1 });
db.incidents.createIndex({ "category": 1 });
db.incidents.createIndex({ "detectedAt": -1 });
db.incidents.createIndex({ "assignedTo": 1 });
db.incidents.createIndex({ "createdBy": 1 });

db.alerts.createIndex({ "severity": 1 });
db.alerts.createIndex({ "status": 1 });
db.alerts.createIndex({ "createdAt": -1 });
db.alerts.createIndex({ "source": 1 });

db.audit_logs.createIndex({ "timestamp": -1 });
db.audit_logs.createIndex({ "user": 1 });
db.audit_logs.createIndex({ "action": 1 });

// Tạo admin user mặc định
const adminUser = {
  username: "admin",
  email: "admin@security.local",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8e", // password: admin123
  firstName: "System",
  lastName: "Administrator",
  role: "admin",
  department: "IT Security",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Tạo analyst user mặc định
const analystUser = {
  username: "analyst",
  email: "analyst@security.local",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8e", // password: analyst123
  firstName: "Security",
  lastName: "Analyst",
  role: "analyst",
  department: "SOC",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Tạo viewer user mặc định
const viewerUser = {
  username: "viewer",
  email: "viewer@security.local",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8e", // password: viewer123
  firstName: "Security",
  lastName: "Viewer",
  role: "viewer",
  department: "Management",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Insert users nếu chưa tồn tại
if (db.users.countDocuments({ email: adminUser.email }) === 0) {
  db.users.insertOne(adminUser);
  print("Admin user created");
}

if (db.users.countDocuments({ email: analystUser.email }) === 0) {
  db.users.insertOne(analystUser);
  print("Analyst user created");
}

if (db.users.countDocuments({ email: viewerUser.email }) === 0) {
  db.users.insertOne(viewerUser);
  print("Viewer user created");
}

// Tạo dữ liệu mẫu cho incidents
const sampleIncidents = [
  {
    title: "Phát hiện đăng nhập thất bại nhiều lần",
    description: "Hệ thống phát hiện nhiều lần đăng nhập thất bại từ IP 192.168.1.100",
    severity: "medium",
    status: "open",
    category: "authentication",
    source: "automated",
    affectedSystems: ["web-server-01", "database-server"],
    affectedUsers: ["user1", "user2"],
    ipAddresses: ["192.168.1.100"],
    location: {
      country: "Vietnam",
      city: "Ho Chi Minh City",
      coordinates: { lat: 10.8231, lng: 106.6297 }
    },
    detectedAt: new Date(Date.now() - 3600000), // 1 giờ trước
    reportedAt: new Date(Date.now() - 3600000),
    estimatedImpact: "moderate",
    assignedTo: null,
    createdBy: db.users.findOne({ role: "admin" })._id,
    tags: ["brute-force", "authentication"],
    timeline: [
      {
        timestamp: new Date(Date.now() - 3600000),
        action: "incident_created",
        description: "Sự cố được tạo tự động",
        user: db.users.findOne({ role: "admin" })._id
      }
    ],
    notes: [],
    compliance: {
      gdpr: false,
      sox: false,
      pci: false,
      hipaa: false
    }
  },
  {
    title: "Phát hiện malware trên endpoint",
    description: "Antivirus phát hiện file đáng ngờ trong thư mục Downloads",
    severity: "high",
    status: "investigating",
    category: "malware",
    source: "automated",
    affectedSystems: ["endpoint-001"],
    affectedUsers: ["user3"],
    ipAddresses: [],
    location: {
      country: "Vietnam",
      city: "Hanoi",
      coordinates: { lat: 21.0285, lng: 105.8542 }
    },
    detectedAt: new Date(Date.now() - 7200000), // 2 giờ trước
    reportedAt: new Date(Date.now() - 7200000),
    estimatedImpact: "major",
    assignedTo: db.users.findOne({ role: "analyst" })._id,
    createdBy: db.users.findOne({ role: "admin" })._id,
    tags: ["malware", "endpoint"],
    timeline: [
      {
        timestamp: new Date(Date.now() - 7200000),
        action: "incident_created",
        description: "Sự cố được tạo tự động",
        user: db.users.findOne({ role: "admin" })._id
      },
      {
        timestamp: new Date(Date.now() - 3600000),
        action: "status_changed",
        description: "Trạng thái thay đổi thành: investigating",
        user: db.users.findOne({ role: "analyst" })._id
      }
    ],
    notes: [
      {
        content: "Đã cách ly endpoint và bắt đầu phân tích",
        author: db.users.findOne({ role: "analyst" })._id,
        createdAt: new Date(Date.now() - 3600000),
        isPrivate: false
      }
    ],
    compliance: {
      gdpr: false,
      sox: false,
      pci: false,
      hipaa: false
    }
  }
];

// Insert sample incidents
sampleIncidents.forEach(incident => {
  if (db.incidents.countDocuments({ title: incident.title }) === 0) {
    db.incidents.insertOne(incident);
    print(`Sample incident created: ${incident.title}`);
  }
});

// Tạo dữ liệu mẫu cho alerts
const sampleAlerts = [
  {
    title: "Failed Login Attempts",
    message: "Multiple failed login attempts detected from IP 192.168.1.100",
    severity: "medium",
    status: "new",
    source: "auth.log",
    sourceIp: "192.168.1.100",
    timestamp: new Date(Date.now() - 1800000), // 30 phút trước
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
    createdAt: new Date(Date.now() - 1800000),
    updatedAt: new Date(Date.now() - 1800000)
  },
  {
    title: "Suspicious File Detected",
    message: "Antivirus detected suspicious file: malware.exe",
    severity: "high",
    status: "acknowledged",
    source: "antivirus",
    sourceIp: null,
    timestamp: new Date(Date.now() - 5400000), // 1.5 giờ trước
    acknowledged: true,
    acknowledgedBy: db.users.findOne({ role: "analyst" })._id,
    acknowledgedAt: new Date(Date.now() - 3600000),
    createdAt: new Date(Date.now() - 5400000),
    updatedAt: new Date(Date.now() - 3600000)
  }
];

// Insert sample alerts
sampleAlerts.forEach(alert => {
  if (db.alerts.countDocuments({ title: alert.title, timestamp: alert.timestamp }) === 0) {
    db.alerts.insertOne(alert);
    print(`Sample alert created: ${alert.title}`);
  }
});

print("MongoDB initialization completed successfully!");
