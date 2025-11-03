<?php
// Backend/user_update.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config.php';

$adminId = $_SESSION['user']['AccountID'] ?? 0;

$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? null;
$email = $input['email'] ?? ''; // Keep for logging (readonly in form)
$password = $input['password'] ?? ''; // Password can be empty if not changing
$plan = $input['plan'] ?? '';

// --- Validation ---
$errors = [];
if (empty($userId)) {
    $errors['general'] = 'User ID missing.';
}

if (!empty($password) && strlen($password) < 6) {
    $errors['password'] = 'Password must be at least 6 characters if provided.';
}
if (empty($plan)) {
    $errors['plan'] = 'Plan is required.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit;
}
// --- End Validation ---

try {
    // Get current user data
    $currentStmt = $pdo->prepare("SELECT Plan, Plan_Status, Role, SubsStarted, SubsEnd FROM ACCOUNT WHERE AccountID = ?");
    $currentStmt->execute([$userId]);
    $currentAccountData = $currentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentAccountData) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit;
    }

    // Verify this is a customer account
    if ($currentAccountData['Role'] !== 'Customer') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Can only update customer accounts.']);
        exit;
    }

    $currentPlan = $currentAccountData['Plan'];

    // --- Subscription Date and Status Logic ---
    $newPlanStatus = 'Active';
    $subsStarted = null;
    $subsEnd = null;

    if ($plan === 'Basic Plan') {
        // Switching to Basic: clear dates, set Active status
        $subsStarted = null;
        $subsEnd = null;
        $newPlanStatus = 'Active';
    } else {
        // Switching to paid plan (Standard/Premium)
        if ($currentPlan === 'Basic Plan' || empty($currentPlan)) {
            // Upgrading from Basic: start new subscription
            $subsStarted = date('Y-m-d H:i:s');
            $subsEnd = date('Y-m-d H:i:s', strtotime('+30 days'));
            $newPlanStatus = 'Active';
        } else {
            // Already on paid plan: keep existing dates
            $subsStarted = $currentAccountData['SubsStarted'];
            $subsEnd = $currentAccountData['SubsEnd'];
            $newPlanStatus = 'Active';
        }
    }

    // Build and execute update
    if (!empty($password)) {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare(
            "UPDATE ACCOUNT 
             SET Plan = ?, Password = ?, SubsStarted = ?, SubsEnd = ?, Plan_Status = ? 
             WHERE AccountID = ? AND Role = 'Customer'"
        );
        $stmt->execute([$plan, $passwordHash, $subsStarted, $subsEnd, $newPlanStatus, $userId]);
    } else {
        $stmt = $pdo->prepare(
            "UPDATE ACCOUNT 
             SET Plan = ?, SubsStarted = ?, SubsEnd = ?, Plan_Status = ? 
             WHERE AccountID = ? AND Role = 'Customer'"
        );
        $stmt->execute([$plan, $subsStarted, $subsEnd, $newPlanStatus, $userId]);
    }

    $affectedRows = $stmt->rowCount();

    if ($affectedRows === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No changes made.']);
        exit;
    }

    // Log the action
    $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'UPDATE_USER', ?)");
    $log_stmt->execute([$adminId, "Admin updated customer ID: " . $userId . " (Email: " . $email . ")"]);

    echo json_encode(['success' => true, 'message' => 'User updated successfully.']);
} catch (PDOException $e) {
    http_response_code(500);
    error_log('User update error: ' . $e->getMessage());
    // Return the actual error for debugging
    echo json_encode([
        'success' => false,
        'message' => 'Database error updating user.',
        'error' => $e->getMessage(),
        'code' => $e->getCode()
    ]);
}
