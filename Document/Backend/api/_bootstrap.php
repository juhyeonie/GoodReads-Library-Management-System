<?php
// Backend/api/_bootstrap.php
header('Content-Type: application/json; charset=utf-8');

session_start();

// include your config (adjust path if needed)
$configPath = __DIR__ . '/../config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'config.php not found at expected path: ' . $configPath]);
    exit;
}
require_once $configPath;

// locate PDO/DB handle (tries common names)
$db = null;
if (isset($pdo) && $pdo instanceof PDO) {
    $db = $pdo;
} elseif (isset($conn) && $conn instanceof PDO) {
    $db = $conn;
} elseif (isset($dbconn) && $dbconn instanceof PDO) {
    $db = $dbconn;
} elseif (function_exists('getPDO')) {
    $db = getPDO();
}
if (!$db) {
    // fallback to sqlite file (if present)
    $dbPath = __DIR__ . '/../Database/GoodReads-LibraryManagement.sqlite';
    if (file_exists($dbPath)) {
        try {
            $db = new PDO("sqlite:" . $dbPath);
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $db->exec('PRAGMA foreign_keys = ON;');
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success'=>false,'message'=>'Cannot create fallback PDO: '.$e->getMessage()]);
            exit;
        }
    } else {
        http_response_code(500);
        echo json_encode(['success'=>false,'message'=>'No DB handle found and fallback DB missing. Please ensure config.php exposes $pdo or $conn.']);
        exit;
    }
}

// Helper: try to extract the logged-in user's id from common session shapes
function getSessionUserId() {
    // 1) direct keys
    $keys = ['user_id', 'uid', 'id', 'userid'];
    foreach ($keys as $k) {
        if (isset($_SESSION[$k]) && intval($_SESSION[$k]) > 0) {
            return intval($_SESSION[$k]);
        }
    }

    // 2) nested 'user' array (your debug shows $_SESSION['user']['AccountID'])
    if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
        // common possible id fields
        foreach (['AccountID','accountid','id','user_id','UserID'] as $k) {
            if (isset($_SESSION['user'][$k]) && intval($_SESSION['user'][$k]) > 0) {
                return intval($_SESSION['user'][$k]);
            }
        }
    }

    // 3) nested 'user' object (stdClass)
    if (isset($_SESSION['user']) && is_object($_SESSION['user'])) {
        foreach (['AccountID','accountid','id','user_id','UserID'] as $k) {
            if (isset($_SESSION['user']->{$k}) && intval($_SESSION['user']->{$k}) > 0) {
                return intval($_SESSION['user']->{$k});
            }
        }
    }

    return null;
}

function json_ok($data = []) {
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}
function json_err($msg = 'Error', $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $msg]);
    exit;
}

// normalized current user id (use this in endpoints)
$currentUserId = getSessionUserId();

// also helpful: expose the raw user object if present
$currentUser = null;
if (isset($_SESSION['user'])) {
    $currentUser = $_SESSION['user'];
}
