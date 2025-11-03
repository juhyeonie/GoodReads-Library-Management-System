<?php
// Backend/user_update.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once __DIR__ . '/config.php';

$adminId = $_SESSION['user']['AccountID'] ?? 0;

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? null;
$email = $input['email'] ?? ''; // Keep for logging
$password = $input['password'] ?? ''; // Password can be empty if not changing
$plan = $input['plan'] ?? '';

// --- Validation ---
$errors = [];
if (empty($userId)) { $errors['general'] = 'User ID missing.'; }

if (!empty($password) && strlen($password) < 6) { $errors['password'] = 'Password must be at least 6 characters if provided.'; }
if (empty($plan)) { $errors['plan'] = 'Plan is required.'; }


if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit;
}
// --- End Validation ---

try {
    $sql = "UPDATE ACCOUNT SET Plan = ?";
    $params = [$plan];

    // Handle password update ONLY if a new password was provided
    if (!empty($password)) {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $sql .= ", Password = ?";
        $params[] = $passwordHash;
    }

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

    $sql .= " WHERE AccountID = ?";
    $params[] = $userId;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Log the action
    $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'UPDATE_USER', ?)");
    $log_stmt->execute([$adminId, "Admin updated customer ID: " . $userId . " (Email: " . $email . ")"]);

    echo json_encode(['success' => true, 'message' => 'User updated successfully.']);

} catch (PDOException $e) {
    http_response_code(500);
    error_log('User update error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error updating user.', 'debug_error' => $e->getMessage()]);
}
?>