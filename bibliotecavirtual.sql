-- --------------------------------------------------------
-- Servidor:                     localhost
-- Versão do servidor:           10.4.32-MariaDB - mariadb.org binary distribution
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para bibliotecavirtual
DROP DATABASE IF EXISTS `bibliotecavirtual`;
CREATE DATABASE IF NOT EXISTS `bibliotecavirtual` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `bibliotecavirtual`;

-- Copiando estrutura para tabela bibliotecavirtual.administrador
DROP TABLE IF EXISTS `administrador`;
CREATE TABLE IF NOT EXISTS `administrador` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `senhaAdm` varchar(256) NOT NULL DEFAULT '',
  `nome` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `foto` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela bibliotecavirtual.administrador: ~1 rows (aproximadamente)
INSERT INTO `administrador` (`id`, `senhaAdm`, `nome`, `email`, `foto`) VALUES
	(29, 'a1b165f5f7c2cdd9e909bef3a78f150df351bb43a15e7c4612bce9d43b2015af', 'Biblioteca Virtual', 'biblioteca@gmail.com', '/uploads/fotos/adm_29_1764332016340.png');

-- Copiando estrutura para tabela bibliotecavirtual.avaliacoes
DROP TABLE IF EXISTS `avaliacoes`;
CREATE TABLE IF NOT EXISTS `avaliacoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `livro_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `estrelas` int(11) NOT NULL CHECK (`estrelas` between 1 and 5),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_avaliacao` (`livro_id`,`usuario_id`),
  KEY `fk_avaliacao_usuario` (`usuario_id`),
  CONSTRAINT `fk_avaliacao_livro` FOREIGN KEY (`livro_id`) REFERENCES `livros` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_avaliacao_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela bibliotecavirtual.avaliacoes: ~0 rows (aproximadamente)

-- Copiando estrutura para tabela bibliotecavirtual.favoritos
DROP TABLE IF EXISTS `favoritos`;
CREATE TABLE IF NOT EXISTS `favoritos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `livro_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_favorito` (`livro_id`,`usuario_id`),
  KEY `fk_fav_usuario` (`usuario_id`),
  CONSTRAINT `fk_fav_livro` FOREIGN KEY (`livro_id`) REFERENCES `livros` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fav_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela bibliotecavirtual.favoritos: ~0 rows (aproximadamente)

