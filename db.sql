É necessário fazer todos esses no server? CREATE DATABASE projeto_integrador;
USE projeto_integrador;

CREATE TABLE cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf_cnpj VARCHAR(20) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE cadastro (
    id_cadastro INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL UNIQUE,
    endereco VARCHAR(255) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    data_nascimento DATE,
    CONSTRAINT fk_cadastro_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE login (
    id_login INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL, 
    ultimo_acesso DATETIME,
    ativo BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_login_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE consulta (
    id_consulta INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    assunto VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    data_consulta DATETIME DEFAULT CURRENT_TIMESTAMP,
    status_consulta ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO') DEFAULT 'PENDENTE',
    CONSTRAINT fk_consulta_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente) ON DELETE CASCADE ON UPDATE CASCADE
);



CREATE TABLE produto (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    categoria VARCHAR(100) NOT NULL,
    is_organico BOOLEAN DEFAULT TRUE, 
    is_vegano BOOLEAN DEFAULT TRUE,   
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE carrinho_de_compra (
    id_carrinho INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    data_adicao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carrinho_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_carrinho_produto FOREIGN KEY (id_produto)
        REFERENCES produto(id_produto) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uk_cliente_produto UNIQUE (id_cliente, id_produto)
);


CREATE TABLE compra (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    metodo_pagamento ENUM('CARTAO', 'PIX', 'BOLETO') NOT NULL,
    status_compra ENUM('PENDENTE', 'PAGO', 'CANCELADO') DEFAULT 'PENDENTE',
    data_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_compra_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE nota_fiscal (
    id_nota INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT NOT NULL UNIQUE,
    chave_acesso VARCHAR(44) NOT NULL UNIQUE,
    valor_imposto DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    data_emissao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_nota_compra FOREIGN KEY (id_compra)
        REFERENCES compra(id_compra) ON DELETE CASCADE ON UPDATE CASCADE
);



SELECT * FROM cliente;
SELECT * FROM cadastro;
SELECT * FROM login;
SELECT * FROM consulta;
SELECT * FROM produto;
SELECT * FROM carrinho_de_compra;
SELECT * FROM compra;
SELECT * FROM nota_fiscal;

SHOW TABLES;