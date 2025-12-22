USE sat_hsa;

CREATE TABLE IF NOT EXISTS feedbacks (
  id INT NOT NULL AUTO_INCREMENT,
  userId INT NOT NULL,

  type ENUM('wrong_answer','invalid_question','too_hard','bug','other') NOT NULL,
  message TEXT NOT NULL,

  status ENUM('open','in_review','resolved','dismissed') NOT NULL DEFAULT 'open',
  priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',

  testId INT NULL,
  questionId INT NULL,
  attemptId INT NULL,

  adminNote TEXT NULL,

  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_feedback_userId (userId),
  KEY idx_feedback_testId (testId),
  KEY idx_feedback_questionId (questionId),
  KEY idx_feedback_attemptId (attemptId),

  CONSTRAINT fk_feedback_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_feedback_test FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_feedback_question FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_feedback_attempt FOREIGN KEY (attemptId) REFERENCES exam_attempts(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
