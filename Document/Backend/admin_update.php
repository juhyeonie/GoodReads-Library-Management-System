<?php
// Backend/admin_update.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config.php';

$adminId = $_SESSION['user']['AccountID'] ?? 0;
$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? null;
$email = $input['email'] ?? '';
$password = $input['password'] ?? ''; // Can be empty
$role = $input['role'] ?? '';

// --- Validation ---
$errors = [];
if (empty($userId)) {
    $errors['general'] = 'User ID missing.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Invalid email format.';
}
if (!empty($password) && strlen($password) < 6) {
    $errors['password'] = 'Password must be at least 6 characters if provided.';
}
// Disallow 'SuperAdmin' role in the request
if (empty($role) || !in_array($role, ['SubsAdmin', 'UserAdmin'])) {
    $errors['role'] = 'Invalid role selected.';
}

// FIRST: Check if the account being edited is a SuperAdmin
if (!empty($userId)) {
    try {
        $checkStmt = $pdo->prepare("SELECT Role FROM ACCOUNT WHERE AccountID = ?");
        $checkStmt->execute([$userId]);
        $currentUserRole = $checkStmt->fetchColumn();

        // SAFETY: Do not allow editing a SuperAdmin AT ALL
        if ($currentUserRole === 'SuperAdmin') {
            $errors['general'] = 'SuperAdmin accounts cannot be modified from this panel.';
        }
    } catch (PDOException $e) {
        error_log("Role check error: " . $e->getMessage());
        $errors['database'] = 'Error checking account role.';
    }
}

// Check if the NEW email already exists FOR ANOTHER USER
if (!empty($email) && !empty($userId) && empty($errors)) {
    try {
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM ACCOUNT WHERE Email = ? COLLATE NOCASE AND AccountID != ?");
        $checkStmt->execute([$email, $userId]);
        if ($checkStmt->fetchColumn() > 0) {
            $errors['email'] = 'Email already registered by another user.';
        }
    } catch (PDOException $e) {
        error_log("Email check error: " . $e->getMessage());
        $errors['database'] = 'Error checking email.';
    }
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit;
}
// --- End Validation ---

try {
    // Build UPDATE query
    $updateFields = ['Email = ?', 'Role = ?'];
    $params = [$email, $role];

    if (!empty($password)) {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $updateFields[] = 'Password = ?';
        $params[] = $passwordHash;
    }

    // Add userId to params for WHERE clause
    $params[] = $userId;

    // Execute update - ensure it only affects admin accounts (not Customers or SuperAdmin)
    $sql = "UPDATE ACCOUNT SET " . implode(', ', $updateFields) . " WHERE AccountID = ? AND Role != 'Customer' AND Role != 'SuperAdmin'";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $rowCount = $stmt->rowCount();

    if ($rowCount > 0) {
        // Log the action
        $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'UPDATE_ADMIN', ?)");
        $log_stmt->execute([$adminId, "SuperAdmin updated admin ID: " . $userId . " (Email: " . $email . ")"]);
        echo json_encode(['success' => true, 'message' => 'Admin updated successfully.']);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No changes made. User not found or insufficient permissions.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Admin update error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error updating admin.']);
}
