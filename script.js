/* ============================================
   Calculadora IMC — Projeto Virada 28 Dias
   script.js
   ============================================ */

const state = {
  sexo: 'F',
  atividade: null,
  objetivo: null,
  refeicoes: null,
  agua: null,
  sono: null
};

// Seletor de opções
function sel(btn) {
  state[btn.dataset.field] = btn.dataset.val;
  btn.closest('.selector').querySelectorAll('.sel-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// Accordion de perguntas opcionais
function toggleAccordion() {
  const t = document.getElementById('accToggle');
  const b = document.getElementById('accBody');
  t.classList.toggle('open');
  b.classList.toggle('open');
}

// Verifica se extras foram preenchidos
function hasExtras() {
  return state.atividade || state.objetivo || state.refeicoes || state.agua || state.sono;
}

// ===== CÁLCULO PRINCIPAL =====
function calcular() {
  let altura = parseFloat(document.getElementById('altura').value);
  const peso = parseFloat(document.getElementById('peso').value);
  const idade = parseInt(document.getElementById('idade').value);
  const sexo = state.sexo;

  if (!altura || !peso || !idade || peso < 20 || idade < 10) {
    const c = document.querySelector('#screenForm .card');
    c.classList.add('shake');
    setTimeout(() => c.classList.remove('shake'), 350);
    return;
  }

  // Auto-convert: se digitou 183 em vez de 1.83, converte cm → m
  if (altura > 3) altura = altura / 100;

  const imc = peso / (altura * altura);
  const imcR = Math.round(imc * 10) / 10;
  const extras = hasExtras();

  // Altura em cm para TMB
  const alturaCm = Math.round(altura * 100);

  // TMB (Mifflin-St Jeor)
  let tmb = sexo === 'M'
    ? 10 * peso + 6.25 * alturaCm - 5 * idade + 5
    : 10 * peso + 6.25 * alturaCm - 5 * idade - 161;

  const actMult = { sedentario: 1.2, leve: 1.375, moderado: 1.55, intenso: 1.725, atleta: 1.9 };
  const gasto = tmb * (actMult[state.atividade] || 1.2);

  // Categoria
  let cat, catName, color, colorRaw, refId, emoji, zoneKey;
  if (imc < 18.5) { cat = 'abaixo'; catName = 'Abaixo do peso'; color = 'var(--blue)'; colorRaw = '#3498DB'; refId = 'ref-abaixo'; emoji = '🍃'; zoneKey = 'abaixo'; }
  else if (imc < 25) { cat = 'normal'; catName = 'Peso normal'; color = 'var(--green)'; colorRaw = '#2ECC71'; refId = 'ref-normal'; emoji = '💚'; zoneKey = 'normal'; }
  else if (imc < 30) { cat = 'sobrepeso'; catName = 'Sobrepeso'; color = 'var(--yellow)'; colorRaw = '#F1C40F'; refId = 'ref-sobrepeso'; emoji = '⚡'; zoneKey = 'sobrepeso'; }
  else if (imc < 35) { cat = 'obes1'; catName = 'Obesidade grau I'; color = 'var(--primary)'; colorRaw = '#D6246E'; refId = 'ref-obes1'; emoji = '🎯'; zoneKey = 'obeso'; }
  else if (imc < 40) { cat = 'obes2'; catName = 'Obesidade grau II'; color = 'var(--red)'; colorRaw = '#E74C3C'; refId = 'ref-obes2'; emoji = '❤️‍🔥'; zoneKey = 'obeso'; }
  else { cat = 'obes3'; catName = 'Obesidade grau III'; color = '#AA1122'; colorRaw = '#AA1122'; refId = 'ref-obes3'; emoji = '🫀'; zoneKey = 'obeso'; }

  // Mostrar resultado
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
  document.getElementById('screenResult').classList.add('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // === RING GAUGE ===
  const maxArc = 395;
  const pct = Math.min(1, Math.max(0, (imc - 14) / (45 - 14)));
  const fillLen = pct * maxArc;

  const ringFill = document.getElementById('ringFill');
  ringFill.style.stroke = colorRaw;
  ringFill.setAttribute('stroke-dasharray', '0 560');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ringFill.setAttribute('stroke-dasharray', `${fillLen} 560`);
    });
  });

  // Glow
  document.getElementById('ringGlow').style.background = colorRaw;

  // Número animado
  const numEl = document.getElementById('rcNumber');
  numEl.style.color = colorRaw;
  numEl.classList.remove('count-up');
  void numEl.offsetWidth;
  numEl.classList.add('count-up');
  animateNumber(numEl, 0, imcR, 800);

  document.getElementById('rcCat').textContent = catName;
  document.getElementById('rcCat').style.color = colorRaw;

  // Barra linear
  const lgPct = Math.min(98, Math.max(2, ((imc - 14) / (44 - 14)) * 100));
  document.getElementById('lgThumb').style.left = lgPct + '%';

  // Legenda de zonas
  document.querySelectorAll('.zone-item').forEach(z => {
    z.classList.toggle('active-zone', z.dataset.zone === zoneKey);
  });

  // Peso ideal
  const piMin = Math.round(18.5 * altura * altura);
  const piMax = Math.round(24.9 * altura * altura);
  document.getElementById('resPesoIdeal').textContent = piMin + '–' + piMax;
  document.getElementById('resPesoIdealSub').textContent = 'kg (faixa saudável)';

  // Meta
  const piMid = Math.round((piMin + piMax) / 2);
  const diff = Math.round(peso - piMid);
  const metaEl = document.getElementById('resMeta');
  const metaSubEl = document.getElementById('resMetaSub');
  if (Math.abs(diff) <= 2) { metaEl.textContent = '✓ No alvo'; metaEl.style.color = 'var(--green)'; metaSubEl.textContent = 'Você está ótimo(a)!'; }
  else if (diff > 0) { metaEl.textContent = '-' + diff + ' kg'; metaEl.style.color = 'var(--primary)'; metaSubEl.textContent = 'para o centro da faixa ideal'; }
  else { metaEl.textContent = '+' + Math.abs(diff) + ' kg'; metaEl.style.color = 'var(--blue)'; metaSubEl.textContent = 'para o centro da faixa ideal'; }

  // Stats extras
  const extraGrid = document.getElementById('statsGridExtra');
  const profileCard = document.getElementById('profileCard');
  if (extras && state.atividade) {
    extraGrid.style.display = 'grid';
    document.getElementById('resTMB').textContent = Math.round(tmb);
    document.getElementById('resGasto').textContent = Math.round(gasto);
  } else {
    extraGrid.style.display = 'none';
  }

  // Perfil
  if (extras) {
    profileCard.style.display = 'block';
    const lb = {
      act: { sedentario: 'Nenhuma', leve: '1–2x/semana', moderado: '3–4x/semana', intenso: '5–6x/semana', atleta: 'Todo dia' },
      obj: { emagrecer: 'Emagrecer', manter: 'Manter peso', massa: 'Ganhar massa', saude: 'Mais saúde' },
      ref: { '1-2': '1 a 2', '3-4': '3 a 4', '5+': '5 ou mais' },
      agua: { pouca: 'Menos de 1L', media: '1 a 2L', boa: 'Mais de 2L' },
      sono: { ruim: 'Ruim', regular: 'Regular', bom: 'Bom' }
    };
    const rows = [
      ['Sexo', sexo === 'F' ? 'Feminino' : 'Masculino'],
      ['Idade', idade + ' anos'],
      ['Altura', altura.toFixed(2) + ' m'],
      ['Peso', Math.round(peso) + ' kg'],
    ];
    if (state.atividade) rows.push(['Academia/semana', lb.act[state.atividade]]);
    if (state.objetivo) rows.push(['Objetivo', lb.obj[state.objetivo]]);
    if (state.refeicoes) rows.push(['Refeições/dia', lb.ref[state.refeicoes]]);
    if (state.agua) rows.push(['Água/dia', lb.agua[state.agua]]);
    if (state.sono) rows.push(['Sono', lb.sono[state.sono]]);
    document.getElementById('profileRows').innerHTML = rows.map(([k, v]) => `<div class="profile-row"><span class="pr-key">${k}</span><span class="pr-val">${v}</span></div>`).join('');
  } else {
    profileCard.style.display = 'none';
  }

  // Tabela de referência
  document.querySelectorAll('.ref-row').forEach(r => r.classList.remove('highlight'));
  document.getElementById(refId).classList.add('highlight');

  // === DICAS PERSONALIZADAS ===
  const tips = [];

  if (cat === 'abaixo') {
    tips.push({ icon: '🥜', bg: 'var(--blue-dim)', text: '<strong>Aumente calorias de forma saudável:</strong> oleaginosas, abacate, azeite e granola. Priorize proteínas de qualidade em todas as refeições.' });
  } else if (cat === 'normal') {
    tips.push({ icon: '💚', bg: 'var(--green-dim)', text: '<strong>Parabéns, peso saudável!</strong> Continue com bons hábitos. Foque em qualidade de vida, força e energia no dia a dia.' });
  } else {
    const def = Math.round(gasto * 0.15);
    tips.push({ icon: '🎯', bg: 'var(--primary-glow)', text: `<strong>Déficit calórico sugerido:</strong> tente ~${Math.round(gasto - def)} kcal/dia (redução de ${def} kcal). Perda gradual e sustentável.` });
  }

  if (state.atividade === 'sedentario') tips.push({ icon: '🚶', bg: 'var(--yellow-dim)', text: '<strong>Você não vai pra academia?</strong> Comece com 30 min de caminhada diária. Nos 28 dias, tente incluir pelo menos 2–3 treinos por semana.' });
  else if (state.atividade === 'leve') tips.push({ icon: '🏋️', bg: 'var(--yellow-dim)', text: '<strong>1–2x na semana é um bom começo!</strong> Tente aumentar para 3–4x e combine treinos de força com cardio.' });
  else if (state.atividade === 'intenso' || state.atividade === 'atleta') tips.push({ icon: '⚡', bg: 'var(--green-dim)', text: '<strong>Frequência excelente!</strong> Foque em periodização e recuperação adequada. Sono + nutrição pós-treino são seus aliados.' });

  if (state.agua === 'pouca') tips.push({ icon: '💧', bg: 'var(--blue-dim)', text: `<strong>Beba mais água!</strong> Ideal: ~35ml/kg. Para você: <strong>${Math.round(peso * .035 * 10) / 10}L/dia</strong>.` });
  else if (state.agua === 'media') tips.push({ icon: '💧', bg: 'var(--blue-dim)', text: `<strong>Quase lá!</strong> Tente chegar a ${Math.round(peso * .035 * 10) / 10}L/dia. Água gelada antes das refeições ajuda na saciedade.` });

  if (state.refeicoes === '1-2') tips.push({ icon: '🍽️', bg: 'var(--red-dim)', text: '<strong>Poucas refeições!</strong> Comer a cada 3h mantém o metabolismo ativo e evita picos de fome.' });
  if (state.sono === 'ruim') tips.push({ icon: '😴', bg: 'var(--red-dim)', text: '<strong>Sono é fundamental!</strong> Dormir mal eleva cortisol, dificulta emagrecimento e reduz recuperação. Mire em 7-8h.' });

  if (state.objetivo === 'massa') tips.push({ icon: '💪', bg: 'var(--green-dim)', text: `<strong>Para ganhar massa:</strong> ~1.8g proteína/kg (${Math.round(peso * 1.8)}g/dia). Distribua em 4-5 refeições variadas.` });
  else if (state.objetivo === 'emagrecer' && cat === 'normal') tips.push({ icon: '✨', bg: 'var(--green-dim)', text: '<strong>IMC já saudável!</strong> Foque em recomposição: perder gordura + ganhar músculo com treino de força.' });

  if (!extras) {
    tips.push({ icon: '🎯', bg: 'var(--yellow-dim)', text: '<strong>Quer dicas mais detalhadas?</strong> Volte e preencha as perguntas opcionais para receber orientações sobre alimentação, água, sono e treino.' });
  }
  tips.push({ icon: '📱', bg: 'var(--primary-glow)', text: '<strong>Dica de ouro:</strong> siga @projetovirada28dias no Instagram para treinos, receitas e motivação diária!' });

  document.getElementById('tipsContent').innerHTML = tips.map(t =>
    `<div class="tip-item"><div class="tip-icon" style="background:${t.bg}">${t.icon}</div><div class="tip-text">${t.text}</div></div>`
  ).join('');

  // Motivação
  const motis = {
    abaixo: 'Ganhar peso saudável também é uma virada! Em 28 dias, com alimentação certa, você constrói um corpo mais forte. ' + emoji,
    normal: 'Você já está na faixa ideal — agora é hora de potencializar! 28 dias para ficar ainda melhor. ' + emoji,
    sobrepeso: 'A distância entre você e o seu melhor shape? 28 dias de foco e determinação. Bora?! ' + emoji,
    obes1: 'Cada grande transformação começa com uma decisão. Você já deu o primeiro passo. Agora é virar o jogo! ' + emoji,
    obes2: 'Não importa de onde você parte. Importa a direção. 28 dias podem ser o começo de uma nova vida. ' + emoji,
    obes3: 'A jornada mais importante é a que começa agora. Com acompanhamento e dedicação, você vai se surpreender. ' + emoji
  };
  document.getElementById('motiText').textContent = motis[cat];
}

// Animação de contagem
function animateNumber(el, from, to, duration) {
  const start = performance.now();
  const toFixed = Number.isInteger(to) ? 0 : 1;
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = from + (to - from) * ease;
    el.textContent = current.toFixed(toFixed);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = to.toFixed(toFixed);
  }
  requestAnimationFrame(tick);
}

// Recalcular
function recalcular() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
  document.getElementById('screenForm').classList.add('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Enter para calcular
document.querySelectorAll('#screenForm input[type="number"]').forEach(inp => {
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') calcular(); });
});
