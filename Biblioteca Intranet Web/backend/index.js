const dotenv = require('dotenv')
dotenv.config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const crypto = require("crypto");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.use(express.json());
app.use(cors());

const conexao = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get("/", (req, res) => res.send("Rota padrão"));

app.get("/config.js", (req, res) => {
    res.type("application/javascript");
    res.send(`window.API_URL = "http://${process.env.HOST}:${process.env.PORT}";`);
});
app.use(express.static(path.join(__dirname, "../front")));

app.get("/hash", (req, res) => {
    const { senha } = req.query;
    const hash_gerada = crypto.createHash("sha256").update(senha).digest("hex");
    res.send(hash_gerada);
});

app.get("/api-config", (req, res) => {
    res.json({
        apiUrl: `http://${process.env.HOST}:${process.env.PORT}`,
        host: process.env.HOST,
        port: process.env.PORT
    });
});

app.post("/cadastrar", async (req, res) => {
    try {
        const { nome, email, senhaAdm } = req.body;

        if (!nome || !email || !senhaAdm)
            return res.status(400).json({ Mensagem: "Todos os campos são obrigatórios!" });

        if (/\d/.test(nome))
            return res.status(400).json({ Mensagem: "O nome não pode conter números!" });

        if (nome.length > 150 || email.length > 150)
            return res.status(400).json({ Mensagem: "Nome e e-mail devem ter no máximo 150 caracteres!" });

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email))
            return res.status(400).json({ Mensagem: "Formato de e-mail inválido!" });

        const emailNormalizado = email.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const [rows] = await conexao.execute(
            "SELECT * FROM administrador WHERE email = ?",
            [emailNormalizado]
        );

        if (rows.length > 0)
            return res.status(400).json({ Mensagem: "Já existe um usuário com esse e-mail!" });

        if (senhaAdm.length < 6) {
            return res.status(400).json({ Mensagem: "A senha deve ter no mínimo 6 caracteres." });
        }

        const hash_gerada = crypto
            .createHash("sha256")
            .update(senhaAdm)
            .digest("hex");

        const sql = `INSERT INTO administrador (nome, email, senhaAdm) VALUES (?, ?, ?)`;
        await conexao.execute(sql, [nome, emailNormalizado, hash_gerada]);

        res.json({ Mensagem: "Cadastro realizado com sucesso!" });

    } catch (error) {
        console.error("Erro ao cadastrar:", error);
        res.status(500).json({ Mensagem: "Erro interno no servidor" });
    }
});


app.post("/login", async (req, res) => {
    try {
        const { email, senhaAdm } = req.body;

        if (!email || !senhaAdm || email.trim() === "" || senhaAdm.trim() === "") {
            return res.status(400).json({ Mensagem: "Login e senha não podem estar vazios!" });
        }

        const hash_gerada = crypto.createHash("sha256").update(senhaAdm).digest("hex");

        const sql = `SELECT id, nome, email, foto FROM administrador WHERE email = ? AND senhaAdm = ? LIMIT 1`;
        const [rows] = await conexao.query(sql, [email, hash_gerada]);

        if (rows.length === 0) {
            return res.status(401).json({ Mensagem: "Usuário ou senha inválidos!" });
        }

        res.json({
            Mensagem: "Login realizado com sucesso!",
            usuario: {
                id: rows[0].id,
                nome: rows[0].nome,
                email: rows[0].email,
                foto: rows[0].foto
            }
        });

    } catch (error) {
        console.error("Erro ao fazer login:", error);
        res.status(500).json({ Mensagem: "Erro interno no servidor" });
    }
});

app.post("/cadastrarLivro", async (req, res) => {
    try {
        const { titulo, editora, autor, genero, capa, quantidade_total, quantidade_disponivel } = req.body;

        if (!titulo || !editora || !autor || !genero || !capa || quantidade_total == null || quantidade_disponivel == null)
            return res.json({ Mensagem: "Todos os campos devem ser preenchidos!" });

        const sql = `INSERT INTO livros (titulo, editora, autor, genero, capa, quantidade_total, quantidade_disponivel) 
                     VALUES (?,?,?,?,?,?,?)`;

        await conexao.execute(sql, [titulo, editora, autor, genero, capa, quantidade_total, quantidade_disponivel]);
        res.json({ Mensagem: "Livro Registrado!" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ Mensagem: "Erro interno no servidor" });
    }
});

app.get("/listarLivros", async (req, res) => {
    try {
        const sql = `SELECT * FROM livros`;
        const [livros] = await conexao.execute(sql);
        if (livros.length === 0) return res.status(404).json({ Mensagem: "Nenhum livro encontrado!" });
        res.json({ Livros: livros });
    } catch (error) {
        console.error("Erro ao listar livros:", error);
        res.status(500).json({ Mensagem: "Erro interno do servidor" });
    }
});

app.delete("/livros/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const sql = "DELETE FROM livros WHERE id = ?";
        const [result] = await conexao.execute(sql, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ Mensagem: "Livro não encontrado!" });
        res.status(200).json({ Mensagem: "Livro removido com sucesso!" });
    } catch (error) {
        console.error("Erro ao excluir livro:", error);
        res.status(500).json({ Mensagem: "Erro interno no servidor" });
    }
});

app.get("/livros/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const sql = "SELECT * FROM livros WHERE id = ?";
        const [rows] = await conexao.execute(sql, [id]);
        if (rows.length === 0) return res.status(404).json({ Mensagem: "Livro não encontrado!" });
        res.json(rows[0]);
    } catch (error) {
        console.error("Erro ao buscar livro:", error);
        res.status(500).json({ Mensagem: "Erro interno no servidor" });
    }
});

app.put("/livros/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { titulo, editora, autor, genero, capa, quantidade_total, quantidade_disponivel } = req.body;
    try {
        const sql = "UPDATE livros SET titulo = ?, editora = ?, autor = ?, genero = ?, capa = ?, quantidade_total = ?, quantidade_disponivel = ? WHERE id = ?";
        const [result] = await conexao.execute(sql, [titulo, editora, autor, genero, capa, quantidade_total, quantidade_disponivel, id]);
        if (result.affectedRows === 0) return res.status(404).json({ Mensagem: "Livro não encontrado!" });
        res.status(200).json({ Mensagem: "Livro atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar livro:", error);
        res.status(500).json({ Mensagem: "Erro interno no servidor" });
    }
});

