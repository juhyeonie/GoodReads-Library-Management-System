<?php
// Backend/admin_delete.php
header('Content-Type: application/json; charset=utf-8');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config.php';

$adminId = $_SESSION['user']['AccountID'] ?? 0;
$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['userId'] ?? null;

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User ID is required.']);
    exit;
}

try {
    // Get user info before deleting for logging and safety check
    $infoStmt = $pdo->prepare("SELECT Email, Role FROM ACCOUNT WHERE AccountID = ?");
    $infoStmt->execute([$userId]);
    $userInfo = $infoStmt->fetch(PDO::FETCH_ASSOC);
    $logEmail = $userInfo['Email'] ?? 'Unknown Email';

    // SAFETY CHECK: Do not allow deleting a SuperAdmin
    if (!$userInfo || $userInfo['Role'] === 'SuperAdmin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Cannot delete a SuperAdmin account.']);
        exit;
    }

    // --- MODIFIED: Made the query more specific ---
    // Only allows deleting SubsAdmin or UserAdmin, prevents deleting 'Customer' or other roles.
    $stmt = $pdo->prepare("DELETE FROM ACCOUNT WHERE AccountID = ? AND Role IN ('SubsAdmin', 'UserAdmin')");
    $stmt->execute([$userId]);
    $deletedRows = $stmt->rowCount();

    if ($deletedRows > 0) {
        $log_stmt = $pdo->prepare("INSERT INTO ACTIVITY_LOG (AccountID, ActionType, Description) VALUES (?, 'DELETE_ADMIN', ?)");
        $log_stmt->execute([$adminId, "SuperAdmin deleted admin ID: " . $userId . " (Email: " . $logEmail . ")"]);
        echo json_encode(['success' => true, 'message' => 'Admin deleted successfully.']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Admin not found or is not a deletable role.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    error_log('Admin delete error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error deleting admin.']);
}
