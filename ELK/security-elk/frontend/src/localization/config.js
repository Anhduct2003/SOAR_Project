export const SUPPORTED_LOCALES = ['en', 'vi'];

export const LOCALE_LABELS = {
  en: 'EN',
  vi: 'VI'
};

export const DEFAULT_LOCALE = 'en';

export const apiMessageKeyMap = {
  'Không thể tải alerts': 'common.errors.alertsLoad',
  'Lỗi tải dữ liệu': 'common.errors.incidentsLoad',
  'Không thể tải danh sách người dùng': 'common.errors.usersLoad',
  'Cập nhật thất bại': 'common.errors.updateFailed',
  'Chặn IP thất bại': 'common.errors.blockIpFailed',
  'Loi xac thuc': 'common.errors.auth',
  'Token không hợp lệ': 'common.errors.invalidToken',
  'Không có token, truy cập bị từ chối': 'common.errors.auth',
  'Không có quyền truy cập': 'common.errors.forbidden',
  'Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút.': 'common.errors.rateLimit',
  'Dang nhap that bai': 'auth.loginFailed',
  'Dang ky that bai': 'auth.registerFailed',
  'Cap nhat that bai': 'auth.profileUpdateFailed',
  'Doi mat khau that bai': 'auth.passwordChangeFailed',
  'Password đã được thay đổi thành công': 'auth.passwordChangeSuccess'
};
