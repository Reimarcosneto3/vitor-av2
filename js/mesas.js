// ===== MESAS & COMANDAS - Jolly Rogers =====
// Salve este arquivo como js/mesas.js (o HTML já carrega ele no final do body)

// ---------- DADOS ----------
const CHAVE = "jr_comandas"; // nome da "gaveta" onde guardamos os dados no navegador (localStorage)
const CHAVE_HISTORICO = "jr_historico"; // gaveta onde guardamos as comandas já pagas
let comandas = []; // lista de comandas abertas
let proximoId = 1; // número da próxima comanda a ser aberta
let selecionadaId = null; // id da comanda que está aparecendo na tela (null = nenhuma)
let itemParaExcluir = null; // id do item que o usuário clicou para excluir

// ---------- FUNÇÕES AUXILIARES ----------
function $(id) { // atalho: $("abc") faz o mesmo que document.getElementById("abc")
  return document.getElementById(id); // devolve o elemento da página que tem esse id
} // fim do atalho

function dinheiro(valor) { // transforma número (12.5) em texto de dinheiro ("R$ 12,50")
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); // formata no padrão brasileiro
} // fim da função dinheiro

function achar(id) { // procura uma comanda pelo id
  return comandas.find(function (c) { return c.id === id; }); // devolve a comanda encontrada (ou undefined)
} // fim da função achar

function numeroComanda(c) { // monta o texto "Comanda #001"
  return "Comanda #" + String(c.id).padStart(3, "0"); // padStart completa com zeros à esquerda até ter 3 dígitos
} // fim da função numeroComanda

function criar(tag, texto, classe) { // cria um elemento HTML já com texto e classe
  const el = document.createElement(tag); // cria o elemento (ex.: td, li, p)
  if (texto !== undefined) el.textContent = texto; // se veio texto, coloca dentro (textContent é seguro contra códigos maliciosos)
  if (classe) el.className = classe; // se veio classe, aplica no elemento
  return el; // devolve o elemento pronto
} // fim da função criar

function salvar() { // grava tudo no navegador para não perder ao recarregar
  localStorage.setItem(CHAVE, JSON.stringify({ comandas: comandas, proximoId: proximoId })); // converte para texto e guarda
} // fim da função salvar

function carregar() { // lê o que foi gravado anteriormente
  const texto = localStorage.getItem(CHAVE); // pega o texto guardado (ou null se não existir)
  if (!texto) return; // se não tem nada guardado, não faz nada
  const dados = JSON.parse(texto); // converte o texto de volta para objeto
  comandas = dados.comandas || []; // recupera a lista de comandas
  proximoId = dados.proximoId || 1; // recupera o contador de comandas
} // fim da função carregar

function calcular(c) { // calcula subtotal, taxa e total de uma comanda
  let sub = 0; // começa o subtotal em zero
  c.itens.forEach(function (item) { // para cada item da comanda...
    sub += item.preco * item.qtd; // ...soma preço x quantidade
  }); // fim do forEach
  const taxa = c.taxa ? sub * 0.1 : 0; // se a taxa está ligada, são 10% do subtotal; senão zero
  return { sub: sub, taxa: taxa, total: sub + taxa }; // devolve os três valores juntos
} // fim da função calcular

// ---------- DESENHAR NA TELA ----------
function desenharMesas() { // pinta o mapa de mesas (livre ou ocupada)
  document.querySelectorAll(".mesa").forEach(function (a) { // para cada botão de mesa...
    const ocupada = comandas.some(function (c) { return c.mesa === a.dataset.mesa; }); // ...vê se existe comanda aberta nela
    a.className = "mesa " + (ocupada ? "ocupada" : "livre"); // troca a classe visual
    a.querySelector("small").textContent = ocupada ? "Ocupada" : "Livre"; // troca o texto pequeno
  }); // fim do forEach
} // fim da função desenharMesas

