const restify = require('restify');
const { Pool } = require('pg');

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'db',
    database: process.env.POSTGRES_DB || 'consultas',
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: process.env.POSTGRES_PORT || 5432,
});

// iniciar o servidor
var server = restify.createServer({
    name: 'projeto-c216',
});

// Iniciando o banco de dados
async function initDatabase() {
    try {
        await pool.query('DROP TABLE IF EXISTS consultas');
        await pool.query('CREATE TABLE IF NOT EXISTS consultas (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, data_nascimento VARCHAR(255) NOT NULL, data_atendimento VARCHAR(255) NOT NULL, horario VARCHAR(255) NOT NULL, tipo VARCHAR(255) NOT NULL)');
        console.log('Banco de dados inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao iniciar o banco de dados, tentando novamente em 5 segundos:', error);
        setTimeout(initDatabase, 5000);
    }
}

// Middleware para permitir o parsing do corpo da requisição
server.use(restify.plugins.bodyParser());

// Endpoint para inserir uma nova consulta
server.post('/api/v1/consulta/inserir', async (req, res, next) => {
    const { nome, data_nascimento, data_atendimento, horario, tipo } = req.body;

    try {
        const result = await pool.query(
          'INSERT INTO consultas (nome, data_nascimento, data_atendimento, horario, tipo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [nome, data_nascimento, data_atendimento, horario, tipo]
        );
        res.send(201, result.rows[0]);
        console.log('Consulta inserida com sucesso:', result.rows[0]);
      } catch (error) {
        console.error('Erro ao inserir consulta:', error);
        res.send(500, { message: 'Erro ao inserir consulta' });
      }
    return next();
});

// Endpoint para listar todas as consultas
server.get('/api/v1/consulta/listar', async (req, res, next) => {
    try {
      const result = await pool.query('SELECT * FROM consultas ORDER BY data_atendimento ASC, horario ASC');
      res.send(result.rows);
      console.log('Consultas encontradas:', result.rows);
    } catch (error) {
      console.error('Erro ao listar consultas:', error);
      res.send(500, { message: 'Erro ao listar consultas' });
    }
    return next();
});

// Endpoint para atualizar uma consulta
server.post('/api/v1/consulta/atualizar', async (req, res, next) => {
  const { id, nome, data_nascimento, data_atendimento, horario, tipo } = req.body;

  try {
    const result = await pool.query(
      'UPDATE consultas SET nome = $1, data_nascimento = $2, data_atendimento = $3, horario = $4, tipo = $5 WHERE id = $6 RETURNING *',
      [nome, data_nascimento, data_atendimento, horario, tipo, id]
    );
    if (result.rowCount === 0) {
      res.send(404, { message: 'Consulta não encontrada' });
    } else {
      res.send(200, result.rows[0]);
      console.log('Consulta atualizada com sucesso:', result.rows[0]);
    }
  } catch (error) {
    console.error('Erro ao atualizar consulta:', error);
    res.send(500, { message: 'Erro ao atualizar consulta' });
  }

  return next();
});

// Endpoint para excluir uma consulta pelo ID
server.post('/api/v1/consulta/excluir', async (req, res, next) => {
  const { id } = req.body;

  if (!id) {
    console.error('ID não fornecido na requisição');
    res.send(400, { message: 'ID não fornecido' });
    return next();
  }

  try {
    console.log('Tentando excluir consulta com ID:', id);
    const result = await pool.query('DELETE FROM consultas WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.send(404, { message: 'Consulta não encontrada' });
      console.log('Consulta não encontrada para o ID:', id);
    } else {
      res.send(200, { message: 'Consulta excluída com sucesso' });
      console.log('Consulta excluída com sucesso, ID:', id);
    }
  } catch (error) {
    console.error('Erro ao excluir consulta:', error);
    res.send(500, { message: 'Erro ao excluir consulta' });
  }

  return next();
});

// Endpoint para resetar o banco de dados
server.del('/api/v1/database/reset', async (req, res, next) => {
    try {
      await pool.query('DROP TABLE IF EXISTS consultas');
      await pool.query('CREATE TABLE consultas (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, data_nascimento VARCHAR(255) NOT NULL, horario VARCHAR(255) NOT NULL, data_atendimento VARCHAR(255) NOT NULL ,tipo VARCHAR(255) NOT NULL)');
      res.send(200, { message: 'Banco de dados resetado com sucesso' });
      console.log('Banco de dados resetado com sucesso');
    } catch (error) {
      console.error('Erro ao resetar o banco de dados:', error);
      res.send(500, { message: 'Erro ao resetar o banco de dados' });
    }

    return next();
});

// iniciar o servidor
var port = process.env.PORT || 5000;
// configurando o CORS
server.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Content-Length, X-Requested-With'
    );
    if (req.method === 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});
server.listen(port, function() {
    console.log('Servidor iniciado', server.name, ' na url http://localhost:' + port);
    // Iniciando o banco de dados
    console.log('Iniciando o banco de dados');
    initDatabase();
});
