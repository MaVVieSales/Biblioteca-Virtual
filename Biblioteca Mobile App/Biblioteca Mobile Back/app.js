require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const mysql = require("mysql2/promise");
const cors = require("cors");
const fetch = require("node-fetch");
const { PDFDocument } = require("pdf-lib");
const { createCanvas } = require("canvas");
const multer = require("multer");
const path = require("path");
const fs = require('fs').promises;
const fsSync = require('fs');

const app = express();
app.use(cors());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
const host = process.env.HOST || "0.0.0.0";

app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 3,
  queueLimit: 0,
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fsSync.existsSync(uploadsDir)) {
      fsSync.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024,
    files: 1 
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

app.post("/editar-perfil", (req, res) => {
  req.setTimeout(30000); 
  
  upload.single("foto")(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      console.error("❌ Erro Multer:", err);
      return res.status(400).json({ Mensagem: `Erro no upload: ${err.message}` });
    } else if (err) {
      console.error("❌ Erro desconhecido:", err);
      return res.status(400).json({ Mensagem: err.message });
    }

    const { id, nome, email, matricula, senha } = req.body;

    if (!id || !nome || !email || !matricula) {
      if (req.file && fsSync.existsSync(req.file.path)) {
        try {
          await fs.unlink(req.file.path);
        } catch (e) {
          console.error("Erro ao remover arquivo temporário:", e);
        }
      }
      return res.status(400).json({ 
        Mensagem: "Todos os campos obrigatórios devem ser preenchidos!" 
      });
    }

    let conexao;
    
    try {
      conexao = await pool.getConnection();
      
      let fotoPath = null;
      
      if (req.file) {
        try {
          const ext = path.extname(req.file.filename);
          const newFilename = `user_${id}${ext}`;
          const oldPath = req.file.path;
          const fotosDir = path.join(__dirname, "uploads", "fotos");
          const newPath = path.join(fotosDir, newFilename);
          
          if (!fsSync.existsSync(fotosDir)) {
            await fs.mkdir(fotosDir, { recursive: true });
          }
          
          const extensoesPossiveis = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
          
          for (const extensao of extensoesPossiveis) {
            const arquivoAntigo = path.join(fotosDir, `user_${id}${extensao}`);
            try {
              if (fsSync.existsSync(arquivoAntigo) && arquivoAntigo !== newPath) {
                await fs.unlink(arquivoAntigo);
              }
            } catch (err) {
              if (err.code !== 'ENOENT') {
                console.error(`⚠️ Erro ao remover foto antiga: ${err.message}`);
              }
            }
          }
          
          await fs.rename(oldPath, newPath);
          fotoPath = `fotos/${newFilename}`;
          
        } catch (fileError) {
          console.error("❌ Erro ao processar arquivo:", fileError);
          try {
            if (fsSync.existsSync(req.file.path)) {
              await fs.unlink(req.file.path);
            }
          } catch (cleanupError) {
            console.error("Erro ao limpar arquivo temporário:", cleanupError);
          }
          throw new Error("Erro ao processar a foto. Tente novamente.");
        }
      }
      
      let senhaHash = null;
      if (senha && senha.trim()) {
        senhaHash = crypto.createHash("sha256").update(senha.trim()).digest("hex");
      }
      
      let query = "UPDATE usuarios SET nome=?, email=?, matricula=?";
      let params = [nome.trim(), email.trim(), matricula.trim()];
      
      if (senhaHash) {
        query += ", senha_hash=?";
        params.push(senhaHash);
      }
      
      if (fotoPath) {
        query += ", foto=?";
        params.push(fotoPath);
      }
      
      query += " WHERE id=?";
      params.push(id);
      
      const [result] = await conexao.execute(query, params);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ Mensagem: "Usuário não encontrado!" });
      }
      
      
      res.json({
        Mensagem: "Perfil atualizado com sucesso!",
        foto: fotoPath ? `/uploads/${fotoPath}` : null,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error("❌ Erro ao atualizar perfil:", error);
      res.status(500).json({ 
        Mensagem: error.message || "Erro ao atualizar perfil!",
        detalhes: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      });
    } finally {
      if (conexao) {
        conexao.release();
      }
    }
  });
});

