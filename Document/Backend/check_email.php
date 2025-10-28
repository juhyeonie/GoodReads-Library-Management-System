<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST required']);
    exit;
}

$email = trim($_POST['email'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

$stmt = $pdo->prepare('SELECT 1 FROM ACCOUNT WHERE Email = ? COLLATE NOCASE LIMIT 1');
$stmt->execute([$email]);
$exists = (bool) $stmt->fetchColumn();

echo json_encode(['exists' => $exists]);
