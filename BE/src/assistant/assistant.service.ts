import { Injectable } from '@nestjs/common';

@Injectable()
export class AssistantService {
  async reply(message: string): Promise<string> {
    const t = (message || '').toLowerCase();

    if (t.includes('login') || t.includes('đăng nhập')) {
      return (
        'Để đăng nhập: vào trang Login, nhập email + mật khẩu đã đăng ký. ' +
        'Sau khi đăng nhập thành công, hệ thống lưu token và tự chuyển sang /tests.'
      );
    }

    if (t.includes('register') || t.includes('đăng ký')) {
      return (
        'Đăng ký: nhập username, email và mật khẩu (>= 6 ký tự). ' +
        'Sau khi đăng ký xong, bạn có thể đăng nhập ngay.'
      );
    }

    if (t.includes('test') || t.includes('đề') || t.includes('bài thi')) {
      return (
        'Trang Tests hiển thị danh sách đề hiện có. Nhấn “Làm bài” để vào /exam/:id. ' +
        'Nếu bạn là admin, bạn có thể bấm “Tạo nhanh 1 đề (demo)” để tạo đề + câu hỏi mẫu.'
      );
    }

    if (t.includes('exam') || t.includes('làm bài') || t.includes('nộp')) {
      return (
        'Trang Exam tải đề theo id từ endpoint GET /tests/:id/questions. ' +
        'Có bộ đếm thời gian; khi hết giờ hoặc bấm “Nộp bài”, hệ thống chấm điểm ngay trên FE (demo).' 
      );
    }

    return (
      'Mình có thể hỗ trợ: (1) cách dùng hệ thống (Login/Register/Tests/Exam), ' +
      '(2) gợi ý chiến lược làm bài, hoặc (3) giải 1 câu cụ thể nếu bạn dán đề vào đây.'
    );
  }
}
