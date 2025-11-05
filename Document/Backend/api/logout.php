<?php
header('Content-Type: application/json');

// Start session if not started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Unset all session variables
$_SESSION = [];

// If session uses cookie, remove it
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Destroy session
$destroyed = session_destroy();

echo json_encode([
    'success' => (bool)$destroyed,
    'message' => $destroyed ? 'Logged out' : 'Session destroyed (maybe none)'
]);
