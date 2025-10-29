<?php
// Backend/user_delete.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) { session_start(); }
require_once __DIR__ . '/config.php'; 

$adminId = $_SESSION['user']['AccountID'] ?? 0;

// Get user ID from POST request (JSON)
$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['userId'] ?? null;

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User ID is required.']);
    exit;
}

try {
    // Optional: Get user email before deleting for logging
    $emailStmt = $pdo->prepare("SELECT Email FROM ACCOUNT WHERE AccountID = ?");
    $emailStmt->execute([$userId]);
    $email = $emailStmt->fetchColumn();
    $logEmail = $email ?: 'Unknown Email';

    // Delete the user
    $stmt = $pdo->prepare("DELETE FROM ACCOUNT WHERE AccountID = ? AND Role = 'Customer'"); // Only allow deleting customers
    $stmt->execute([$userId]);
    $deletedRows = $stmt->rowCount();

    if ($deletedRows > 0) {
        // Log the action
        $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'DELETE_USER', ?)");
        $log_stmt->execute([$adminId, "Admin deleted customer ID: " . $userId . " (Email: " . $logEmail . ")"]); 
        echo json_encode(['success' => true, 'message' => 'User deleted successfully.']);
    } else {
         http_response_code(404); // Or 400 if ID was invalid vs not found
         echo json_encode(['success' => false, 'message' => 'User not found or not a customer.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    error_log('User delete error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error deleting user.', 'debug_error' => $e->getMessage()]);
}