function desenharLista() { // desenha a lista "Comandas em Aberto"
  const caixa = $("lista-comandas"); // pega a caixa onde a lista aparece
  caixa.textContent = ""; // limpa tudo o que tinha dentro
  if (comandas.length === 0) { // se não existe nenhuma comanda...
    const vazio = criar("div", undefined, "vazio"); // ...cria o aviso de lista vazia
    vazio.setAttribute("role", "status"); // acessibilidade: leitor de tela avisa a mudança
    vazio.appendChild(criar("h3", "Nenhuma comanda aberta")); // título do aviso
    vazio.appendChild(criar("p", 'Clique em "Abrir Comanda" ou selecione uma mesa livre.')); // texto do aviso
    caixa.appendChild(vazio); // coloca o aviso na caixa
    return; // para aqui, não há mais o que desenhar
  } // fim do if
  const ul = criar("ul"); // cria a lista
  comandas.forEach(function (c) { // para cada comanda aberta...
    const li = criar("li"); // ...cria um item de lista
    const link = criar("a", numeroComanda(c) + " · Mesa " + c.mesa + " · " + c.cliente + " · " + dinheiro(calcular(c).total)); // link com o resumo
    link.href = "#comanda"; // clicar leva até a comanda
    link.dataset.id = c.id; // guarda o id no próprio link (data-id)
    if (c.id === selecionadaId) link.className = "ativa"; // marca a comanda que está selecionada
    li.appendChild(link); // coloca o link dentro do item
    ul.appendChild(li); // coloca o item dentro da lista
  }); // fim do forEach
  caixa.appendChild(ul); // coloca a lista pronta na caixa
} // fim da função desenharLista

function desenharComanda() { // desenha a comanda selecionada (lado direito)
  const c = achar(selecionadaId); // procura a comanda selecionada
  const painel = $("comanda"); // painel que mostra a comanda
  const semComanda = document.querySelector(".sem-comanda"); // painel de "nenhuma comanda"
  if (!c) { // se não tem comanda selecionada...
    painel.style.display = "none"; // ...esconde o painel da comanda
    semComanda.style.display = ""; // ...e mostra o aviso (vazio = volta ao padrão do CSS)
    return; // para aqui
  } // fim do if
  painel.style.display = ""; // mostra o painel da comanda
  semComanda.style.display = "none"; // esconde o aviso de "nenhuma comanda"

  $("c-id").textContent = numeroComanda(c); // escreve o número da comanda
  $("c-mesa").textContent = "Mesa " + c.mesa; // escreve a mesa
  $("c-cliente").textContent = c.cliente; // escreve o nome do cliente
  $("c-hora").textContent = c.hora; // escreve a hora de abertura
  $("c-taxa").checked = c.taxa; // marca ou desmarca a caixinha da taxa

  $("c-vazio").style.display = c.itens.length === 0 ? "" : "none"; // mostra "comanda vazia" só se não houver itens
  $("c-itens").hidden = c.itens.length === 0; // esconde a tabela se não houver itens

  const corpo = $("c-corpo"); // corpo da tabela de itens
  corpo.textContent = ""; // limpa as linhas antigas
  c.itens.forEach(function (item) { // para cada item da comanda...
    const tr = criar("tr"); // ...cria uma linha

    const tdNome = criar("td", item.nome); // célula com o nome do prato
    if (item.obs) { // se tem observação...
      tdNome.appendChild(criar("br")); // ...pula uma linha
      tdNome.appendChild(criar("small", "Obs: " + item.obs)); // ...e mostra a observação
    } // fim do if
    tr.appendChild(tdNome); // coloca a célula na linha

    const tdQtd = criar("td"); // célula da quantidade
    const menos = criar("button", "−"); // botão de diminuir
    menos.type = "button"; // evita que o botão envie formulário
    menos.dataset.acao = "menos"; // marca que é o botão de diminuir
    menos.dataset.item = item.id; // guarda de qual item ele é
    const mais = criar("button", "+"); // botão de aumentar
    mais.type = "button"; // evita que o botão envie formulário
    mais.dataset.acao = "mais"; // marca que é o botão de aumentar
    mais.dataset.item = item.id; // guarda de qual item ele é
    tdQtd.appendChild(menos); // coloca o botão − na célula
    tdQtd.appendChild(criar("span", " " + item.qtd + " ")); // mostra a quantidade no meio
    tdQtd.appendChild(mais); // coloca o botão + na célula
    tr.appendChild(tdQtd); // coloca a célula na linha

    tr.appendChild(criar("td", dinheiro(item.preco))); // célula do preço unitário
    tr.appendChild(criar("td", dinheiro(item.preco * item.qtd))); // célula do subtotal do item
    tr.appendChild(criar("td", item.status)); // célula do status de produção

    const tdAcoes = criar("td"); // célula das ações
    const excluir = criar("a", "Excluir", "btn-acao vermelho"); // link de excluir
    excluir.href = "#excluir-item"; // abre o modal de confirmação
    excluir.dataset.acao = "excluir"; // marca que é o link de excluir
    excluir.dataset.item = item.id; // guarda de qual item ele é
    tdAcoes.appendChild(excluir); // coloca o link na célula
    tr.appendChild(tdAcoes); // coloca a célula na linha

    corpo.appendChild(tr); // coloca a linha pronta na tabela
  }); // fim do forEach

  const t = calcular(c); // calcula os valores da comanda
  $("c-sub").textContent = dinheiro(t.sub); // mostra o subtotal
  $("c-taxa-v").textContent = dinheiro(t.taxa); // mostra o valor da taxa
  $("c-total").textContent = dinheiro(t.total); // mostra o total
  $("c-total-btn").textContent = dinheiro(t.total); // mostra o total no botão de pagar
} // fim da função desenharComanda

