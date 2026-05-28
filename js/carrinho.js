// gerenciamento do cardápio, carrinho, cupons e pontos

// cardápio de cada unidade com imagens
const cardapioPorUnidade = {
    recife: [
        { id: 1, nome: "Tapioca de Carne Seca", descricao: "Tapioca com carne seca", preco: 18.90, imagem: "assets/recife/tapioca-carne-seca.jpg" },
        { id: 2, nome: "Cuscuz Recheado", descricao: "Cuscuz com carne seca temperada", preco: 22.50, imagem: "assets/recife/cuscuz-recheado.png" },
        { id: 3, nome: "Bolo de Macaxeira", descricao: "Com coco e leite condensado", preco: 9.90, imagem: "assets/recife/bolo-macaxeira.jpg" },
        { id: 4, nome: "Suco de Cajá", descricao: "Natural (500ml)", preco: 8.50, imagem: "assets/recife/suco-caja.jpg" },
        { id: 5, nome: "Café Regional", descricao: "Com canela", preco: 6.00, imagem: "assets/recife/cafe-regional.jpg" },
        { id: 6, nome: "Manteiga de Garrafa", descricao: "Acompanhamento", preco: 4.50, imagem: "assets/recife/manteiga-garrafa.jpg" }
    ],
    olinda: [
        { id: 1, nome: "Tapioca Mista", descricao: "Opção: Queijo e coco ralado", preco: 15.90, imagem: "assets/olinda/tapioca-mista.jpg" },
        { id: 2, nome: "Cuscuz Simples", descricao: "Com manteiga", preco: 12.00, imagem: "assets/olinda/cuscuz-simples.jpg" },
        { id: 3, nome: "Suco de Maracujá", descricao: "Natural", preco: 7.50, imagem: "assets/olinda/suco-maracuja.jpg" },
        { id: 4, nome: "Bolo de Rolo", descricao: "Fatia", preco: 8.90, imagem: "assets/olinda/bolo-rolo.jpg" }
    ],
    caruaru: [
        { id: 1, nome: "Tapioca de Charque", descricao: "Charque desfiado", preco: 20.90, imagem: "assets/caruaru/tapioca-charque.jpg" },
        { id: 2, nome: "Cuscuz de Forno", descricao: "Gratinado", preco: 24.90, imagem: "assets/caruaru/cuscuz-forno.jpg" },
        { id: 3, nome: "Canjica", descricao: "Típica junina", preco: 10.90, imagem: "assets/caruaru/canjica.jpg" },
        { id: 4, nome: "Suco de Umbu", descricao: "Natural", preco: 9.90, imagem: "assets/caruaru/suco-umbu.jpg" },
        { id: 5, nome: "Pamonha", descricao: "Caseira", preco: 8.90, imagem: "assets/caruaru/pamonha.jpg" }
    ]
};

let unidadeAtual = "recife";
let carrinho = [];
let cupomAplicado = null;
let pontosUsados = 0;
let termoBusca = "";
let intervaloStatus = null;

// cupons de desconto disponíveis
const cuponsValidos = {
    "FIDELIDADE10": { tipo: "percentual", valor: 10, descricao: "10% off" },
    "FIDELIDADE20": { tipo: "percentual", valor: 20, descricao: "20% off" },
    "BEMVINDO5": { tipo: "fixo", valor: 5, descricao: "R$5 off" }
};

// salva o carrinho no localStorage
function salvarCarrinho() {
    if (usuarioLogado) {
        salvarLocalStorage(`carrinho_${usuarioLogado.id}`, carrinho);
    }
}

// carrega o carrinho do localStorage
function carregarCarrinho() {
    if (usuarioLogado) {
        const salvo = carregarLocalStorage(`carrinho_${usuarioLogado.id}`, []);
        carrinho = salvo;
    }
    renderizarCarrinho();
}

// adiciona produto ao carrinho (bloqueado para visitante)
function adicionarAoCarrinho(id, nome, preco) {
    // verifica se é visitante
    if (modoVisitante) {
        mostrarToast('Faça login para adicionar itens ao carrinho!', 'erro');
        return;
    }
    
    const itemExistente = carrinho.find(item => item.id === id && item.unidade === unidadeAtual);
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ id, nome, preco, quantidade: 1, unidade: unidadeAtual });
    }
    salvarCarrinho();
    renderizarCarrinho();
    mostrarConfirmacaoAdicionado(nome);
}

// altera quantidade de um item no carrinho
function alterarQuantidade(id, delta) {
    const item = carrinho.find(item => item.id === id && item.unidade === unidadeAtual);
    if (item) {
        const novaQtd = item.quantidade + delta;
        if (novaQtd <= 0) {
            carrinho = carrinho.filter(i => !(i.id === id && i.unidade === unidadeAtual));
        } else {
            item.quantidade = novaQtd;
        }
        salvarCarrinho();
        renderizarCarrinho();
    }
}

// remove item completamente do carrinho
function removerItemCompleto(id) {
    carrinho = carrinho.filter(item => !(item.id === id && item.unidade === unidadeAtual));
    salvarCarrinho();
    renderizarCarrinho();
    mostrarToast('Item removido do carrinho', 'sucesso');
}

