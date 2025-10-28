<?php
require __DIR__ . '/config.php';

// FIX 1: Updated SELECT to include Plan_Status and Payment_Method
$stmt = $pdo->query("SELECT AccountID, Email, Plan, Role, SubsStarted, SubsEnd, Plan_Status, Payment_Method FROM ACCOUNT ORDER BY AccountID");
$accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<h2>Accounts</h2><table border=1 cellpadding=6>";
// FIX 2: Updated table header
echo "<tr><th>ID</th><th>Email</th><th>Plan</th><th>Role</th><th>SubsStarted</th><th>SubsEnd</th><th>Plan Status</th><th>Payment Method</th></tr>";
foreach ($accounts as $a) {
    echo "<tr>";
    echo "<td>" . (int)$a['AccountID'] . "</td>";
    echo "<td>" . htmlspecialchars($a['Email'] ?? '') . "</td>";
    echo "<td>" . htmlspecialchars($a['Plan'] ?? '') . "</td>";
    echo "<td>" . htmlspecialchars($a['Role'] ?? '') . "</td>";
    echo "<td>" . htmlspecialchars($a['SubsStarted'] ?? '') . "</td>";
    echo "<td>" . htmlspecialchars($a['SubsEnd'] ?? '') . "</td>";
    // FIX 3: Display new columns
    echo "<td>" . htmlspecialchars($a['Plan_Status'] ?? '') . "</td>";
    echo "<td>" . htmlspecialchars($a['Payment_Method'] ?? '') . "</td>";
    echo "</tr>";
}
echo "</table>";