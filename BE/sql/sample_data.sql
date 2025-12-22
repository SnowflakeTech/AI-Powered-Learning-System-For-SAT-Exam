USE sat_hsa;

-- Tạo 1 đề demo
INSERT INTO tests (mode, title, durationSec, quantities, startedAt, userId, createdAt, updatedAt)
VALUES ('fixed', 'Đề demo #1', 900, 0, NOW(), NULL, NOW(), NOW());
SET @testId := LAST_INSERT_ID();

-- Câu 1
INSERT INTO questions (hashId, content, section, skill, passage, difficulty, model, createdAt, updatedAt)
VALUES (NULL, 'Nếu 2x = 10 thì x = ?', 'math', 'algebra', NULL, 'easy', NULL, NOW(), NOW());
SET @q1 := LAST_INSERT_ID();

INSERT INTO questionchoices (choiceText, isCorrect, questionId, choiceOrder, createdAt, updatedAt)
VALUES
('3', 0, @q1, 1, NOW(), NOW()),
('5', 1, @q1, 2, NOW(), NOW()),
('7', 0, @q1, 3, NOW(), NOW()),
('10', 0, @q1, 4, NOW(), NOW());

-- Câu 2
INSERT INTO questions (hashId, content, section, skill, passage, difficulty, model, createdAt, updatedAt)
VALUES (NULL, 'Hàm số y = x^2 có cực tiểu tại x = ?', 'math', 'calculus', NULL, 'easy', NULL, NOW(), NOW());
SET @q2 := LAST_INSERT_ID();

INSERT INTO questionchoices (choiceText, isCorrect, questionId, choiceOrder, createdAt, updatedAt)
VALUES
('-1', 0, @q2, 1, NOW(), NOW()),
('0', 1, @q2, 2, NOW(), NOW()),
('1', 0, @q2, 3, NOW(), NOW()),
('2', 0, @q2, 4, NOW(), NOW());

-- Gắn vào đề
INSERT INTO test_questions (testId, questionId, `order`, createdAt, updatedAt)
VALUES
(@testId, @q1, 1, NOW(), NOW()),
(@testId, @q2, 2, NOW(), NOW());

-- cập nhật quantities
UPDATE tests SET quantities = (SELECT COUNT(*) FROM test_questions WHERE testId=@testId) WHERE id=@testId;

SELECT id, title, quantities FROM tests WHERE id=@testId;
