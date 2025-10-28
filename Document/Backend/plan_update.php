<?php
// Backend/plan_update.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php'; 

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

// Extract the number from the price string (e.g., "₱199 / month" -> 199)
preg_match('/[0-9\.]+/', $newPriceStr, $priceMatches);
$newPrice = (float)($priceMatches[0] ?? 0.0);
// --- End Validation ---

try {
    // Use a transaction to ensure all queries succeed or fail together
    $pdo->beginTransaction();

    // 1. Update the main plan details
    $stmt = $pdo->prepare("UPDATE SUBSCRIPTION_PLANS SET PlanName = ?, Price = ? WHERE PlanName = ?");
    $stmt->execute([$newPlanName, $newPrice, $originalPlanName]);

    // 2. Delete all old features for this plan
    // We use originalPlanName in case the name itself was changed
    $stmt = $pdo->prepare("DELETE FROM PLAN_FEATURES WHERE PlanName = ?");
    $stmt->execute([$originalPlanName]);

    // 3. Insert all new features
    $stmt = $pdo->prepare("INSERT INTO PLAN_FEATURES (PlanName, FeatureText, SortOrder) VALUES (?, ?, ?)");
    $sortOrder = 0;
    foreach ($features as $featureText) {
        if (!empty(trim($featureText))) {
            // Use the NEW plan name for re-insertion
            $stmt->execute([$newPlanName, $featureText, $sortOrder]);
            $sortOrder++;
        }
    }

    // 4. Commit all changes
    $pdo->commit();
    
    // Also log this admin action
    $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'UPDATE_PLAN', ?)");
    $log_stmt->execute([1, "Admin updated plan: " . $newPlanName]); // Note: Replace '1' with a real Admin Session ID

    echo json_encode(['success' => true, 'message' => 'Plan updated successfully.']);

} catch (Exception $e) {
    // If anything fails, roll back all changes
    $pdo->rollBack();
    http_response_code(500);
    error_log('Plan update error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error updating plan.']);
}