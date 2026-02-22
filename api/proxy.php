<?php
// Search API Proxy
header('Content-Type: application/json');

$engine = $_GET['engine'] ?? 'google';
$query = $_GET['q'] ?? '';
$num = intval($_GET['num'] ?? 10);

if (!$query) {
    echo json_encode(['error' => 'No query provided']);
    exit;
}

// You would need API keys for actual search engines
// This is a mock implementation
$results = [];

for ($i = 0; $i < $num; $i++) {
    $results[] = [
        'title' => "Result " . ($i+1) . " for: " . substr($query, 0, 50),
        'url' => "https://example.com/result/" . ($i+1),
        'snippet' => "This is a mock search result. In production, use Google Custom Search API, Bing Web Search API, or other search APIs.",
        'engine' => $engine
    ];
}

echo json_encode([
    'query' => $query,
    'engine' => $engine,
    'total' => count($results),
    'results' => $results
]);
?>
