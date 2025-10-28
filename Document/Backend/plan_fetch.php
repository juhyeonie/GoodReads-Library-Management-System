<?php
// Backend/plan_fetch.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php'; 

try {
    // 1. Get all the main plans (name, price)
    $planStmt = $pdo->query("SELECT PlanName, Price FROM SUBSCRIPTION_PLANS");
    $plans = $planStmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Get all features, ordered correctly
    $featureStmt = $pdo->query("SELECT FeatureID, PlanName, FeatureText FROM PLAN_FEATURES ORDER BY SortOrder");
    $allFeatures = $featureStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Combine them: Attach features to their parent plan
    foreach ($plans as $i => $plan) {
        $planFeatures = [];
        foreach ($allFeatures as $feature) {
            if ($feature['PlanName'] === $plan['PlanName']) {
                $planFeatures[] = $feature;
            }
        }
        // Add the list of features to the plan object
        $plans[$i]['features'] = $planFeatures;
    }

    echo json_encode(['success' => true, 'plans' => $plans]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log('Plan fetch error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error loading plans.']);
}