app.post("/cadastrarTCC", async (req, res) => {
    try {
        const { titulo, ano, curso, autor, link } = req.body;
        if (!titulo || !ano || !curso || !autor || !link) {
            return res.status(400).json({ Mensagem: "Todos os campos devem ser preenchidos!" });
        }

        const sql = `INSERT INTO tccs (titulo, ano, curso, autor, link) VALUES (?, ?, ?, ?, ?)`;
        await conexao.execute(sql, [titulo, ano, curso, autor, link]);

        res.status(201).json({ Mensagem: "TCC Registrado!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Mensagem: "Erro interno no servidor" });
    }
});

app.get("/listarTCCs", async (req, res) => {
    try {
        const sql = `SELECT * FROM tccs`;
        const [tcc] = await conexao.execute(sql);
        if (tcc.length === 0) return res.status(404).json({ Mensagem: "Nenhum TCC encontrado!" });
        res.json({ tcc: tcc });
    } catch (error) {
        console.error("Erro ao listar TCCs:", error);
        res.status(500).json({ Mensagem: "Erro interno do servidor" });
    }
});

app.delete("/TCCs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const sql = "DELETE FROM tccs WHERE id = ?";
        const [result] = await conexao.execute(sql, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ Mensagem: "TCC não encontrado!" });
        res.status(200).json({ Mensagem: "TCC removido com sucesso!" });
    } catch (error) {
        console.error("Erro ao excluir TCC:", error);
        res.status(500).json({ Mensagem: "Erro interno no servidor" });
    }
});

app.get("/TCCs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const sql = "SELECT * FROM tccs WHERE id = ?";
        const [rows] = await conexao.execute(sql, [id]);
        if (rows.length === 0) return res.status(404).json({ Mensagem: "TCC não encontrado!" });
        res.json(rows[0]);
    } catch (error) {
        console.error("Erro ao buscar TCC:", error);
        res.status(500).json({ Mensagem: "Erro interno no servidor" });
    }
});

app.put("/TCCs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { titulo, ano, autor, curso, link } = req.body;
    try {
        const sql = "UPDATE tccs SET titulo = ?, ano = ?, autor = ?, curso = ?, link = ? WHERE id = ?";
        const [result] = await conexao.execute(sql, [titulo, ano, autor, curso, link, id]);
        if (result.affectedRows === 0) return res.status(404).json({ Mensagem: "TCC não encontrado!" });
        res.status(200).json({ Mensagem: "TCC atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar TCC:", error);
        res.status(500).json({ Mensagem: "Erro interno no servidor" });
    }
});

async function scrapeGoogleBook(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: "networkidle2" });

        await page.waitForSelector("#metadata_content_table", { timeout: 5000 });

        const dados = await page.evaluate(() => {
            const resultado = {};

            const tituloPagina = document.querySelector("h1[itemprop='name']")?.innerText.trim();
            resultado.Título = tituloPagina || "Sem título";

            const tabela = document.querySelector("#metadata_content_table");
            if (tabela) {
                const linhas = tabela.querySelectorAll("tr.metadata_row");
                linhas.forEach(linha => {
                    const label = linha.querySelector(".metadata_label")?.innerText.trim();
                    const valor = linha.querySelector(".metadata_value")?.innerText.trim();
                    if (label && valor) resultado[label] = valor;
                });
            }

            const imgEl = document.querySelector("#summary-frontcover img") || document.querySelector("#summary-frontcover");
            resultado.capa = imgEl ? imgEl.src || imgEl.getAttribute("src") : null;

            return resultado;
        });

        await browser.close();
        return dados;

    } catch (err) {
        await browser.close();
        console.error("Erro scraping:", err);
        return null;
    }
}

app.get("/livro/isbn/:isbn", async (req, res) => {
    const { isbn } = req.params;

    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
        const data = await response.json();

        if (!data.items || data.items.length === 0)
            return res.status(404).json({ Mensagem: "Livro não encontrado via Google Books API." });

        const item = data.items[0];
        const infoLink = item.volumeInfo.infoLink;

        const detalhes = await scrapeGoogleBook(infoLink);

        res.json({
            titulo: detalhes?.Título || item.volumeInfo.title || "",
            autor: detalhes?.Autor || (item.volumeInfo.authors ? item.volumeInfo.authors.join(", ") : ""),
            editora: detalhes?.Editora || item.volumeInfo.publisher || "",
            genero: detalhes?.Gênero || (item.volumeInfo.categories ? item.volumeInfo.categories.join(", ") : ""),
            capa: detalhes?.capa || (item.volumeInfo.imageLinks?.thumbnail || ""),
            link: infoLink
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ Mensagem: "Erro ao buscar livro pelo ISBN." });
    }
});

app.get("/pre_reservas", async (req, res) => {
    try {
        const sql = `
            SELECT 
                pr.id,
                pr.usuario_id,
                pr.livro_id,
                pr.data_reserva,
                pr.status,
                pr.data_retirada,
                pr.data_retirada_max,
                pr.data_devolucao,
                l.titulo,
                l.capa,
                l.autor,
                l.editora,
                u.nome AS nome_usuario,
                u.matricula
            FROM pre_reservas pr
            JOIN livros l ON pr.livro_id = l.id
            JOIN usuarios u ON pr.usuario_id = u.id
            ORDER BY 
                CASE pr.status
                    WHEN 'aguardando' THEN 1
                    WHEN 'retirado' THEN 2
                    WHEN 'devolvido' THEN 3
                    ELSE 4
                END,
                pr.data_reserva DESC
        `;
        const [reservas] = await conexao.execute(sql);
        res.json(reservas);
    } catch (err) {
        console.error("Erro ao listar pré-reservas:", err);
        res.status(500).json({ erro: "Erro interno ao listar pré-reservas." });
    }
});

