<?php
// Backend/user_fetch.php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php'; 

// --- Input Parameters ---
$searchTerm = $_GET['search'] ?? '';
$filterPlan = $_GET['filter'] ?? 'all'; // e.g., 'all', 'basic plan', 'standard plan', 'premium plan', 'expired', 'cancelled'

// --- Build SQL Query ---
$sql = "SELECT AccountID, Email, Plan, Payment_Method, Plan_Status FROM ACCOUNT WHERE Role = 'Customer'";
$params = [];

// Apply Search
if (!empty($searchTerm)) {
    // Search AccountID (exact match) or Email (partial match)
    $sql .= " AND (AccountID = ? OR Email LIKE ?)";
    $params[] = $searchTerm; // AccountID must be exact
    $params[] = '%' . $searchTerm . '%'; // Email partial match
}

// Apply Filter
if ($filterPlan !== 'all') {
    if ($filterPlan === 'expired' || $filterPlan === 'cancelled' || $filterPlan === 'downgraded') {
        // Filter by Plan_Status
        $sql .= " AND Plan_Status = ?";
        // Capitalize first letter for DB values ('Expired', 'Cancelled', 'Downgraded')
        $params[] = ucfirst($filterPlan); 
    } else {
        // Filter by Plan name (e.g., 'Basic Plan', 'Standard Plan', 'Premium Plan')
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