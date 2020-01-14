const keys = require('./keys');
// EXPRESS APP SETUP
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// Se crea una nueva aplicacion express to manage cualquier HTTP request
const app = express();
// Permite hacer requests desde un domain (React) to a diferente domain o port (donde express esta arrancado)
app.use(cors());
// Parsea los parametros pasados desde React a un json
app.use(bodyParser.json());
// POSTGRES CLIENT SETUP
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
// Si se pierde la conexion muestralo por pantalla
pgClient.on('error', () => console.log('Lost PG connection'));
// Se crea la tabla si no existe
pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch(err => console.log(err));
// REDIS CLIENT SETUP
const redis = require('redis');
// Se crea el cliente redis utilizando las keys. Si se pierde la conexion, intenta reconectar cada segundo (retry_strategy)
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
// Se duplica la conexion
const redisPublisher = redisClient.duplicate();
// EXPRESS ROUTE HANDLERS
app.get('/', (req, res) => {
  res.send('Hi');
});
// Devuelve la lista con todos los indices que estan en postgre
app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * FROM values');
  res.send(values.rows);
});
// Devuelve todos los indices-valores que han sido calculados en Redis
app.get('/values/current', async (req, res) => {
  // Redis no tiene sporte a future por lo que se tiene que utilizar callback 
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});
// Recibe una nueva peticion para calcular fibonacci
app.get('/values', async (req, res) => {
  const index = red.body.index;
  // Si el indice es mayor 40 devuelve un error ya que puede tardar mucho
  if (parseInt(index) > 40) {
  	return res.status(422).send('Index too high');
  }
  // el worker lo que hará es buscar este index y reemplazar el valor de fib por la frase por defecto
  redisClient.hset('values', index, 'Nothing yet!');
  // Se crea un nuevo evento llamado insert para llamar al worker y que calcule fib
  redisPublisher.publish('insert', index);
  // Inserta el index en postgres
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
  // Devuelve que el working esta trabajando
  res.send({ working: true});
});
// Arranca la aplicacion en un puerto 5000
app.listen(5000, err =>{
  console.log('Listening');
});