function desenhar() { // atualiza a tela inteira de uma vez
  desenharMesas(); // atualiza o mapa de mesas
  desenharLista(); // atualiza a lista de comandas
  desenharComanda(); // atualiza a comanda selecionada
} // fim da função desenhar

// ---------- CLIQUES ----------
document.querySelector(".mesas").addEventListener("click", function (e) { // escuta cliques no mapa de mesas
  const a = e.target.closest("a.mesa"); // descobre qual mesa foi clicada
  if (!a) return; // se não clicou em uma mesa, sai
  const existente = comandas.find(function (c) { return c.mesa === a.dataset.mesa; }); // procura comanda aberta nessa mesa
  if (existente) { // se a mesa está ocupada...
    e.preventDefault(); // ...cancela a abertura do modal
    selecionadaId = existente.id; // ...seleciona a comanda dessa mesa
    desenhar(); // ...atualiza a tela
    location.hash = "#comanda"; // ...vai até a comanda
  } else { // se a mesa está livre...
    $("mesa").value = a.dataset.mesa; // ...já deixa a mesa escolhida no formulário
  } // fim do if/else
}); // fim do clique nas mesas

$("lista-comandas").addEventListener("click", function (e) { // escuta cliques na lista de comandas abertas
  const link = e.target.closest("a"); // descobre qual link foi clicado
  if (!link || !link.dataset.id) return; // se não for um link de comanda, sai
  selecionadaId = Number(link.dataset.id); // seleciona essa comanda (converte texto em número)
  desenhar(); // atualiza a tela
}); // fim do clique na lista

$("c-corpo").addEventListener("click", function (e) { // escuta cliques dentro da tabela de itens
  const botao = e.target.closest("[data-acao]"); // procura um botão/link com data-acao
  if (!botao) return; // se não clicou em um, sai
  const c = achar(selecionadaId); // pega a comanda atual
  const item = c.itens.find(function (i) { return i.id === Number(botao.dataset.item); }); // acha o item clicado
  if (botao.dataset.acao === "mais") { // se foi o botão +...
    item.qtd += 1; // ...aumenta a quantidade
  } else if (botao.dataset.acao === "menos") { // se foi o botão −...
    if (item.qtd > 1) item.qtd -= 1; // ...diminui, mas nunca abaixo de 1
  } else if (botao.dataset.acao === "excluir") { // se foi o link excluir...
    itemParaExcluir = item.id; // ...guarda qual item será excluído
    $("excluir-nome").textContent = item.nome; // ...mostra o nome no modal de confirmação
    return; // ...o link abre o modal sozinho, então sai sem redesenhar
  } // fim dos ifs
  salvar(); // grava a mudança
  desenhar(); // atualiza a tela
}); // fim do clique na tabela

$("c-taxa").addEventListener("change", function () { // quando marca/desmarca a taxa na comanda
  const c = achar(selecionadaId); // pega a comanda atual
  c.taxa = $("c-taxa").checked; // guarda se a taxa está ligada
  salvar(); // grava a mudança
  desenhar(); // atualiza os valores
}); // fim da taxa

