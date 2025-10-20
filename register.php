<?php
// Turn off warnings/notices to avoid breaking JSON
error_reporting(0);
ini_set('display_errors', 0);

// JSON response headers
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../config/database.php';

$response = ["success" => false, "message" => ""];

try {
    // Read JSON body
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

    if (!$data) throw new Exception("Invalid JSON received.");

    if (empty($data["name"]) || empty($data["email"]) || empty($data["password"])) {
        throw new Exception("Missing required fields.");
    }

    $name = trim($data["name"]);
    $email = trim($data["email"]);
    $password_hash = password_hash(trim($data["password"]), PASSWORD_BCRYPT);

    $conn = Database::getConnection();

    // Check for existing email
    $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $result = $check->get_result();

    if ($result && $result->num_rows > 0) {
        throw new Exception("Email already registered.");
    }

    // Insert user into password_hash column
    $stmt = $conn->prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $email, $password_hash);

    if ($stmt->execute()) {
        $response["success"] = true;
        $response["message"] = "Registration successful!";
    } else {
        throw new Exception("Failed to insert user.");
    }

} catch (Exception $e) {
    $response["success"] = false;
    $response["message"] = $e->getMessage();
}

// Always output valid JSON
echo json_encode($response);
exit;
