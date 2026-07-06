<?php
/**
 * Smart Gallery Importer — Scrapes student profiles from bitp3353 gallery
 * 
 * Adapted from user's ChromaSeek importer approach.
 * Scrapes gallery.php → finds profile IDs → fetches each profile → downloads photos.
 * 
 * Run via: http://localhost/color-retrieval-system/api/scrape_gallery.php
 *          ?limit=20  (optional: max profiles to process, default=40)
 */

require_once 'config.php';

// Allow the import process to run for up to 60 seconds
set_time_limit(60);
ini_set('max_execution_time', '60');
ini_set('default_socket_timeout', '60');

// Force output buffering off for real-time progress
ob_implicit_flush(true);
if (ob_get_level()) ob_end_flush();

echo "<html><head><title>Gallery Importer</title>";
echo "<style>body{background:#0a0e17;color:#f1f5f9;font-family:'Consolas',monospace;padding:20px;font-size:13px}";
echo ".ok{color:#34d399}.err{color:#f87171}.warn{color:#fbbf24}.info{color:#38bdf8}h2{color:#a78bfa}pre{white-space:pre-wrap}</style></head><body>";
echo "<h2>🎨 Color Retrieval System — Gallery Importer</h2><pre>";

// SSL context to bypass certificate issues on the school server
$context = stream_context_create([
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false
    ],
    "http" => [
        "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n",
        "timeout" => 60
    ]
]);

$portalBase = GALLERY_BASE_URL; // from config.php
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 200;

// =====================================================================
// STEP 1: SCRAPE GALLERY.PHP TO GET ALL VALID STUDENT IDs
// =====================================================================
echo "<span class='info'>[STEP 1]</span> Fetching gallery list from portal...\n";
$galleryHtml = @file_get_contents($portalBase . "gallery.php", false, $context);

if ($galleryHtml === false) {
    echo "<span class='err'>[FATAL]</span> Failed to connect to gallery portal.\n";
    echo "Check internet connection or try again later.\n";
    echo "</pre></body></html>";
    exit;
}

// Extract all profile.php?id=XXX links
preg_match_all("/profile\.php\?id=(\d+)/", $galleryHtml, $matches);
$validIds = array_unique($matches[1]);

if (empty($validIds)) {
    echo "<span class='err'>[FATAL]</span> No student IDs found on gallery page.\n";
    echo "</pre></body></html>";
    exit;
}

// Sort descending (newest first)
rsort($validIds);
echo "<span class='ok'>[OK]</span> Found " . count($validIds) . " student profiles!\n\n";

// =====================================================================
// STEP 2: CONNECT TO DATABASE
// =====================================================================
echo "<span class='info'>[STEP 2]</span> Connecting to database...\n";
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "<span class='ok'>[OK]</span> Database connected.\n\n";
} catch (PDOException $e) {
    echo "<span class='err'>[FATAL]</span> Database connection failed: " . $e->getMessage() . "\n";
    echo "Make sure you ran db_setup.php first!\n";
    echo "</pre></body></html>";
    exit;
}