app.get("/usuarios/verificar-email", async (req, res) => {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ Mensagem: "E-mail inválido." });
  }

  let conexao;
  try {
    conexao = await pool.getConnection();

    const [rows] = await conexao.execute(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email.trim()]
    );

    if (rows.length > 0) {
      return res.json({ existe: true, id: rows[0].id });
    } else {
      return res.json({ existe: false });
    }

  } catch (erro) {
    console.error("❌ Erro ao verificar e-mail:", erro);
    return res.status(500).json({ Mensagem: "Erro no servidor ao verificar e-mail." });
  } finally {
    if (conexao) conexao.release();
  }
});

app.get("/hash", (req, res) => {
  const texto = req.query.texto || "senha123";
  const hash = crypto.createHash("sha256").update(texto).digest("hex");
  res.json({ texto, hash });
});

app.post("/cadastrar", async (req, res) => {
  let conexao;
  try {
    let { nome, email, matricula, senha } = req.body;

    if (!nome || !email || !matricula || !senha) {
      return res.status(400).json({ error: "Campos obrigatórios não preenchidos." });
    }

    email = email.trim().toLowerCase();
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "E-mail inválido." });
    }

    const nomeRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    if (!nomeRegex.test(nome.trim())) {
      return res.status(400).json({ error: "O nome deve conter apenas letras e espaços." });
    }

    conexao = await pool.getConnection();

    const [existe] = await conexao.execute("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (existe.length > 0) {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    const minha_hash = crypto.createHash("sha256").update(senha).digest("hex");

    const sql = `INSERT INTO usuarios (nome, email, matricula, senha_hash) VALUES (?, ?, ?, ?)`;
    const [resultado] = await conexao.execute(sql, [nome, email, matricula, minha_hash]);

    res.status(201).json({ msg: "Usuário cadastrado com sucesso", id: resultado.insertId });
  } catch (error) {
    res.status(500).json({ error: "Erro no cadastro" });
  } finally {
    if (conexao) conexao.release();
  }
});


app.post("/login", async (req, res) => {
  let conexao;
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    const minha_hash = crypto.createHash("sha256").update(senha).digest("hex");

    conexao = await pool.getConnection();
    const sql = `SELECT id, nome, email, matricula FROM usuarios WHERE email = ? AND senha_hash = ?`;
    const [linhas] = await conexao.execute(sql, [email, minha_hash]);

    if (linhas.length === 1) {
      res.status(200).json(linhas[0]);
    } else {
      res.status(401).json({ msg: "Email ou senha incorretos" });
    }
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);
    res.status(500).json({ error: "Erro interno no login" });
  } finally {
    if (conexao) conexao.release();
  }
});

