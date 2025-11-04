<?php
// Backend/subsadmin_user_update.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config.php';

// Get the Admin's ID from the secure server session for logging
$adminId = $_SESSION['user']['AccountID'] ?? 0;
$adminRole = $_SESSION['user']['Role'] ?? '';

// Security Check: Only SubsAdmin can perform this action
if ($adminRole !== 'SubsAdmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden: You do not have permission.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? null;
$plan = $input['plan'] ?? '';
$email = $input['email'] ?? ''; // Email is passed for logging

// --- Validation ---
$errors = [];
if (empty($userId)) {
    $errors['general'] = 'User ID missing.';
}
if (empty($plan) || !in_array($plan, ['Basic Plan', 'Standard Plan', 'Premium Plan'])) {
    $errors['plan'] = 'A valid plan is required.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit;
}
// --- End Validation ---


// --- THIS IS THE CORRECTED LOGIC ---
$paymentMethod = '';
$subsStarted = null;
$subsEnd = null;
$planStatus = 'Active';

if ($plan === 'Basic Plan') {
    // Matches the 'Free Plan' string in your database
    $paymentMethod = 'Free Plan';
    $subsStarted = null; // Clear subscription dates
    $subsEnd = null;
} else {
    // This handles "Standard Plan" and "Premium Plan"
    // Matches the 'AdminGiven' string in your database
    $paymentMethod = 'AdminGiven';
    // Set start time to now and end time to 30 days from now
    $subsStarted = date('Y-m-d H:i:s');
    $subsEnd = date('Y-m-d H:i:s', strtotime('+30 days'));
}
// --- End of Corrected Logic ---

try {
    // Update the user's account
    $stmt = $pdo->prepare(
        "UPDATE ACCOUNT SET 
            Plan = ?, 
            Payment_Method = ?, 
            SubsStarted = ?, 
            SubsEnd = ?, 
            Plan_Status = ?
         WHERE AccountID = ? AND Role = 'Customer'"
    );

    $stmt->execute([
        $plan,
        $paymentMethod,
        $subsStarted,
        $subsEnd,
        $planStatus,
        $userId
    ]);

    $rowCount = $stmt->rowCount();

    if ($rowCount > 0) {
        // Log the action
        $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'UPDATE_CUSTOMER_PLAN', ?)");
        $log_stmt->execute([$adminId, "SubsAdmin updated customer (ID: $userId, Email: $email) to $plan."]);

        echo json_encode(['success' => true, 'message' => 'User plan updated successfully.']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Customer not found or no changes made.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log('SubsAdmin update error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error updating user.', 'debug_error' => $e->getMessage()]);
}
