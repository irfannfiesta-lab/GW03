<?php
/**
 * Search Log API
 * Logs search queries for analytics
 * 
 * POST /api/search_log.php
 */
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['search_type'])) {
        jsonResponse(['error' => 'Missing search_type'], 400);
    }
    $stmt = $db->prepare("
        INSERT INTO search_logs (search_type, query_text, metric_used, results_count, top_result_id, top_result_score)
        VALUES (:st, :qt, :mu, :rc, :tri, :trs)
    ");
    $stmt->execute([
        'st'  => $input['search_type'],
        'qt'  => $input['query_text'] ?? '',
        'mu'  => $input['metric_used'] ?? '',
        'rc'  => $input['results_count'] ?? 0,
        'tri' => $input['top_result_id'] ?? null,
        'trs' => $input['top_result_score'] ?? 0,
    ]);
    jsonResponse(['success' => true, 'log_id' => $db->lastInsertId()]);
} else {
    // GET: return recent search logs
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 20;
    $stmt = $db->prepare("SELECT * FROM search_logs ORDER BY searched_at DESC LIMIT ?");
    $stmt->execute([$limit]);
    jsonResponse($stmt->fetchAll());
}
