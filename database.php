<?php
class Database {
    private static $host = "localhost";
    private static $db_name = "budget_tracker";
    private static $username = "root";
    private static $password = "";
    private static $conn;

    public static function getConnection() {
        if (!self::$conn) {
            self::$conn = new mysqli(self::$host, self::$username, self::$password, self::$db_name);
            if (self::$conn->connect_error) {
                throw new Exception("Database connection failed: " . self::$conn->connect_error);
            }
        }
        return self::$conn;
    }
}
?>
