<?php
// Backend/api/debug_session.php
header('Content-Type: application/json; charset=utf-8');
session_start();
echo json_encode([
  'php_sess_id' => session_id(),
  'session' => $_SESSION,
  'cookies' => $_COOKIE
], JSON_PRETTY_PRINT);
