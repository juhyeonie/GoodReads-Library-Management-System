<?php
// config.php for LIVE SERVER
$dbPath = __DIR__ . '/Database/GoodReads-LibraryManagement.sqlite';

if (!file_exists($dbPath)) {
    die("DB not found at: " . htmlspecialchars($dbPath));
}

try {
    $dsn = 'sqlite:' . $dbPath;
    $pdo = new PDO($dsn);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON;');
} catch (PDOException $e) {
    die("DB Connection failed: " . htmlspecialchars($e->getMessage()));
}
