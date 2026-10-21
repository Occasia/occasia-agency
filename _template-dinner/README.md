# 🍷 The Occasia Executive Dinner Deck — Master Standard

Ce dossier constitue le **gabarit officiel et standardisé** pour toutes les futures présentations de dîners exécutifs B2B créées par Occasia Agency (validé sur la formule *Oriso Solutions*).

---

## 🎯 Architecture des 10 Slides (Story Arc)

Le deck est calibré pour être présenté en direct (partage d'écran) ou envoyé en amont aux comités de direction et directeurs marketing :

| Slide | Identifiant | Titre / Thématique | Objectif Psychologique & Rôle |
|---|---|---|---|
| **01** | `#hero` | **Introduction** | Accroche puissante : *12–14 Décideurs Réunis. 4 heures d'échange.* Pose le statut et l'exclusivité. |
| **02** | `#concept` | **Acquisition TI Traditionnelle vs. Dîner Privé** | Contraste net et scannable (Salons 15k$+ vs 12-14 DSI assis, Cold outreach 0 DSI vs 4h d'attention, Bouche-à-oreille passif vs Contrôle proactif). |
| **03** | `#invites` | **Profils Invités (ICP)** | Les 3 personas d'acheteurs et critères d'entreprises (Chiffre d'affaires, effectif, géographie). |
| **04** | `#pourquoi-ils-viennent` | **Pourquoi ils acceptent l'invitation** | Les 3 Piliers psychologiques brefs (~18 mots chacun) : *1. La direction de l'industrie*, *2. La Garantie Zéro Pitch*, *3. La Curation & le Statut*. Fond authentique avec dégradé directionnel (sombre à gauche, chaleureux à droite). |
| **05** | `#comptes-cibles` | **Comptes Cibles Présélectionnés** | Tableau accordéon de 20 comptes réels et crédibles dans le marché cible, avec effectif, siège social et contexte stratégique. |
| **06** | `#evenements-passes` | **Événements Passés** | Preuve sociale visuelle : cartes photos réelles de dîners précédents à Montréal et Toronto. |
| **07** | `#temoignages` | **Avis Dirigeants** | Témoignages authentiques de participants avec avatars et entreprises. |
| **08** | `#deroulement` | **Le Déroulement (19h00 – 23h00)** | Chronologie fluide en 5 étapes : 19h00 Accueil & Cocktails, 20h00 Fin networking & Table, 20h10 Mot de bienvenue Hôte & Entrées, 21h30 Fin dîner assis & Échanges libres, 23h00 Clôture. |
| **09** | `#notre-role` | **Notre Rôle & Referral Engine** | 5 étapes opérationnelles (Sourcing, Invitations, Salon Privé, Jour J, Suivi) + Bannière Referral Engine (*12–14 invités à table → 25–30 opportunités & recommandations directes*). |
| **10** | `#offre` | **L'Offre d'Activation** | Formule Pilote clé en main, 100% pris en charge, sans prix public, sans boutons gadgets, sans clauses de remboursement bon marché. |

---

## 🚀 Comment déployer un nouveau Dîner en 5 minutes

### Étape 1 : Dupliquer le dossier
Dupliquez le dossier `_template-dinner/` sous le nom du nouveau client :
```bash
cp -r _template-dinner/ [nomclient]-dinner
```

### Étape 2 : Remplacer les variables clés
Ouvrez `[nomclient]-dinner/index.html` et effectuez un chercher-remplacer :
1. **Nom du client :** Remplacer `ORISO SOLUTIONS` par `[NOM DU CLIENT]` (ex. `LEOR`, `ACME TECHNOLOGIES`).
2. **Marque courte :** Remplacer `ORISO` par `[MARQUE]` (ex. `LEOR`).
3. **Logo :** Placer le logo dans `assets/images/[nomclient]-logo.png` et pointer vers `../assets/images/[nomclient]-logo.png`.
4. **Secteur / Thématique :** Remplacer `TI` / `Directeurs TI` par le secteur concerné si différent (ex. `Cybersécurité`, `Finance & CFOs`, `Manufacturing`, `IA & Data`).
5. **Ville :** Remplacer `Montréal` si le dîner a lieu à Toronto, Québec, etc.
6. **ICP (Slide 03) :** Ajuster les 3 profils cibles selon le produit ou service du client.
7. **20 Comptes cibles (Slide 05) :** Insérer les 20 entreprises locales pertinentes pour ce client.

### Étape 3 : Configurer Vercel (Redirection propre)
Dans le fichier `vercel.json` à la racine du projet, ajoutez la redirection vers le nouveau dossier :
```json
{
  "source": "/[nomclient]-dinner.html",
  "destination": "/[nomclient]-dinner",
  "permanent": true
}
```

### Étape 4 : Tester et Déployer
1. Tester localement : `http://localhost:4000/[nomclient]-dinner/`
2. Commiter et pousser :
```bash
git add [nomclient]-dinner/ vercel.json
git commit -m "feat: add [Nom Client] Executive Dinner presentation deck"
git push origin main
```
Le deck est immédiatement accessible sur `https://occasia.agency/[nomclient]-dinner`.

---

## 💎 Règles d'or de Présentation & Copywriting (Kevin Voice)

1. **Aucun visuel généré par IA :** Utiliser exclusivement de la vraie photographie d'événement ou de table gastronomique haut de gamme (`luxury_table_hero.jpg`, `afro_business_club_dinner.png`, `executive_dining.jpg`).
2. **Dégradé directionnel obligatoire sur les fonds photos :**
   - Sombre à gauche (94% d'opacité) pour assurer 100% de lisibilité du texte.
   - Chaleureux et visible à droite (15% d'opacité) pour révéler l'atmosphère de la table.
3. **Brevity & Scan :**
   - Moins de 20 mots par point.
   - Phrases percutantes, zéro verbiage d'agence, aucun jargon corporate artificiel.
4. **Pas de prix affiché ni de garantie "remboursé" :**
   - Les décideurs de haut niveau perçoivent les garanties de remboursement comme un manque de stature.
   - L'offre est présentée comme un projet pilote d'autorité sur mesure.
