<?php
// Backend/user_fetch.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php'; 

// --- Input Parameters ---
$searchTerm = $_GET['search'] ?? '';
$filterPlan = $_GET['filter'] ?? 'all'; 

// --- Build SQL Query ---
// *** CHANGED: Added SubsEnd and AccountCreated to the SELECT statement ***
$sql = "SELECT AccountID, Email, Plan, Payment_Method, Plan_Status, SubsStarted, SubsEnd, AccountCreated FROM ACCOUNT WHERE Role = 'Customer'";
$params = [];

// Apply Search
if (!empty($searchTerm)) {
    $sql .= " AND (AccountID = ? OR Email LIKE ?)";
    $params[] = $searchTerm; 
    $params[] = '%' . $searchTerm . '%';
}

// Apply Filter
if ($filterPlan !== 'all') {
    if ($filterPlan === 'expired' || $filterPlan === 'cancelled' || $filterPlan === 'downgraded') {
        $sql .= " AND Plan_Status = ?";
        $params[] = ucfirst($filterPlan); 
    } else {
        $sql .= " AND Plan = ?";
        $params[] = $filterPlan; 
    }
}

$sql .= " ORDER BY AccountID DESC"; // Show newest first

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'users' => $users]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log('User fetch error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error loading users.', 'debug_error' => $e->getMessage()]);
}