// calcula subtotal (sem descontos)
function calcularSubtotal() {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

// calcula desconto baseado nos pontos do usuário
function calcularDescontoPontos(total) {
    if (!usuarioLogado) return { desconto: 0, pontosUsados: 0 };
    const maxPontosUsar = Math.min(usuarioLogado.pontos, Math.floor(total * 10));
    const pontosUsar = Math.min(pontosUsados, maxPontosUsar);
    const desconto = pontosUsar / 10;
    return { desconto, pontosUsadosReais: pontosUsar };
}

// calcula desconto baseado no cupom aplicado
function calcularDescontoCupom(total) {
    if (!cupomAplicado) return 0;
    if (cupomAplicado.tipo === "percentual") {
        return total * (cupomAplicado.valor / 100);
    } else if (cupomAplicado.tipo === "fixo") {
        return Math.min(cupomAplicado.valor, total);
    }
    return 0;
}

// calcula total final com todos os descontos
function calcularTotal() {
    let subtotal = calcularSubtotal();
    const descontoCupom = calcularDescontoCupom(subtotal);
    let aposCupom = subtotal - descontoCupom;
    const { desconto: descontoPontos } = calcularDescontoPontos(aposCupom);
    return Math.max(0, aposCupom - descontoPontos);
}

// exibe produtos do cardápio com imagens
function renderizarCardapio() {
    const container = document.getElementById('menu-container');
    let produtos = cardapioPorUnidade[unidadeAtual];
    
    // aplica filtro de busca se houver
    if (termoBusca) {
        produtos = produtos.filter(p => 
            p.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
            p.descricao.toLowerCase().includes(termoBusca.toLowerCase())
        );
    }
    
    if (!container) return;
    container.innerHTML = '';
    
    produtos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            <div class="menu-card-imagem">
                <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
            </div>
            <h3>${produto.nome}</h3>
            <div class="desc">${produto.descricao}</div>
            <div class="price">${formatarMoeda(produto.preco)}</div>
            <button class="btn-add" data-id="${produto.id}" data-nome="${produto.nome}" data-preco="${produto.preco}">➕ Adicionar</button>
        `;
        container.appendChild(card);
    });

    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', () => {
            adicionarAoCarrinho(parseInt(btn.dataset.id), btn.dataset.nome, parseFloat(btn.dataset.preco));
        });
    });
}

// exibe itens do carrinho e atualiza totais
function renderizarCarrinho() {
    const container = document.getElementById('cart-items-container');
    const subtotalSpan = document.getElementById('subtotal-value');
    const totalSpan = document.getElementById('total-value');
    const pontosInfo = document.getElementById('pontos-info');
    
    if (!container) return;
    
    if (carrinho.length === 0) {
        container.innerHTML = '<div class="empty-cart">🛍️ Carrinho vazio</div>';
        if (subtotalSpan) subtotalSpan.innerText = formatarMoeda(0);
        if (totalSpan) totalSpan.innerText = formatarMoeda(0);
        return;
    }

    let html = '';
    carrinho.forEach(item => {
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nome}</div>
                    <div class="cart-item-price">${formatarMoeda(item.preco)}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-minus" data-id="${item.id}">-</button>
                    <span>${item.quantidade}</span>
                    <button class="qty-plus" data-id="${item.id}">+</button>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">✕</button>
            </div>
        `;
    });
    container.innerHTML = html;
    
    const subtotal = calcularSubtotal();
    const descontoCupom = calcularDescontoCupom(subtotal);
    const aposCupom = subtotal - descontoCupom;
    const { desconto: descontoPontos } = calcularDescontoPontos(aposCupom);
    const total = Math.max(0, aposCupom - descontoPontos);
    
    if (subtotalSpan) subtotalSpan.innerText = formatarMoeda(subtotal);
    if (totalSpan) totalSpan.innerText = formatarMoeda(total);
    
    if (pontosInfo && usuarioLogado) {
        pontosInfo.innerHTML = `Você tem ${usuarioLogado.pontos} pontos. (Cada 10 pontos = R$1)`;
    }

    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', () => alterarQuantidade(parseInt(btn.dataset.id), -1));
    });
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', () => alterarQuantidade(parseInt(btn.dataset.id), 1));
    });
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => removerItemCompleto(parseInt(btn.dataset.id)));
    });
}

// aplica cupom de desconto ao pedido
function aplicarCupom() {
    const codigo = document.getElementById('cupom-input').value.trim().toUpperCase();
    const msgDiv = document.getElementById('cupom-mensagem');
    
    if (cupomAplicado) {
        msgDiv.innerHTML = '⚠️ Já existe um cupom aplicado!';
        msgDiv.style.color = '#e74c3c';
        return;
    }
    
    if (cuponsValidos[codigo]) {
        cupomAplicado = cuponsValidos[codigo];
        msgDiv.innerHTML = `✅ Cupom aplicado: ${cupomAplicado.descricao}`;
        msgDiv.style.color = '#2c7a47';
        renderizarCarrinho();
    } else {
        msgDiv.innerHTML = '❌ Cupom inválido! Use: FIDELIDADE10, FIDELIDADE20 ou BEMVINDO5';
        msgDiv.style.color = '#e74c3c';
    }
}

// aplica desconto usando pontos de fidelidade
function aplicarPontos() {
    const input = document.getElementById('pontos-usar');
    let pontos = parseInt(input.value) || 0;
    const maxPontos = usuarioLogado?.pontos || 0;
    const maxPontosPorPedido = Math.floor(calcularSubtotal() * 10);
    
    if (pontos > maxPontos) {
        mostrarToast(`Você só tem ${maxPontos} pontos!`, 'erro');
        pontos = maxPontos;
    }
    if (pontos > maxPontosPorPedido) {
        mostrarToast(`Máximo de ${maxPontosPorPedido} pontos para este pedido`, 'erro');
        pontos = maxPontosPorPedido;
    }
    if (pontos < 0) pontos = 0;
    
    pontosUsados = pontos;
    input.value = pontos;
    renderizarCarrinho();
    mostrarToast(`Desconto de ${formatarMoeda(pontos / 10)} aplicado!`, 'sucesso');
}