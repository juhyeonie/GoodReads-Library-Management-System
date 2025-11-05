<?php
// Backend/activity_log.php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config.php';

// Security Check: Only SuperAdmin should be able to view all logs
if (($_SESSION['user']['Role'] ?? '') !== 'SuperAdmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden: You do not have permission.']);
    exit;
}

try {
    // 1. Prepare the query
    // We LEFT JOIN ACCOUNT to get both Email (as AdminName) and Role
    // We use COALESCE to show 'System' if the AccountID is 0 or NULL
    $stmt = $pdo->query("
        SELECT 
            L.Timestamp,
            COALESCE(A.Email, 'System') AS AdminName,
            A.Role,
            L.Description
        FROM 
            ACTIVITY_LOG AS L
        LEFT JOIN 
            ACCOUNT AS A ON L.AccountID = A.AccountID
        ORDER BY 
            L.LogID DESC
    ");

    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Send the response
    echo json_encode([
        'success' => true,
        'logs' => $logs
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Activity Log fetch error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error loading activity logs.', 'debug_error' => $e->getMessage()]);
}
