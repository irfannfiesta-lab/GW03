<?php
/**
 * Save Analysis Results
 * Saves computed color features and image analysis to database
 * 
 * POST /api/save_analysis.php
 * Body: JSON with student_id, color_features, image_analysis
 */
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'POST method required'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['student_id'])) {
    jsonResponse(['error' => 'Missing student_id'], 400);
}

$db = getDB();
$studentId = (int)$input['student_id'];

// Verify student exists
$check = $db->prepare("SELECT id FROM students WHERE id = ?");
$check->execute([$studentId]);
if (!$check->fetch()) {
    jsonResponse(['error' => 'Student not found'], 404);
}

$saved = [];

// Save color features
if (isset($input['color_features'])) {
    $cf = $input['color_features'];
    $stmt = $db->prepare("
        INSERT INTO color_features (student_id, histogram_r, histogram_g, histogram_b,
            mean_r, mean_g, mean_b, std_r, std_g, std_b, skew_r, skew_g, skew_b,
            dominant_colors, colorfulness, temperature_score, temperature_label,
            avg_saturation, avg_brightness)
        VALUES (:sid, :hr, :hg, :hb, :mr, :mg, :mb, :sr, :sg, :sb, :skr, :skg, :skb,
                :dc, :cf, :ts, :tl, :as2, :ab)
        ON DUPLICATE KEY UPDATE
            histogram_r=VALUES(histogram_r), histogram_g=VALUES(histogram_g), histogram_b=VALUES(histogram_b),
            mean_r=VALUES(mean_r), mean_g=VALUES(mean_g), mean_b=VALUES(mean_b),
            std_r=VALUES(std_r), std_g=VALUES(std_g), std_b=VALUES(std_b),
            skew_r=VALUES(skew_r), skew_g=VALUES(skew_g), skew_b=VALUES(skew_b),
            dominant_colors=VALUES(dominant_colors), colorfulness=VALUES(colorfulness),
            temperature_score=VALUES(temperature_score), temperature_label=VALUES(temperature_label),
            avg_saturation=VALUES(avg_saturation), avg_brightness=VALUES(avg_brightness),
            computed_at=CURRENT_TIMESTAMP
    ");
    $stmt->execute([
        'sid' => $studentId,
        'hr'  => json_encode($cf['histogram_r'] ?? []),
        'hg'  => json_encode($cf['histogram_g'] ?? []),
        'hb'  => json_encode($cf['histogram_b'] ?? []),
        'mr'  => $cf['mean_r'] ?? 0,  'mg' => $cf['mean_g'] ?? 0,  'mb' => $cf['mean_b'] ?? 0,
        'sr'  => $cf['std_r'] ?? 0,   'sg' => $cf['std_g'] ?? 0,   'sb' => $cf['std_b'] ?? 0,
        'skr' => $cf['skew_r'] ?? 0, 'skg' => $cf['skew_g'] ?? 0, 'skb' => $cf['skew_b'] ?? 0,
        'dc'  => json_encode($cf['dominant_colors'] ?? []),
        'cf'  => $cf['colorfulness'] ?? 0,
        'ts'  => $cf['temperature_score'] ?? 0,
        'tl'  => $cf['temperature_label'] ?? 'neutral',
        'as2' => $cf['avg_saturation'] ?? 0,
        'ab'  => $cf['avg_brightness'] ?? 0,
    ]);
    $saved[] = 'color_features';
}

// Save image analysis
if (isset($input['image_analysis'])) {
    $ia = $input['image_analysis'];
    $stmt = $db->prepare("
        INSERT INTO image_analysis (student_id, skin_tone, skin_tone_hex,
            clothing_color, clothing_hex, clothing_description,
            hijab_detected, hijab_color, hijab_hex,
            background_color, background_hex, background_description,
            overall_description, tags)
        VALUES (:sid, :st, :sth, :cc, :ch, :cd, :hd, :hc, :hh, :bc, :bh, :bd, :od, :tags)
        ON DUPLICATE KEY UPDATE
            skin_tone=VALUES(skin_tone), skin_tone_hex=VALUES(skin_tone_hex),
            clothing_color=VALUES(clothing_color), clothing_hex=VALUES(clothing_hex),
            clothing_description=VALUES(clothing_description),
            hijab_detected=VALUES(hijab_detected), hijab_color=VALUES(hijab_color), hijab_hex=VALUES(hijab_hex),
            background_color=VALUES(background_color), background_hex=VALUES(background_hex),
            background_description=VALUES(background_description),
            overall_description=VALUES(overall_description), tags=VALUES(tags),
            analyzed_at=CURRENT_TIMESTAMP
    ");
    $stmt->execute([
        'sid' => $studentId,
        'st'  => $ia['skin_tone'] ?? null,
        'sth' => $ia['skin_tone_hex'] ?? null,
        'cc'  => $ia['clothing_color'] ?? null,
        'ch'  => $ia['clothing_hex'] ?? null,
        'cd'  => $ia['clothing_description'] ?? null,
        'hd'  => $ia['hijab_detected'] ?? false,
        'hc'  => $ia['hijab_color'] ?? null,
        'hh'  => $ia['hijab_hex'] ?? null,
        'bc'  => $ia['background_color'] ?? null,
        'bh'  => $ia['background_hex'] ?? null,
        'bd'  => $ia['background_description'] ?? null,
        'od'  => $ia['overall_description'] ?? null,
        'tags'=> json_encode($ia['tags'] ?? []),
    ]);
    $saved[] = 'image_analysis';
}

jsonResponse(['success' => true, 'saved' => $saved, 'student_id' => $studentId]);
