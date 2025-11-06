// /api/grupos.js

// 1. Importa o "tradutor" do Postgres que instalamos (npm install pg)
const { Pool } = require('pg');

// 2. Configura a conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 3. Esta é a função principal que a Vercel vai rodar
module.exports = async (req, res) => {
  
  // --- SE O MÉTODO FOR 'GET' (Buscar dados) ---
  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT * FROM grupos ORDER BY data_criacao DESC');
      res.status(200).json(rows);

    } catch (error) {
      console.error(error); 
      res.status(500).json({ error: error.message });
    }
  } 
  
  // --- SE O MÉTODO FOR 'POST' (Criar dados) ---
  else if (req.method === 'POST') {
    try {
      const { nome } = req.body; 
      if (!nome) {
        return res.status(400).json({ error: 'O nome do grupo é obrigatório.' });
      }

      const { rows } = await pool.query(
        'INSERT INTO grupos (nome) VALUES ($1) RETURNING *',
        [nome]
      );
      
      res.status(201).json(rows[0]);

    } catch (error) { // <-- A CHAVE DE ABERTURA FALTAVA AQUI
      // Se der erro no banco, avisa o front-end
      console.error(error); // Loga o erro no console da Vercel
      res.status(500).json({ error: error.message });
    } // <-- Chave de fechamento do catch
  } 
  
  // --- Se for qualquer outro método (PUT, DELETE, etc.) ---
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};