app.get("/pre_reservas/aguardando", async (req, res) => {
    try {
        const sql = `
            SELECT 
                pr.id,
                pr.usuario_id,
                pr.livro_id,
                pr.data_reserva,
                pr.data_retirada_max,
                pr.status,
                l.titulo,
                l.capa,
                l.autor,
                u.nome AS nome_usuario,
                u.matricula
            FROM pre_reservas pr
            JOIN livros l ON pr.livro_id = l.id
            JOIN usuarios u ON pr.usuario_id = u.id
            WHERE pr.status = 'aguardando'
            ORDER BY pr.data_reserva ASC
        `;
        const [reservas] = await conexao.execute(sql);
        res.json(reservas);
    } catch (err) {
        console.error("Erro ao listar pré-reservas aguardando:", err);
        res.status(500).json({ erro: "Erro interno ao listar pré-reservas." });
    }
});

app.get("/pre_reservas/retirados", async (req, res) => {
    try {
        const sql = `
            SELECT 
                pr.id,
                pr.usuario_id,
                pr.livro_id,
                pr.data_reserva,
                pr.data_retirada,
                pr.data_retirada_max,
                pr.status,
                l.titulo,
                l.capa,
                l.autor,
                u.nome AS nome_usuario,
                u.matricula
            FROM pre_reservas pr
            JOIN livros l ON pr.livro_id = l.id
            JOIN usuarios u ON pr.usuario_id = u.id
            WHERE pr.status = 'retirado'
            ORDER BY pr.data_retirada DESC
        `;
        const [reservas] = await conexao.execute(sql);
        res.json(reservas);
    } catch (err) {
        console.error("Erro ao listar livros retirados:", err);
        res.status(500).json({ erro: "Erro interno ao listar livros retirados." });
    }
});

app.get("/pre_reservas/historico", async (req, res) => {
    try {
        const sql = `
            SELECT 
                pr.id,
                pr.usuario_id,
                pr.livro_id,
                pr.data_reserva,
                pr.data_retirada,
                pr.data_devolucao,
                pr.status,
                l.titulo,
                l.capa,
                l.autor,
                u.nome AS nome_usuario,
                u.matricula
            FROM pre_reservas pr
            JOIN livros l ON pr.livro_id = l.id
            JOIN usuarios u ON pr.usuario_id = u.id
            WHERE pr.status IN ('retirado', 'devolvido', 'cancelada')
            ORDER BY 
                CASE 
                    WHEN pr.data_devolucao IS NOT NULL THEN pr.data_devolucao
                    WHEN pr.data_retirada IS NOT NULL THEN pr.data_retirada
                    ELSE pr.data_reserva
                END DESC
        `;
        const [historico] = await conexao.execute(sql);
        res.json(historico);
    } catch (err) {
        console.error("Erro ao listar histórico:", err);
        res.status(500).json({ erro: "Erro interno ao listar histórico." });
    }
});

