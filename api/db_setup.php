<?php
/**
 * Database Setup Script
 * Creates tables and inserts student data from bitp3353 gallery
 * 
 * Run via: http://localhost/color-retrieval-system/api/db_setup.php
 */

// --- Step 1: Create Database ---
try {
    $pdo = new PDO("mysql:host=localhost;charset=utf8mb4", "root", "", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS color_retrieval_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE color_retrieval_db");
    echo "<h2>✅ Database 'color_retrieval_db' created/verified</h2>";
} catch (PDOException $e) {
    die("<h2>❌ Database creation failed: " . $e->getMessage() . "</h2>");
}

// --- Step 2: Create Tables ---
$tables = [
    'students' => "
        CREATE TABLE IF NOT EXISTS students (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            gallery_id      INT,
            name            VARCHAR(255) NOT NULL,
            matric_no       VARCHAR(50),
            lab_group       VARCHAR(20),
            phone           VARCHAR(20),
            life_motto      TEXT,
            photo_url       VARCHAR(500),
            photo_filename  VARCHAR(255),
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_gallery_id (gallery_id),
            INDEX idx_matric (matric_no)
        ) ENGINE=InnoDB
    ",
    'color_features' => "
        CREATE TABLE IF NOT EXISTS color_features (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            student_id      INT NOT NULL,
            histogram_r     TEXT,
            histogram_g     TEXT,
            histogram_b     TEXT,
            mean_r FLOAT DEFAULT 0, mean_g FLOAT DEFAULT 0, mean_b FLOAT DEFAULT 0,
            std_r FLOAT DEFAULT 0, std_g FLOAT DEFAULT 0, std_b FLOAT DEFAULT 0,
            skew_r FLOAT DEFAULT 0, skew_g FLOAT DEFAULT 0, skew_b FLOAT DEFAULT 0,
            dominant_colors TEXT,
            colorfulness    FLOAT DEFAULT 0,
            temperature_score FLOAT DEFAULT 0,
            temperature_label VARCHAR(20),
            avg_saturation  FLOAT DEFAULT 0,
            avg_brightness  FLOAT DEFAULT 0,
            computed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            UNIQUE KEY uk_student (student_id)
        ) ENGINE=InnoDB
    ",
    'image_analysis' => "
        CREATE TABLE IF NOT EXISTS image_analysis (
            id                      INT AUTO_INCREMENT PRIMARY KEY,
            student_id              INT NOT NULL,
            skin_tone               VARCHAR(50),
            skin_tone_hex           VARCHAR(7),
            clothing_color          VARCHAR(100),
            clothing_hex            VARCHAR(7),
            clothing_description    VARCHAR(255),
            hijab_detected          BOOLEAN DEFAULT FALSE,
            hijab_color             VARCHAR(50),
            hijab_hex               VARCHAR(7),
            background_color        VARCHAR(100),
            background_hex          VARCHAR(7),
            background_description  VARCHAR(255),
            overall_description     TEXT,
            tags                    TEXT,
            analyzed_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            UNIQUE KEY uk_student (student_id)
        ) ENGINE=InnoDB
    ",
    'search_logs' => "
        CREATE TABLE IF NOT EXISTS search_logs (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            search_type     ENUM('TBR','CBR','ABR') NOT NULL,
            query_text      VARCHAR(500),
            metric_used     VARCHAR(50),
            results_count   INT DEFAULT 0,
            top_result_id   INT,
            top_result_score FLOAT DEFAULT 0,
            searched_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_type (search_type),
            INDEX idx_time (searched_at)
        ) ENGINE=InnoDB
    "
];

foreach ($tables as $name => $sql) {
    try {
        $pdo->exec($sql);
        echo "<p>✅ Table <strong>$name</strong> created/verified</p>";
    } catch (PDOException $e) {
        echo "<p>❌ Table <strong>$name</strong> failed: " . $e->getMessage() . "</p>";
    }
}

// --- Step 3: Insert Student Data from Gallery ---
$students = [
    ['gallery_id' => 119, 'name' => 'Nurin Zuhairah Binti Azhar',           'matric_no' => 'B032420131', 'photo_url' => 'uploads/p_B032420131_1.jpg'],
    ['gallery_id' => 118, 'name' => 'Umar Ashraffi bin Adnan',              'matric_no' => 'B032310374', 'photo_url' => 'uploads/B032310374_20260611_054653_matric card.jpg'],
    ['gallery_id' => 117, 'name' => 'NUR WAHIDA BINTI NORIZIADY',           'matric_no' => 'B032310134', 'photo_url' => 'uploads/p_B032310134_1.jpg'],
    ['gallery_id' => 116, 'name' => 'NUR ELIZA BINTI ANTHONY',              'matric_no' => 'B032310619', 'photo_url' => 'uploads/B032310619_20260611_042838_WhatsApp Image 2026-06-11 at 12.27.18 PM.jpeg'],
    ['gallery_id' => 111, 'name' => 'Nik Arlina binti Nik Abdul Rahman',    'matric_no' => 'B032310739', 'photo_url' => 'uploads/p_B032310739_1.jpeg'],
    ['gallery_id' => 110, 'name' => 'AIN SURIANI BINTI ZULKEFLI',           'matric_no' => 'B032410183', 'photo_url' => 'uploads/B032410183_20260610_115658_AIN.jpeg'],
    ['gallery_id' => 109, 'name' => 'NURUL AIN NASUHA BINTI REDUAN',        'matric_no' => 'B032410176', 'photo_url' => 'uploads/p_B032410176_1.jpg'],
    ['gallery_id' => 108, 'name' => 'NUR SYARMIMI ALIA HUSNA BINTI ZAIPOLBAHARI', 'matric_no' => 'B032310381', 'photo_url' => 'uploads/p_B032310381_1.jpg'],
    ['gallery_id' => 103, 'name' => 'MIZA BINTI MOHAMAD RADZI',             'matric_no' => 'B032310641', 'photo_url' => 'uploads/p_B032310641_1.jpeg'],
    ['gallery_id' => 102, 'name' => 'HENG HUEY JIN',                        'matric_no' => 'B032420041', 'photo_url' => 'uploads/p_B032420041_1.jpeg'],
    ['gallery_id' => 101, 'name' => 'MIYA AOYON',                           'matric_no' => 'B032220052', 'photo_url' => 'uploads/p_B032220052_1.jpeg'],
    ['gallery_id' => 100, 'name' => 'Muhammad Rukaini Aidil',               'matric_no' => 'B032410200', 'photo_url' => 'uploads/B032410200_20260521_055841_IMG_1406.png'],
    ['gallery_id' => 95,  'name' => 'Fatin Nur Faqihah Bt Md Radzi',        'matric_no' => 'B032310211', 'photo_url' => 'uploads/p_B032310211_1.JPG'],
    ['gallery_id' => 94,  'name' => 'Nureen Amini Binti Fairuz',            'matric_no' => 'B032420127', 'photo_url' => 'uploads/p_B032420127_1.jpeg'],
    ['gallery_id' => 93,  'name' => 'MOHAMAD ZARIL AIDID BIN RASHID',       'matric_no' => 'B032420059', 'photo_url' => 'uploads/p_B032420059_1.jpeg'],
    ['gallery_id' => 92,  'name' => 'SHARIFAH YASMIN BINTI SYD KHALIL',     'matric_no' => 'B032310193', 'photo_url' => 'uploads/p_B032310193_1.jpeg'],
    ['gallery_id' => 90,  'name' => 'MARSYA KAMILIA BINTI YUSRIZAL',        'matric_no' => 'B032310514', 'photo_url' => 'uploads/1779275687_WhatsApp Image 2026-05-20 at 6.50.06 PM.jpeg'],
    ['gallery_id' => 89,  'name' => 'SITI NURATIQAH BINTI ABU BAKAR',       'matric_no' => 'B032310424', 'photo_url' => 'uploads/1779272491_64262.jpg'],
    ['gallery_id' => 84,  'name' => 'AMEERAH MAISARAH BINTI ROSZAINI',      'matric_no' => 'B032310648', 'photo_url' => 'uploads/1779250207_BA63B6BA-CAF0-412F-97F6-F2A99F427238.png'],
    ['gallery_id' => 91,  'name' => 'Hidayah',                              'matric_no' => 'B0231241',   'photo_url' => 'uploads/p_B0231241_1.gif'],
];

$stmt = $pdo->prepare("
    INSERT INTO students (gallery_id, name, matric_no, photo_url) 
    VALUES (:gallery_id, :name, :matric_no, :photo_url)
    ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        matric_no = VALUES(matric_no),
        photo_url = VALUES(photo_url)
");

$inserted = 0;
foreach ($students as $s) {
    try {
        $stmt->execute($s);
        $inserted++;
    } catch (PDOException $e) {
        echo "<p>⚠️ Student '{$s['name']}' insert warning: " . $e->getMessage() . "</p>";
    }
}
echo "<h2>✅ $inserted students inserted/updated</h2>";

// --- Step 4: Summary ---
echo "<hr>";
echo "<h2>🎉 Database Setup Complete!</h2>";
echo "<p><strong>Database:</strong> color_retrieval_db</p>";
echo "<p><strong>Tables:</strong> students, color_features, image_analysis, search_logs</p>";
echo "<p><strong>Students:</strong> $inserted records</p>";
echo "<p><a href='../index.html'>→ Go to Color Retrieval System</a></p>";
echo "<p><a href='fetch_students.php'>→ Test API: Fetch Students</a></p>";
?>
