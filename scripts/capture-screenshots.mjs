/**
 * Script Puppeteer — Capture automatique des screenshots 4K pour la landing page
 * 
 * Usage :
 *   1. Lancer l'app en dev :  npm run dev
 *   2. Exécuter ce script :   node scripts/capture-screenshots.mjs
 *   3. Le navigateur s'ouvre — connecte-toi manuellement
 *   4. Appuie sur Entrée dans le terminal quand tu es sur le builder avec un projet ouvert
 *   5. Les captures sont générées automatiquement dans frontend/assets/captures/
 * 
 * Prérequis : puppeteer (déjà dans devDependencies)
 */

import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAPTURES_DIR = resolve(__dirname, '..', 'frontend', 'assets', 'captures');
const APP_URL = 'http://localhost:5173';

// Résolution 4K (Retina-like)
const VIEWPORT = { width: 2560, height: 1440, deviceScaleFactor: 1 };

function waitForEnter(message) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(`\n⏳ ${message}\n   Appuie sur Entrée pour continuer...`, () => { rl.close(); res(); }));
}

async function capture(page, name, description, selector = null) {
  const filepath = resolve(CAPTURES_DIR, `${name}.png`);
  console.log(`\n📸 Capture : ${name}`);
  console.log(`   ${description}`);

  if (selector) {
    try {
      const el = await page.$(selector);
      if (el) {
        await el.screenshot({ path: filepath, type: 'png' });
        console.log(`   ✅ Sauvegardé → frontend/assets/captures/${name}.png (élément)`);
        return true;
      }
    } catch (e) {
      console.log(`   ⚠️  Sélecteur "${selector}" non trouvé, capture pleine page`);
    }
  }

  await page.screenshot({ path: filepath, fullPage: false, type: 'png' });
  console.log(`   ✅ Sauvegardé → frontend/assets/captures/${name}.png`);
  return true;
}

async function main() {
  await mkdir(CAPTURES_DIR, { recursive: true });

  console.log('🚀 Lancement du navigateur Puppeteer...');
  console.log(`   Résolution : ${VIEWPORT.width}×${VIEWPORT.height}`);
  console.log(`   Dossier cible : frontend/assets/captures/\n`);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: VIEWPORT,
    args: [
      `--window-size=${VIEWPORT.width},${VIEWPORT.height + 100}`,
      '--no-sandbox',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // ─── ÉTAPE 1 : Connexion ───
  console.log('🔗 Navigation vers l\'application...');
  await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  await waitForEnter('Connecte-toi à l\'application dans le navigateur Puppeteer.');

  // ─── CAPTURE C16 : Page d'authentification ───
  // (si l'utilisateur n'est pas encore connecté à ce point, on peut la capturer avant)
  // On la fait après le login en naviguant vers /auth si besoin

  // ─── ÉTAPE 2 : Écran des projets ───
  await waitForEnter('Assure-toi d\'être sur l\'écran "Mes Projets" (WelcomeScreen). Crée 3-4 projets si nécessaire.');

  await capture(page, 'capture-feature-projects',
    'Écran des projets — liste avec cartes et thumbnails');

  await capture(page, 'capture-step1-create',
    'Écran de création de projet');

  // ─── ÉTAPE 3 : Ouvrir un projet avec un dashboard riche ───
  await waitForEnter('Ouvre un projet avec des widgets variés sur le canvas (dashboard). Thème CLAIR activé.');

  await capture(page, 'capture-hero-canvas-fullscreen',
    'Vue complète du builder : sidebar + canvas + properties panel (HERO)');

  await capture(page, 'capture-canvas-large',
    'Canvas large avec dashboard riche (stat cards, table, chart)');

  await capture(page, 'capture-step2-design',
    'Canvas avec widgets en cours de conception (étape 2 workflow)');

  // ─── CAPTURE sidebar widgets ───
  await waitForEnter('Assure-toi que la sidebar "Composants" est ouverte et visible.');

  await capture(page, 'capture-widgets-library',
    'Sidebar bibliothèque de widgets avec catégories déployées');

  // ─── CAPTURE propriétés ───
  await waitForEnter('Sélectionne un widget Bouton sur le canvas pour afficher ses propriétés.');

  await capture(page, 'capture-feature-properties',
    'Panneau de propriétés avec widget sélectionné');

  // ─── CAPTURE canvas avec composites ───
  await waitForEnter('Place des composites variés sur le canvas (StatCard, Table, Chart, ProductCard, UserProfile, MenuItem).');

  await capture(page, 'capture-widgets-canvas',
    'Canvas avec composants composites variés');

  // ─── CAPTURE drag & drop ───
  await waitForEnter('Commence à glisser un widget depuis la bibliothèque (garde la souris enfoncée). Capture quand prêt.');

  await capture(page, 'capture-feature-dragdrop',
    'Widget en cours de drag depuis la sidebar vers le canvas');

  // ─── CAPTURE Export Modal ───
  await waitForEnter('Ouvre la modal d\'export (bouton "Exporter le Code" dans la TopBar).');

  await capture(page, 'capture-feature-export',
    'Modal d\'export avec prévisualisation code Python et bouton ZIP');

  await capture(page, 'capture-step3-export',
    'Modal export (étape 3 workflow)');

  // ─── CAPTURE AI Modal ───
  await waitForEnter('Ouvre la modal IA (bouton "Générer UI" violet dans la TopBar). Tape un prompt d\'exemple.');

  await capture(page, 'capture-feature-ai',
    'Modal IA avec prompt textuel et sélection de modèle');

  await capture(page, 'capture-ai-modal',
    'Modal IA complète (section IA)');

  // ─── CAPTURE résultat IA ───
  await waitForEnter('Si possible, lance une génération IA et attends le résultat sur le canvas.');

  await capture(page, 'capture-ai-result',
    'Canvas après génération IA');

  // ─── CAPTURE vue Code ───
  await waitForEnter('Bascule en vue Code (toggle Design/Code dans la TopBar).');

  await capture(page, 'capture-feature-codeview',
    'Vue code Python avec coloration syntaxique');

  // ─── CAPTURE raccourcis clavier ───
  await waitForEnter('Ouvre la dialog des raccourcis clavier (bouton ? ou F1).');

  await capture(page, 'capture-keyboard-shortcuts',
    'Dialog raccourcis clavier');

  // ─── CAPTURE dark mode ───
  await waitForEnter('Bascule en mode SOMBRE (toggle thème dans la TopBar).');

  await capture(page, 'capture-dark-mode',
    'Vue du builder en mode sombre');

  // ─── CAPTURE Auth Page (bonus) ───
  await waitForEnter('Déconnecte-toi pour voir la page d\'authentification.');

  await capture(page, 'capture-auth-page',
    'Page de connexion/inscription');

  // ─── FIN ───
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 TOUTES LES CAPTURES SONT TERMINÉES !');
  console.log('═'.repeat(60));
  console.log(`\n📁 Fichiers dans : frontend/assets/captures/`);
  console.log('   Tu peux maintenant fermer le navigateur.\n');

  await waitForEnter('Appuie sur Entrée pour fermer le navigateur.');
  await browser.close();
}

main().catch((err) => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
