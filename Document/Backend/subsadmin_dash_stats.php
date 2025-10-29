<?php
// Backend/subsadmin_dash_stats.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php'; 

try {
    // 1. Get Plan Counts (for Customers only)
    // (This part remains the same)
    $planStmt = $pdo->query("
        SELECT 
            LOWER(Plan) as plan_name, 
            COUNT(AccountID) as count 
        FROM ACCOUNT 
        WHERE Role = 'Customer' 
        GROUP BY LOWER(Plan)
    ");
    $planCounts = $planStmt->fetchAll(PDO::FETCH_KEY_PAIR); 

    $stats = [
        'free' => (int)($planCounts['basic plan'] ?? 0),
        'standard' => (int)($planCounts['standard plan'] ?? 0),
        'premium' => (int)($planCounts['premium plan'] ?? 0)
    ];
    
    // --- UPDATED QUERY ---
    // 2. Get 10 Most Recent Subscriptions (Customers only)
    //    - REMOVED "AND Plan_Status = 'Active'"
    //    - Kept "LIMIT 10"
    $usersStmt = $pdo->query("
        SELECT AccountID, Email, Plan, Payment_Method 
        FROM ACCOUNT 
        WHERE Role = 'Customer'
        ORDER BY AccountID DESC
        LIMIT 10
    ");
    $recentUsers = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Send combined response
    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'recentUsers' => $recentUsers
    ]);

} catch (PDOException $e) {
    error_log('SubsAdmin Dashboard stats error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error loading dashboard data.']);
}
?>