-- Copiando estrutura para tabela bibliotecavirtual.favoritos_tcc
DROP TABLE IF EXISTS `favoritos_tcc`;
CREATE TABLE IF NOT EXISTS `favoritos_tcc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tcc_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_favoritos_tcc_tccs` (`tcc_id`),
  KEY `FK_favoritos_tcc_usuarios` (`usuario_id`),
  CONSTRAINT `FK_favoritos_tcc_tccs` FOREIGN KEY (`tcc_id`) REFERENCES `tccs` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `FK_favoritos_tcc_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=90 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela bibliotecavirtual.favoritos_tcc: ~0 rows (aproximadamente)

-- Copiando estrutura para tabela bibliotecavirtual.livros
DROP TABLE IF EXISTS `livros`;
CREATE TABLE IF NOT EXISTS `livros` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(50) NOT NULL DEFAULT '',
  `editora` varchar(50) NOT NULL DEFAULT '',
  `autor` varchar(50) NOT NULL DEFAULT '',
  `genero` varchar(50) NOT NULL DEFAULT '',
  `capa` longtext NOT NULL,
  `quantidade_total` int(11) NOT NULL DEFAULT 0,
  `quantidade_disponivel` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=189 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela bibliotecavirtual.livros: ~11 rows (aproximadamente)
INSERT INTO `livros` (`id`, `titulo`, `editora`, `autor`, `genero`, `capa`, `quantidade_total`, `quantidade_disponivel`) VALUES
	(167, 'Concrete Mathematics: A Foundation for Computer Sc', 'Addison-Wesley, 1994', 'Ronald L. Graham, Donald Ervin Knuth, Oren Patashn', 'Computers', 'https://books.google.com.br/books/content?id=pntQAAAAMAAJ&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE72C5DcQFf0PK2Veyhk_EtmFY80Beyry0arLqj5914k7FGRDBLBKvG5CO018_k_ezEWBgCIkNQ1uug5-5LxMoEeze9R9G468GRZg9_7y2JZY-Tt_gI0LD3wzNSVNBWolI3uCd7fU', 2, 1),
	(168, 'Zen Speaks: Shouts of Nothingness', 'Anchor Books, 1994', 'Zhizhong Cai', 'Zen Buddhism', 'https://books.google.com.br/books/content?id=TN4GAAAACAAJ&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE71ndici3wabK1r412ivKpKOwLbhomRwMR74rtD5pUh7F3-x2vJGKtFz0p8L97k-HbVf9WE2yPZ7UANSzdqHnAy8NuQ5RWRiRIuWz12Fxsa6_Z5--DSlkyb4RlAX-KC9BcRWwzGt', 2, 2),
	(169, 'How to Make a Few Billion Dollars', 'Greenleaf Book Group Press, 2024', 'Brad Jacobs', 'Negócios e Economia', 'https://books.google.com.br/books/content?id=SIsn0AEACAAJ&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE7318iSTY_KAe5sgJu3BAz2UknPZnADY3HpZIm7rnyx5iS4DlwArmAFCUrKkrcpd4AIyLV70LHkuIgYF2ycxG2u5reabE-tOB4lEUdysIRIJtUWnj0v_wDXZ3KP7pBmeUJwceU9i', 2, 0),
	(170, 'The Hunger Games: The First Book of the Hunger Gam', 'Scholastic Press, 2008', 'Suzanne Collins', 'Ficção', 'https://books.google.com.br/books/content?id=sJdUAzLUNyAC&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE70Ziv-i2F1SOhf6vuABJUSg8i2CjfKVhuJ_X93lIhee5MKMORRvy4a4d3D3AHwDgvKKmQVowt1cg1q2rh30VHej8NjFL1PqvvSHAlyeeV8SYrpptyMU2YaYEshN34QJgQizWgqV', 2, 2),
	(171, 'Harry Potter e a Pedra Filosofal - Volume 1', 'Rocco, 2000', 'J. K. Rowling', 'Fantasia', 'https://books.google.com.br/books/content?id=DqvrPgAACAAJ&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE71py5SmDZvwLAXeyitly8FNRIfuzl7YxEUVUdNxkPqOjXWrHmxYluW08nF7ZJ_adyWbvShhEamzqUQh6FRZwjlcvMgQxj5XE9c_Yf-wm8ij5OMb3Yc2jU1o1WlfrjhFPPkCX8CS', 4, 4),
	(173, 'Drácula', 'Instituto Brasileiro de Cultura Ltda, 2021', 'Bram Stoker', 'Fantasia', 'https://books.google.com.br/books/content?id=pSW6zwEACAAJ&printsec=frontcover&img=1&zoom=1&imgtk=AFLRE707Ly-XWNNjof-NMnbmSFLw05tfC7ZSokEPY6WbPYLtCp1zTYcK3lnZfR2DAZErKbH9GqnAaz156Cxzpv9LK7Cb0ZJJ000rMO8gnP0lCVOovK6-fAORLYdym2UmV1xCxsVn8-nP', 4, 4),
	(178, 'A garota no trem', 'Editora Record, 2015', 'Paula Hawkins', 'Suspense', 'https://tse1.mm.bing.net/th/id/OIP.Vx12GmUyNxcdcOJWWKM2IQHaK8?rs=1&pid=ImgDetMain&o=7&rm=3', 5, 4),
	(179, 'Naruto - VOLUME 1 (GOLD)', 'PANINI, 2015', 'Masashi Kishimoto', 'Shounen', 'https://images.tcdn.com.br/img/img_prod/824711/naruto_gold_v_01_6171_1_1f7b6ba9570948627b6a14788d60193e.jpg', 4, 2),
	(180, 'Hunter X Hunter - VOLUME 13', 'JBC, 2001', 'Yoshihiro Togashi', 'Shounen', 'https://www.jbchost.com.br/editorajbc/wp-content/uploads/2021/06/hunterxhunter-13-capa-p.jpg', 3, 3),
	(181, 'Harry Potter e a Câmara Secreta - Volume 2', 'Rocco, 2000', 'J. K. Rowling', 'Fantasia', 'https://m.media-amazon.com/images/I/71NsVQ5MlwL._SY466_.jpg', 1, 0),
	(182, 'DEATH NOTE  - VOLUME 1 (BLACK EDITION)', 'JBC, 2013', 'Tsugumi Ohba', 'SHOUNEN', 'https://m.media-amazon.com/images/I/612x+rQ0yJL._SY425_.jpg', 10, 6);

-- Copiando estrutura para tabela bibliotecavirtual.pre_reservas
DROP TABLE IF EXISTS `pre_reservas`;
CREATE TABLE IF NOT EXISTS `pre_reservas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `livro_id` int(11) NOT NULL,
  `data_retirada_max` datetime NOT NULL,
  `data_reserva` datetime NOT NULL DEFAULT current_timestamp(),
  `status` enum('aguardando','retirado','devolvido') DEFAULT 'aguardando',
  `data_retirada` datetime DEFAULT NULL,
  `data_devolucao` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_usuario` (`usuario_id`),
  KEY `FK_pre_reservas_livros` (`livro_id`),
  CONSTRAINT `FK_pre_reservas_livros` FOREIGN KEY (`livro_id`) REFERENCES `livros` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela bibliotecavirtual.pre_reservas: ~1 rows (aproximadamente)
INSERT INTO `pre_reservas` (`id`, `usuario_id`, `livro_id`, `data_retirada_max`, `data_reserva`, `status`, `data_retirada`, `data_devolucao`) VALUES
	(141, 34, 171, '2025-12-05 14:14:54', '2025-11-28 11:05:06', 'devolvido', '2025-11-28 14:14:54', '2025-11-28 14:15:05');

-- Copiando estrutura para tabela bibliotecavirtual.tccs
DROP TABLE IF EXISTS `tccs`;
CREATE TABLE IF NOT EXISTS `tccs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(50) NOT NULL,
  `autor` varchar(150) NOT NULL,
  `ano` varchar(50) NOT NULL,
  `curso` varchar(50) NOT NULL,
  `link` longtext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela bibliotecavirtual.tccs: ~4 rows (aproximadamente)
