<?php
require __DIR__ . '/config.php';

try {
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "<h3>Connected — existing tables:</h3>";
    if (empty($tables)) {
        echo "<p>No tables found.</p>";
    } else {
        echo "<ul>";
        foreach ($tables as $t) {
            echo "<li>" . htmlspecialchars($t) . "</li>";
        }
        echo "</ul>";
    }
} catch (Exception $e) {
    echo "Error: " . htmlspecialchars($e->getMessage());
}
