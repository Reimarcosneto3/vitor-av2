//Ordenação

const selectOrdem = document.querySelector('select[name="ordem"]');
const listas = document.querySelectorAll('main section > ul');

listas.forEach(ul => {
  [...ul.children].forEach((li, index) => (li.setAttribute('data-ordem', index)));
})

const getPreco = li => {
  const texto = li.querySelector('footer strong').textContent;
  return parseFloat(texto.replace('R$', '').replace(',', '.'));
}

const getNome = li => li.querySelector('h3').textContent.trim();

const ordenacao = {
  padrao: (a, b) => a.getAttribute('data-ordem') - b.getAttribute('data-ordem'),
  menorPreco: (a, b) => getPreco(a) - getPreco(b),
  maiorPreco: (a, b) => getPreco(b) - getPreco(a),
  'a-z': (a, b) => getNome(a).localeCompare(getNome(b), 'pt-BR'),
};

selectOrdem?.addEventListener('change', () => {
  const comparer = ordenacao[selectOrdem.value];
  

  listas.forEach(ul => {
    const itens = [...ul.children].sort(comparer);
    itens.forEach(li => ul.appendChild(li));
  });
});

//Barra de Pesquisa

const searchInput = document.querySelector('input[name="search"]');
const listasProdutos = document.querySelectorAll('main section > ul > li');
const todosProdutos = [...listasProdutos];
const secoes = document.querySelectorAll('main section[id]');

const displayProdutos = encontrados => {
  todosProdutos.forEach(li => {
    li.hidden = !encontrados.includes(li);

    secoes.forEach(secao => {
      const temProdutoVisivel = [...secao.querySelectorAll('li')].some(li => !li.hidden);
      secao.hidden = !temProdutoVisivel;
    })
  });
};

searchInput?.addEventListener('keyup', (e) => {
  const texto = e.target.value.toLocaleLowerCase();

  const search = todosProdutos.filter(li => 
    li.querySelector('h3').textContent.toLowerCase().includes(texto));
  displayProdutos(search);
})

window.addEventListener('load', displayProdutos.bind(null, todosProdutos));

function iniciarAberturaPeloCardapio() {
  const CHAVE_ESTADO = 'jolly-rogers-mesas';
  const formularioIndex = document.querySelector('#nova-comanda form:not(#form-comanda)');
  if (!formularioIndex) return;

  function lerEstado() {
    let estado = { seq: 100, atual: null, comandas: [], pedidos: [] };
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE_ESTADO));
      if (salvo && Array.isArray(salvo.comandas)) estado = salvo;
    } catch (erro) { /* sem storage: usa o estado vazio */ }
    return estado;
  }

  function salvarEstado(estado) {
    try {
      localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
    } catch (erro) { /* sem storage */ }
  }

  function abrirComandaPeloCardapio(evento) {
    evento.preventDefault();

    const estado = lerEstado();
    const mesa = parseInt(document.querySelector('#mesa').value, 10);
    const cliente = document.querySelector('#cliente').value.trim();
    const taxa = document.querySelector('#taxa').checked;

    if (!mesa || !cliente) return;

    const mesaOcupada = estado.comandas.some(function verificarMesa(comanda) {
      return comanda.mesa === mesa;
    });
    if (mesaOcupada) {
      alert('A mesa ' + mesa + ' já está em uso. Escolha outra mesa.');
      return;
    }

    estado.seq += 1;
    const novaComanda = {
      id: 'CMD-' + estado.seq,
      mesa: mesa,
      cliente: cliente,
      taxa: taxa,
      itens: [],
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    estado.comandas.push(novaComanda);
    estado.atual = novaComanda.id;
    salvarEstado(estado);

    window.location.href = 'mesas.html#comanda';
  }

  formularioIndex.addEventListener('submit', abrirComandaPeloCardapio);
};

iniciarAberturaPeloCardapio();