app.get("/pre_reservas/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const sql = `
            SELECT 
                pr.*,
                l.titulo,
                l.capa,
                l.autor,
                l.editora,
                l.quantidade_disponivel,
                u.nome AS nome_usuario,
                u.matricula,
                u.email
            FROM pre_reservas pr
            JOIN livros l ON pr.livro_id = l.id
            JOIN usuarios u ON pr.usuario_id = u.id
            WHERE pr.id = ?
        `;
        const [rows] = await conexao.execute(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ erro: "Reserva não encontrada." });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Erro ao buscar pré-reserva:", err);
        res.status(500).json({ erro: "Erro interno ao buscar pré-reserva." });
    }
});

app.put("/pre_reservas/:id/retirar", async (req, res) => {
    const { id } = req.params;
    const { data_retirada } = req.body;
    try {
        const [reserva] = await conexao.execute(
            "SELECT * FROM pre_reservas WHERE id = ? AND status = 'aguardando'",
            [id]
        );

        if (reserva.length === 0) {
            return res.status(404).json({ erro: "Reserva não encontrada ou já foi processada." });
        }

        const dataRetirada = data_retirada || new Date().toISOString();

        const dataRetiradaMax = new Date(dataRetirada);
        dataRetiradaMax.setDate(dataRetiradaMax.getDate() + 7);

        const sql = `
            UPDATE pre_reservas
            SET 
                status = 'retirado',
                data_retirada = ?,
                data_retirada_max = ?
            WHERE id = ?
        `;

        await conexao.execute(sql, [
            dataRetirada,
            dataRetiradaMax.toISOString(),
            id
        ]);

        res.json({
            mensagem: "Retirada registrada com sucesso!",
            data_retirada: dataRetirada,
            data_retirada_max: dataRetiradaMax.toISOString()
        });

    } catch (err) {
        console.error("Erro ao registrar retirada:", err);
        res.status(500).json({ erro: "Erro interno ao registrar retirada." });
    }
});

app.put("/pre_reservas/:id/devolver", async (req, res) => {
    const { id } = req.params;
    const { data_devolucao, disponibilizar } = req.body;

    try {

        const [reserva] = await conexao.execute(
            `SELECT 
                pr.*, 
                l.quantidade_disponivel, 
                l.quantidade_total 
             FROM pre_reservas pr
             JOIN livros l ON pr.livro_id = l.id
             WHERE pr.id = ? AND pr.status = 'retirado'`,
            [id]
        );

        if (reserva.length === 0) {
            return res.status(404).json({
                erro: "Reserva não encontrada ou ainda não foi retirada."
            });
        }

        const reservaAtual = reserva[0];
        const dataDevolucao = data_devolucao || new Date().toISOString();

        const sqlReserva = `
            UPDATE pre_reservas
            SET 
                status = 'devolvido',
                data_devolucao = ?
            WHERE id = ?
        `;

        await conexao.execute(sqlReserva, [dataDevolucao, id]);

        if (disponibilizar === true) {
            const novaQuantidade = (reservaAtual.quantidade_disponivel || 0) + 1;

            const quantidadeFinal = Math.min(
                novaQuantidade,
                reservaAtual.quantidade_total || novaQuantidade
            );

            const sqlLivro = `
                UPDATE livros
                SET quantidade_disponivel = ?
                WHERE id = ?
            `;

            await conexao.execute(sqlLivro, [
                quantidadeFinal,
                reservaAtual.livro_id
            ]);

            return res.json({
                mensagem: "Devolução registrada e livro disponibilizado com sucesso!",
                data_devolucao: dataDevolucao,
                quantidade_disponivel: quantidadeFinal,
                livro_id: reservaAtual.livro_id
            });
        } else {
            return res.json({
                mensagem: "Devolução registrada com sucesso! Livro não foi disponibilizado.",
                data_devolucao: dataDevolucao
            });
        }

    } catch (err) {
        console.error("Erro ao registrar devolução:", err);
        return res.status(500).json({
            erro: "Erro interno ao registrar devolução.",
            detalhes: err.message
        });
    }
});

app.get("/debug/reserva/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const sql = `
            SELECT 
                pr.id as reserva_id,
                pr.usuario_id,
                pr.livro_id,
                pr.status,
                pr.data_reserva,
                pr.data_retirada,
                pr.data_devolucao,
                l.id as livro_id_tabela,
                l.titulo,
                l.quantidade_disponivel,
                l.quantidade_total,
                u.nome as usuario_nome,
                u.matricula
            FROM pre_reservas pr
            JOIN livros l ON pr.livro_id = l.id
            JOIN usuarios u ON pr.usuario_id = u.id
            WHERE pr.id = ?
        `;

        const [result] = await conexao.execute(sql, [id]);

        if (result.length === 0) {
            return res.status(404).json({ erro: "Reserva não encontrada" });
        }

        res.json({
            debug: true,
            reserva: result[0],
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("Erro no diagnóstico:", err);
        res.status(500).json({
            erro: "Erro ao buscar dados",
            detalhes: err.message
        });
    }

});

app.get("/debug/estrutura/livros", async (req, res) => {
    try {
        const [columns] = await conexao.execute(
            "DESCRIBE livros"
        );

        res.json({
            debug: true,
            colunas: columns,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("Erro ao verificar estrutura:", err);
        res.status(500).json({
            erro: "Erro ao verificar estrutura",
            detalhes: err.message
        });
    }
});

app.get("/debug/livro/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await conexao.execute(
            "SELECT * FROM livros WHERE id = ?",
            [id]
        );

        if (result.length === 0) {
            return res.status(404).json({ erro: "Livro não encontrado" });
        }

        res.json({
            debug: true,
            livro: result[0],
            campos: Object.keys(result[0]),
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("Erro ao buscar livro:", err);
        res.status(500).json({
            erro: "Erro ao buscar livro",
            detalhes: err.message
        });
    }
});

app.put("/pre_reservas/:id", async (req, res) => {
    const { id } = req.params;
    const { status, data_retirada, data_devolucao } = req.body;

    try {
        const updates = [];
        const values = [];

        if (status) {
            updates.push("status = ?");
            values.push(status);
        }

        if (data_retirada) {
            updates.push("data_retirada = ?");
            values.push(data_retirada);
        }

        if (data_devolucao) {
            updates.push("data_devolucao = ?");
            values.push(data_devolucao);
        }

        if (updates.length === 0) {
            return res.status(400).json({ erro: "Nenhum campo para atualizar." });
        }

        values.push(id);

        const sql = `UPDATE pre_reservas SET ${updates.join(", ")} WHERE id = ?`;
        const [result] = await conexao.execute(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Reserva não encontrada." });
        }

        res.json({ mensagem: "Reserva atualizada com sucesso!" });

    } catch (err) {
        console.error("Erro ao atualizar pré-reserva:", err);
        res.status(500).json({ erro: "Erro interno ao atualizar pré-reserva." });
    }
});

app.get("/pre_reservas/usuario/:usuario_id", async (req, res) => {
    const { usuario_id } = req.params;

    try {
        const sql = `
            SELECT 
                pr.*,
                l.titulo,
                l.capa,
                l.autor,
                l.editora
            FROM pre_reservas pr
            JOIN livros l ON pr.livro_id = l.id
            WHERE pr.usuario_id = ?
            ORDER BY 
                CASE pr.status
                    WHEN 'aguardando' THEN 1
                    WHEN 'retirado' THEN 2
                    WHEN 'devolvido' THEN 3
                    ELSE 4
                END,
                pr.data_reserva DESC
        `;

        const [reservas] = await conexao.execute(sql, [usuario_id]);
        res.json(reservas);

    } catch (err) {
        console.error("Erro ao buscar reservas do usuário:", err);
        res.status(500).json({ erro: "Erro interno ao buscar reservas do usuário." });
    }
});

app.get("/pre_reservas/stats/geral", async (req, res) => {
    try {
        const sql = `
            SELECT 
                COUNT(CASE WHEN status = 'aguardando' THEN 1 END) as total_aguardando,
                COUNT(CASE WHEN status = 'retirado' THEN 1 END) as total_retirados,
                COUNT(CASE WHEN status = 'devolvido' THEN 1 END) as total_devolvidos,
                COUNT(CASE WHEN status = 'devolvido' AND DATE(data_devolucao) = CURDATE() THEN 1 END) as devolvidos_hoje
            FROM pre_reservas
        `;

        const [stats] = await conexao.execute(sql);
        res.json(stats[0]);

    } catch (err) {
        console.error("Erro ao buscar estatísticas:", err);
        res.status(500).json({ erro: "Erro interno ao buscar estatísticas." });
    }
});

app.delete("/pre_reservas/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [reserva] = await conexao.execute(
            "SELECT * FROM pre_reservas WHERE id = ?",
            [id]
        );

        if (reserva.length === 0) {
            return res.status(404).json({ erro: "Reserva não encontrada." });
        }

        const sql = `
            UPDATE pre_reservas
            SET status = 'cancelada', data_devolucao = NOW()
            WHERE id = ?
        `;

        await conexao.execute(sql, [id]);

        res.json({ mensagem: "Reserva cancelada com sucesso!" });

    } catch (err) {
        console.error("Erro ao cancelar reserva:", err);
        res.status(500).json({ erro: "Erro interno ao cancelar reserva." });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads', 'fotos');

        console.log('=== MULTER DESTINATION ===');
        console.log('Diretório de destino:', uploadDir);
        console.log('Diretório existe?', fs.existsSync(uploadDir));

        if (!fs.existsSync(uploadDir)) {
            console.log('Criando diretório...');
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Diretório criado!');
        }

        console.log('Permissões do diretório:');
        try {
            fs.accessSync(uploadDir, fs.constants.W_OK);
            console.log('✓ Diretório tem permissão de escrita');
        } catch (err) {
            console.error('✗ SEM permissão de escrita!', err);
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const userId = req.params.id;
        const ext = path.extname(file.originalname);
        // ADICIONA TIMESTAMP PARA EVITAR CONFLITO DE NOMES
        const timestamp = Date.now();
        const filename = `adm_${userId}_${timestamp}${ext}`;
        
        console.log('=== MULTER FILENAME ===');
        console.log('Gerando nome do arquivo:', filename);
        console.log('Extensão detectada:', ext);
        console.log('ID do usuário:', userId);
        console.log('Timestamp:', timestamp);
        
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        console.log('=== MULTER FILE FILTER ===');
        console.log('Arquivo original:', file.originalname);
        console.log('MIME type:', file.mimetype);
        
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            console.log('✓ Arquivo ACEITO');
            cb(null, true);
        } else {
            console.log('✗ Arquivo REJEITADO');
            cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)'));
        }
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/administrador/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await conexao.execute(
            "SELECT id, nome, email, foto FROM administrador WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ Mensagem: "Administrador não encontrado." });
        }

        const admin = rows[0];

        if (!admin.foto || admin.foto === '/uploads/usericon.png') {
            admin.foto = null;
        }

        res.json(admin);
    } catch (error) {
        console.error("Erro ao buscar administrador:", error);
        res.status(500).json({ Mensagem: "Erro interno no servidor." });
    }
});

app.put("/administrador/:id", upload.single("foto"), async (req, res) => {
    const { id } = req.params;
    const { nome, email, senhaAtual, novaSenha } = req.body;

    console.log('=== DEBUG UPLOAD ===');
    console.log('ID do usuário:', id);
    console.log('Arquivo recebido:', req.file ? 'SIM' : 'NÃO');
    if (req.file) {
        console.log('Detalhes do arquivo:', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        });
        
        console.log('Verificando se arquivo existe:', fs.existsSync(req.file.path));
        if (fs.existsSync(req.file.path)) {
            const stats = fs.statSync(req.file.path);
            console.log('✓ Arquivo salvo! Tamanho:', stats.size, 'bytes');
        } else {
            console.error('✗ ARQUIVO NÃO FOI SALVO NO DISCO!');
        }
    }
    console.log('Body:', req.body);
    console.log('===================');

    // VARIÁVEL PARA ARMAZENAR O CAMINHO DA FOTO ANTIGA
    let fotoAntigaPath = null;

    try {
        if (!senhaAtual) {
            if (req.file && fs.existsSync(req.file.path)) {
                console.log('Removendo arquivo não utilizado:', req.file.path);
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ Mensagem: "Senha atual é obrigatória para realizar alterações." });
        }

        const [adminRows] = await conexao.execute(
            "SELECT * FROM administrador WHERE id = ?",
            [id]
        );

        if (adminRows.length === 0) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ Mensagem: "Administrador não encontrado." });
        }

        const adminAtual = adminRows[0];

        const hashSenhaAtual = crypto.createHash("sha256").update(senhaAtual).digest("hex");

        if (hashSenhaAtual !== adminAtual.senhaAdm) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(401).json({ Mensagem: "Senha atual incorreta." });
        }

        const updates = [];
        const values = [];

        if (nome && nome.trim()) {
            if (/\d/.test(nome))
                return res.status(400).json({ Mensagem: "O nome não pode conter números!" });

            if (nome.length > 150)
                return res.status(400).json({ Mensagem: "O nome deve ter no máximo 150 caracteres!" });

            updates.push("nome = ?");
            values.push(nome.trim());
        }

        if (email && email.trim()) {
            if (email.length > 150)
                return res.status(400).json({ Mensagem: "O e-mail deve ter no máximo 150 caracteres!" });

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email))
                return res.status(400).json({ Mensagem: "Formato de e-mail inválido!" });

            const emailNormalizado = email.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            const [verificarEmail] = await conexao.execute(
                "SELECT id FROM administrador WHERE email = ? AND id <> ?",
                [emailNormalizado, id]
            );

            if (verificarEmail.length > 0)
                return res.status(400).json({ Mensagem: "Já existe um usuário com esse e-mail!" });

            updates.push("email = ?");
            values.push(emailNormalizado);
        }

        if (req.file) {
            const caminhoFoto = `/uploads/fotos/${req.file.filename}`;
            updates.push("foto = ?");
            values.push(caminhoFoto);

            console.log("Nova foto salva:", caminhoFoto);

            // ARMAZENA O CAMINHO DA FOTO ANTIGA PARA DELETAR DEPOIS
            const fotoAntiga = adminAtual.foto;
            if (fotoAntiga && fotoAntiga !== "/uploads/usericon.png") {
                fotoAntigaPath = path.join(__dirname, fotoAntiga);
                console.log('Foto antiga marcada para exclusão:', fotoAntigaPath);
            }
        }

        if (novaSenha && novaSenha.trim()) {
            if (novaSenha.length < 6)
                return res.status(400).json({ Mensagem: "A nova senha deve ter no mínimo 6 caracteres." });

            const hashNovaSenha = crypto.createHash("sha256").update(novaSenha).digest("hex");

            updates.push("senhaAdm = ?");
            values.push(hashNovaSenha);
        }

        // EXECUTA O UPDATE NO BANCO
        if (updates.length > 0) {
            values.push(id);
            const sql = `UPDATE administrador SET ${updates.join(", ")} WHERE id = ?`;
            await conexao.execute(sql, values);
            console.log('✓ Banco de dados atualizado com sucesso');
        }

        // BUSCA OS DADOS ATUALIZADOS
        const [dadosAtualizados] = await conexao.execute(
            "SELECT id, nome, email, foto FROM administrador WHERE id = ?",
            [id]
        );

        // SÓ AGORA APAGA A FOTO ANTIGA (DEPOIS DE CONFIRMAR QUE TUDO DEU CERTO)
        if (fotoAntigaPath && fs.existsSync(fotoAntigaPath)) {
            try {
                fs.unlinkSync(fotoAntigaPath);
                console.log('✓ Foto antiga removida com sucesso:', fotoAntigaPath);
            } catch (err) {
                console.error("Erro ao remover foto antiga (não crítico):", err);
                // Não retorna erro aqui, pois o update já foi feito com sucesso
            }
        }

        res.json({
            Mensagem: "Dados atualizados com sucesso!",
            dados: dadosAtualizados[0]
        });

    } catch (error) {
        console.error("Erro ao atualizar administrador:", error);

        // EM CASO DE ERRO, REMOVE A NOVA FOTO (se foi salva)
        if (req.file && fs.existsSync(req.file.path)) {
            try { 
                fs.unlinkSync(req.file.path); 
                console.log('✓ Nova foto removida após erro');
            } catch { 
                console.error('✗ Erro ao remover nova foto após falha');
            }
        }

        res.status(500).json({ Mensagem: "Erro interno no servidor: " + error.message });
    }
});

app.put("/administrador/:id/senha", async (req, res) => {
    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    try {
        if (!senhaAtual || !novaSenha) {
            return res
                .status(400)
                .json({ Mensagem: "Senha atual e nova senha são obrigatórias." });
        }

        if (novaSenha.length < 6) {
            return res
                .status(400)
                .json({ Mensagem: "A nova senha deve ter no mínimo 6 caracteres." });
        }

        const [rows] = await conexao.execute(
            "SELECT senhaAdm FROM administrador WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ Mensagem: "Administrador não encontrado." });
        }

        const senhaBanco = rows[0].senhaAdm;
        const hashSenhaAtual = crypto.createHash("sha256").update(senhaAtual).digest("hex");

        if (hashSenhaAtual !== senhaBanco) {
            return res.status(401).json({ Mensagem: "Senha atual incorreta." });
        }

        const novaSenhaHash = crypto.createHash("sha256").update(novaSenha).digest("hex");

        await conexao.execute("UPDATE administrador SET senhaAdm = ? WHERE id = ?", [
            novaSenhaHash,
            id,
        ]);

        res.json({ Mensagem: "Senha alterada com sucesso!" });
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        res.status(500).json({ Mensagem: "Erro interno no servidor." });
    }
});

app.delete("/administrador/:id/foto", async (req, res) => {
    const { id } = req.params;
    const { senhaAtual } = req.body;

    try {
        if (!senhaAtual) {
            return res.status(400).json({ Mensagem: "Senha atual é obrigatória." });
        }

        const [adminRows] = await conexao.execute(
            "SELECT senhaAdm, foto FROM administrador WHERE id = ?",
            [id]
        );

        if (adminRows.length === 0) {
            return res.status(404).json({ Mensagem: "Administrador não encontrado." });
        }

        const hashSenhaAtual = crypto.createHash("sha256").update(senhaAtual).digest("hex");

        if (hashSenhaAtual !== adminRows[0].senhaAdm) {
            return res.status(401).json({ Mensagem: "Senha atual incorreta." });
        }

        // ATUALIZA O BANCO PRIMEIRO
        await conexao.execute(
            "UPDATE administrador SET foto = NULL WHERE id = ?",
            [id]
        );

        // SÓ DEPOIS APAGA O ARQUIVO
        if (adminRows[0].foto && adminRows[0].foto !== '/uploads/usericon.png') {
            const fotoPath = path.join(__dirname, adminRows[0].foto);
            if (fs.existsSync(fotoPath)) {
                try {
                    fs.unlinkSync(fotoPath);
                    console.log('✓ Foto removida com sucesso');
                } catch (err) {
                    console.error('Erro ao remover arquivo (não crítico):', err);
                }
            }
        }

        res.json({ Mensagem: "Foto removida com sucesso!" });

    } catch (error) {
        console.error("Erro ao remover foto:", error);
        res.status(500).json({ Mensagem: "Erro interno no servidor." });
    }
});

module.exports = app;

app.get("/estatisticas/generos-reservados", async (req, res) => {
    try {
        const sql = `
            SELECT 
                l.genero,
                COUNT(pr.id) as total_reservas
            FROM pre_reservas pr
            JOIN livros l ON pr.livro_id = l.id
            WHERE l.genero IS NOT NULL AND l.genero != ''
            GROUP BY l.genero
            ORDER BY total_reservas DESC
            LIMIT 10
        `;

        const [resultados] = await conexao.execute(sql);

        if (resultados.length === 0) {
            return res.json([]);
        }

        res.json(resultados);
    } catch (error) {
        console.error("Erro ao buscar gêneros reservados:", error);
        res.status(500).json({ erro: "Erro ao buscar estatísticas de reservas" });
    }
});

app.get("/estatisticas/generos-avaliados", async (req, res) => {
    try {
        const sql = `
            SELECT 
                l.genero,
                AVG(a.estrelas) as media_estrelas,
                COUNT(a.id) as total_avaliacoes
            FROM avaliacoes a
            JOIN livros l ON a.livro_id = l.id
            WHERE l.genero IS NOT NULL AND l.genero != ''
            GROUP BY l.genero
            HAVING total_avaliacoes >= 3
            ORDER BY media_estrelas DESC, total_avaliacoes DESC
            LIMIT 10
        `;

        const [resultados] = await conexao.execute(sql);

        if (resultados.length === 0) {
            return res.json([]);
        }

        res.json(resultados);
    } catch (error) {
        console.error("Erro ao buscar gêneros avaliados:", error);
        res.status(500).json({ erro: "Erro ao buscar estatísticas de avaliações" });
    }
});

app.get("/estatisticas/generos-favoritos", async (req, res) => {
    try {
        const sql = `
            SELECT 
                l.genero,
                COUNT(f.id) as total_favoritos
            FROM favoritos f
            JOIN livros l ON f.livro_id = l.id
            WHERE l.genero IS NOT NULL AND l.genero != ''
            GROUP BY l.genero
            ORDER BY total_favoritos DESC
            LIMIT 10
        `;

        const [resultados] = await conexao.execute(sql);

        if (resultados.length === 0) {
            return res.json([]);
        }

        res.json(resultados);
    } catch (error) {
        console.error("Erro ao buscar gêneros favoritos:", error);
        res.status(500).json({ erro: "Erro ao buscar estatísticas de favoritos" });
    }
});

app.get("/estatisticas/generos-todos", async (req, res) => {
    try {
        const [reservados] = await conexao.execute(`
            SELECT l.genero, COUNT(pr.id) as total_reservas
            FROM pre_reservas pr
            JOIN livros l ON pr.livro_id = l.id
            WHERE l.genero IS NOT NULL AND l.genero != ''
            GROUP BY l.genero
            ORDER BY total_reservas DESC
            LIMIT 10
        `);

        router.get('/generos-avaliados', async (req, res) => {
            try {
                const query = `
        SELECT 
          l.genero AS genero,
          ROUND(AVG(media_livro), 2) AS media_estrelas
        FROM (
          SELECT 
            a.livro_id,
            AVG(a.estrelas) AS media_livro
          FROM avaliacoes a
          GROUP BY a.livro_id
        ) AS medias
        JOIN livros l ON l.id = medias.livro_id
        WHERE l.genero IS NOT NULL AND l.genero != ''
        GROUP BY l.genero
        HAVING AVG(media_livro) > 0
        ORDER BY media_estrelas DESC
        LIMIT 10
      `;

                const [results] = await db.query(query);
                res.json(results);
            } catch (error) {
                console.error('Erro ao buscar gêneros avaliados:', error);
                res.status(500).json({ error: 'Erro ao buscar estatísticas' });
            }
        });

        const [favoritos] = await conexao.execute(`
            SELECT l.genero, COUNT(f.id) as total_favoritos
            FROM favoritos f
            JOIN livros l ON f.livro_id = l.id
            WHERE l.genero IS NOT NULL AND l.genero != ''
            GROUP BY l.genero
            ORDER BY total_favoritos DESC
            LIMIT 10
        `);

        res.json({
            reservados: reservados,
            avaliados: avaliados,
            favoritos: favoritos
        });

    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        res.status(500).json({ erro: "Erro ao buscar estatísticas" });
    }
});

app.get("/buscarLivros", async (req, res) => {
    try {
        const query = req.query.q || '';

        if (query.length < 2) {
            return res.json([]);
        }

        const [livros] = await conexao.query(
            `SELECT id, titulo, autor, editora, quantidade_disponivel 
             FROM livros 
             WHERE titulo LIKE ? AND quantidade_disponivel > 0
             ORDER BY titulo
             LIMIT 10`,
            [`%${query}%`]
        );

        res.json(livros);
    } catch (error) {
        console.error("Erro ao buscar livros:", error);
        res.status(500).json({
            mensagem: "Erro ao buscar livros",
            erro: error.message
        });
    }
});

app.get("/validarMatricula/:matricula", async (req, res) => {
    try {
        const { matricula } = req.params;

        const [usuarios] = await conexao.query(
            `SELECT id, nome, matricula 
             FROM usuarios 
             WHERE matricula = ?`,
            [matricula]
        );

        if (usuarios.length > 0) {
            res.json({
                encontrado: true,
                id: usuarios[0].id,
                nome: usuarios[0].nome,
                matricula: usuarios[0].matricula
            });
        } else {
            res.json({
                encontrado: false,
                mensagem: "Aluno não cadastrado no sistema"
            });
        }
    } catch (error) {
        console.error("Erro ao validar matrícula:", error);
        res.status(500).json({
            mensagem: "Erro ao validar matrícula",
            erro: error.message
        });
    }
});

app.post("/cadastrarReserva", async (req, res) => {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const { livro_id, usuario_id, status, data_retirada_max } = req.body;

        if (!livro_id || !usuario_id || !status) {
            await conn.rollback();
            return res.status(400).json({
                mensagem: "Campos obrigatórios faltando"
            });
        }

        if (!['aguardando', 'retirado'].includes(status)) {
            await conn.rollback();
            return res.status(400).json({
                mensagem: "Status inválido. Use 'aguardando' ou 'retirado'"
            });
        }

        if (status === 'aguardando' && !data_retirada_max) {
            await conn.rollback();
            return res.status(400).json({
                mensagem: "Data máxima de retirada é obrigatória para reservas aguardando"
            });
        }

        const [livros] = await conn.query(
            'SELECT id, titulo, quantidade_disponivel FROM livros WHERE id = ?',
            [livro_id]
        );

        if (livros.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                mensagem: "Livro não encontrado"
            });
        }

        if (livros[0].quantidade_disponivel <= 0) {
            await conn.rollback();
            return res.status(400).json({
                mensagem: "Livro sem exemplares disponíveis"
            });
        }

        const [usuarios] = await conn.query(
            'SELECT id, nome FROM usuarios WHERE id = ?',
            [usuario_id]
        );

        if (usuarios.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                mensagem: "Usuário não encontrado"
            });
        }

        const [reservasAtivas] = await conn.query(
            `SELECT id FROM pre_reservas 
             WHERE usuario_id = ? AND livro_id = ? 
             AND status IN ('aguardando', 'retirado')`,
            [usuario_id, livro_id]
        );

        if (reservasAtivas.length > 0) {
            await conn.rollback();
            return res.status(400).json({
                mensagem: "Usuário já possui uma reserva ativa deste livro"
            });
        }

        const dados = {
            usuario_id: usuario_id,
            livro_id: livro_id,
            status: status,
            data_reserva: new Date()
        };

        if (status === 'aguardando') {
            dados.data_retirada_max = data_retirada_max;
        }

        if (status === 'retirado') {
            dados.data_retirada = new Date();
        }

        const [resultado] = await conn.query(
            'INSERT INTO pre_reservas SET ?',
            [dados]
        );

        await conn.query(
            'UPDATE livros SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id = ?',
            [livro_id]
        );

        await conn.commit();

        res.status(201).json({
            mensagem: "Reserva cadastrada com sucesso",
            reserva_id: resultado.insertId,
            status: status,
            livro: livros[0].titulo,
            usuario: usuarios[0].nome
        });

    } catch (error) {
        await conn.rollback();
        console.error("Erro ao cadastrar reserva:", error);
        res.status(500).json({
            mensagem: "Erro ao cadastrar reserva",
            erro: error.message
        });
    } finally {
        conn.release();
    }
});

app.get("/listarReservas", async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT 
                pr.id,
                pr.data_reserva,
                pr.data_retirada_max,
                pr.data_retirada,
                pr.data_devolucao,
                pr.status,
                u.id as usuario_id,
                u.nome as usuario_nome,
                u.matricula as usuario_matricula,
                l.id as livro_id,
                l.titulo as livro_titulo,
                l.autor as livro_autor
            FROM pre_reservas pr
            INNER JOIN usuarios u ON pr.usuario_id = u.id
            INNER JOIN livros l ON pr.livro_id = l.id
        `;

        const params = [];

        if (status) {
            query += ' WHERE pr.status = ?';
            params.push(status);
        }

        query += ' ORDER BY pr.data_reserva DESC';

        const [reservas] = await conexao.query(query, params);

        res.json(reservas);
    } catch (error) {
        console.error("Erro ao listar reservas:", error);
        res.status(500).json({
            mensagem: "Erro ao listar reservas",
            erro: error.message
        });
    }
});

