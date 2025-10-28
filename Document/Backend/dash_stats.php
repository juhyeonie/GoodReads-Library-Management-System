<?php
// Backend/dash_stats.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php'; // Use the standard config for $pdo

try {
    // 1. Get Plan Counts from the ACCOUNT table
    $planStmt = $pdo->query("SELECT LOWER(Plan) as plan_name, COUNT(AccountID) as count FROM ACCOUNT GROUP BY LOWER(Plan)");
    $planCounts = $planStmt->fetchAll(PDO::FETCH_KEY_PAIR); // e.g., ['basic' => 10, 'premium' => 5]

    // Initialize counts to 0
    // Using 'basic' for the 'Free Plan' count based on your table data
    $freeCount = (int)($planCounts['basic'] ?? 0); 
    $standardCount = (int)($planCounts['standard'] ?? 0);
    $premiumCount = (int)($planCounts['premium'] ?? 0);
    
    // 2. Get Total Admins (Role is SuperAdmin, SubsAdmin, or UserAdmin)
    $adminStmt = $pdo->query("SELECT COUNT(AccountID) FROM ACCOUNT WHERE Role IN ('SuperAdmin', 'SubsAdmin', 'UserAdmin')");
    $totalAdmins = (int)$adminStmt->fetchColumn();

    // 3. Get Total Customers (Role is Customer)
    $customerStmt = $pdo->query("SELECT COUNT(AccountID) FROM ACCOUNT WHERE Role = 'Customer'");
    $totalCustomers = (int)$customerStmt->fetchColumn();
    
    // 4. Get Total Books (Placeholder based on original JS demo data)
    $totalBooks = 4;

    echo json_encode([
        'success' => true,
        'stats' => [
            'free_plan' => $freeCount,
            'standard_plan' => $standardCount,
            'premium_plan' => $premiumCount,
            'total_admins' => $totalAdmins,
            'total_customers' => $totalCustomers,
            'total_books' => $totalBooks,
        ]
    ]);

} catch (PDOException $e) {
    error_log('Dashboard stats error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error loading stats.']);
}