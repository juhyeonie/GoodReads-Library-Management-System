<?php
// Backend/plan_fetch.php (TEMPORARY TROUBLESHOOTING VERSION)
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php'; 

try {
    // 1. Let's ONLY try to get the main plans
    $planStmt = $pdo->query("SELECT PlanName, Price FROM SUBSCRIPTION_PLANS");
    $plans = $planStmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. We will skip the PLAN_FEATURES query for now
    $allFeatures = [];

    // 3. Combine them (features will be empty)
    foreach ($plans as $i => $plan) {
        $plans[$i]['features'] = []; // Send empty features array
    }

    echo json_encode(['success' => true, 'plans' => $plans]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log('Plan fetch error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error loading plans.']);
}