INSERT INTO `tccs` (`id`, `titulo`, `autor`, `ano`, `curso`, `link`) VALUES
	(9, 'Projetos Desenvolvidos', 'Prof. Marcos Roberto Ruiz; Prof. Paulo Roberto da Silva Ribeiro;  Prof. Rafael Rebes Zilliani;', '2022', 'Técnico em química', 'https://drive.google.com/file/d/1aW_MVwzXjJbKsVSMVh9HP5WVVUXfcgQB/view?usp=drive_link'),
	(10, 'Contador de Fluxo de Pessoas', 'Desconhecidos', '2018', 'Técnico eletroeletrônica', 'https://drive.google.com/file/d/1dEeG3m00R5reqXHR7qO20_BL00aw-zmu/view?usp=drive_link'),
	(11, 'Inversor 500 Watts', 'CAMILA FERNANDA DOS SANTOS; JOÃO PEDRO ARAÚJO DO AMARAL; JONAS RODRIGUES FREIRE; RAFAEL MELO RIMES;', '2018', 'Técnico eletroeletrônica', 'https://drive.google.com/file/d/1teJhlq7xLr1-8MNGT9IPP1GNgG0KA8PZ/view?usp=drive_link'),
	(12, 'Pulseira de Locomoção', 'Kenzo Espanhol Takei; Luan Baccar Fonseca Casarotto; Matheus Sizilo Oliani;', '2018', 'Técnico em química', 'https://drive.google.com/file/d/1QAO9tcou1K-Qo2FTScp5YuLfLR3_Cfdd/view?usp=drive_link');

-- Copiando estrutura para tabela bibliotecavirtual.usuarios
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL DEFAULT '0',
  `email` varchar(150) NOT NULL DEFAULT '0',
  `senha_hash` varchar(255) NOT NULL DEFAULT '0',
  `matricula` int(11) NOT NULL DEFAULT 0,
  `foto` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela bibliotecavirtual.usuarios: ~1 rows (aproximadamente)
INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha_hash`, `matricula`, `foto`) VALUES
	(34, 'Biblioteca', 'biblioteca@gmail.com', 'a1b165f5f7c2cdd9e909bef3a78f150df351bb43a15e7c4612bce9d43b2015af', 2025, 'fotos/user_34.png');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
