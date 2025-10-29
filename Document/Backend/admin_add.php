<?php
// Backend/admin_add.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once __DIR__ . '/config.php'; 

$adminId = $_SESSION['user']['AccountID'] ?? 0;

$input = json_decode(file_get_contents('php://input'), true);

$email = $input['email'] ?? '';
$password = $input['password'] ?? '';
$role = $input['role'] ?? ''; // Role is required

// --- Validation ---
$errors = [];
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $errors['email'] = 'Invalid email format.'; }
if (strlen($password) < 6) { $errors['password'] = 'Password must be at least 6 characters.'; }
if (empty($role) || !in_array($role, ['SubsAdmin', 'UserAdmin', 'SuperAdmin'])) { 
    $errors['role'] = 'Invalid role selected.'; 
}

// Check if email already exists
try {
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM ACCOUNT WHERE Email = ? COLLATE NOCASE");
    $checkStmt->execute([$email]);
    if ($checkStmt->fetchColumn() > 0) {
        $errors['email'] = 'Email already registered.';
    }
} catch (PDOException $e) {
    error_log("Email check error: " . $e->getMessage());
    $errors['database'] = 'Error checking email.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors]);
    exit;
}
// --- End Validation ---

try {
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Admins do not have subscription dates or payment methods
    $stmt = $pdo->prepare(
        "INSERT INTO ACCOUNT (Email, Password, Role, Plan, Plan_Status) 
         VALUES (?, ?, ?, ?, ?)"
    );
    // Admins get a 'Premium Plan' by default, or you can adjust as needed
    $stmt->execute([
        $email, $passwordHash, $role, 'Premium Plan', 'Active'
    ]);

    $newUserId = $pdo->lastInsertId();

    // Log the action
    $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'CREATE_ADMIN', ?)");
    $log_stmt->execute([$adminId, "SuperAdmin added admin: " . $email . " (ID: " . $newUserId . ")"]); 

    echo json_encode(['success' => true, 'message' => 'Admin added successfully.', 'newUser' => [
        'AccountID' => $newUserId,
        'Email' => $email,
        'Role' => $role
    ]]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log('Admin add error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error adding admin.']);
}