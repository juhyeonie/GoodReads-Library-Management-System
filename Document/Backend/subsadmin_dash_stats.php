<?php
// Backend/subsadmin_dash_stats.php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

require_once __DIR__ . '/config.php';

try {
    // 1. Get Plan Counts (for Customers only)
    $planStmt = $pdo->query("
        SELECT 
            LOWER(Plan) as plan_name, 
            COUNT(AccountID) as count 
        FROM ACCOUNT 
        WHERE Role = 'Customer' 
        GROUP BY LOWER(Plan)
    ");
    $planCounts = $planStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // 2. Get Status Counts (for Customers only)
    $statusStmt = $pdo->query("
        SELECT 
            LOWER(Plan_Status) as status_name, 
            COUNT(AccountID) as count 
        FROM ACCOUNT 
        WHERE Role = 'Customer' AND Plan_Status IN ('Expired', 'Cancelled')
        GROUP BY LOWER(Plan_Status)
    ");
    $statusCounts = $statusStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // Combine all stats into one object
    $stats = [
        'free' => (int)($planCounts['basic plan'] ?? 0),
        'standard' => (int)($planCounts['standard plan'] ?? 0),
        'premium' => (int)($planCounts['premium plan'] ?? 0),
        'expired' => (int)($statusCounts['expired'] ?? 0),
        'cancelled' => (int)($statusCounts['cancelled'] ?? 0)
    ];

    // 3. Get 10 Most Recent PAID Subscriptions (Customers only)
    //    - EXCLUDES 'Basic Plan'
    //    - MODIFIED: Now orders by SubsStarted DESC to get the most recent dates first.
    $usersStmt = $pdo->query("
        SELECT AccountID, Email, Plan, Payment_Method, SubsStarted
        FROM ACCOUNT 
        WHERE Role = 'Customer' AND Plan IN ('Standard Plan', 'Premium Plan')
        ORDER BY SubsStarted DESC
        LIMIT 10
    ");
    $recentUsers = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Send combined response
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
