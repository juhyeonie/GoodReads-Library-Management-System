<?php
// Backend/subsadmin_user_update.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once __DIR__ . '/config.php';

$adminId = $_SESSION['user']['AccountID'] ?? 0; // Assuming SubsAdmin is logged in

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? null;
$email = $input['email'] ?? ''; // Still needed for logging
$plan = $input['plan'] ?? '';

// --- Validation ---
$errors = [];
if (empty($userId)) { $errors['general'] = 'User ID missing.'; }
if (empty($plan)) { $errors['plan'] = 'Plan is required.'; }

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit;
}
// --- End Validation ---

try {
    // Only modifies Plan
    $sql = "UPDATE ACCOUNT SET Plan = ?";
    $params = [$plan];

    // Add subscription dates if changing TO a paid plan FROM Basic
    $currentPlanStmt = $pdo->prepare("SELECT Plan FROM ACCOUNT WHERE AccountID = ?");
    $currentPlanStmt->execute([$userId]);
    $currentPlan = $currentPlanStmt->fetchColumn();

    if ($currentPlan === 'Basic Plan' && $plan !== 'Basic Plan') {
         $sql .= ", SubsStarted = ?, SubsEnd = ?";
         $params[] = date('Y-m-d H:i:s');
         $params[] = date('Y-m-d H:i:s', strtotime('+30 days'));
         $sql .= ", Plan_Status = 'Active'";
    } elseif ($plan === 'Basic Plan') { // If changing TO Basic, clear dates
         $sql .= ", SubsStarted = NULL, SubsEnd = NULL";
         $sql .= ", Plan_Status = 'Active'";
    }

    $sql .= " WHERE AccountID = ? AND Role = 'Customer'"; // Ensure only customers are updated
    $params[] = $userId;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $updatedRows = $stmt->rowCount();

    if ($updatedRows > 0) {
        // Log the action
        $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'UPDATE_USER_SUBS', ?)");
        $log_stmt->execute([$adminId, "SubsAdmin updated subscription for ID: " . $userId . " (Email: " . $email . ", New Plan: " . $plan . ")"]);
        echo json_encode(['success' => true, 'message' => 'User subscription updated successfully.']);
    } else {
         echo json_encode(['success' => false, 'message' => 'User not found, not a customer, or no changes made.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    error_log('SubsAdmin User update error: ' . $e->getMessage()); // Uses ->
    // FIX: Changed $e.getMessage() to $e->getMessage()
    echo json_encode(['success' => false, 'message' => 'Database error updating user subscription.', 'debug_error' => $e->getMessage()]); // Uses ->
}