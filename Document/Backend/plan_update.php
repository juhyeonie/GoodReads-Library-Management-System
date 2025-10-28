<?php
// Backend/plan_update.php (FINAL VERSION)
header('Content-Type: application/json; charset=utf-8');

// FIX: Start the session to get the admin's ID
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/config.php'; 

// FIX: Get the logged-in admin's ID
$adminId = $_SESSION['user']['AccountID'] ?? 0; // Default to 0 (System) if not logged in

// Get the JSON data sent from the JavaScript
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input.']);
    exit;
}

$originalPlanName = $input['originalPlanName'] ?? '';
$newPlanName = $input['newPlanName'] ?? '';
$newPriceStr = $input['newPrice'] ?? '0';
$features = $input['features'] ?? [];

// --- Data Validation & Parsing ---
if (empty($originalPlanName) || empty($newPlanName)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Plan name cannot be empty.']);
    exit;
}

preg_match('/[0-9\.]+/', $newPriceStr, $priceMatches);
$newPrice = (float)($priceMatches[0] ?? 0.0);
// --- End Validation ---

try {
    $pdo->beginTransaction();

    // 1. Update the main plan details
    $stmt = $pdo->prepare("UPDATE SUBSCRIPTION_PLANS SET PlanName = ?, Price = ? WHERE PlanName = ?");
    $stmt->execute([$newPlanName, $newPrice, $originalPlanName]);

    // 2. Delete all old features for this plan
    $stmt = $pdo->prepare("DELETE FROM PLAN_FEATURES WHERE PlanName = ?");
    $stmt->execute([$originalPlanName]);

    // 3. Insert all new features
    $stmt = $pdo->prepare("INSERT INTO PLAN_FEATURES (PlanName, FeatureText, SortOrder) VALUES (?, ?, ?)");
    $sortOrder = 0;
    foreach ($features as $featureText) {
        if (!empty(trim($featureText))) {
            $stmt->execute([$newPlanName, $featureText, $sortOrder]);
            $sortOrder++;
        }
    }

    $pdo->commit();
    
    // 4. LOG THE ACTION
    $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'UPDATE_PLAN', ?)");
    // FIX: Use the real $adminId
    $log_stmt->execute([$adminId, "Admin updated plan: " . $newPlanName]); 

    echo json_encode(['success' => true, 'message' => 'Plan updated successfully.']);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    error_log('Plan update error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error updating plan.']);
}