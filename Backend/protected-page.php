<?php
// protected-page.php (top of the page)
session_start();
if (empty($_SESSION['user'])) {
    header('Location: SignIn.html');
    exit;
}
$user = $_SESSION['user'];
?>
<!doctype html>
<html>
<head><meta charset="utf-8"><title>Protected</title></head>
<body>
  <h1>Welcome, <?php echo htmlspecialchars($user['Email']); ?></h1>
  <p>Role: <?php echo htmlspecialchars($user['Role']); ?></p>
  <p><a href="javascript:logout()">Logout</a></p>

  <script>
  function logout(){
    fetch('Backend/api.php?action=logout', {
      method: 'POST',
      credentials: 'same-origin'
    }).then(()=> window.location.href = 'SignIn.html').catch(()=> window.location.href = 'SignIn.html');
  }
  </script>
</body>
</html>