app.put("/redefinir-senha", async (req, res) => {
  let conexao;
  try {
    const { email, matricula, novaSenha } = req.body;

    if (!email || !matricula || !novaSenha) {
      return res.status(400).json({ error: "Email, matrícula e nova senha são obrigatórios." });
    }

    const minha_hash = crypto.createHash("sha256").update(novaSenha).digest("hex");

    conexao = await pool.getConnection();

    const sqlVerificacao = `SELECT * FROM usuarios WHERE email = ? AND matricula = ?`;
    const [usuario] = await conexao.execute(sqlVerificacao, [email, matricula]);

    if (usuario.length === 0) {
      return res.status(404).json({ error: "Email e matrícula não correspondem." });
    }

    const sqlAtualizacao = `UPDATE usuarios SET senha_hash = ? WHERE email = ?`;
    const [resultado] = await conexao.execute(sqlAtualizacao, [minha_hash, email]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json({ msg: "Senha redefinida com sucesso." });

  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({ error: "Erro interno ao redefinir senha" });
  } finally {
    if (conexao) conexao.release();
  }
});


app.get("/livros", async (req, res) => {
  let conexao;
  try {
    conexao = await pool.getConnection();
    const sql = "SELECT * FROM livros";
    const [results] = await conexao.execute(sql);
    res.json(results);
  } catch (err) {
    console.error("❌ Erro ao consultar livros:", err);
    res.status(500).json({ error: "Erro ao buscar livros" });
  } finally {
    if (conexao) conexao.release();
  }
});

app.get("/tccs", async (req, res) => {
  let conexao;
  try {
    conexao = await pool.getConnection();
    const sql = "SELECT * FROM tccs";
    const [results] = await conexao.execute(sql);

    const formatados = results.map(tcc => {
      if (tcc.link.includes("drive.google.com/file/d/")) {
        const id = tcc.link.split("/d/")[1].split("/")[0];
        tcc.link = `https://drive.google.com/uc?export=download&id=${id}`;
      }
      return tcc;
    });

    res.json(formatados);
  } catch (err) {
    console.error("❌ Erro ao consultar TCCs:", err);
    res.status(500).json({ error: "Erro ao buscar TCCs" });
  } finally {
    if (conexao) conexao.release();
  }
});

app.get('/livros/:id', async (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.query;

  try {
    const [livroRows] = await pool.query('SELECT * FROM livros WHERE id = ?', [id]);
    if (livroRows.length === 0) {
      return res.status(404).json({ message: 'Livro não encontrado' });
    }

    const livro = livroRows[0];

    let favorito = false;
    let minha_avaliacao = null;
    let numero_avaliacoes = 0;
    let avaliacao_total = 0;

    const [avalRows] = await pool.query('SELECT usuario_id, estrelas FROM avaliacoes WHERE livro_id = ?', [id]);
    numero_avaliacoes = avalRows.length;
    avaliacao_total = avalRows.reduce((sum, a) => sum + a.estrelas, 0);

    if (usuario_id) {
      const [favRows] = await pool.query(
        'SELECT 1 FROM favoritos WHERE livro_id = ? AND usuario_id = ?',
        [id, usuario_id]
      );
      favorito = favRows.length > 0;

      const avalUser = avalRows.find(a => a.usuario_id == usuario_id);
      if (avalUser) minha_avaliacao = avalUser.estrelas;
    }

    res.json({
      id: livro.id,
      titulo: livro.titulo,
      autor: livro.autor,
      editora: livro.editora,
      genero: livro.genero,
      capa: livro.capa,
      quantidade_total: livro.quantidade_total,
      quantidade_disponivel: livro.quantidade_disponivel,
      favorito,
      minha_avaliacao,
      numero_avaliacoes,
      avaliacao: avaliacao_total, 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar livro' });
  }
});

app.get("/usuarios/:id/favoritos", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT l.* 
       FROM livros l
       JOIN favoritos f ON f.livro_id = l.id
       WHERE f.usuario_id = ?`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar favoritos" });
  }
});

app.post('/livros/avaliar', async (req, res) => {
  const { idLivro, nota, idUsuario } = req.body;

  if (!idLivro || !nota || !idUsuario) {
    return res.status(400).json({ message: "Parâmetros inválidos" });
  }

  try {
    const [avaliacaoExistente] = await pool.query(
      'SELECT * FROM avaliacoes WHERE livro_id = ? AND usuario_id = ?',
      [idLivro, idUsuario]
    );

    if (avaliacaoExistente.length > 0) {
      await pool.query(
        'UPDATE avaliacoes SET estrelas = ? WHERE livro_id = ? AND usuario_id = ?',
        [nota, idLivro, idUsuario]
      );

      return res.json({
        message: "Avaliação atualizada com sucesso",
        avaliacao: { livro_id: idLivro, usuario_id: idUsuario, estrelas: nota }
      });
    }

    await pool.query(
      'INSERT INTO avaliacoes (livro_id, usuario_id, estrelas) VALUES (?, ?, ?)',
      [idLivro, idUsuario, nota]
    );

    res.json({
      message: "Avaliação registrada com sucesso",
      avaliacao: { livro_id: idLivro, usuario_id: idUsuario, estrelas: nota }
    });

  } catch (err) {
    console.error("Erro ao avaliar livro:", err);
    res.status(500).json({ message: "Erro ao avaliar livro" });
  }
});

app.post('/livros/:id/favoritar', async (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.body;

  if (!usuario_id) return res.status(400).json({ message: "Usuário não informado" });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM favoritos WHERE livro_id = ? AND usuario_id = ?',
      [id, usuario_id]
    );

    let favorito;
    if (rows.length > 0) {
      await pool.query('DELETE FROM favoritos WHERE livro_id = ? AND usuario_id = ?', [id, usuario_id]);
      favorito = false;
    } else {
      await pool.query('INSERT INTO favoritos (livro_id, usuario_id) VALUES (?, ?)', [id, usuario_id]);
      favorito = true;
    }

    res.json({ favorito });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar favorito" });
  }
});

app.post('/tcc/:id/favoritar', async (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.body;

  if (!usuario_id) return res.status(400).json({ message: "Usuário não informado" });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM favoritos_tcc WHERE tcc_id = ? AND usuario_id = ?',
      [id, usuario_id]
    );

    let favorito;
    if (rows.length > 0) {
      await pool.query('DELETE FROM favoritos_tcc WHERE tcc_id = ? AND usuario_id = ?', [id, usuario_id]);
      favorito = false;
    } else {
      await pool.query('INSERT INTO favoritos_tcc (tcc_id, usuario_id) VALUES (?, ?)', [id, usuario_id]);
      favorito = true;
    }

    res.json({ favorito });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar favorito" });
  }
});

app.get('/tcc/:id', async (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.query;

  try {
    const [tccRows] = await pool.query('SELECT * FROM tccs WHERE id = ?', [id]);
    if (tccRows.length === 0) {
      return res.status(404).json({ message: 'Tcc não encontrado' });
    }

    let favorito = false;
    if (usuario_id) {
      const [favRows] = await pool.query(
        'SELECT 1 FROM favoritos_tcc WHERE tcc_id = ? AND usuario_id = ?',
        [id, usuario_id]
      );
      favorito = favRows.length > 0;
    }

    res.json({
      ...tccRows[0],
      favorito
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar TCC' });
  }
});

app.get("/usuarios/:id", async (req, res) => {
  let conexao;
  try {
    const { id } = req.params;

    conexao = await pool.getConnection();
    const sql = `SELECT id, nome, email, matricula, foto FROM usuarios WHERE id = ?`;
    const [rows] = await conexao.execute(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro interno ao buscar usuário" });
  } finally {
    if (conexao) conexao.release();
  }
});

app.get("/usuarios/:id/favoritos_tcc", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT t.* 
       FROM tccs t
       JOIN favoritos_tcc f ON f.tcc_id = t.id
       WHERE f.usuario_id = ?`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar favoritos TCC" });
  }
});

app.get("/generos", async (req, res) => {
  let conexao;
  try {
    conexao = await pool.getConnection();
    const [rows] = await conexao.query("SELECT DISTINCT genero FROM livros");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar gêneros:", err);
    res.status(500).json({ error: "Erro ao buscar gêneros" });
  } finally {
    if (conexao) conexao.release();
  }
});

app.get("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await db.get("SELECT * FROM usuarios WHERE id = ?", [id]);

    if (!usuario) {
      return res.status(404).json({ Mensagem: "Usuário não encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ Mensagem: "Erro ao buscar usuário" });
  }
});

app.get("/cursos", async (req, res) => {
  let conexao;
  try {
    conexao = await pool.getConnection();
    const [rows] = await conexao.query("SELECT DISTINCT curso FROM tccs"); 

    res.json(rows.map(r => r.curso)); 
  } catch (err) {
    console.error("Erro ao buscar cursos:", err);
    res.status(500).json({ error: "Erro ao buscar cursos" });
  } finally {
    if (conexao) conexao.release();
  }
});

app.get("/livros/genero/:genero", async (req, res) => {
  let conexao;
  try {
    const { genero } = req.params;
    conexao = await pool.getConnection();

    const sql = "SELECT * FROM livros WHERE genero = ?";
    const [rows] = await conexao.execute(sql, [genero]);

    res.json(rows);
  } catch (err) {
    console.error("❌ Erro ao buscar livros por gênero:", err);
    res.status(500).json({ error: "Erro ao buscar livros por gênero" });
  } finally {
    if (conexao) conexao.release();
  }
});

app.post("/pre_reservas", async (req, res) => {
  const { usuario_id, livro_id } = req.body;
  
  let conexao;
  if (!usuario_id || !livro_id) return res.status(400).json({ message: "ID do usuário e do livro são obrigatórios" });

  try {
    conexao = await pool.getConnection();

    const [livroRows] = await conexao.query("SELECT quantidade_disponivel FROM livros WHERE id = ?", [livro_id]);
    if (livroRows.length === 0) {
      conexao.release();
      return res.status(404).json({ message: "Livro não encontrado." });
    }
    if (livroRows[0].quantidade_disponivel <= 0) {
      conexao.release();
      return res.status(400).json({ message: "Não há exemplares disponíveis para pré-reserva." });
    }

    const [reservaExistente] = await conexao.query(
      `SELECT id, status FROM pre_reservas 
       WHERE usuario_id = ? AND livro_id = ? AND status IN ('aguardando','retirado')`,
      [usuario_id, livro_id]
    );
    if (reservaExistente.length > 0) {
      conexao.release();
      return res.status(400).json({ message: "Você já possui uma reserva ativa para este livro." });
    }

    await conexao.beginTransaction();
    const [resultado] = await conexao.query(
      `INSERT INTO pre_reservas (usuario_id, livro_id, data_reserva, data_retirada_max, status)
       VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR), 'aguardando')`,
      [usuario_id, livro_id]
    );

    await conexao.query(
      "UPDATE livros SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id = ?",
      [livro_id]
    );

    await conexao.commit();
    conexao.release();

    res.json({
      message: "Pré-reserva realizada com sucesso",
      data_reserva: new Date().toISOString(),
      data_retirada_max: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      id_reserva: resultado.insertId
    });
  } catch (err) {
    console.error("Erro ao realizar pré-reserva:", err);
    if (conexao) {
      await conexao.rollback();
      conexao.release();
    }
    res.status(500).json({ message: "Erro ao criar pré-reserva" });
  }
});

app.delete("/pre_reservas", async (req, res) => {
  const { usuario_id, livro_id } = req.body;
  let conexao;
  if (!usuario_id || !livro_id) return res.status(400).json({ message: "ID do usuário e do livro são obrigatórios" });

  try {
    conexao = await pool.getConnection();

    const [preReserva] = await conexao.query(
      "SELECT id FROM pre_reservas WHERE usuario_id = ? AND livro_id = ? AND status = 'aguardando' ORDER BY data_reserva DESC LIMIT 1",
      [usuario_id, livro_id]
    );

    if (preReserva.length === 0) {
      conexao.release();
      return res.status(400).json({ message: "Nenhuma pré-reserva ativa para ser cancelada." });
    }

    await conexao.beginTransaction();
    await conexao.query("DELETE FROM pre_reservas WHERE id = ?", [preReserva[0].id]);
    await conexao.query("UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id = ?", [livro_id]);
    await conexao.commit();
    conexao.release();

    res.json({ message: "Pré-reserva cancelada com sucesso" });
  } catch (err) {
    console.error("Erro ao cancelar pré-reserva:", err);
    if (conexao) {
      await conexao.rollback();
      conexao.release();
    }
    res.status(500).json({ message: "Erro ao cancelar pré-reserva" });
  }
});

app.post("/pre_reservas/retirar", async (req, res) => {
  const { usuario_id, livro_id } = req.body;
  let conexao;
  if (!usuario_id || !livro_id) return res.status(400).json({ message: "ID do usuário e do livro são obrigatórios" });

  try {
    conexao = await pool.getConnection();

    const [rows] = await conexao.query(
      `SELECT id, status FROM pre_reservas 
       WHERE usuario_id = ? AND livro_id = ? 
       ORDER BY data_reserva DESC LIMIT 1`,
      [usuario_id, livro_id]
    );

    if (rows.length === 0) {
      conexao.release();
      return res.status(404).json({ message: "Nenhuma pré-reserva encontrada." });
    }

    const reserva = rows[0];
    if (reserva.status !== "aguardando") {
      conexao.release();
      return res.status(400).json({ message: "Reserva não está em estado 'aguardando' para ser retirada." });
    }

    await conexao.beginTransaction();
    await conexao.query("UPDATE pre_reservas SET status = 'retirado' WHERE id = ?", [reserva.id]);
    await conexao.commit();
    conexao.release();

    res.json({ message: "Livro marcado como retirado", status: "retirado" });
  } catch (err) {
    console.error("Erro ao marcar retirada:", err);
    if (conexao) {
      await conexao.rollback();
      conexao.release();
    }
    res.status(500).json({ message: "Erro ao marcar retirada" });
  }
});

app.post("/pre_reservas/devolver", async (req, res) => {
  const { usuario_id, livro_id } = req.body;
  let conexao;
  if (!usuario_id || !livro_id) return res.status(400).json({ message: "ID do usuário e do livro são obrigatórios" });

  try {
    conexao = await pool.getConnection();

    const [rows] = await conexao.query(
      `SELECT id, status FROM pre_reservas 
       WHERE usuario_id = ? AND livro_id = ? 
       ORDER BY data_reserva DESC LIMIT 1`,
      [usuario_id, livro_id]
    );

    if (rows.length === 0) {
      conexao.release();
      return res.status(404).json({ message: "Nenhuma pré-reserva encontrada." });
    }

    const reserva = rows[0];
    if (reserva.status !== "retirado") {
      conexao.release();
      return res.status(400).json({ message: "Reserva não está em estado 'retirado' para ser devolvida." });
    }

    await conexao.beginTransaction();
    await conexao.query("UPDATE pre_reservas SET status = 'devolvido' WHERE id = ?", [reserva.id]);
    await conexao.query("UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id = ?", [livro_id]);
    await conexao.commit();
    conexao.release();

    res.json({ message: "Livro devolvido com sucesso", status: "devolvido" });
  } catch (err) {
    console.error("Erro ao devolver livro:", err);
    if (conexao) {
      await conexao.rollback();
      conexao.release();
    }
    res.status(500).json({ message: "Erro ao devolver o livro" });
  }
});

app.get("/pre_reservas/check", async (req, res) => {
  const { usuario_id, livro_id } = req.query;
  let conexao;
  if (!usuario_id || !livro_id) return res.status(400).json({ message: "ID do usuário e do livro são obrigatórios" });

  try {
    conexao = await pool.getConnection();

    const [rows] = await conexao.query(
      `SELECT id, status, data_retirada_max FROM pre_reservas 
       WHERE usuario_id = ? AND livro_id = ? 
       ORDER BY data_reserva DESC LIMIT 1`,
      [usuario_id, livro_id]
    );

    if (rows.length === 0) {
      conexao.release();
      return res.json({ existe: false, status: null, data_retirada_max: null });
    }

    const reserva = rows[0];

    if (reserva.status === "aguardando" && reserva.data_retirada_max && new Date(reserva.data_retirada_max) < new Date()) {
      await conexao.beginTransaction();
      await conexao.query("DELETE FROM pre_reservas WHERE id = ?", [reserva.id]);
      await conexao.query("UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id = ?", [livro_id]);
      await conexao.commit();
      conexao.release();

      return res.json({ existe: false, status: null, message: "Pré-reserva expirada e removida automaticamente" });
    }

    conexao.release();
    return res.json({
      existe: true,
      status: reserva.status,
      data_retirada_max: reserva.data_retirada_max
    });
  } catch (err) {
    console.error("Erro ao verificar pré-reserva:", err);
    if (conexao) conexao.release();
    res.status(500).json({ message: "Erro ao verificar pré-reserva" });
  }
});

async function cleanupExpiredReservations() {
  let conexao;
  try {
    conexao = await pool.getConnection();

    const [expired] = await conexao.query(
      "SELECT id, livro_id FROM pre_reservas WHERE status = 'aguardando' AND data_retirada_max < NOW()"
    );

    if (expired.length === 0) {
      conexao.release();
      return;
    }

    const counts = {};
    expired.forEach((r) => {
      counts[r.livro_id] = (counts[r.livro_id] || 0) + 1;
    });

    await conexao.beginTransaction();
    
    for (const livroId of Object.keys(counts)) {
      const cnt = counts[livroId];
      await conexao.query("UPDATE livros SET quantidade_disponivel = quantidade_disponivel + ? WHERE id = ?", [cnt, livroId]);
    }

    const ids = expired.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');
    await conexao.query(`DELETE FROM pre_reservas WHERE id IN (${placeholders})`, ids);

    await conexao.commit();
    conexao.release();

  } catch (err) {
    console.error("Erro no cleanupExpiredReservations:", err);
    if (conexao) {
      await conexao.rollback();
      conexao.release();
    }
  }
}

setInterval(() => {
  cleanupExpiredReservations().catch(e => console.error("cleanup falhou:", e));
}, 5 * 60 * 1000);

app.get("/pre_reservas/usuario/:id", async (req, res) => {
  let conexao;
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: "ID do usuário é obrigatório" });
    }
    
    conexao = await pool.getConnection();
    const [rows] = await conexao.query(
      `SELECT 
        r.id as reserva_id,
        r.usuario_id,
        r.livro_id,
        r.status,
        r.data_reserva,
        r.data_retirada_max,
        r.data_retirada,
        r.data_devolucao,
        l.id,
        l.titulo,
        l.capa,
        l.autor,
        l.genero,
        l.editora,
        l.quantidade_disponivel,
        l.quantidade_total
       FROM pre_reservas r
       JOIN livros l ON r.livro_id = l.id
       WHERE r.usuario_id = ?
       ORDER BY r.data_reserva DESC`,
      [id]
    );
    
    conexao.release();
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar reservas do usuário:", err);
    if (conexao) conexao.release();
    res.status(500).json({ message: "Erro interno no servidor" });
  }
});

