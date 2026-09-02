(function () {
  "use strict";
  const data = window.BRIEFING_DATA;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const statusClass = (value) => value === "PASS" ? "pass-text" : value === "FAIL" ? "fail-text" : "";
  const modeMatch = (item, filter) => {
    if (filter === "all") return true;
    if (filter === "指标") return item.primaryMode.includes("指标") || item.primaryMode.includes("proxy");
    if (filter === "实验") return item.primaryMode.includes("实验") || item.primaryMode.includes("行动") || item.primaryMode.includes("锚定");
    if (filter === "结果") return item.primaryMode.includes("结果");
    return item.primaryMode.includes(filter);
  };
  const absoluteEvidencePath = (path) => path.startsWith("/") ? path : `/Users/huihui/Documents/review/ctr-optimization-assignment-pack/trajectories/${path}`;

  function renderConstraints() {
    $("#constraint-grid").innerHTML = data.constraints.map((item) => `<div class="constraint-card"><span class="label">${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong><small>${escapeHtml(item.detail)}</small></div>`).join("");
    $("#intended-flow").innerHTML = data.construct.intended.map((item) => `<div class="flow-item">${escapeHtml(item)}</div>`).join("");
    $("#effective-flow").innerHTML = data.construct.effective.map((item) => `<div class="flow-item">${escapeHtml(item)}</div>`).join("");
  }

  function renderTrajectories(filter = "all") {
    const rows = data.trajectories.filter((item) => modeMatch(item, filter));
    $("#trajectory-table-body").innerHTML = rows.map((item) => {
      const width = Math.max(5, Math.round(item.steps / 370 * 100));
      const infra = item.source === "infra";
      return `<tr class="trajectory-row ${item.id === currentTrace ? "is-selected" : ""}" data-trace-row="${escapeHtml(item.id)}" tabindex="0" aria-label="查看 ${escapeHtml(item.id)} 轨迹"><td><span class="trajectory-id">${escapeHtml(item.id)}</span><span class="source-label">${infra ? "infra / unscorable" : "model / substantive"}</span></td><td><div class="step-bar"><span><i style="width:${width}%"></i></span><b>${item.steps}</b></div></td><td><span class="mode-pill ${infra ? "infra" : ""}">${escapeHtml(item.primaryMode)}</span><p class="table-breakdown">${escapeHtml(item.breakdown)}</p></td><td class="outcome-cell ${infra ? "infra" : ""}">${escapeHtml(item.verifierCtr)}<br><small>${infra ? "verifier 未执行" : "lock / airtime pass"}</small></td></tr>`;
    }).join("");
    $$("[data-trace-row]").forEach((row) => {
      row.addEventListener("click", () => selectTrace(row.dataset.traceRow));
      row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectTrace(row.dataset.traceRow); } });
    });
  }

  let currentTrace = "kDVj2op";
  function selectTrace(id) {
    const item = data.trajectories.find((entry) => entry.id === id) || data.trajectories[0];
    currentTrace = item.id;
    $$(".trace-case").forEach((button) => button.classList.toggle("is-active", button.dataset.trace === currentTrace));
    renderTrace(item);
    const activeFilter = $(".filter-button.is-active")?.dataset.filter || "all";
    renderTrajectories(activeFilter);
  }

  function renderTrace(item) {
    const verifier = item.verifierSummary || {
      executed: item.source === "infra" ? "false" : "true",
      reward: item.source === "infra" ? "—" : "0.0",
      ctr: item.verifierCtr || "—",
      lock: item.source === "infra" ? "not run" : "PASS",
      airtime: item.source === "infra" ? "not run" : "PASS"
    };
    const finalState = item.finalState || {
      config: "未在深挖摘要中统一记录",
      experiments: "未统一记录",
      blackout: "未统一记录",
      timing: "需回到原始轨迹核对"
    };
    const correctiveBoundary = item.counterfactual || "当前案例未进入三条深挖摘要；保持责任边界，不扩展未经核验的解释。";
    const attributionBasis = item.attributionBasis || (item.source === "infra" ? "未形成可评分 verifier evidence。" : "需回到原始轨迹和 verifier artifact 复核。" );
    const nodes = [
      ["01", "Observation", item.observation, item.evidence[0]?.step || "observe", item.evidence[0]],
      ["02", "Interpretation", item.interpretation, item.evidence[0]?.step || "interpret", item.evidence[0]],
      ["03", "Action", item.action, item.evidence[1]?.step || item.evidence[0]?.step || "action", item.evidence[1] || item.evidence[0]],
      ["04", "Outcome", item.outcome, "verifier", item.evidence[1] || item.evidence[0]],
      ["05", "Attribution", `${item.source === "infra" ? "infra / unscorable" : "model / substantive failure"}。${item.boundary}`, "boundary", null]
    ];
    const verifierDetail = `executed=${verifier.executed} · reward=${verifier.reward}`;
    const verifierMetrics = `CTR ${verifier.ctr} · lock ${verifier.lock} · airtime ${verifier.airtime}`;
    $("#trace-viewer-content").innerHTML = `<div class="trace-summary"><div class="trace-summary-card"><span>verifier summary</span><b>${escapeHtml(verifierDetail)}</b><small>${escapeHtml(verifierMetrics)}</small></div><div class="trace-summary-card"><span>final state</span><b>${escapeHtml(finalState.config)}</b><small>行动后的配置快照</small></div><div class="trace-summary-card"><span>experiment / time</span><b>${escapeHtml(finalState.experiments)}</b><small>${escapeHtml(`${finalState.blackout} · ${finalState.timing}`)}</small></div><div class="trace-summary-card"><span>attribution basis</span><b>${escapeHtml(item.source === "infra" ? "infra / unscorable" : "model / substantive")}</b><small>${escapeHtml(attributionBasis)}</small></div></div>${nodes.map(([num, title, text, step, evidence], index) => `<article class="trace-node ${index === 0 || index === 4 ? "is-highlighted" : ""}"><div class="node-title">${num} · ${title}</div><div class="node-step">step ${escapeHtml(step)}</div><p class="node-text">${escapeHtml(text)}</p>${evidence ? `<div class="node-source"><span>${escapeHtml(evidence.label)}</span><code>${escapeHtml(absoluteEvidencePath(evidence.path))} · ${escapeHtml(evidence.step)}</code></div>` : ""}</article>`).join("")}<div class="trace-correction"><span>minimal corrective boundary</span><p>${escapeHtml(correctiveBoundary)}</p></div>`;
  }

  function renderProbe(kind = "outcome") {
    const rows = kind === "outcome" ? data.outcomeProbe : data.processProbe;
    const columns = kind === "outcome" ? ["fixture", "CTR", "lock", "airtime", "all", "解释"] : ["fixture", "污染覆盖", "实验闭环", "pre-eval lock", "all", "解释"];
    $("#probe-content").innerHTML = `<div class="probe-table-wrap"><table class="probe-table"><thead><tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr class="${row.fixture === "processless_pass" ? "focus-row" : ""}"><td class="fixture-name">${escapeHtml(row.fixture)}</td>${kind === "outcome" ? `<td>${escapeHtml(row.ctr)}</td><td class="${statusClass(row.lock)}">${row.lock}</td><td>${escapeHtml(row.airtime)}</td>` : `<td class="${statusClass(row.pollution)}">${row.pollution}</td><td class="${statusClass(row.closure)}">${row.closure}</td><td class="${statusClass(row.lock)}">${row.lock}</td>`}<td class="${statusClass(row.all)}">${row.all}</td><td>${escapeHtml(row.note)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function renderHarborHistory() {
    $("#harbor-history").innerHTML = data.harborJobs.slice(0, 5).map((job) => `<div class="harbor-history-row"><code>${escapeHtml(job.name)}</code><span class="history-status">${escapeHtml(job.status)}</span><span>${escapeHtml(job.reason)}</span></div>`).join("");
  }

  let currentKnowledge = 0;
  function renderKnowledge(index = 0) {
    currentKnowledge = index;
    $("#knowledge-loop").innerHTML = data.knowledgeMap.map((item, itemIndex) => `<button class="loop-card ${itemIndex === currentKnowledge ? "is-active" : ""}" data-knowledge="${itemIndex}" type="button"><span class="loop-tag">${escapeHtml(item.tag)}</span><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.text)}</span></button>`).join("");
    const item = data.knowledgeMap[currentKnowledge];
    $("#knowledge-detail").innerHTML = `<b>${escapeHtml(item.title)}：</b>${escapeHtml(item.detail)}`;
    $$("[data-knowledge]").forEach((button) => button.addEventListener("click", () => renderKnowledge(Number(button.dataset.knowledge))));
  }

  function renderEvidence() {
    $("#evidence-list").innerHTML = data.evidence.map((item) => `<div class="evidence-row"><span class="evidence-label">${escapeHtml(item.label)}</span><code class="evidence-path">${escapeHtml(item.path)}</code><button class="copy-button" type="button" data-copy="${escapeHtml(item.path)}">复制路径</button></div>`).join("");
    $$("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
      const original = button.textContent;
      try { await navigator.clipboard.writeText(button.dataset.copy); button.textContent = "已复制"; } catch (error) { button.textContent = "请手动复制"; }
      window.setTimeout(() => { button.textContent = original; }, 1300);
    }));
  }

  function setupMode() {
    $$(".mode-button").forEach((button) => button.addEventListener("click", () => {
      $$(".mode-button").forEach((item) => item.classList.toggle("is-active", item === button));
      document.body.classList.toggle("evidence-mode", button.dataset.mode === "evidence");
    }));
  }

  function setupFilters() {
    $$(".filter-button").forEach((button) => button.addEventListener("click", () => {
      $$(".filter-button").forEach((item) => item.classList.toggle("is-active", item === button));
      renderTrajectories(button.dataset.filter);
    }));
  }

  function setupProbeTabs() {
    $$(".probe-tab").forEach((button) => button.addEventListener("click", () => {
      $$(".probe-tab").forEach((item) => { item.classList.toggle("is-active", item === button); item.setAttribute("aria-selected", item === button ? "true" : "false"); });
      renderProbe(button.dataset.probe);
    }));
  }

  function setupTraceButtons() { $$(".trace-case").forEach((button) => button.addEventListener("click", () => selectTrace(button.dataset.trace))); }

  function setupScrollSpy() {
    const sections = $$("main .section");
    const links = $$(".chapter-link");
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) links.forEach((link) => link.classList.toggle("is-current", link.getAttribute("href") === `#${entry.target.id}`)); }), { rootMargin: "-20% 0px -70% 0px", threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }

  function setupPrint() { $$("#print-button, #final-print").forEach((button) => button.addEventListener("click", () => { document.body.classList.add("evidence-mode"); window.print(); })); }

  renderConstraints();
  renderTrajectories();
  renderTrace(data.trajectories.find((item) => item.id === currentTrace));
  renderProbe();
  renderHarborHistory();
  renderKnowledge();
  renderEvidence();
  setupMode(); setupFilters(); setupProbeTabs(); setupTraceButtons(); setupScrollSpy(); setupPrint();
})();
