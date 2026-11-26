// Faltou o cloude dá o nome para essa funcao, para eu explicar a vitor na entrega

function renderizarPedidosKDS() {
  const coluna = document.querySelector('.col-recebidos');
  if (!coluna) return;

  const KEY = 'jolly-rogers-pedidos';
  const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let pedidos = [];
  try {
    pedidos = JSON.parse(localStorage.getItem(KEY)) || [];
  } catch (e) {}

  const conteudo = coluna.querySelector('.kds-conteudo');
  const badge = coluna.querySelector('.badge');

  const recebidos = pedidos.filter((p) => p.status === 'recebido');

  if (recebidos.length) {
    conteudo.innerHTML = recebidos.map((p) => `
      <article class="pedido">
        <header>
          <h3>${esc(p.comanda)}</h3>
          <mark>Mesa ${esc(p.mesa)}</mark>
        </header>
        <p class="pedido-info">${esc(p.cliente)} · <time>${esc(p.hora)}</time></p>
        <ul>
          ${p.itens.map((i) => `<li><strong>${i.qtd}x</strong> ${esc(i.nome)}${i.obs ? `<small>${esc(i.obs)}</small>` : ''}</li>`).join('')}
        </ul>
        <footer>
          <span>${esc(p.forma)}</span>
          <strong>${brl(p.total)}</strong>
        </footer>
      </article>`).join('');
  }

  badge.textContent = recebidos.length;
  badge.value = recebidos.length;
};

renderizarPedidosKDS();