// Prepare statements
$stmtInsert = $pdo->prepare("
    INSERT INTO students (gallery_id, name, matric_no, lab_group, phone, life_motto, photo_url, photo_filename)
    VALUES (:gid, :name, :matric, :grp, :phone, :motto, :photo_url, :photo_file)
    ON DUPLICATE KEY UPDATE
        name = VALUES(name), matric_no = VALUES(matric_no), lab_group = VALUES(lab_group),
        phone = VALUES(phone), life_motto = VALUES(life_motto),
        photo_url = VALUES(photo_url), photo_filename = VALUES(photo_filename)
");

// Create local uploads directory
$uploadsDir = __DIR__ . '/../uploads';
if (!file_exists($uploadsDir)) {
    mkdir($uploadsDir, 0777, true);
    echo "<span class='ok'>[OK]</span> Created uploads directory.\n";
}

// =====================================================================
// STEP 3: LOOP THROUGH EACH PROFILE
// =====================================================================
$processedCount = 0;
$successCount = 0;
$errorCount = 0;

foreach ($validIds as $currentId) {
    if ($processedCount >= $limit) {
        echo "\n<span class='warn'>[LIMIT]</span> Reached limit of $limit profiles. ";
        echo "Add ?limit=300 to process more.\n";
        break;
    }

    echo "────────────────────────────────────────────────\n";
    echo "<span class='info'>[Profile #$currentId]</span> Scanning...\n";

    $profileUrl = $portalBase . "profile.php?id=" . $currentId;
    $html = @file_get_contents($profileUrl, false, $context);

    if ($html === false) {
        echo "  <span class='err'>[X]</span> Failed to load profile page. Skipping.\n";
        $errorCount++;
        $processedCount++;
        continue;
    }

    // Parse HTML with DOMDocument
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    @$dom->loadHTML($html);
    libxml_clear_errors();
    $xpath = new DOMXPath($dom);

    // Extract student info from profile form inputs
    $studentName = trim($xpath->evaluate("string(//input[@name='fullname']/@value)"));
    $matricNo    = trim($xpath->evaluate("string(//label[text()='Matric No']/following-sibling::input/@value)"));
    $groupCode   = trim($xpath->evaluate("string(//label[text()='Group']/following-sibling::input/@value)"));
    $phone       = trim($xpath->evaluate("string(//label[contains(text(),'Phone')]/following-sibling::input/@value)"));
    $motto       = trim($xpath->evaluate("string(//label[contains(text(),'Motto')]/following-sibling::input/@value)"));

    // Fallback: try alternate selectors
    if (empty($studentName)) {
        $studentName = trim($xpath->evaluate("string(//input[@id='fullname']/@value)"));
    }
    if (empty($matricNo)) {
        $matricNo = trim($xpath->evaluate("string(//input[@name='matric_no']/@value)"));
    }

    if (empty($matricNo) && empty($studentName)) {
        echo "  <span class='warn'>[!]</span> Could not extract student info. Skipping.\n";
        $errorCount++;
        $processedCount++;
        continue;
    }

    echo "  <span class='ok'>[✓]</span> $studentName ($matricNo) — $groupCode\n";

    // Extract photo URL (profile-img class or first img in profile section)
    $photoRelUrl = trim($xpath->evaluate("string(//img[@class='profile-img']/@src)"));
    if (empty($photoRelUrl)) {
        $photoRelUrl = trim($xpath->evaluate("string(//img[contains(@class,'profile')]/@src)"));
    }
    if (empty($photoRelUrl)) {
        // Try any img with 'uploads' in src
        $photoRelUrl = trim($xpath->evaluate("string(//img[contains(@src,'uploads')]/@src)"));
    }

    $photoFilename = '';
    if (!empty($photoRelUrl)) {
        $photoFilename = basename($photoRelUrl);

        // Download photo locally
        $localPath = $uploadsDir . '/' . $photoFilename;
        if (!file_exists($localPath)) {
            $fullImgUrl = $portalBase . $photoRelUrl;
            $imgData = @file_get_contents($fullImgUrl, false, $context);
            if ($imgData !== false) {
                file_put_contents($localPath, $imgData);
                echo "  <span class='ok'>[+]</span> Downloaded photo: $photoFilename\n";
            } else {
                echo "  <span class='warn'>[!]</span> Photo download failed.\n";
            }
        } else {
            echo "  <span class='info'>[-]</span> Photo already cached: $photoFilename\n";
        }
    } else {
        echo "  <span class='warn'>[!]</span> No photo found on profile.\n";
    }

    // Insert/Update in database
    try {
        $stmtInsert->execute([
            'gid'       => $currentId,
            'name'      => $studentName ?: 'Unknown',
            'matric'    => $matricNo,
            'grp'       => $groupCode,
            'phone'     => $phone,
            'motto'     => $motto,
            'photo_url' => $photoRelUrl,
            'photo_file'=> $photoFilename,
        ]);
        echo "  <span class='ok'>[✓]</span> Database record saved.\n";
        $successCount++;
    } catch (PDOException $e) {
        echo "  <span class='err'>[X]</span> DB error: " . $e->getMessage() . "\n";
        $errorCount++;
    }

    $processedCount++;
    flush();
}

// =====================================================================
// SUMMARY
// =====================================================================
echo "\n════════════════════════════════════════════════\n";
echo "<span class='ok'>[DONE]</span> Gallery import complete!\n";
echo "  Processed: $processedCount\n";
echo "  Success:   <span class='ok'>$successCount</span>\n";
echo "  Errors:    <span class='err'>$errorCount</span>\n";

// Count total in DB
$total = $pdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
echo "  Total in DB: $total students\n\n";

echo "<a href='../index.html' style='color:#38bdf8'>→ Go to Color Retrieval System</a>\n";
echo "<a href='fetch_students.php' style='color:#38bdf8'>→ Test API: Fetch Students</a>\n";

echo "</pre></body></html>";
