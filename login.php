<?php
// Turn off warnings/notices
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

    if (empty($data["email"]) || empty($data["password"])) {
        throw new Exception("Missing email or password.");
    }

    $email = trim($data["email"]);
    $password = trim($data["password"]);

    $conn = Database::getConnection();

    // Select user
    $stmt = $conn->prepare("SELECT id, name, password_hash FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $result->num_rows > 0) {
        $user = $result->fetch_assoc();

        // Verify password
        if (password_verify($password, $user["password_hash"])) {
            $response["success"] = true;
            $response["message"] = "Login successful!";
            $response["user"] = [
                "id" => $user["id"],
                "name" => $user["name"],
                "email" => $email
            ];
        } else {
            throw new Exception("Invalid email or password.");
        }
    } else {
        throw new Exception("Invalid email or password.");
    }

} catch (Exception $e) {
    $response["success"] = false;
    $response["message"] = $e->getMessage();
}

// Always output valid JSON
echo json_encode($response);
exit;
