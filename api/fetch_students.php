<?php
/**
 * Fetch Students API
 * Returns student data with color features and image analysis
 * 
 * GET /api/fetch_students.php          → All students
 * GET /api/fetch_students.php?id=5     → Single student
 */
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$db = getDB();

if (isset($_GET['id'])) {
    // Single student
    $stmt = $db->prepare("
        SELECT s.*, 
               cf.mean_r, cf.mean_g, cf.mean_b,
               cf.std_r, cf.std_g, cf.std_b,
               cf.skew_r, cf.skew_g, cf.skew_b,
               cf.dominant_colors, cf.colorfulness,
               cf.temperature_score, cf.temperature_label,
               cf.avg_saturation, cf.avg_brightness,
               cf.histogram_r, cf.histogram_g, cf.histogram_b,
               ia.skin_tone, ia.clothing_color, ia.clothing_description,
               ia.hijab_detected, ia.hijab_color,
               ia.background_color, ia.background_description,
               ia.overall_description, ia.tags
        FROM students s
        LEFT JOIN color_features cf ON cf.student_id = s.id
        LEFT JOIN image_analysis ia ON ia.student_id = s.id
        WHERE s.id = :id
    ");
    $stmt->execute(['id' => (int)$_GET['id']]);
    $student = $stmt->fetch();
    
    if (!$student) {
        jsonResponse(['error' => 'Student not found'], 404);
    }
    
    // Parse JSON fields
    $student['dominant_colors'] = json_decode($student['dominant_colors'] ?? '[]', true);
    $student['tags'] = json_decode($student['tags'] ?? '[]', true);
    $student['histogram_r'] = json_decode($student['histogram_r'] ?? '[]', true);
    $student['histogram_g'] = json_decode($student['histogram_g'] ?? '[]', true);
    $student['histogram_b'] = json_decode($student['histogram_b'] ?? '[]', true);
    $student['photo_full_url'] = UPLOADS_BASE_URL . basename($student['photo_url'] ?? '');
    
    jsonResponse($student);
} else {
    // All students
    $stmt = $db->query("
        SELECT s.*, 
               cf.dominant_colors, cf.colorfulness,
               cf.temperature_score, cf.temperature_label,
               cf.avg_saturation, cf.avg_brightness,
               cf.mean_r, cf.mean_g, cf.mean_b,
               cf.std_r, cf.std_g, cf.std_b,
               cf.skew_r, cf.skew_g, cf.skew_b,
               cf.histogram_r, cf.histogram_g, cf.histogram_b,
               ia.overall_description, ia.tags,
               ia.skin_tone, ia.clothing_color, ia.hijab_detected, ia.hijab_color,
               ia.background_color
        FROM students s
        LEFT JOIN color_features cf ON cf.student_id = s.id
        LEFT JOIN image_analysis ia ON ia.student_id = s.id
        ORDER BY s.gallery_id DESC
    ");
    $students = $stmt->fetchAll();
    
    foreach ($students as &$s) {
        $s['dominant_colors'] = json_decode($s['dominant_colors'] ?? '[]', true);
        $s['tags'] = json_decode($s['tags'] ?? '[]', true);
        $s['histogram_r'] = json_decode($s['histogram_r'] ?? '[]', true);
        $s['histogram_g'] = json_decode($s['histogram_g'] ?? '[]', true);
        $s['histogram_b'] = json_decode($s['histogram_b'] ?? '[]', true);
        $photoFile = $s['photo_url'] ?? '';
        // The photo_url in DB is like 'uploads/filename.jpg'
        // Build full URL by stripping 'uploads/' prefix and prepending base
        $filename = preg_replace('/^uploads\//', '', $photoFile);
        $s['photo_full_url'] = UPLOADS_BASE_URL . rawurlencode($filename);
    }
    
    jsonResponse(['count' => count($students), 'students' => $students]);
}