app.put("/atualizarStatusReserva/:id", async (req, res) => {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const { id } = req.params;
        const { status } = req.body;

        if (!['aguardando', 'retirado', 'devolvido'].includes(status)) {
            await conn.rollback();
            return res.status(400).json({
                mensagem: "Status inválido"
            });
        }

        const [reservas] = await conn.query(
            'SELECT * FROM pre_reservas WHERE id = ?',
            [id]
        );

        if (reservas.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                mensagem: "Reserva não encontrada"
            });
        }

        const reservaAtual = reservas[0];
        const dados = { status };

        if (status === 'retirado' && reservaAtual.status === 'aguardando') {
            dados.data_retirada = new Date();
        } else if (status === 'devolvido' && reservaAtual.status === 'retirado') {
            dados.data_devolucao = new Date();

            await conn.query(
                'UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id = ?',
                [reservaAtual.livro_id]
            );
        } else {
            await conn.rollback();
            return res.status(400).json({
                mensagem: "Transição de status inválida"
            });
        }

        await conn.query(
            'UPDATE pre_reservas SET ? WHERE id = ?',
            [dados, id]
        );

        await conn.commit();

        res.json({
            mensagem: "Status atualizado com sucesso",
            novo_status: status
        });

    } catch (error) {
        await conn.rollback();
        console.error("Erro ao atualizar status:", error);
        res.status(500).json({
            mensagem: "Erro ao atualizar status",
            erro: error.message
        });
    } finally {
        conn.release();
    }
});

