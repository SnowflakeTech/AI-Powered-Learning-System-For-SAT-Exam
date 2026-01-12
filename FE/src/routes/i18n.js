export const DICT = {
  vi: {
    nav: {
      dashboard: "Màn hình chính",
      tests: "Luyện theo đề thi",
      practice: "Luyện theo kỹ năng",
      lookup: "Tra cứu",
      assistant: "Trợ lý học tập",
      history: "Lịch sử làm bài",
      stats: "Thống kê",
      feedback: "Phản hồi",
      settings: "Cài đặt",
      hello: "Xin chào",
      logout: "Đăng xuất",
    },
    settings: {
      title: "Cài đặt",
      subtitle: "Quản lý tài khoản, bảo mật và tuỳ chọn hiển thị.",
      role: "Vai trò",
      userId: "User ID",
      createdAt: "Ngày tạo",
      lastLoginAt: "Đăng nhập gần nhất",
      lastLoginIp: "IP gần nhất",
      lastDevice: "Thiết bị gần nhất",
      display: "Tuỳ chọn hiển thị",
      language: "Ngôn ngữ",
      security: "Bảo mật",
      currentPassword: "Mật khẩu hiện tại",
      newPassword: "Mật khẩu mới",
      confirmPassword: "Nhập lại mật khẩu mới",
      updatePassword: "Cập nhật mật khẩu",
      passwordHint: "Tối thiểu 6 ký tự.",
      infoTitle: "Thông tin",
      infoText:
        "Nếu gặp lỗi khi làm bài hoặc phát hiện sai đáp án, hãy vào mục Phản hồi để báo lỗi kèm attemptId/testId.",
      aboutTitle: "Về hệ thống",
      aboutText: "Hệ thống luyện thi SAT/HSA tích hợp AI.",
      authors: "Tác giả: Phạm Sơn – Lê Quốc Anh – Đặng Sỹ Toàn",
      savedLangHint: "Ngôn ngữ được lưu trên trình duyệt và áp dụng cho mọi trang.",
    },
  },

  en: {
    nav: {
      dashboard: "Dashboard",
      tests: "Practice tests",
      practice: "Skill practice",
      lookup: "Lookup",
      assistant: "Study assistant",
      history: "History",
      stats: "Statistics",
      feedback: "Feedback",
      settings: "Settings",
      hello: "Hello",
      logout: "Log out",
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your account, security, and display preferences.",
      role: "Role",
      userId: "User ID",
      createdAt: "Created at",
      lastLoginAt: "Last login",
      lastLoginIp: "Last IP",
      lastDevice: "Last device",
      display: "Display",
      language: "Language",
      security: "Security",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmPassword: "Confirm new password",
      updatePassword: "Update password",
      passwordHint: "At least 6 characters.",
      infoTitle: "Tip",
      infoText:
        "If you find a wrong answer or a bug, use Feedback and include attemptId/testId.",
      aboutTitle: "About",
      aboutText: "SAT/HSA practice system with AI.",
      authors: "Authors: Pham Son – Le Quoc Anh - Dang Sy Toan",
      savedLangHint: "Language is saved in your browser and applies to all pages.",
    },
  },
};

export function t(lang, key, fallback = "") {
  const parts = String(key || "").split(".");
  const dict = DICT[lang] || DICT.vi;
  let cur = dict;
  for (const p of parts) {
    cur = cur?.[p];
    if (cur === undefined || cur === null) return fallback || key;
  }
  return typeof cur === "string" ? cur : fallback || key;
}
