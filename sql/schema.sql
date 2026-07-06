-- ============================================================
-- Color Extraction & Retrieval System — Database Schema
-- Database: color_retrieval_db
-- ============================================================

CREATE DATABASE IF NOT EXISTS color_retrieval_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE color_retrieval_db;

-- -----------------------------------------------------------
-- Table: students
-- Stores student profile data scraped from gallery
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    gallery_id      INT                     COMMENT 'ID from gallery.php (profile.php?id=X)',
    name            VARCHAR(255) NOT NULL   COMMENT 'Student full name',
    matric_no       VARCHAR(50)             COMMENT 'Matric number e.g. B032310619',
    lab_group       VARCHAR(20)             COMMENT 'Lab group e.g. GW01',
    phone           VARCHAR(20)             COMMENT 'Phone number',
    life_motto      TEXT                    COMMENT 'Student life motto',
    photo_url       VARCHAR(500)            COMMENT 'Remote image URL on bitp3353 server',
    photo_filename  VARCHAR(255)            COMMENT 'Local cached filename (if any)',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_gallery_id (gallery_id),
    INDEX idx_matric (matric_no)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Table: color_features
-- Stores extracted color features for each student image
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS color_features (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT NOT NULL,
    histogram_r     TEXT                    COMMENT 'JSON: 256-bin R histogram',
    histogram_g     TEXT                    COMMENT 'JSON: 256-bin G histogram',
    histogram_b     TEXT                    COMMENT 'JSON: 256-bin B histogram',
    mean_r          FLOAT DEFAULT 0,
    mean_g          FLOAT DEFAULT 0,
    mean_b          FLOAT DEFAULT 0,
    std_r           FLOAT DEFAULT 0,
    std_g           FLOAT DEFAULT 0,
    std_b           FLOAT DEFAULT 0,
    skew_r          FLOAT DEFAULT 0,
    skew_g          FLOAT DEFAULT 0,
    skew_b          FLOAT DEFAULT 0,
    dominant_colors TEXT                    COMMENT 'JSON: [{hex, rgb:[r,g,b], weight}]',
    colorfulness    FLOAT DEFAULT 0        COMMENT 'Hasler-Süsstrunk metric',
    temperature_score FLOAT DEFAULT 0      COMMENT '0=cold, 1=warm',
    temperature_label VARCHAR(20)          COMMENT 'warm/neutral/cool',
    avg_saturation  FLOAT DEFAULT 0        COMMENT '0-100%',
    avg_brightness  FLOAT DEFAULT 0        COMMENT '0-100%',
    computed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY uk_student (student_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Table: image_analysis
-- Stores analytical description of each student image
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS image_analysis (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    student_id              INT NOT NULL,
    skin_tone               VARCHAR(50)     COMMENT 'light/fair/medium/olive/brown/dark',
    skin_tone_hex           VARCHAR(7)      COMMENT 'Detected hex e.g. #d4b59c',
    clothing_color          VARCHAR(100)    COMMENT 'Primary clothing color name',
    clothing_hex            VARCHAR(7)      COMMENT 'Detected clothing hex',
    clothing_description    VARCHAR(255)    COMMENT 'e.g. "dark blue baju kurung"',
    hijab_detected          BOOLEAN DEFAULT FALSE,
    hijab_color             VARCHAR(50)     COMMENT 'Hijab color name if detected',
    hijab_hex               VARCHAR(7)      COMMENT 'Detected hijab hex',
    background_color        VARCHAR(100)    COMMENT 'Background color name',
    background_hex          VARCHAR(7)      COMMENT 'Detected background hex',
    background_description  VARCHAR(255)    COMMENT 'e.g. "red studio backdrop"',
    overall_description     TEXT            COMMENT 'Full analytical summary paragraph',
    tags                    TEXT            COMMENT 'JSON: keyword tags for TBR search',
    analyzed_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY uk_student (student_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Table: search_logs
-- Logs every search performed for analytics
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    search_type     ENUM('TBR','CBR','ABR') NOT NULL,
    query_text      VARCHAR(500)            COMMENT 'Keywords or description',
    metric_used     VARCHAR(50)             COMMENT 'e.g. cosine, chi-square',
    results_count   INT DEFAULT 0,
    top_result_id   INT                     COMMENT 'Student ID of top match',
    top_result_score FLOAT DEFAULT 0,
    searched_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (search_type),
    INDEX idx_time (searched_at)
) ENGINE=InnoDB;