app.delete("/cancelarReserva/:id", async (req, res) => {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const { id } = req.params;

        const [reservas] = await conn.query(
            'SELECT * FROM pre_reservas WHERE id = ?',
            [id]
        );

        if (reservas.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                mensagem: "Reserva não encontrada"
            });
        }

        const reserva = reservas[0];

        if (reserva.status !== 'aguardando') {
            await conn.rollback();
            return res.status(400).json({
                mensagem: "Apenas reservas com status 'aguardando' podem ser canceladas"
            });
        }

        await conn.query('DELETE FROM pre_reservas WHERE id = ?', [id]);

        await conn.query(
            'UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id = ?',
            [reserva.livro_id]
        );

        await conn.commit();

        res.json({
            mensagem: "Reserva cancelada com sucesso"
        });

    } catch (error) {
        await conn.rollback();
        console.error("Erro ao cancelar reserva:", error);
        res.status(500).json({
            mensagem: "Erro ao cancelar reserva",
            erro: error.message
        });
    } finally {
        conn.release();
    }
});

app.get("/livros2", async (req, res) => {
    try {
        const [livros] = await conexao.query(
            'SELECT * FROM livros ORDER BY titulo'
        );
        res.json(livros);
    } catch (error) {
        console.error("Erro ao listar livros:", error);
        res.status(500).json({
            mensagem: "Erro ao listar livros",
            erro: error.message
        });
    }
});