// ---------- FORMULÁRIOS ----------
$("form-comanda").addEventListener("submit", function (e) { // quando clica em ABRIR no modal de nova comanda
  e.preventDefault(); // impede o comportamento padrão do formulário
  const mesa = $("mesa").value; // lê a mesa escolhida
  const cliente = $("cliente").value.trim(); // lê o cliente e tira espaços das pontas
  if (comandas.some(function (c) { return c.mesa === mesa; })) { // se já existe comanda nessa mesa...
    alert("Essa mesa já está ocupada."); // ...avisa o usuário
    return; // ...e não abre
  } // fim do if
  const nova = { // monta a nova comanda
    id: proximoId, // número da comanda
    mesa: mesa, // mesa escolhida
    cliente: cliente, // nome do cliente
    hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), // hora atual (ex.: 19:30)
    taxa: $("taxa").checked, // se a taxa de serviço está ligada
    itens: [] // começa sem nenhum item
  }; // fim do objeto
  proximoId += 1; // prepara o número da próxima comanda
  comandas.push(nova); // adiciona na lista de comandas abertas
  selecionadaId = nova.id; // já seleciona a comanda nova
  $("form-comanda").reset(); // limpa o formulário
  salvar(); // grava
  desenhar(); // atualiza a tela
  location.hash = "#comanda"; // fecha o modal e vai para a comanda
}); // fim do form-comanda

$("form-produto").addEventListener("submit", function (e) { // quando clica em Adicionar no modal de produto
  e.preventDefault(); // impede o comportamento padrão
  const c = achar(selecionadaId); // pega a comanda atual
  const opcao = $("a-item").selectedOptions[0]; // pega a opção escolhida no select
  const qtd = parseInt($("a-qtd").value, 10); // lê a quantidade como número inteiro
  if (!qtd || qtd < 1) { // se a quantidade é inválida...
    alert("Informe uma quantidade válida."); // ...avisa
    return; // ...e não adiciona
  } // fim do if
  c.itens.push({ // adiciona o item na comanda
    id: Date.now(), // id único baseado na hora atual
    nome: opcao.value, // nome do prato
    preco: Number(opcao.dataset.preco), // preço (vem do data-preco do HTML)
    qtd: qtd, // quantidade
    obs: $("a-obs").value.trim(), // observação para a cozinha
    status: "Pendente" // status inicial de produção
  }); // fim do item
  $("form-produto").reset(); // limpa o formulário
  salvar(); // grava
  desenhar(); // atualiza a tela
  location.hash = "#comanda"; // fecha o modal
}); // fim do form-produto

$("form-excluir").addEventListener("submit", function (e) { // quando confirma excluir o item
  e.preventDefault(); // impede o comportamento padrão
  const c = achar(selecionadaId); // pega a comanda atual
  c.itens = c.itens.filter(function (i) { return i.id !== itemParaExcluir; }); // mantém todos, menos o excluído
  salvar(); // grava
  desenhar(); // atualiza a tela
  location.hash = "#comanda"; // fecha o modal
}); // fim do form-excluir

$("form-cancelar").addEventListener("submit", function (e) { // quando confirma cancelar a comanda
  e.preventDefault(); // impede o comportamento padrão
  comandas = comandas.filter(function (c) { return c.id !== selecionadaId; }); // remove a comanda da lista
  selecionadaId = null; // nenhuma comanda fica selecionada
  salvar(); // grava
  desenhar(); // atualiza a tela (a mesa volta a ficar livre)
  location.hash = "#topo"; // fecha o modal
}); // fim do form-cancelar

// ---------- PAGAMENTO ----------
function valoresPagamento() { // calcula os valores mostrados no modal de pagamento
  const c = achar(selecionadaId); // pega a comanda atual
  const t = calcular(c); // calcula subtotal da comanda
  const taxa = $("p-taxa").checked ? t.sub * 0.1 : 0; // taxa de 10% só se estiver marcada
  let desconto = Number($("p-desc").value) || 0; // lê o desconto (se vazio, vira 0)
  if (desconto > t.sub + taxa) desconto = t.sub + taxa; // desconto não pode passar do total
  return { sub: t.sub, taxa: taxa, desconto: desconto, total: t.sub + taxa - desconto }; // devolve tudo junto
} // fim da função valoresPagamento

function mostrarPagamento() { // escreve os valores no modal de pagamento
  const v = valoresPagamento(); // calcula os valores
  $("p-sub").textContent = dinheiro(v.sub); // mostra o subtotal
  $("p-taxa-v").textContent = dinheiro(v.taxa); // mostra a taxa
  $("p-total").textContent = dinheiro(v.total); // mostra o total com desconto
} // fim da função mostrarPagamento

