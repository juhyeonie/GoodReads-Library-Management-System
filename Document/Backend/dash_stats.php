<?php
// Backend/dash_stats.php (FINAL VERSION)
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php'; 

try {
    // 1. Get Plan Counts
    $planStmt = $pdo->query("SELECT LOWER(Plan) as plan_name, COUNT(AccountID) as count FROM ACCOUNT GROUP BY LOWER(Plan)");
    $planCounts = $planStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // FIX: Count the correct full plan names
    $freeCount = (int)($planCounts['basic plan'] ?? 0); 
    $standardCount = (int)($planCounts['standard plan'] ?? 0);
    $premiumCount = (int)($planCounts['premium plan'] ?? 0);
    
    // 2. Get Total Admins
    $adminStmt = $pdo->query("SELECT COUNT(AccountID) FROM ACCOUNT WHERE Role IN ('SuperAdmin', 'SubsAdmin', 'UserAdmin')");
    $totalAdmins = (int)$adminStmt->fetchColumn();

    // 3. Get Total Customers
    $customerStmt = $pdo->query("SELECT COUNT(AccountID) FROM ACCOUNT WHERE Role = 'Customer'");
    $totalCustomers = (int)$customerStmt->fetchColumn();
    
    // 4. Get Total Books (FIX: Query the actual table)
    $bookStmt = $pdo->query("SELECT COUNT(BookID) FROM BOOKS");
    $totalBooks = (int)$bookStmt->fetchColumn();

    // 5. Get Activity Logs (FIX: Re-enabled)
    $logStmt = $pdo->query("
        SELECT Timestamp, Description 
        FROM ACTIVITY_LOG
        ORDER BY Timestamp DESC 
        LIMIT 6
    ");
    $activityLogs = $logStmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. Send the combined JSON response
    echo json_encode([
        'success' => true,
        'stats' => [
            'free_plan' => $freeCount,
            'standard_plan' => $standardCount,
            'premium_plan' => $premiumCount,
            'total_admins' => $totalAdmins,
            'total_customers' => $totalCustomers,
            'total_books' => $totalBooks,
        ],
        'activityLogs' => $activityLogs 
    ]);

} catch (PDOException $e) {
    error_log('Dashboard stats error: ' . $e->getMessage());
    http_response_code(500);
    // Send debug error for safety
    echo json_encode(['success' => false, 'message' => 'Database error loading stats.', 'debug_error' => $e->getMessage()]);
}