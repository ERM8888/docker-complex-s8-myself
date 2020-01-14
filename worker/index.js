const keys = require('./keys');
const redis = require('redis');
// Se crea el cliente redis utilizando las keys. Si se pierde la conexion, intenta reconectar cada segundo (retry_strategy)
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
// Se duplica la conexion
const sub = redisClient.duplicate();
// Crea la funcion para calcular fibonacci
function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib (index - 2);
}
// Se va a mirar Redis para ver si se tiene que calcular un número nuevo de fibonacci
sub.on('message', (channel, message) => {
  // Se almacena un hash de values llamado values donde la key es message(index) y el valor el valor de fib
  redisClient.hset('values', message, fib(parseInt(message)));
});
// Se subscribe a todos los eventos que inserten un nuevo valor
sub.subscribe('insert');