app.post("/livros/:id/favoritar", async (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.body;
  let conexao;

  if (!usuario_id) {
    return res.status(400).json({ message: "ID do usuário é obrigatório" });
  }

  try {
    conexao = await pool.getConnection();
    const [existing] = await conexao.query(
      "SELECT * FROM favoritos WHERE usuario_id = ? AND livro_id = ?",
      [usuario_id, id]
    );

    let favorito = false;
    if (existing.length > 0) {
      await conexao.query(
        "DELETE FROM favoritos WHERE usuario_id = ? AND livro_id = ?",
        [usuario_id, id]
      );
      favorito = false;
    } else {
      await conexao.query(
        "INSERT INTO favoritos (usuario_id, livro_id) VALUES (?, ?)",
        [usuario_id, id]
      );
      favorito = true;
    }
    conexao.release();
    res.json({ favorito });
  } catch (err) {
    console.error("Erro ao favoritar/desfavoritar:", err);
    if (conexao) conexao.release();
    res.status(500).json({ message: "Erro ao processar a solicitação" });
  }
});

app.post("/livros/avaliar", async (req, res) => {
  const { usuario_id, item_id, nota } = req.body;

  try {
      const conn = await db.getConnection();

      const [existe] = await conn.query(
          "SELECT * FROM avaliacoes WHERE usuario_id = ? AND item_id = ?",
          [usuario_id, item_id]
      );

      if (existe.length > 0) {
          await conn.query(
              "UPDATE avaliacoes SET nota = ? WHERE usuario_id = ? AND item_id = ?",
              [nota, usuario_id, item_id]
          );
      } else {
          await conn.query(
              "INSERT INTO avaliacoes (usuario_id, item_id, nota) VALUES (?, ?, ?)",
              [usuario_id, item_id, nota]
          );
      }

      conn.release();
      res.json({ ok: true, mensagem: "Avaliação salva com sucesso!" });

  } catch (e) {
      console.error(e);
      res.status(500).json({ erro: "Erro ao salvar avaliação." });
  }
});