app.get("/usuarios", async (req, res) => {
    try {
        const [usuarios] = await conexao.query(
            'SELECT id, nome, email, matricula FROM usuarios ORDER BY nome'
        );
        res.json(usuarios);
    } catch (error) {
        console.error("Erro ao listar usuários:", error);
        res.status(500).json({
            mensagem: "Erro ao listar usuários",
            erro: error.message
        });
    }
});
app.get('/generos2', async (req, res) => {
    try {
        const [results] = await conexao.query( 'SELECT * FROM livros ORDER BY genero');
        
        const generosSet = new Set();
        results.forEach(row => {
            const normalizado = row.genero.trim().toLowerCase();
            if (normalizado) {
                generosSet.add(normalizado);
            }
        });
        
        const generos = Array.from(generosSet)
            .map(g => g.charAt(0).toUpperCase() + g.slice(1))
            .sort();
        
        res.json({ generos });
    } catch (error) {
        console.error('Erro ao buscar gêneros:', error);
        res.status(500).json({ error: 'Erro ao buscar gêneros' });
    }
});

app.get('/curso2', async (req, res) => {
    try {
        const [results] = await conexao.query( 'SELECT * FROM tccs ORDER BY curso');
        
        const cursosSet = new Set();
        results.forEach(row => {
            const normalizado = row.curso.trim().toLowerCase();
            if (normalizado) {
                cursosSet.add(normalizado);
            }
        });
        
        const cursos = Array.from(cursosSet)
            .map(c => c.charAt(0).toUpperCase() + c.slice(1))
            .sort();
        
        res.json({ cursos });
    } catch (error) {
        console.error('Erro ao buscar cursos:', error);
        res.status(500).json({ error: 'Erro ao buscar cursos' });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🚀 Servidor rodando!                     ║
║   📍 URL: http://${HOST}:${PORT}          ║
║   📚 API Biblioteca SENAI                  ║ 
╚════════════════════════════════════════════╝
    `);
});