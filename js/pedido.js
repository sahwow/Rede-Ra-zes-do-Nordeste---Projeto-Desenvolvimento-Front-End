// gerenciamento de pedidos, status e avaliações
let pedidoAtivo = null;
let pedidoAvaliandoNumero = null;

// finalizar pedido após o pagamento aprovado
function finalizarPedidoComPagamento(resultadoPagamento) {
    if (carrinho.length === 0) {
        mostrarToast("Carrinho vazio!", 'erro');
        return;
    }
    
    const total = calcularTotal();
    const numeroPedido = gerarNumeroPedido();
    const formaEntrega = document.querySelector('input[name="entrega"]:checked').value;
    const endereco = document.getElementById('endereco')?.value || '';
    
    let mensagem = `✅ Pedido #${numeroPedido} confirmado!\n`;
    mensagem += `Unidade: ${document.getElementById('unidade-select').selectedOptions[0].text}\n`;
    mensagem += `Forma: ${formaEntrega === 'retirar' ? 'Retirada na unidade' : 'Delivery'}\n`;
    if (formaEntrega === 'delivery') mensagem += `Endereço: ${endereco}\n`;
    mensagem += `Total: ${formatarMoeda(total)}\n`;
    mensagem += `Pagamento: ${resultadoPagamento.metodo} - ${resultadoPagamento.transacaoId}\n\n`;
    mensagem += `Acompanhe o status do seu pedido na tela!`;
    
    alert(mensagem);
    
    // registra pedido para controlar de pontos e avaliação
    if (usuarioLogado) {
        usuarioLogado.pedidos.unshift({
            numero: numeroPedido,
            data: new Date().toLocaleString(),
            total: total,
            statusCompleto: false,
            avaliado: false
        });
        
        // descontar pontos utilizados no pedido
        if (pontosUsados > 0) {
            usuarioLogado.pontos -= pontosUsados;
        }
        
        salvarUsuarios();
        salvarLocalStorage('raizes_usuario_logado', usuarioLogado);
    }
    
    pedidoAtivo = numeroPedido;
    document.getElementById('pedido-numero').innerText = numeroPedido;
    document.getElementById('status-card').classList.add('active');
    
    iniciarSimulacaoStatus(1);
    
    // limpar carrinho e descontos
    carrinho = [];
    cupomAplicado = null;
    pontosUsados = 0;
    document.getElementById('cupom-input').value = '';
    document.getElementById('pontos-usar').value = '0';
    document.getElementById('cupom-mensagem').innerHTML = '';
    salvarCarrinho();
    renderizarCarrinho();
}

// simula evolução automática do status do pedido
function iniciarSimulacaoStatus(passoInicial = 0) {
    if (intervaloStatus) clearInterval(intervaloStatus);
    
    let stepAtual = passoInicial;
    atualizarStatusUI(stepAtual);
    
    intervaloStatus = setInterval(() => {
        if (stepAtual < 4) {
            stepAtual++;
            atualizarStatusUI(stepAtual);
        } else {
            clearInterval(intervaloStatus);
            intervaloStatus = null;
            
            // pedido finalizado (retirado/entregue)
            if (usuarioLogado && pedidoAtivo) {
                const pedido = usuarioLogado.pedidos.find(p => p.numero === pedidoAtivo);
                if (pedido && !pedido.statusCompleto) {
                    pedido.statusCompleto = true;
                    
                    // ganha pontos (10% do valor do pedido)
                    const pontosGanhos = Math.floor(pedido.total / 10);
                    usuarioLogado.pontos += pontosGanhos;
                    
                    salvarUsuarios();
                    salvarLocalStorage('raizes_usuario_logado', usuarioLogado);
                    atualizarInterfaceUsuario();
                    
                    mostrarToast(`🎉 Pedido #${pedidoAtivo} finalizado! Você ganhou ${pontosGanhos} pontos!`, 'sucesso');
                    
                    mostrarSecaoAvaliacao(pedidoAtivo);
                }
            }
            pedidoAtivo = null;
        }
    }, 5000);
}

function atualizarStatusUI(step) {
    const stepsDivs = document.querySelectorAll('.step');
    stepsDivs.forEach((div, index) => {
        if (index <= step) {
            div.classList.add('active');
        } else {
            div.classList.remove('active');
        }
    });
    
    const statusTexto = ["Aguardando Pagamento", "Recebido", "Preparando", "Pronto", "Retirado/Entregue"];
    document.getElementById('pedido-status').innerText = statusTexto[step];
}

function mostrarSecaoAvaliacao(numeroPedido) {
    const secao = document.getElementById('avaliacao-section');
    if (!secao) return;
    
    // verifica se o pedido já foi avaliado
    const pedido = usuarioLogado?.pedidos.find(p => p.numero === numeroPedido);
    if (pedido && pedido.avaliado) {
        return; // não mostrar avaliação se já avaliado
    }
    
    pedidoAvaliandoNumero = numeroPedido;
    document.getElementById('avaliacao-pedido-numero-tela').innerText = numeroPedido;
    
    // resetar estrelas e comentário
    document.querySelectorAll('#rating-stars-tela span').forEach(star => {
        star.classList.remove('active');
    });
    document.getElementById('avaliacao-comentario-tela').value = '';
    
    secao.style.display = 'block';
    secao.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// esconder a seção de avaliação
function esconderSecaoAvaliacao() {
    const secao = document.getElementById('avaliacao-section');
    if (secao) {
        secao.style.display = 'none';
    }
}

function enviarAvaliacaoTela() {
    const stars = document.querySelectorAll('#rating-stars-tela span.active').length;
    const comentario = document.getElementById('avaliacao-comentario-tela').value;
    const numeroPedido = pedidoAvaliandoNumero;
    
    if (stars === 0) {
        mostrarToast("Selecione uma nota!", 'erro');
        return;
    }
    
    if (usuarioLogado && numeroPedido) {
        const pedido = usuarioLogado.pedidos.find(p => p.numero === numeroPedido);
        if (pedido && !pedido.avaliado) {
            pedido.avaliado = true;
            pedido.avaliacao = { 
                nota: stars, 
                comentario: comentario, 
                data: new Date().toLocaleString() 
            };
            
            salvarUsuarios();
            salvarLocalStorage('raizes_usuario_logado', usuarioLogado);
            
            mostrarToast(`⭐ Obrigado por avaliar o pedido #${numeroPedido} com ${stars} estrelas!`, 'sucesso');
            
            esconderSecaoAvaliacao();
        }
    }
}