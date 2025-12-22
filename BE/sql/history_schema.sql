USE sat_hsa;


CREATE TABLE IF NOT EXISTS exam_attempts (
  id INT NOT NULL AUTO_INCREMENT,
  userId INT NOT NULL,
  testId INT NOT NULL,
  status ENUM('completed','in_progress') NOT NULL DEFAULT 'completed',
  startedAt DATETIME NULL,
  submittedAt DATETIME NULL,
  durationSec INT NULL,
  correctCount INT NOT NULL DEFAULT 0,
  totalQuestions INT NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  totalScore INT NOT NULL DEFAULT 800,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attempt_user (userId),
  KEY idx_attempt_test (testId),
  CONSTRAINT fk_attempt_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attempt_test FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS exam_attempt_answers (
  id INT NOT NULL AUTO_INCREMENT,
  attemptId INT NOT NULL,
  questionId INT NOT NULL,
  selectedChoiceId INT NULL,
  isCorrect TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ans_attempt (attemptId),
  KEY idx_ans_question (questionId),
  KEY idx_ans_choice (selectedChoiceId),
  CONSTRAINT fk_ans_attempt FOREIGN KEY (attemptId) REFERENCES exam_attempts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ans_question FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ans_choice FOREIGN KEY (selectedChoiceId) REFERENCES questionchoices(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
