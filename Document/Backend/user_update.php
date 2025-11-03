<?php
// Backend/user_update.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once __DIR__ . '/config.php';

$adminId = $_SESSION['user']['AccountID'] ?? 0;

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? null;
// *** MODIFICATION: Email is still needed for logging, but not for validation ***
$email = $input['email'] ?? ''; // Keep for logging
$password = $input['password'] ?? ''; // Password can be empty if not changing
$plan = $input['plan'] ?? '';

// --- Validation ---
$errors = [];
if (empty($userId)) { $errors['general'] = 'User ID missing.'; }

// *** MODIFICATION: Removed email validation since it's read-only ***
// if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $errors['email'] = 'Invalid email format.'; }

if (!empty($password) && strlen($password) < 6) { $errors['password'] = 'Password must be at least 6 characters if provided.'; }
if (empty($plan)) { $errors['plan'] = 'Plan is required.'; }

// *** MODIFICATION: Removed the email existence check ***
/*
if (!empty($email) && !empty($userId)) {
    try {
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM ACCOUNT WHERE Email = ? COLLATE NOCASE AND AccountID != ?");
        $checkStmt->execute([$email, $userId]);
        if ($checkStmt->fetchColumn() > 0) {
            $errors['email'] = 'Email already registered by another user.';
        }
    } catch (PDOException $e) {
        error_log("Email check error during update: " . $e->getMessage());
        $errors['database'] = 'Error checking email.';
    }
}
*/

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit;
}
// --- End Validation ---

try {
    // *** MODIFICATION: Removed "Email = ?" from the SQL query ***
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
         // *** FIX: Also set Plan_Status to Active (or Downgraded) when switching to Basic ***
         $sql .= ", Plan_Status = 'Active'"; // Or 'Downgraded' if you prefer
    }

    $sql .= " WHERE AccountID = ?";
    $params[] = $userId;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Log the action
    // We still use the $email variable (passed from JS) for a clearer log message
    $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'UPDATE_USER', ?)");
    $log_stmt->execute([$adminId, "Admin updated customer ID: " . $userId . " (Email: " . $email . ")"]);

    echo json_encode(['success' => true, 'message' => 'User updated successfully.']);

} catch (PDOException $e) {
    http_response_code(500);
    error_log('User update error: ' . $e->getMessage());
    // This is the error message you are seeing
    echo json_encode(['success' => false, 'message' => 'Database error updating user.', 'debug_error' => $e->getMessage()]);
}
?>