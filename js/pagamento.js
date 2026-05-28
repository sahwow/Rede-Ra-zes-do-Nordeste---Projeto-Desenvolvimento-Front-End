let metodoSelecionado = null;

// simulação de chamada a um gateway de pagamento externo
function servicoExternoPagamento(valor, metodo) {
    return new Promise((resolve, reject) => {
        console.log(`[Serviço Externo] Solicitando pagamento de ${formatarMoeda(valor)} via ${metodo}`);
        
        // aguardar 2 segundos simulando o processamento
        setTimeout(() => {
            // 90% de chance de sucesso, 10% de falha
            const sucesso = Math.random() < 0.9;
            if (sucesso) {
                const transacaoId = gerarIdTransacao();
                console.log(`[Serviço Externo] Pagamento APROVADO. Transação: ${transacaoId}`);
                resolve({
                    sucesso: true,
                    transacaoId: transacaoId,
                    mensagem: "Pagamento aprovado!",
                    metodo: metodo,
                    valor: valor,
                    data: new Date().toISOString()
                });
            } else {
                console.log(`[Serviço Externo] Pagamento RECUSADO.`);
                reject({
                    sucesso: false,
                    codigoErro: "ERRO_001",
                    mensagem: "Pagamento recusado. Verifique seus dados ou tente outro método."
                });
            }
        }, 2000);
    });
}

// abrir modal para escolher forma de pagamento
async function solicitarPagamento() {
    if (carrinho.length === 0) {
        mostrarToast("Carrinho vazio! Adicione itens primeiro.", 'erro');
        return;
    }
    
    const total = calcularTotal();
    document.getElementById('modal-total').innerText = formatarMoeda(total);
    document.getElementById('pagamento-modal').style.display = 'flex';
    document.getElementById('metodos-pagamento').style.display = 'block';
    document.getElementById('loading-pagamento').style.display = 'none';
    document.getElementById('pagamento-status').style.display = 'none';
    document.getElementById('btn-processar').style.display = 'block';
    
    metodoSelecionado = null;
    document.querySelectorAll('.metodo-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

async function processarPagamento() {
    if (!metodoSelecionado) {
        mostrarToast("Selecione um método de pagamento!", 'erro');
        return;
    }
    
    const total = calcularTotal();
    
    // mostrar 'loading' e esconder opções
    document.getElementById('metodos-pagamento').style.display = 'none';
    document.getElementById('loading-pagamento').style.display = 'block';
    document.getElementById('btn-processar').style.display = 'none';
    document.getElementById('pagamento-status').style.display = 'none';
    
    try {
        // aguardar resposta do serviço externo de pagamento
        const resultado = await servicoExternoPagamento(total, metodoSelecionado);
        
        document.getElementById('loading-pagamento').style.display = 'none';
        const statusDiv = document.getElementById('pagamento-status');
        statusDiv.style.display = 'block';
        statusDiv.className = 'status-pagamento sucesso';
        statusDiv.innerHTML = `✅ ${resultado.mensagem}<br>Transação: ${resultado.transacaoId}<br>Método: ${resultado.metodo}`;
        
        // fechar modal e finalizar pedido após 1.5s
        setTimeout(() => {
            document.getElementById('pagamento-modal').style.display = 'none';
            finalizarPedidoComPagamento(resultado);
        }, 1500);
        
    } catch (erro) {
        // mensagem de erro
        document.getElementById('loading-pagamento').style.display = 'none';
        const statusDiv = document.getElementById('pagamento-status');
        statusDiv.style.display = 'block';
        statusDiv.className = 'status-pagamento erro';
        statusDiv.innerHTML = `❌ ${erro.mensagem}<br>Tente novamente com outro método.`;
        
        document.getElementById('metodos-pagamento').style.display = 'block';
        document.getElementById('btn-processar').style.display = 'block';
    }
}