app.get("/livros/:id", async (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.query;
  let conexao;

  try {
    conexao = await pool.getConnection();

    const [livroRows] = await conexao.query("SELECT * FROM livros WHERE id = ?", [id]);
    if (livroRows.length === 0) {
      conexao.release();
      return res.status(404).json({ message: "Livro não encontrado." });
    }

    const livro = livroRows[0];
    livro.favorito = false;
    livro.minha_avaliacao = 0;

    if (usuario_id) {
      const [favRows] = await conexao.query("SELECT 1 FROM favoritos WHERE usuario_id = ? AND livro_id = ?", [usuario_id, id]);
      if (favRows.length > 0) {
        livro.favorito = true;
      }

      const [avaliacaoRows] = await conexao.query("SELECT nota FROM avaliacoes WHERE id_usuario = ? AND id_livro = ?", [usuario_id, id]);
      if (avaliacaoRows.length > 0) {
        livro.minha_avaliacao = avaliacaoRows[0].nota;
      }
    }

    conexao.release();
    res.json(livro);
  } catch (err) {
    console.error("Erro ao buscar detalhes do livro:", err);
    if (conexao) conexao.release();
    res.status(500).json({ message: "Erro ao buscar detalhes do livro." });
  }
});



app.post("/verificar-senha", async (req, res) => {
  const { id, senhaAtual } = req.body;

  try {
    const conexao = await pool.getConnection();

    const [rows] = await conexao.execute(
      "SELECT senha_hash FROM usuarios WHERE id=?",
      [id]
    );

    conexao.release();

    if (!rows.length) {
      return res.status(404).json({ Mensagem: "Usuário não encontrado!" });
    }

    const senhaHash = crypto.createHash("sha256").update(senhaAtual).digest("hex");

    if (senhaHash !== rows[0].senha_hash) {
      return res.status(401).json({ Mensagem: "Senha incorreta!" });
    }

    res.json({ Mensagem: "Senha verificada com sucesso!" });
  } catch (error) {
    console.error("Erro ao verificar senha:", error);
    res.status(500).json({ Mensagem: "Erro no servidor!" });
  }
});

app.listen(port, host, () => {
  console.log(`Servidor rodando em http://${host}:${port}`);
});