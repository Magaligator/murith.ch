# A. Murith SA — Maquettes du nouveau site

Pompes funèbres à Genève depuis 1888. Trois maquettes du nouveau site murith.ch, présentées sur une page d'accueil commune.

| Maquette | Dossier | Partis pris |
|---|---|---|
| **Aube** | [`clair/`](clair/index.html) | Blanc, bleu marine et or ; arche animée, galerie des salons en cylindre 3D, formulaire interactif |
| **Panorama** | [`panorama/`](panorama/index.html) | Photo pleine largeur, carrousel 3D, frise de l'histoire, check-list des formalités à télécharger, blog magazine |
| **Nuit** | [`fonce/`](fonce/index.html) | Fond bleu nuit, titres fins, menu déroulant avec aperçu photo, questionnaire de prévoyance |

Chaque maquette existe en français, anglais, allemand, espagnol et portugais (sous-dossiers `en/`, `de/`, `es/`, `pt/`).

## Publier sur GitHub Pages

1. Créer un dépôt sur GitHub et y envoyer **le contenu** de ce dossier (le fichier `index.html` doit se trouver à la racine du dépôt).
2. Dans le dépôt : **Settings → Pages → Build and deployment → Source : Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Le site est disponible quelques minutes plus tard à `https://<compte>.github.io/<dépôt>/`.

Aucune étape de compilation : ce sont des fichiers statiques (HTML, CSS, JavaScript). Tous les chemins sont relatifs, le site fonctionne donc aussi dans un sous-dossier. Le fichier `.nojekyll` désactive le traitement Jekyll de GitHub.

## Ce dossier contient

- `index.html` : page de présentation (les trois maquettes + identité en bref)
- `clair/`, `panorama/`, `fonce/` : les trois maquettes
- `img/` : photos, logos, vidéo de présentation (`murith.mp4`, 13 Mo)
- `fonts/` : polices Playfair Display, Poppins, Inter, Cormorant Garamond (fichiers locaux)

## À savoir

- **Maquettes, pas le site définitif** : toutes les pages portent `noindex` et `robots.txt` interdit l'exploration, pour que Google n'indexe pas cette version de démonstration. Le référencement (balises, données structurées, plan du site) est prévu pour la mise en ligne sur murith.ch.
- Les formulaires ouvrent la messagerie de l'utilisateur (`mailto:`) : aucun envoi réel tant qu'un service d'envoi n'est pas branché.
- Le plan d'accès de la page Contact utilise OpenStreetMap et la vidéo de l'historique YouTube : une connexion internet est nécessaire pour ces deux éléments.

## Crédit

Maquettes réalisées par [Websituation](https://www.websituation.ch) — contact@websituation.ch.
© 2026 Websituation — tous droits réservés.
