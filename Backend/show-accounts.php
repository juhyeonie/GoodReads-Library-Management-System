<?php
require __DIR__ . '/config.php';

$stmt = $pdo->query("SELECT AccountID, Email, Plan, Role, SubsStarted, SubsEnd, Status FROM ACCOUNT ORDER BY AccountID");
$accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<h2>Accounts</h2><table border=1 cellpadding=6>";
echo "<tr><th>ID</th><th>Email</th><th>Plan</th><th>Role</th><th>SubsStarted</th><th>SubsEnd</th><th>Status</th></tr>";
foreach ($accounts as $a) {
    echo "<tr>";
    echo "<td>" . (int)$a['AccountID'] . "</td>";
    echo "<td>" . htmlspecialchars($a['Email']) . "</td>";
    echo "<td>" . htmlspecialchars($a['Plan']) . "</td>";
    echo "<td>" . htmlspecialchars($a['Role']) . "</td>";
    echo "<td>" . htmlspecialchars($a['SubsStarted']) . "</td>";
    echo "<td>" . htmlspecialchars($a['SubsEnd']) . "</td>";
    echo "<td>" . htmlspecialchars($a['Status']) . "</td>";
    echo "</tr>";
}
echo "</table>";
