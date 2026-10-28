document.documentElement.classList.add("js");

// Entrées des sections, une seule fois.
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  });
}, { rootMargin: "0px 0px -10% 0px" });
document.querySelectorAll("[data-reveal], [data-reveal-row]").forEach((el) => io.observe(el));

// Anneau : la légende de l'image remplace la phrase d'accroche.
const caption = document.getElementById("hero-caption");
const defaultCaption = caption.textContent;
document.querySelectorAll(".frame").forEach((frame) => {
  const show = () => { caption.textContent = frame.dataset.caption; };
  const reset = () => { caption.textContent = defaultCaption; };
  frame.addEventListener("mouseenter", show);
  frame.addEventListener("focus", show);
  frame.addEventListener("click", show);
  frame.addEventListener("mouseleave", reset);
  frame.addEventListener("blur", reset);
});

// Rangée « Du mûrier à la taie » : boutons et barre de progression.
const row = document.querySelector(".row");
const bar = document.querySelector(".progress span");
const updateBar = () => {
  const max = row.scrollWidth - row.clientWidth;
  const seen = row.clientWidth / row.scrollWidth;
  const done = max > 0 ? row.scrollLeft / max : 1;
  bar.style.width = `${Math.min(100, (seen + (1 - seen) * done) * 100)}%`;
};
row.addEventListener("scroll", updateBar, { passive: true });
window.addEventListener("resize", updateBar);
updateBar();
document.querySelectorAll(".path-btns [data-dir]").forEach((btn) => {
  btn.addEventListener("click", () => row.scrollBy({ left: Number(btn.dataset.dir) * 312, behavior: "smooth" }));
});

// Le momme : 1 momme = 4,34 g/m² ; une taie 50 × 70 cm = deux faces, 0,7 m².
const GRAMS_PER_MOMME = 4.34;
const CASE_AREA_M2 = 0.5 * 0.7 * 2;
const NOTES = {
  19: "19 momme : une soie légère, courante sur les taies d'entrée de gamme.",
  22: "22 momme : le poids le plus répandu chez les marques de soie.",
  25: "25 momme : la soie que nous testons en premier, plus dense que les 19 et 22 momme.",
  30: "30 momme : une soie très dense, rare et nettement plus chère.",
};
const choices = [...document.querySelectorAll(".choices [data-m]")];
const setMomme = (btn) => {
  const m = Number(btn.dataset.m);
  const gsm = m * GRAMS_PER_MOMME;
  document.getElementById("m-gsm").textContent = Math.round(gsm);
  document.getElementById("m-case").textContent = `${Math.round(gsm * CASE_AREA_M2)} g`;
  document.getElementById("m-note").textContent = NOTES[m];
  choices.forEach((c) => {
    const on = c === btn;
    c.setAttribute("aria-checked", String(on));
    c.tabIndex = on ? 0 : -1;
  });
};
choices.forEach((btn, i) => {
  btn.addEventListener("click", () => setMomme(btn));
  btn.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = choices[(i + step + choices.length) % choices.length];
    next.focus();
    setMomme(next);
  });
});
setMomme(choices.find((c) => c.getAttribute("aria-checked") === "true"));

// Liste d'attente : envoi vers Brevo quand data-endpoint est renseigné.
const form = document.querySelector(".signup");
// Sans script, le navigateur vérifie lui-même e-mail et consentement ; avec, nos messages prennent le relais.
form.noValidate = true;
const msg = document.getElementById("email-msg");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = form.elements.EMAIL;
  const consent = form.elements.OPT_IN;
  msg.className = "msg";
  if (!email.checkValidity()) {
    msg.textContent = "Vérifiez l'adresse e-mail, par exemple prenom@exemple.fr.";
    msg.classList.add("error");
    email.focus();
    return;
  }
  if (!consent.checked) {
    msg.textContent = "Cochez la case pour accepter de recevoir l'e-mail d'ouverture.";
    msg.classList.add("error");
    consent.focus();
    return;
  }
  const endpoint = form.dataset.endpoint;
  if (!endpoint) {
    msg.textContent = "Aperçu : l'inscription n'est pas encore reliée à la liste d'attente.";
    return;
  }
  try {
    await fetch(endpoint, { method: "POST", body: new FormData(form), mode: "no-cors" });
    form.reset();
    msg.textContent = "Merci ! Un e-mail de confirmation vient de partir : cliquez sur le lien qu'il contient pour valider votre inscription.";
  } catch {
    msg.textContent = "L'inscription n'a pas pu être envoyée. Réessayez dans un instant.";
    msg.classList.add("error");
  }
});
