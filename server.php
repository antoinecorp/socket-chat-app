<?php
require __DIR__ . '/vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class ActiveUsers implements MessageComponentInterface {
    protected $clients;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn) {
        $querystring = $conn->httpRequest->getUri()->getQuery();
        parse_str($querystring, $queryParams);

        // Check for the admin token in the query params
        if (isset($queryParams['token']) && $queryParams['token'] === 'YOUR_ADMIN_TOKEN') {
            $conn->admin = true;
        } else {
            $conn->admin = false;
        }

        // Store the new connection
        $this->clients->attach($conn);

        // Notify the admin about the new user count
        $this->notifyAdmin();
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        // Handle incoming messages if needed
    }

    public function onClose(ConnectionInterface $conn) {
        // Detach the connection
        $this->clients->detach($conn);

        // Notify the admin about the new user count
        $this->notifyAdmin();
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }

    private function notifyAdmin() {
        $activeUsers = count($this->clients);
        $data = json_encode(['activeUsers' => $activeUsers]);

        foreach ($this->clients as $client) {
            // Only send data to admin clients
            if ($client->admin) {
                $client->send($data);
            }
        }
    }
}

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new ActiveUsers()
        )
    ),
    8080
);

echo "WebSocket server started on port 8080\n";

$server->run();