window.addEventListener("hashchange", function () { // roda toda vez que o endereço (#...) muda
  if (location.hash === "#pagamento") { // se abriu o modal de pagamento...
    if (!achar(selecionadaId)) { location.hash = "#topo"; return; } // ...sem comanda, volta ao topo
    $("p-taxa").checked = achar(selecionadaId).taxa; // ...copia a escolha da taxa
    $("p-desc").value = ""; // ...zera o desconto
    $("p-forma").value = ""; // ...zera a forma de pagamento
    mostrarPagamento(); // ...atualiza os valores
  } // fim do if
  if (location.hash === "#cancelar-comanda" && achar(selecionadaId)) { // se abriu o modal de cancelar...
    $("cancelar-id").textContent = numeroComanda(achar(selecionadaId)); // ...mostra o número da comanda
  } // fim do if
}); // fim do hashchange

$("p-taxa").addEventListener("change", mostrarPagamento); // marcar/desmarcar taxa recalcula o total
$("p-desc").addEventListener("input", mostrarPagamento); // digitar desconto recalcula o total

document.querySelector('a[href="#comprovante"]').addEventListener("click", function (e) { // clique em "Confirmar pagamento"
  const forma = $("p-forma").value; // lê a forma de pagamento
  if (!forma) { // se não escolheu...
    e.preventDefault(); // ...não deixa abrir o comprovante
    alert("Escolha a forma de pagamento."); // ...avisa
    return; // ...e sai
  } // fim do if
  const c = achar(selecionadaId); // pega a comanda atual
  const v = valoresPagamento(); // calcula os valores finais
  const agora = new Date(); // pega a data e hora de agora

  $("r-cmd").textContent = numeroComanda(c); // comprovante: número da comanda
  $("r-mesa").textContent = c.mesa; // comprovante: mesa
  $("r-cliente").textContent = c.cliente; // comprovante: cliente
  $("r-data").textContent = agora.toLocaleString("pt-BR"); // comprovante: data e hora
  const corpo = $("r-itens"); // tabela de itens do comprovante
  corpo.textContent = ""; // limpa itens antigos
  c.itens.forEach(function (item) { // para cada item da comanda...
    const tr = criar("tr"); // ...cria uma linha
    tr.appendChild(criar("td", item.nome)); // ...nome do item
    tr.appendChild(criar("td", String(item.qtd))); // ...quantidade
    tr.appendChild(criar("td", dinheiro(item.preco * item.qtd))); // ...total do item
    corpo.appendChild(tr); // ...coloca a linha na tabela
  }); // fim do forEach
  $("r-sub").textContent = dinheiro(v.sub); // comprovante: subtotal
  $("r-taxa").textContent = dinheiro(v.taxa); // comprovante: taxa
  $("r-desc-t").hidden = v.desconto === 0; // mostra o título "Desconto" só se houve desconto
  $("r-desc").hidden = v.desconto === 0; // mostra o valor do desconto só se houve
  $("r-desc").textContent = "- " + dinheiro(v.desconto); // comprovante: valor do desconto
  $("r-total").textContent = dinheiro(v.total); // comprovante: total pago
  $("r-forma").textContent = forma; // comprovante: forma de pagamento

  const historico = JSON.parse(localStorage.getItem(CHAVE_HISTORICO) || "[]"); // lê o histórico já guardado
  historico.push({ // adiciona esta venda no histórico
    comanda: numeroComanda(c), // número da comanda
    mesa: c.mesa, // mesa
    cliente: c.cliente, // cliente
    data: agora.toISOString(), // data e hora
    itens: c.itens, // itens vendidos
    total: v.total, // total pago
    forma: forma // forma de pagamento
  }); // fim da venda
  localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico)); // grava o histórico

  comandas = comandas.filter(function (x) { return x.id !== c.id; }); // remove a comanda paga das abertas
  selecionadaId = null; // nenhuma comanda selecionada
  salvar(); // grava
  desenhar(); // atualiza a tela (a mesa volta a ficar livre)
}); // fim do pagamento

// ---------- INÍCIO ----------
carregar(); // lê os dados guardados ao abrir a página
if (comandas.length > 0) selecionadaId = comandas[0].id; // se há comandas, já seleciona a primeira
if (location.hash) location.hash = "#topo"; // se a página abriu com um modal aberto, fecha
desenhar(); // desenha a tela pela primeira vez
