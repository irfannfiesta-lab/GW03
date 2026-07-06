<?php
/**
 * Image Proxy
 * Fetches remote images from bitp3353 server to bypass CORS restrictions
 * 
 * Usage: /api/proxy_image.php?url=uploads/p_B032420131_1.jpg
 */

$allowedDomain = 'bitp3353.utem.edu.my';
$baseUrl = 'https://bitp3353.utem.edu.my/2026/all/';

if (!isset($_GET['url']) || empty($_GET['url'])) {
    http_response_code(400);
    die('Missing url parameter');
}

$requestedPath = $_GET['url'];

// Security: prevent directory traversal
if (strpos($requestedPath, '..') !== false) {
    http_response_code(403);
    die('Invalid path');
}

$fullUrl = $baseUrl . $requestedPath;

// Validate domain
$parsed = parse_url($fullUrl);
if (!$parsed || $parsed['host'] !== $allowedDomain) {
    http_response_code(403);
    die('Unauthorized domain');
}

// Fetch the remote image
$context = stream_context_create([
    'http' => [
        'timeout' => 10,
        'user_agent' => 'ColorRetrievalSystem/1.0',
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false,
    ]
]);

$imageData = @file_get_contents($fullUrl, false, $context);

if ($imageData === false) {
    http_response_code(404);
    die('Image not found: ' . htmlspecialchars($fullUrl));
}

// Detect content type from response headers
$contentType = 'image/jpeg'; // default
if (isset($http_response_header)) {
    foreach ($http_response_header as $header) {
        if (stripos($header, 'Content-Type:') === 0) {
            $contentType = trim(substr($header, 13));
            break;
        }
    }
}

// Fallback: detect from extension
$ext = strtolower(pathinfo($requestedPath, PATHINFO_EXTENSION));
$mimeMap = [
    'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg',
    'png' => 'image/png', 'gif' => 'image/gif',
    'webp' => 'image/webp', 'bmp' => 'image/bmp',
];
if (isset($mimeMap[$ext])) {
    $contentType = $mimeMap[$ext];
}

// Serve with CORS headers
header('Content-Type: ' . $contentType);
header('Content-Length: ' . strlen($imageData));
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=86400'); // Cache for 24h
echo $imageData;
