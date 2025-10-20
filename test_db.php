<?php
require_once '../config/database.php';

$conn = getDBConnection();

if ($conn) {
    echo "✅ Database connection successful!";
} else {
    echo "❌ Connection failed.";
}
?>
