<?php
// Backend/dash_stats.php (ACCOUNT TABLE ONLY)
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

try {
    // 1. Get Plan Counts (Customers only)
    $planStmt = $pdo->query("SELECT LOWER(Plan) as plan_name, COUNT(AccountID) as count FROM ACCOUNT WHERE Role = 'Customer' GROUP BY LOWER(Plan)");
    $planCounts = $planStmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $freeCount = (int)($planCounts['basic plan'] ?? 0);
    $standardCount = (int)($planCounts['standard plan'] ?? 0);
    $premiumCount = (int)($planCounts['premium plan'] ?? 0);

    // 2. Get Total Admins
    $adminStmt = $pdo->query("SELECT COUNT(AccountID) FROM ACCOUNT WHERE Role IN ('SuperAdmin', 'SubsAdmin', 'UserAdmin')");
    $totalAdmins = (int)$adminStmt->fetchColumn();

    // 3. Get Total Customers
    $customerStmt = $pdo->query("SELECT COUNT(AccountID) FROM ACCOUNT WHERE Role = 'Customer'");
    $totalCustomers = (int)$customerStmt->fetchColumn();

    // 4. Get Activity Logs
    $logStmt = $pdo->query("
        SELECT Timestamp, Description 
        FROM ACTIVITY_LOG
        ORDER BY Timestamp DESC 
        LIMIT 6
    ");
    $activityLogs = $logStmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Get All Customer Data (for modal tables)
    $customersStmt = $pdo->query("
        SELECT AccountID, Email, Plan, Payment_Method, Plan_Status 
        FROM ACCOUNT 
        WHERE Role = 'Customer'
        ORDER BY AccountID DESC
    ");
    $customers = $customersStmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. Get All Admin Data (for modal tables)
    $adminsStmt = $pdo->query("
        SELECT AccountID, Email, Role 
        FROM ACCOUNT 
        WHERE Role IN ('UserAdmin', 'SubsAdmin', 'SuperAdmin')
        ORDER BY AccountID DESC
    ");
    $admins = $adminsStmt->fetchAll(PDO::FETCH_ASSOC);

    // 7. Send the combined JSON response
    echo json_encode([
        'success' => true,
        'stats' => [
            'free_plan' => $freeCount,
            'standard_plan' => $standardCount,
            'premium_plan' => $premiumCount,
            'total_admins' => $totalAdmins,
            'total_customers' => $totalCustomers,
            'total_books' => 0, // Set to 0 for now
        ],
        'activityLogs' => $activityLogs,
        'customers' => $customers,
        'admins' => $admins
    ]);
} catch (PDOException $e) {
    error_log('Dashboard stats error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error loading stats.', 'debug_error' => $e->getMessage()]);
}
