/* Mesas & Comandas: estado em memória + localStorage */
(() => {
  'use strict';

  const KEY = 'jolly-rogers-mesas';
  const TAXA = 0.10;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const arred = (n) => Math.round(n * 100) / 100;
  const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  let state = { seq: 100, atual: null, comandas: [] };
  try {
    const salvo = JSON.parse(localStorage.getItem(KEY));
    if (salvo && Array.isArray(salvo.comandas)) state = salvo;
  } catch (e) { /* sem storage: segue em memória */ }
  const salvar = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  let itemParaExcluir = null;

  const atual = () => state.comandas.find((c) => c.id === state.atual) || null;
  const totais = (c, desconto = 0) => {
    const sub = arred(c.itens.reduce((t, i) => t + i.preco * i.qtd, 0));
    const taxa = c.taxa ? arred(sub * TAXA) : 0;
    const desc = Math.min(Math.max(desconto, 0), sub + taxa);
    return { sub, taxa, desc, total: arred(sub + taxa - desc) };
  };
  const irPara = (hash) => { location.hash = hash; };

  /* ---------- render ---------- */
  function render() {
    // mesas
    $$('.mesa').forEach((m) => {
      const ocupada = state.comandas.some((c) => String(c.mesa) === m.dataset.mesa);
      m.classList.toggle('ocupada', ocupada);
      m.classList.toggle('livre', !ocupada);
      m.setAttribute('href', ocupada ? '#comanda' : '#nova-comanda');
      m.querySelector('small').textContent = ocupada ? 'Em uso' : 'Livre';
    });
    // select de mesas: só as livres
    $$('#mesa option').forEach((o) => {
      if (o.value) o.disabled = state.comandas.some((c) => String(c.mesa) === o.value);
    });

    // lista de comandas em aberto
    const lista = $('#lista-comandas');
    if (!state.comandas.length) {
      lista.innerHTML = '<div class="vazio" role="status"><h3>Nenhuma comanda aberta</h3><p>Clique em "Abrir Comanda" ou selecione uma mesa livre.</p></div>';
    } else {
      lista.innerHTML = '<ul>' + state.comandas.map((c) => {
        const qtd = c.itens.length;
        return `<li><a href="#comanda" data-cmd="${c.id}"><article class="cartao">
          <h3>${esc(c.id)}</h3><mark>Mesa ${c.mesa}</mark>
          <p class="cli">${esc(c.cliente)}</p>
          <p class="n-itens">${qtd} ${qtd === 1 ? 'item' : 'itens'}</p>
          <strong>${brl(totais(c).sub)}</strong></article></a></li>`;
      }).join('') + '</ul>';
    }

    // painel da comanda
    const c = atual();
    $('.salao').classList.toggle('tem-comanda', !!c);
    if (!c) return;
    const t = totais(c);
    $('#c-id').textContent = c.id;
    $('#c-mesa').textContent = 'Mesa ' + c.mesa;
    $('#c-cliente').textContent = c.cliente;
    $('#c-hora').textContent = c.hora + 'h';
    $('#c-vazio').hidden = c.itens.length > 0;
    $('#c-itens').hidden = c.itens.length === 0;
    $('#c-corpo').innerHTML = c.itens.map((i) => `<tr>
      <th scope="row">${esc(i.nome)}${i.obs ? `<small class="obs">${esc(i.obs)}</small>` : ''}</th>
      <td class="qtd"><button type="button" data-acao="mais" data-item="${i.id}" aria-label="Aumentar quantidade">+</button><data value="${i.qtd}">${i.qtd}</data><button type="button" data-acao="menos" data-item="${i.id}" aria-label="Diminuir quantidade">−</button></td>
      <td>${brl(i.preco)}</td><td><strong>${brl(i.preco * i.qtd)}</strong></td>
      <td><small class="selo">Recebido</small></td>
      <td><a href="#excluir-item" class="btn-icone" data-excluir="${i.id}" aria-label="Excluir ${esc(i.nome)}"></a></td></tr>`).join('');
    $('#c-sub').textContent = brl(t.sub);
    $('#c-taxa').checked = c.taxa;
    $('#c-taxa-v').textContent = brl(t.taxa);
    $('#c-total').textContent = brl(t.total);
    $('#c-total-btn').textContent = brl(t.total).replace('R$ ', 'R$');
    $('#cancelar-id').textContent = c.id;
    $('#p-taxa').checked = c.taxa;
    atualizarPagamento();
  }

  function atualizarPagamento() {
    const c = atual();
    if (!c) return;
    const t = totais(c, parseFloat($('#p-desc').value) || 0);
    $('#p-sub').textContent = brl(t.sub);
    $('#p-taxa-v').textContent = brl(t.taxa);
    $('#p-total').textContent = brl(t.total);
  }

  /* ---------- cliques ---------- */
  document.addEventListener('click', (e) => {
    // mesa livre → pré-seleciona no modal; mesa em uso → abre a comanda dela
    const mesa = e.target.closest('.mesa');
    if (mesa) {
      if (mesa.classList.contains('ocupada')) {
        const c = state.comandas.find((x) => String(x.mesa) === mesa.dataset.mesa);
        if (c) { state.atual = c.id; render(); }
      } else {
        $('#mesa').value = mesa.dataset.mesa;
      }
      return;
    }
    if (e.target.closest('a[href="#nova-comanda"]')) { $('#form-comanda').reset(); $('#mesa').value = ''; }

    const card = e.target.closest('a[data-cmd]');
    if (card) { state.atual = card.dataset.cmd; render(); return; }

    const c = atual();
    const qtdBtn = e.target.closest('button[data-acao]');
    if (qtdBtn && c) {
      const item = c.itens.find((i) => i.id === qtdBtn.dataset.item);
      if (item) item.qtd = Math.max(1, item.qtd + (qtdBtn.dataset.acao === 'mais' ? 1 : -1));
      salvar(); render(); return;
    }

    const del = e.target.closest('a[data-excluir]');
    if (del && c) {
      itemParaExcluir = del.dataset.excluir;
      const item = c.itens.find((i) => i.id === itemParaExcluir);
      $('#excluir-nome').textContent = item ? item.nome : '';
      return;
    }

    if (e.target.closest('a[href="#pagamento"]') && c) {
      $('#p-forma').value = ''; $('#p-desc').value = ''; $('#p-forma').setCustomValidity('');
      atualizarPagamento();
      return;
    }

    if (e.target.closest('a[href="#comprovante"]')) {
      e.preventDefault();
      confirmarPagamento();
    }
  });

  document.addEventListener('change', (e) => {
    const c = atual();
    if (c && (e.target.id === 'c-taxa' || e.target.id === 'p-taxa')) { c.taxa = e.target.checked; salvar(); render(); }
  });
  $('#p-desc').addEventListener('input', atualizarPagamento);
  $('#p-forma').addEventListener('change', (e) => e.target.setCustomValidity(''));

  /* ---------- formulários ---------- */
  $('#form-comanda').addEventListener('submit', (e) => {
    e.preventDefault();
    const mesa = parseInt($('#mesa').value, 10);
    const cliente = $('#cliente').value.trim();
    if (!mesa || !cliente || state.comandas.some((c) => c.mesa === mesa)) return;
    state.seq += 1;
    const cmd = {
      id: 'CMD-' + state.seq, mesa, cliente, taxa: $('#taxa').checked, itens: [],
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    state.comandas.push(cmd);
    state.atual = cmd.id;
    salvar(); render();
    e.target.reset();
    irPara('#comanda');
  });

  $('#form-produto').addEventListener('submit', (e) => {
    e.preventDefault();
    const c = atual();
    const sel = $('#a-item');
    const opt = sel.selectedOptions[0];
    if (!c || !opt || !opt.value) return;
    const qtd = Math.max(1, parseInt($('#a-qtd').value, 10) || 1);
    const obs = $('#a-obs').value.trim();
    const igual = c.itens.find((i) => i.nome === opt.value && i.obs === obs);
    if (igual) igual.qtd += qtd;
    else c.itens.push({ id: uid(), nome: opt.value, preco: parseFloat(opt.dataset.preco) || 0, qtd, obs });
    salvar(); render();
    e.target.reset();
    irPara('#comanda');
  });

  $('#form-excluir').addEventListener('submit', (e) => {
    e.preventDefault();
    const c = atual();
    if (c) c.itens = c.itens.filter((i) => i.id !== itemParaExcluir);
    itemParaExcluir = null;
    salvar(); render();
    irPara('#comanda');
  });

  $('#form-cancelar').addEventListener('submit', (e) => {
    e.preventDefault();
    state.comandas = state.comandas.filter((c) => c.id !== state.atual);
    state.atual = state.comandas.length ? state.comandas[0].id : null;
    salvar(); render();
    irPara('#topo');
  });

  function confirmarPagamento() {
    const c = atual();
    const forma = $('#p-forma');
    if (!c || !c.itens.length) {
      forma.setCustomValidity('Adicione pelo menos um item antes de fechar a conta.');
      forma.reportValidity();
      return;
    }
    if (!forma.value) {
      forma.setCustomValidity('Selecione a forma de pagamento.');
      forma.reportValidity();
      return;
    }
    const t = totais(c, parseFloat($('#p-desc').value) || 0);
    $('#r-cmd').textContent = c.id;
    $('#r-mesa').textContent = c.mesa;
    $('#r-cliente').textContent = c.cliente;
    $('#r-data').textContent = new Date().toLocaleString('pt-BR');
    $('#r-itens').innerHTML = c.itens.map((i) => `<tr><td>${esc(i.nome)}</td><td>${i.qtd}</td><td>${brl(i.preco * i.qtd)}</td></tr>`).join('');
    $('#r-sub').textContent = brl(t.sub);
    $('#r-taxa').textContent = brl(t.taxa);
    $('#r-desc-t').hidden = $('#r-desc').hidden = t.desc === 0;
    $('#r-desc').textContent = '− ' + brl(t.desc);
    $('#r-total').textContent = brl(t.total);
    $('#r-forma').textContent = forma.value;

    // encerra a comanda e libera a mesa
    state.comandas = state.comandas.filter((x) => x.id !== c.id);
    state.atual = state.comandas.length ? state.comandas[0].id : null;
    salvar(); render();
    irPara('#comprovante');
  }

  render();
})();