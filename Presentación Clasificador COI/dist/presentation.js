(function presentationController() {
  "use strict";

  const chapterNames = {
    portada: "Portada",
    datos: "Preprocesamiento",
    grupo: "Rama de grupo",
    especie: "Rama de especie",
    decision: "Decisión final",
  };
  const baseNames = ["A", "C", "G", "T"];
  const poolWindows = [[2, 5], [4, 1]];
  // Ejemplos de validación que conserva el mapa general de la arquitectura.
  const examples = [
    ["Conocida", "Acrididae", "Acrida cinerea"],
    ["Especie nueva", "Aphididae", "especie desconocida"],
    ["Grupo nuevo", "grupo desconocido", "especie no evaluada"],
  ];
  const decisionExample = slides.find(slide => slide.kind === "decision-filter").example;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const page = document.getElementById("slide");
  const stage = document.getElementById("stage");
  const chapters = document.getElementById("chapters");
  const indexDialog = document.getElementById("index-dialog");
  const notesDialog = document.getElementById("notes-dialog");
  const fullscreen = document.getElementById("fullscreen");
  const announcement = document.getElementById("announcement");

  const connector = '<span class="connector" aria-hidden="true"></span>';
  let active = -1;
  let slideMotion;
  const sampleBases = ["A", "G", "T"];
  let adjustment = 0;
  let selectedWindow = 0;
  let selectedExample = 0;
  let architectureCase = 0;
  let architectureNode = "entrada";
  let architectureObserver;
  const architectureAccepted = ["entrada", "grupo", "cnn", "gru", "salida"];
  const architectureRejected = ["entrada", "grupo", "rechazo"];

  function safe(value) {
    const characters = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(value ?? "").replace(/[&<>"']/g, character => characters[character]);
  }

  function inlineText(value) {
    return safe(value)
      .replace(/`([^`]+)`/g, "<span class=\"formula\">$1</span>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^\s*](?:[^*]*[^\s*])?)\*/g, "<em>$1</em>");
  }

  function bulletList(items, className = "") {
    const bullets = items.map(value => {
      if (value?.calculation) {
        return `<li><span class="calculation-row">
          <span>${safe(value.label)}</span>
          <span aria-hidden="true">→</span>
          <span class="formula">${safe(value.calculation)}</span>
        </span></li>`;
      }
      return `<li>${inlineText(value)}</li>`;
    }).join("");
    const classAttribute = className ? ` class="${safe(className)}"` : "";
    return `<ul${classAttribute}>${bullets}</ul>`;
  }

  function labeledRow(label, value, extraClass = "") {
    const className = extraClass ? `labeled-row ${extraClass}` : "labeled-row";
    if (Array.isArray(value)) {
      return `<div class="${className} labeled-list"><strong class="row-label">${safe(label)}</strong>${bulletList(value)}</div>`;
    }
    if (value?.bullets) {
      const after = value.after ? `<p class="row-after">${inlineText(value.after)}</p>` : "";
      return `<div class="${className} labeled-list"><strong class="row-label">${safe(label)}</strong><div class="row-content"><p>${inlineText(value.text)}</p>${bulletList(value.bullets)}${after}</div></div>`;
    }
    if (value?.formula) {
      return `<div class="${className} labeled-formula"><strong class="row-label">${safe(label)}</strong><p class="formula">${inlineText(value.text)}</p></div>`;
    }
    return `<p class="${className}"><strong class="row-label">${safe(label)}</strong> <span>${inlineText(value)}</span></p>`;
  }

  function rows(items) {
    return items.map(item => {
      if (typeof item === "string") return `<p>${inlineText(item)}</p>`;
      if (item.bullets) return bulletList(item.bullets);
      if (item.table) return dataTable(item.table, item.tableClass ?? "label-table", item.caption);
      if (item.formula) return `<p class="formula">${inlineText(item.text)}</p>`;
      return labeledRow(item.label, item.text);
    }).join("");
  }

  function block(item, extra = "", options = {}) {
    const tone = item.chapter ? ` data-tone="${safe(item.chapter)}"` : "";
    const className = options.className ? ` ${options.className}` : "";
    const attributes = options.attributes ?? "";
    const steps = item.process ?? [];
    const [operation, ...details] = steps;
    const process = item.input && steps.length
      ? [{ label: "Proceso", text: operation }, ...details]
      : steps;
    const rowClass = item.alignLabels ? "block-rows block-rows-aligned" : "block-rows";
    return `<section class="block${className}"${tone}${attributes}>
      <h2>${safe(item.title)}</h2>
      <div class="${rowClass}">
        ${item.input ? labeledRow("Entrada", item.input) : ""}
        ${process.length ? `<div class="block-process">${rows(process)}</div>` : ""}
        ${extra}
        ${item.output ? labeledRow("Salida", item.output, "block-output") : ""}
      </div>
    </section>`;
  }

  function dataTable(data, className, caption) {
    const [header, ...body] = data;
    return `<div class="table-wrapper">
      <table class="${className}">
        <caption class="sr-only">${safe(caption)}</caption>
        <thead><tr>${header.map(value => `<th scope="col">${safe(value)}</th>`).join("")}</tr></thead>
        <tbody>${body.map(([label, ...cells]) =>
          `<tr><th scope="row">${safe(label)}</th>${cells.map(value => {
            const highlight = className === "matrix" && value === "1" ? ' class="one"' : "";
            return `<td${highlight}>${safe(value)}</td>`;
          }).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>`;
  }

  function flow(model, rightExtra = "") {
    return `<div class="flow">
      ${block(model.blocks[0])}${connector}${block(model.blocks[1], rightExtra)}
    </div>`;
  }

  function tableSlide(model) {
    const kind = model.tableClass ?? (model.chapter === "datos" ? "dataset-table" : "example-table");
    const columns = model.equalColumns ? " table-flow-balanced" : "";
    return `<div class="table-flow${columns}">
      ${block(model.blocks[0])}
      ${block(model.blocks[1], dataTable(model.table, kind, model.blocks[1].title))}
    </div>`;
  }

  function fork(join = false) {
    return `<span class="fork${join ? " fork-join" : ""}" aria-hidden="true"><i></i><i></i><i></i></span>`;
  }

  function branch(model, routing = false) {
    const lane = (item, choice) => block(item, routing ? '<span class="route-state"></span>' : "", {
      className: routing ? "route-lane" : "",
      attributes: routing ? ` data-lane="${choice}"` : "",
    });
    return `<div class="branch-flow">
      ${block(model.blocks[0], "", { className: "source-node" })}
      ${fork()}
      <div class="branch-lanes">
        ${lane(model.blocks[1], "catalogue")}
        ${lane(model.blocks[2], "unknown")}
      </div>
    </div>`;
  }

  function merge(model) {
    return `<div class="merge-flow">
      ${block(model.blocks[0], "", { className: "source-node" })}
      ${fork()}
      <div class="branch-lanes">
        ${block(model.blocks[1])}
        ${block(model.blocks[2])}
      </div>
      ${fork(true)}
      ${block(model.blocks[3], "", { className: "source-node" })}
    </div>`;
  }

  function oneHotMatrix() {
    const header = ["Base", ...sampleBases.map((_, index) => index + 1)];
    const channels = baseNames.map(base => [base, ...sampleBases.map(letter => letter === base ? "1" : "0")]);
    return dataTable([header, ...channels], "matrix", "Matriz one-hot de las tres primeras posiciones");
  }

  function oneHot(model) {
    const selectors = sampleBases.map((base, index) => `<label class="base-input">
      <span>Posición ${index + 1}</span>
      <select data-base="${index}" aria-label="Base en la posición ${index + 1}">
        ${baseNames.map(value => `<option${value === base ? " selected" : ""}>${value}</option>`).join("")}
      </select>
    </label>`).join("");
    return `<div class="one-hot-flow">
      ${block(model.blocks[0], `<div class="base-selectors">${selectors}</div>`)}
      ${connector}
      ${block(model.blocks[1], `<div id="one-hot-matrix" class="one-hot-matrix">${oneHotMatrix()}</div>`)}
    </div>`;
  }

  function rejectionReadout() {
    const best = 92;
    const unknown = best + adjustment;
    const chosen = unknown > best ? "Grupo desconocido" : "Grupo del catálogo";
    const sign = adjustment > 0 ? "+" : adjustment < 0 ? "−" : "";
    return `<span>Δ = <strong>${sign}${Math.abs(adjustment)}</strong></span>
      <span>m + Δ = <strong>${unknown}</strong></span>
      <strong class="verdict">${chosen}</strong>`;
  }

  function rejection(model) {
    return flow(model, `<div class="demo rejection-demo">
      <label for="rejection-adjustment">Variá Δ para ver qué categoría gana.</label>
      <input id="rejection-adjustment" type="range" min="-8" max="8" step="1" value="${adjustment}" />
      <output class="rejection-readout" id="rejection-readout" for="rejection-adjustment" aria-live="polite">${rejectionReadout()}</output>
    </div>`);
  }

  function poolReadout() {
    const [left, right] = poolWindows[selectedWindow];
    return `max(${left}, ${right}) = ${Math.max(left, right)}`;
  }

  function pool(model) {
    const windows = poolWindows.map((values, index) => `<button class="window-control" type="button"
      data-action="pool" data-value="${index}" aria-label="Ventana ${index + 1}, valores ${values.join(' y ')}"
      aria-pressed="${index === selectedWindow}">
      ${values.map(value => `<span>${value}</span>`).join("")}
    </button>`).join("");
    return flow(model, `<div class="demo pool-demo">
      <p>Elegí una ventana de dos valores.</p>
      <div class="pool-controls">${windows}
        <output class="pool-output" id="pool-output" aria-live="polite">${poolReadout()}</output>
      </div>
    </div>`);
  }

  function route(model) {
    const options = examples.map(([name], index) =>
      `<button class="scenario" type="button" data-action="scenario" data-value="${index}" aria-pressed="${index === selectedExample}">${safe(name)}</button>`).join("");
    return `${branch(model, true)}
      <div class="route-demo">
        <div class="scenario-buttons" role="group" aria-label="Ejemplos de validación">${options}</div>
        <output id="route-result" aria-live="polite"></output>
      </div>`;
  }

  function updateScenario() {
    const rejected = selectedExample === examples.length - 1;
    for (const lane of page.querySelectorAll(".route-lane")) {
      const selected = (lane.dataset.lane === "unknown") === rejected;
      lane.toggleAttribute("data-active", selected);
      lane.querySelector(".route-state").textContent = selected ? "Camino del ejemplo" : "";
    }
    for (const option of page.querySelectorAll(".scenario")) {
      option.setAttribute("aria-pressed", Number(option.dataset.value) === selectedExample);
    }
    const [, group, species] = examples[selectedExample];
    document.getElementById("route-result").textContent = `${group} · ${species}`;
  }

  function cover(model) {
    const sample = ["A", "G", "T", "C", "C", "A", "T", "G", "T", "A"];
    const map = baseNames.map(base => `<div class="cover-matrix-row">
      <span>${base}</span>${sample.map(value =>
        `<i class="${value === base ? "is-on" : ""}"></i>`).join("")}
    </div>`).join("");
    return `<div class="cover-layout">
      <div class="cover-copy">
        <p class="subject">Inteligencia Artificial 2026 / Trabajo final</p>
        <h1 id="slide-heading" tabindex="-1">${safe(model.title)}</h1>
        <p class="cover-lead">${safe(model.intro)}</p>
      </div>
      <div class="cover-diagram" role="group" aria-label="Del fragmento COI a la clasificación de grupo y especie">
        <figure class="cover-sequence">
          <figcaption>Fragmento COI <code>4 × 540</code></figcaption>
          <div class="cover-matrix" role="img" aria-label="Detalle del one-hot, con cuatro canales de bases y un canal activo por posición">${map}</div>
        </figure>
        <svg class="cover-fork" viewBox="0 0 480 30" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M240 0V12M116 30V12H364V30" />
        </svg>
        <div class="cover-lanes">
          <section class="cover-route" data-tone="grupo" aria-labelledby="cover-group-title">
            <h2 id="cover-group-title">Grupo</h2>
            <p class="cover-route-method">Perfiles + rechazo</p>
            <svg class="cover-model-sketch" viewBox="0 0 220 76" aria-hidden="true" focusable="false">
              <g class="sketch-muted">
                <rect x="6" y="11" width="89" height="15" rx="3" />
                <rect x="6" y="31" width="89" height="15" rx="3" />
                <rect x="6" y="51" width="89" height="15" rx="3" />
              </g>
              <g class="sketch-cells">
                <rect x="11" y="15" width="11" height="7" rx="1" />
                <rect x="42" y="15" width="11" height="7" rx="1" />
                <rect x="73" y="15" width="11" height="7" rx="1" />
                <rect x="27" y="35" width="11" height="7" rx="1" />
                <rect x="57" y="35" width="11" height="7" rx="1" />
                <rect x="11" y="55" width="11" height="7" rx="1" />
                <rect x="57" y="55" width="11" height="7" rx="1" />
              </g>
              <path class="sketch-wire" d="M104 38H128M122 32L128 38L122 44" />
              <path class="sketch-baseline" d="M144 66H212" />
              <g class="sketch-bars">
                <rect x="148" y="37" width="10" height="29" rx="2" />
                <rect x="165" y="13" width="10" height="53" rx="2" />
                <rect x="182" y="45" width="10" height="21" rx="2" />
                <rect x="199" y="27" width="10" height="39" rx="2" />
              </g>
            </svg>
            <p class="cover-route-count">149 puntajes</p>
          </section>
          <section class="cover-route" data-tone="especie" aria-labelledby="cover-species-title">
            <h2 id="cover-species-title">Especie</h2>
            <p class="cover-route-method">CNN + GRU</p>
            <svg class="cover-model-sketch" viewBox="0 0 220 76" aria-hidden="true" focusable="false">
              <g class="sketch-planes">
                <rect x="6" y="23" width="22" height="43" rx="3" />
                <rect x="17" y="16" width="22" height="43" rx="3" />
                <rect x="28" y="9" width="22" height="43" rx="3" />
              </g>
              <path class="sketch-wire" d="M59 38H75M69 32L75 38L69 44M103 38H120M114 32L120 38L114 44M149 38H168M162 32L168 38L162 44" />
              <g class="sketch-states">
                <rect x="77" y="25" width="26" height="26" rx="7" />
                <rect x="123" y="25" width="26" height="26" rx="7" />
              </g>
              <path class="sketch-wire" d="M84 25V17C84 5 98 5 98 17V25M91 19L98 25L104 19M130 25V17C130 5 144 5 144 17V25M137 19L144 25L150 19" />
              <g class="sketch-bars">
                <rect x="178" y="34" width="8" height="32" rx="2" />
                <rect x="190" y="13" width="8" height="53" rx="2" />
                <rect x="202" y="44" width="8" height="22" rx="2" />
              </g>
              <path class="sketch-baseline" d="M174 66H214" />
            </svg>
            <p class="cover-route-count">11.024 categorías</p>
          </section>
        </div>
        <svg class="cover-join" data-tone="decision" viewBox="0 0 480 30" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M116 0V12H364V0M240 12V30M236 25L240 30L244 25" />
        </svg>
        <div class="cover-result" data-tone="decision">
          <div><p class="cover-result-label">Decisión final</p><p class="cover-result-title">Filtro por grupo</p></div>
          <p class="cover-result-output">Grupo + especie</p>
        </div>
      </div>
    </div>`;
  }

  function architecturePath() {
    return architectureCase === 2 ? architectureRejected : architectureAccepted;
  }

  function architectureDetails(model, nodeId = architectureNode) {
    const node = model.nodes[nodeId];
    const currentPath = architecturePath();
    const path = currentPath.includes(nodeId) ? currentPath : nodeId === "rechazo" ? architectureRejected : architectureAccepted;
    return `<p class="architecture-step">Bloque ${path.indexOf(nodeId) + 1} de ${path.length}</p>
      <h2 id="architecture-detail-heading-${nodeId}">${safe(node.title)}</h2>
      <p class="architecture-shape">${safe(node.detailShape)}</p>
      ${bulletList(node.details, "architecture-points")}`;
  }

  function architecture(model) {
    const arrow = '<span class="architecture-arrow" aria-hidden="true">→</span>';
    const node = id => `<button class="architecture-node" type="button" data-action="architecture-node"
      data-node="${id}" data-tone="${model.nodes[id].tone}" aria-pressed="false" aria-controls="architecture-details">
      <strong>${safe(model.nodes[id].label)}</strong><span>${safe(model.nodes[id].shape)}</span>
    </button>`;
    return `<div class="architecture-explorer">
      <div class="architecture-cases" role="group" aria-label="Recorrido según el caso de la secuencia">
        ${model.cases.map((label, index) => `<button type="button" class="architecture-case"
          data-action="architecture-case" data-value="${index}" aria-pressed="false">${safe(label)}</button>`).join("")}
      </div>
      <div class="architecture-layout">
        <section class="architecture-board" aria-label="Mapa de la clasificación por grupo y especie">
          <p class="architecture-input-note">La CNN recibe el <strong>one-hot original</strong>. El grupo elegido se usa en el <strong>filtro final</strong>.</p>
          <div class="architecture-scroll" role="region" aria-label="Diagrama de arquitectura" tabindex="0">
            <div class="architecture-canvas">
              <div class="architecture-graph">
                <div class="architecture-trunk">${node("entrada")}${arrow}${node("grupo")}</div>
                <span class="architecture-split" aria-hidden="true"></span>
                <div class="architecture-paths">
                  <div class="architecture-path" data-path="accepted">
                    <p>Grupo conocido → evaluar especie</p>
                    <div class="architecture-stages">${node("cnn")}${arrow}${node("gru")}${arrow}${node("salida")}</div>
                  </div>
                  <div class="architecture-path" data-path="rejected">
                    <p>Grupo desconocido → especie no evaluada</p>${node("rechazo")}
                  </div>
                </div>
                <span class="architecture-join-space" aria-hidden="true"></span>
                <section class="architecture-final" data-tone="decision" aria-labelledby="architecture-final-heading">
                  <h2 id="architecture-final-heading">Respuesta final: grupo + especie</h2>
                  <output class="architecture-result" id="architecture-result" aria-live="polite"></output>
                </section>
              </div>
              <svg class="architecture-connections" aria-hidden="true" focusable="false">
                <defs>
                  <marker id="architecture-final-arrow-active" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L8 4 L0 8 Z" class="architecture-arrow-active"/></marker>
                  <marker id="architecture-final-arrow-muted" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L8 4 L0 8 Z" class="architecture-arrow-muted"/></marker>
                </defs>
                <path class="architecture-final-link" data-route="accepted"/>
                <path class="architecture-final-link" data-route="rejected"/>
              </svg>
            </div>
          </div>
        </section>
        <aside class="architecture-inspector" aria-labelledby="architecture-detail-heading-${architectureNode}" data-tone="datos">
          <div id="architecture-details" aria-live="polite" aria-atomic="true">${Object.keys(model.nodes).map(nodeId => `
            <div class="architecture-detail-panel" data-detail-node="${nodeId}" aria-hidden="true">${architectureDetails(model, nodeId)}</div>
          `).join("")}</div>
          <div class="architecture-controls" role="group" aria-label="Recorrer los bloques del mapa">
            <button type="button" data-action="architecture-previous" aria-label="Bloque anterior" title="Bloque anterior">←</button>
            <button type="button" data-action="architecture-next">Bloque siguiente <span aria-hidden="true">→</span></button>
          </div>
        </aside>
      </div>
    </div>`;
  }

  function updateArchitecture() {
    const model = slides[active];
    const path = architecturePath();
    for (const node of page.querySelectorAll(".architecture-node")) {
      const reachable = path.includes(node.dataset.node);
      node.disabled = !reachable;
      node.toggleAttribute("data-in-route", reachable);
      node.setAttribute("aria-pressed", node.dataset.node === architectureNode);
    }
    for (const option of page.querySelectorAll(".architecture-case")) {
      option.setAttribute("aria-pressed", Number(option.dataset.value) === architectureCase);
    }
    for (const lane of page.querySelectorAll(".architecture-path")) {
      lane.toggleAttribute("data-active", (lane.dataset.path === "rejected") === (architectureCase === 2));
    }
    const inspector = page.querySelector(".architecture-inspector");
    inspector.dataset.tone = model.nodes[architectureNode].tone;
    inspector.setAttribute("aria-labelledby", `architecture-detail-heading-${architectureNode}`);
    for (const panel of page.querySelectorAll(".architecture-detail-panel")) {
      const nodeId = panel.dataset.detailNode;
      const selected = nodeId === architectureNode;
      const panelPath = path.includes(nodeId) ? path : nodeId === "rechazo" ? architectureRejected : architectureAccepted;
      panel.toggleAttribute("data-active", selected);
      panel.setAttribute("aria-hidden", !selected);
      panel.querySelector(".architecture-step").textContent = `Bloque ${panelPath.indexOf(nodeId) + 1} de ${panelPath.length}`;
    }
    const step = path.indexOf(architectureNode);
    page.querySelector('[data-action="architecture-previous"]').disabled = step === 0;
    page.querySelector('[data-action="architecture-next"]').disabled = step === path.length - 1;
    const [, group, species] = examples[architectureCase];
    document.getElementById("architecture-result").innerHTML = `<strong>${safe(group)}</strong><span class="architecture-result-divider" aria-hidden="true">/</span>
      <span class="architecture-result-species">${architectureCase === 0 ? `<em>${safe(species)}</em>` : safe(species)}</span>`;
    drawArchitectureConnections();
  }

  function drawArchitectureConnections() {
    const canvas = page.querySelector(".architecture-canvas");
    if (!canvas) return;
    const svg = canvas.querySelector(".architecture-connections");
    const origin = canvas.getBoundingClientRect();
    const x0 = origin.left + canvas.clientLeft;
    const y0 = origin.top + canvas.clientTop;
    const accepted = canvas.querySelector('[data-node="salida"]').getBoundingClientRect();
    const rejected = canvas.querySelector('[data-node="rechazo"]').getBoundingClientRect();
    const final = canvas.querySelector(".architecture-final").getBoundingClientRect();
    const channel = final.left - x0 - 18;
    svg.setAttribute("viewBox", `0 0 ${canvas.clientWidth} ${canvas.clientHeight}`);
    const routes = {
      accepted: `M ${accepted.right - x0} ${accepted.top + accepted.height / 2 - y0} H ${channel} V ${final.top + final.height * .35 - y0} H ${final.left - x0}`,
      rejected: `M ${rejected.right - x0} ${rejected.top + rejected.height / 2 - y0} H ${channel} V ${final.top + final.height * .65 - y0} H ${final.left - x0}`,
    };
    for (const [route, d] of Object.entries(routes)) {
      const link = svg.querySelector(`[data-route="${route}"]`);
      const activeRoute = (route === "rejected") === (architectureCase === 2);
      link.setAttribute("d", d);
      link.toggleAttribute("data-active", activeRoute);
      link.setAttribute("marker-end", `url(#architecture-final-arrow-${activeRoute ? "active" : "muted"})`);
    }
  }

  function observeArchitectureConnections() {
    architectureObserver = new ResizeObserver(drawArchitectureConnections);
    for (const element of page.querySelectorAll('.architecture-canvas, .architecture-final, .architecture-node[data-node="salida"], .architecture-node[data-node="rechazo"]')) {
      architectureObserver.observe(element);
    }
  }

  function stepArchitecture(direction) {
    const path = architecturePath();
    const step = Math.max(0, Math.min(path.length - 1, path.indexOf(architectureNode) + direction));
    const focusedControl = document.activeElement;
    architectureNode = path[step];
    updateArchitecture();
    if (focusedControl.disabled) page.querySelector('.architecture-node[aria-pressed="true"]').focus({ preventScroll: true });
  }

  function decisionName(candidate) {
    return candidate.latin ? `<em>${safe(candidate.name)}</em>` : safe(candidate.name);
  }

  function decisionFilter(model) {
    const example = model.example;
    const filtered = example.candidates.map(candidate => candidate.group === example.group ? candidate.score : "−∞");
    return `<div class="decision-layout decision-filter-layout">
      <section class="block decision-card">
        <h2>Qué recibe y hace el filtro</h2>
        <div class="decision-inputs">
          <div class="decision-source"><span>Desde la rama de grupo</span><strong>${safe(example.group)}</strong><small>Grupo elegido</small></div>
          <div class="decision-source"><span>Desde la rama de especie</span><strong>11.024 puntajes</strong><small>Vector sin normalizar</small></div>
        </div>
        <div class="decision-down" aria-hidden="true">↓</div>
        <h3>Máscara por grupo</h3>
        ${bulletList([
          "Consulta el grupo de cada categoría de especie.",
          `Conserva las especies de **${example.group}** y su opción **«especie desconocida»**.`,
          "Al resto le asigna **−∞**, para que se ignore al buscar el mayor puntaje.",
        ], "decision-points")}
      </section>
      <section class="block decision-card">
        <h2>El filtro en un ejemplo reducido</h2>
        <p class="decision-example-scope">${safe(example.scope)}</p>
        <div class="decision-table-scroll" role="region" aria-label="Puntajes antes y después del filtro" tabindex="0">
          <table class="decision-table decision-filter-table">
            <caption class="sr-only">El grupo elegido es ${safe(example.group)}. Las categorías de otros grupos se reemplazan por menos infinito.</caption>
            <thead><tr><th scope="col">Categoría de especie</th><th scope="col">Grupo</th><th scope="col">Antes</th><th scope="col">Después</th></tr></thead>
            <tbody>${example.candidates.map((candidate, index) => `<tr${candidate.group === example.group ? "" : ' class="decision-excluded"'}>
              <th scope="row">${decisionName(candidate)}</th><td>${safe(candidate.group)}</td>
              <td class="decision-number" data-before-score="${candidate.score}">${candidate.score}</td>
              <td class="decision-number" data-after-score="${filtered[index]}"><strong>${filtered[index]}</strong>${candidate.group === example.group ? "" : "<small>Se ignora</small>"}</td>
            </tr>`).join("")}</tbody>
          </table>
        </div>
        <div class="decision-handoff"><span>Vector filtrado del ejemplo</span><strong class="formula">[${filtered.join(", ")}]</strong></div>
        <p class="decision-example-note">El puntaje 6 queda excluido porque pertenece a otro grupo.</p>
      </section>
    </div>`;
  }

  function decisionAnswer() {
    const example = decisionExample;
    const candidates = example.candidates.filter(candidate => candidate.group === example.group);
    const winner = candidates.reduce((best, candidate) => candidate.score > best.score ? candidate : best);
    const maximum = winner.score;
    const exponents = candidates.map(candidate => Math.exp(candidate.score - maximum));
    const denominator = exponents.reduce((sum, value) => sum + value, 0);
    const probabilities = exponents.map(value => value / denominator);
    const percent = new Intl.NumberFormat("es-AR", {
      style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1,
    });
    const winnerIndex = candidates.indexOf(winner);
    return `<div class="decision-layout decision-answer-layout">
      <section class="block decision-card">
        <h2>Elegir y expresar probabilidades</h2>
        <ol class="decision-steps">
          <li>El mayor puntaje permitido es <strong>${winner.score}</strong>: se elige <strong>${decisionName(winner)}</strong>.</li>
          <li>Softmax convierte los puntajes permitidos <span class="formula">[${candidates.map(candidate => candidate.score).join(", ")}]</span> en probabilidades de pertenencia.</li>
        </ol>
        <div class="decision-table-scroll" role="region" aria-label="Probabilidades de las categorías permitidas" tabindex="0">
          <table class="decision-table decision-probability-table">
            <caption class="sr-only">Probabilidades del mismo ejemplo reducido, redondeadas a un decimal.</caption>
            <thead><tr><th scope="col">Categoría permitida</th><th scope="col">Probabilidad de pertenencia</th></tr></thead>
            <tbody>${candidates.map((candidate, index) => `<tr${candidate === winner ? ' class="decision-winner"' : ""}>
              <th scope="row">${decisionName(candidate)}</th><td class="decision-number" data-probability="${probabilities[index]}">${percent.format(probabilities[index])}</td>
            </tr>`).join("")}</tbody>
          </table>
        </div>
        <div class="decision-equation" role="math" aria-label="La probabilidad de Acrida cinerea es exp de 4 dividido por la suma de exp de 4, exp de 3 y exp de 2; aproximadamente 66,5 por ciento.">
          <span>P(${decisionName(winner)}) =</span>
          <span class="decision-calculation">
            <span class="decision-fraction"><span>exp(${winner.score})</span><span>${candidates.map(candidate => `exp(${candidate.score})`).join(" + ")}</span></span>
            <span>≈ ${percent.format(probabilities[winnerIndex])}</span>
          </span>
        </div>
      </section>
      <section class="block decision-card">
        <h2>Respuesta de clasificar_secuencia</h2>
        <p class="decision-description">La función devuelve un diccionario con estos cuatro campos:</p>
        <dl class="decision-fields">
          <div><dt>grupo</dt><dd><strong>${safe(example.group)}</strong></dd></div>
          <div><dt>especie</dt><dd><strong>${decisionName(winner)}</strong></dd></div>
          <div><dt>puntajes_grupo</dt><dd>149 probabilidades de pertenencia, una por categoría de grupo.</dd></div>
          <div><dt>puntajes_especie</dt><dd>Las tres probabilidades de pertenencia de la tabla del ejemplo.</dd></div>
        </dl>
        <p class="decision-field-note">Las dos series de pandas se indexan por los nombres de las categorías.</p>
      </section>
    </div>`;
  }

  function decisionMatrix(model) {
    const number = new Intl.NumberFormat("es-AR");
    const percent = new Intl.NumberFormat("es-AR", {
      style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1,
    });
    return `<div class="final-matrix-layout">
      <div class="final-matrix-scroll" role="region" aria-label="Matriz de decisiones de validación V14" tabindex="0">
        <table class="final-decision-matrix">
          <caption class="sr-only">Tipo de respuesta por caso real, en conteos y porcentajes de cada fila.</caption>
          <thead><tr><th scope="col">Caso real</th>${model.columns.map(label => `<th scope="col">${safe(label)}</th>`).join("")}</tr></thead>
          <tbody>${model.rows.map((row, rowIndex) => {
            const total = row.counts.reduce((sum, value) => sum + value, 0);
            return `<tr><th scope="row">${safe(row.label)}</th>${row.counts.map((value, column) => `<td${rowIndex === column ? ' class="final-matrix-diagonal"' : ""} data-count="${value}">
              <strong>${number.format(value)}</strong><span>${percent.format(value / total)}</span>
            </td>`).join("")}</tr>`;
          }).join("")}</tbody>
        </table>
      </div>
    </div>`;
  }

  function results(model) {
    const percent = new Intl.NumberFormat("es-AR", {
      style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
    const bar = (value, label, groupOnly = false) => `<div class="results-bar-row">
      <span class="results-bar-label">${safe(label)}</span>
      <span class="results-track" aria-hidden="true"><i${groupOnly ? ' class="results-group-only"' : ""} style="--rate:${value * 100}%"></i></span>
      <b>${percent.format(value)}</b>
    </div>`;
    return `<div class="results-layout">
      <div class="results-rates">${model.rates.map(item => `<section class="results-case">
        <h2>${safe(item.title)}</h2>
        ${item.group === null ? "" : bar(item.group, "Grupo correcto", true)}
        ${bar(item.response, item.label)}
      </section>`).join("")}</div>
      <aside class="results-metrics" aria-label="Indicadores generales">${model.metrics.map(item => `<div>
        <strong>${percent.format(item.value)}</strong><p>${safe(item.label)}</p>
      </div>`).join("")}</aside>
    </div>`;
  }

  const layouts = {
    "decision-matrix": decisionMatrix,
    "decision-filter": decisionFilter,
    "decision-answer": decisionAnswer,
    architecture,
    results,
    table: tableSlide,
    onehot: oneHot,
    parallel: model => `<div class="parallel">${model.blocks.map(item => block(item)).join("")}</div>`,
    branch,
    merge,
    rejection,
    pool,
    route,
    flow,
  };

  function slideView(model) {
    if (model.kind === "cover") return cover(model);
    const summary = Array.isArray(model.summary)
      ? `<div class="block-process">${rows(model.summary)}</div>`
      : safe(model.summary);
    const caption = model.caption
      ? `<div class="caption">${rows(Array.isArray(model.caption) ? model.caption : [model.caption])}</div>`
      : "";
    return `<div class="slide-heading">
      <p class="chapter-name">${chapterNames[model.chapter]}</p>
      <h1 id="slide-heading" tabindex="-1">${safe(model.title)}</h1>
      ${model.intro ? `<p class="lead">${inlineText(model.intro)}</p>` : ""}
      ${model.introBullets ? bulletList(model.introBullets, "lead lead-bullets") : ""}
    </div>
    ${layouts[model.kind](model)}
    ${caption}
    ${model.summary ? `<aside class="caption slide-summary" aria-label="Conclusión">${summary}</aside>` : ""}`;
  }

  function show(index, { changeHistory = true, focus = false } = {}) {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    if (clamped === active) return;
    architectureObserver?.disconnect();

    const model = slides[clamped];
    const wasOnSlide = page.contains(document.activeElement);
    const direction = clamped > active ? 1 : -1;
    const alreadyOpen = active >= 0;
    active = clamped;

    page.dataset.chapter = model.chapter;
    page.dataset.layout = model.kind;
    page.innerHTML = slideView(model);
    stage.dataset.chapter = model.chapter;
    stage.scrollTop = 0;
    if (model.kind === "route") updateScenario();
    if (model.kind === "architecture") {
      updateArchitecture();
      observeArchitectureConnections();
    }

    for (const tab of chapters.querySelectorAll("button")) {
      if (tab.dataset.chapter === model.chapter) tab.setAttribute("aria-current", "step");
      else tab.removeAttribute("aria-current");
    }
    const pageNumber = active + 1;
    document.getElementById("page-count").textContent = `${String(pageNumber).padStart(2, "0")} / ${slides.length}`;
    document.getElementById("progress").value = pageNumber;
    document.title = `Presentación Clasificador COI · ${model.title}`;
    if (changeHistory) history.pushState(null, "", `#${pageNumber}`);
    if (focus || wasOnSlide) {
      page.querySelector("h1").focus({ preventScroll: true });
    } else {
      announcement.textContent = `Diapositiva ${pageNumber} de ${slides.length}. ${model.title}`;
    }

    slideMotion?.cancel();
    if (alreadyOpen && !reducedMotion.matches) {
      slideMotion = page.animate([
        { opacity: 0, transform: `translateX(${direction * 26}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ], { duration: 240, easing: "cubic-bezier(.2,.75,.25,1)" });
    }
  }

  function openIndex() {
    const groups = Object.entries(chapterNames).map(([key, label]) => {
      const items = slides.flatMap((slide, index) => slide.chapter === key ? [{ slide, index }] : []);
      return `<section class="index-group">
        <h3>${label}</h3>
        <ul>${items.map(({ slide, index }) => `<li>
          <button class="index-item" type="button" data-action="jump" data-value="${index}"${index === active ? ' aria-current="page"' : ""}>
            <span>${String(index + 1).padStart(2, "0")}</span> ${safe(slide.title)}
          </button>
        </li>`).join("")}</ul>
      </section>`;
    });
    document.getElementById("index-content").innerHTML = groups.join("");
    indexDialog.showModal();
    indexDialog.querySelector('[aria-current="page"]').focus();
  }

  function openNotes() {
    const model = slides[active];
    document.getElementById("notes-content").innerHTML = `<h3>${safe(model.title)}</h3>
      <p>${safe(model.notes)}</p>
      ${model.source ? `<p class="note-source">Notebook COI V14 AMD, ${safe(model.source)}.</p>` : ""}`;
    notesDialog.showModal();
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      announcement.textContent = "Para usar pantalla completa, abrí la presentación en tu navegador y pulsá F11.";
      const hint = document.getElementById("fullscreen-hint");
      if (hint) hint.remove();
      const message = document.createElement("p");
      message.id = "fullscreen-hint";
      message.className = "fullscreen-hint";
      message.textContent = "Abrí la presentación en tu navegador y pulsá F11.";
      fullscreen.after(message);
      window.setTimeout(() => message.remove(), 4200);
    }
  }

  function selectPool(button) {
    selectedWindow = Number(button.dataset.value);
    for (const item of page.querySelectorAll(".window-control")) {
      item.setAttribute("aria-pressed", item === button);
    }
    document.getElementById("pool-output").textContent = poolReadout();
  }

  const actions = {
    home: () => show(0),
    previous: () => show(active - 1),
    next: () => show(active + 1),
    index: openIndex,
    notes: openNotes,
    fullscreen: toggleFullscreen,
    skip: () => page.querySelector("h1").focus(),
    jump: button => {
      if (indexDialog.open) indexDialog.close();
      show(Number(button.dataset.value), { focus: true });
    },
    pool: selectPool,
    scenario: button => {
      selectedExample = Number(button.dataset.value);
      updateScenario();
    },
    "architecture-case": button => {
      architectureCase = Number(button.dataset.value);
      architectureNode = "entrada";
      updateArchitecture();
    },
    "architecture-node": button => {
      architectureNode = button.dataset.node;
      updateArchitecture();
    },
    "architecture-previous": () => stepArchitecture(-1),
    "architecture-next": () => stepArchitecture(1),
  };

  chapters.innerHTML = Object.entries(chapterNames).slice(1).map(([key]) => {
    const index = slides.findIndex(slide => slide.chapter === key);
    return `<button class="chapter-control" type="button" data-chapter="${key}" data-action="jump" data-value="${index}">${chapterNames[key]}</button>`;
  }).join("");

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-action]");
    if (!trigger || trigger.disabled) return;
    event.preventDefault();
    actions[trigger.dataset.action](trigger);
  });

  page.addEventListener("keydown", event => {
    const region = event.target.closest(".architecture-scroll");
    if (region === event.target && region.scrollWidth > region.clientWidth && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.stopPropagation();
      event.preventDefault();
      region.scrollBy({ left: event.key === "ArrowRight" ? 80 : -80, behavior: "auto" });
    }
  });

  page.addEventListener("change", event => {
    const select = event.target.closest("select[data-base]");
    if (!select) return;
    const index = Number(select.dataset.base);
    sampleBases[index] = select.value;
    document.getElementById("one-hot-matrix").innerHTML = oneHotMatrix();
    announcement.textContent = `En la posición ${index + 1} se activó el canal ${select.value}.`;
  });

  page.addEventListener("input", event => {
    if (event.target.id !== "rejection-adjustment") return;
    adjustment = Number(event.target.value);
    document.getElementById("rejection-readout").innerHTML = rejectionReadout();
  });

  document.addEventListener("fullscreenchange", () => {
    const full = Boolean(document.fullscreenElement);
    const label = full ? "Salir de pantalla completa" : "Pantalla completa";
    fullscreen.setAttribute("aria-pressed", full);
    fullscreen.setAttribute("aria-label", label);
    fullscreen.title = `${label} (F)`;
  });

  document.addEventListener("keydown", event => {
    if (indexDialog.open || notesDialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest("input, select, textarea, [contenteditable]")) return;
    if (event.key === " " && event.target.closest("button, a")) return;

    const keys = {
      ArrowLeft: actions.previous,
      ArrowRight: actions.next,
      PageUp: actions.previous,
      PageDown: actions.next,
      " ": event.shiftKey ? actions.previous : actions.next,
      Home: actions.home,
      End: () => show(slides.length - 1),
      i: actions.index,
      n: actions.notes,
      f: actions.fullscreen,
    };
    const handler = keys[event.key.toLowerCase()] ?? keys[event.key];
    if (handler) {
      event.preventDefault();
      handler();
    }
  });

  function readLocation() {
    const match = location.hash.match(/^#(\d+)$/);
    const index = match ? Number(match[1]) - 1 : 0;
    show(index, { changeHistory: false });
  }

  window.addEventListener("hashchange", readLocation);
  window.addEventListener("popstate", readLocation);
  document.getElementById("progress").max = slides.length;
  readLocation();
})();
