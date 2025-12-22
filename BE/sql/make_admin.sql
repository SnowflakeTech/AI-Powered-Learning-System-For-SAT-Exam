USE sat_hsa;

-- Sau khi bạn đăng ký user qua FE, chạy lệnh này để nâng quyền admin cho email tương ứng
UPDATE users SET role='admin' WHERE email='admin@example.com';

SELECT id, username, email, role FROM users WHERE email='admin@example.com';
