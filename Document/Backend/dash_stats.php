<?php
// Backend/dash_stats.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php'; 

try {
    // 1. Get Plan Counts
    $planStmt = $pdo->query("SELECT LOWER(Plan) as plan_name, COUNT(AccountID) as count FROM ACCOUNT GROUP BY LOWER(Plan)");
    $planCounts = $planStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $freeCount = (int)($planCounts['basic'] ?? 0); 
    $standardCount = (int)($planCounts['standard'] ?? 0);
    $premiumCount = (int)($planCounts['premium'] ?? 0);
    
    // 2. Get Total Admins
    $adminStmt = $pdo->query("SELECT COUNT(AccountID) FROM ACCOUNT WHERE Role IN ('SuperAdmin', 'SubsAdmin', 'UserAdmin')");
    $totalAdmins = (int)$adminStmt->fetchColumn();

    // 3. Get Total Customers
    $customerStmt = $pdo->query("SELECT COUNT(AccountID) FROM ACCOUNT WHERE Role = 'Customer'");
    $totalCustomers = (int)$customerStmt->fetchColumn();
    
    // 4. Get Total Books (Placeholder)
    $totalBooks = 4;

    // 📢 5. Get Activity Logs
    // Note: If you want to show the admin's name, you should join with the ACCOUNT table. 
    // For now, we fetch just the Timestamp and Description from ACTIVITY_LOG.
    $logStmt = $pdo->query("
        SELECT 
            Timestamp, 
            Description 
        FROM ACTIVITY_LOG
        ORDER BY Timestamp DESC 
        LIMIT 6
    ");
    $activityLogs = $logStmt->fetchAll(PDO::FETCH_ASSOC);

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
        'activityLogs' => $activityLogs // Including the log data
    ]);

} catch (PDOException $e) {
    error_log('Dashboard stats error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error loading stats.']);
}