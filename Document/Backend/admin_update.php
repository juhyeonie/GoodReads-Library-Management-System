<?php
// Backend/admin_update.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once __DIR__ . '/config.php';

$adminId = $_SESSION['user']['AccountID'] ?? 0;
$input = json_decode(file_get_contents('php://input'), true);

$userId = $input['userId'] ?? null;
$email = $input['email'] ?? '';
$password = $input['password'] ?? ''; // Can be empty
$role = $input['role'] ?? '';

// --- Validation ---
$errors = [];
if (empty($userId)) { $errors['general'] = 'User ID missing.'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $errors['email'] = 'Invalid email format.'; }
if (!empty($password) && strlen($password) < 6) { $errors['password'] = 'Password must be at least 6 characters if provided.'; }
// --- UPDATED: Disallow 'SuperAdmin' role in the request ---
if (empty($role) || !in_array($role, ['SubsAdmin', 'UserAdmin'])) { 
    $errors['role'] = 'Invalid role selected.'; 
}

// Check if the NEW email already exists FOR ANOTHER USER
if (!empty($email) && !empty($userId)) {
    try {
        // --- UPDATED: Stronger check ---
        // First, get the role of the user being edited
        $checkStmt = $pdo->prepare("SELECT Role FROM ACCOUNT WHERE AccountID = ?");
        $checkStmt->execute([$userId]);
        $currentUserRole = $checkStmt->fetchColumn();

        // SAFETY: Do not allow editing a SuperAdmin AT ALL
        if ($currentUserRole === 'SuperAdmin') {
             $errors['general'] = 'SuperAdmin accounts cannot be modified from this panel.';
        }

        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM ACCOUNT WHERE Email = ? COLLATE NOCASE AND AccountID != ?");
        $checkStmt->execute([$email, $userId]);
        if ($checkStmt->fetchColumn() > 0) {
            $errors['email'] = 'Email already registered by another user.';
        }
    } catch (PDOException $e) {
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
    $sql = "UPDATE ACCOUNT SET Email = ?, Role = ?";
    $params = [$email, $role];

    if (!empty($password)) {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $sql .= ", Password = ?";
        $params[] = $passwordHash;
    }

    // --- UPDATED: Stronger WHERE clause ---
    $sql .= " WHERE AccountID = ? AND Role != 'Customer' AND Role != 'SuperAdmin'";
    $params[] = $userId;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $rowCount = $stmt->rowCount();

    if ($rowCount > 0) {
        // Log the action
        $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'UPDATE_ADMIN', ?)");
        $log_stmt->execute([$adminId, "SuperAdmin updated admin ID: " . $userId . " (Email: " . $email . ")"]);
        echo json_encode(['success' => true, 'message' => 'Admin updated successfully.']);
    } else {
        // This can happen if the user wasn't found or was a SuperAdmin
        echo json_encode(['success' => false, 'message' => 'User not found or no changes made.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    error_log('Admin update error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error updating admin.']);
}